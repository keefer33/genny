import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Collapse,
  Divider,
  Group,
  Loader,
  ScrollArea,
  Select,
  SimpleGrid,
  Stack,
  UnstyledButton,
  Text,
  TextInput,
} from "@mantine/core";
import { RiArrowDownSLine, RiFilter3Line, RiFilterOffLine, RiSearchLine } from "@remixicon/react";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import useAppStore from "~/lib/stores/appStore";
import { authFetchJson } from "~/lib/stores/authFetch";
import { endpoint } from "~/lib/utils";
import { AppPagination } from "~/shared/AppPagination";
import {
  ACCENT_OPTIONS,
  CATEGORY_OPTIONS,
  GENDER_OPTIONS,
  LANGUAGE_OPTIONS,
} from "~/lib/voices/voiceLibraryConstants";
import {
  buildNextFilters,
  buildVoiceLibraryQueryString,
  trimFilters,
  VOICE_LIBRARY_PAGE_SIZE_DEFAULT,
  type SharedLibraryPayload,
  type SharedVoiceItem,
  type VoiceLibraryFilters,
} from "~/lib/voices/voiceLibraryQuery";

const VOICE_LIBRARY_FORM_STORAGE_KEY = "genny_voice_library_search_form";

function readVoiceLibraryFormFromStorage(): { filters: VoiceLibraryFilters; search: string } {
  try {
    const raw = localStorage.getItem(VOICE_LIBRARY_FORM_STORAGE_KEY);
    if (!raw) return { filters: {}, search: "" };
    const p = JSON.parse(raw) as { filters?: unknown; search?: unknown };
    const filters: VoiceLibraryFilters = {};
    if (p.filters && typeof p.filters === "object" && !Array.isArray(p.filters)) {
      const o = p.filters as Record<string, unknown>;
      for (const key of ["gender", "language", "accent", "category"] as const) {
        const v = o[key];
        if (typeof v === "string" && v.trim()) filters[key] = v.trim();
      }
    }
    const search = typeof p.search === "string" ? p.search : "";
    return { filters, search };
  } catch {
    return { filters: {}, search: "" };
  }
}

function writeVoiceLibraryFormToStorage(filters: VoiceLibraryFilters, search: string): void {
  try {
    const trimmedSearch = search.trim();
    const trimmedFilters = trimFilters(filters);
    if (!trimmedFilters && !trimmedSearch) {
      localStorage.removeItem(VOICE_LIBRARY_FORM_STORAGE_KEY);
      return;
    }
    localStorage.setItem(
      VOICE_LIBRARY_FORM_STORAGE_KEY,
      JSON.stringify({
        filters: trimmedFilters ?? {},
        search: trimmedSearch ? search : "",
      })
    );
  } catch {
    /* ignore */
  }
}

function clearVoiceLibraryFormStorage(): void {
  try {
    localStorage.removeItem(VOICE_LIBRARY_FORM_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function VoicePickRow({
  voice,
  busy,
  pickDisabled,
  pickButtonLabel,
  showPreviewAudio,
  alreadyAdded,
  onPick,
}: {
  voice: SharedVoiceItem;
  busy: boolean;
  pickDisabled?: boolean;
  pickButtonLabel: string;
  showPreviewAudio: boolean;
  alreadyAdded: boolean;
  onPick: (voice: SharedVoiceItem) => void;
}) {
  const metaBits = [voice.gender, voice.accent, voice.age, voice.language, voice.category].filter(
    Boolean
  );
  const description = voice.description?.trim() ?? "";

  return (
    <Card withBorder radius="sm" padding="sm">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
          <Group gap="xs">
            <Text fw={500} size="sm" lineClamp={1}>
              {voice.name ?? voice.voice_id}
            </Text>
            {alreadyAdded && (
              <Badge size="xs" color="gray" variant="light">
                Added
              </Badge>
            )}
          </Group>
          <Text size="xs" c="dimmed" lineClamp={1}>
            {metaBits.length > 0 ? metaBits.join(" · ") : voice.voice_id}
          </Text>
          {description ? (
            <Text size="xs" c="dimmed" lineClamp={3}>
              {description}
            </Text>
          ) : null}
          {showPreviewAudio && voice.preview_url ? (
            <audio
              controls
              src={voice.preview_url}
              style={{ width: "100%", maxHeight: 36, marginTop: 4 }}
            />
          ) : null}
        </Stack>
        <Button
          size="xs"
          loading={busy}
          onClick={() => onPick(voice)}
          disabled={pickDisabled || alreadyAdded || !voice.preview_url?.trim()}
        >
          {pickButtonLabel}
        </Button>
      </Group>
    </Card>
  );
}

export type VoiceLibraryPickerProps = {
  active: boolean;
  onPick: (voice: SharedVoiceItem) => void;
  pickDisabled?: boolean;
  pickButtonLabel?: string;
  /** Fixed list height; ignored when `fillContainer` is true. */
  scrollHeight?: number | string;
  /** Grow the voice list to fill remaining flex space (parent must be a flex column). */
  fillContainer?: boolean;
  showPreviewAudio?: boolean;
  existingVoiceIds?: Set<string>;
};

export function VoiceLibraryPicker({
  active,
  onPick,
  pickDisabled,
  pickButtonLabel = "Select",
  scrollHeight = 360,
  fillContainer = false,
  showPreviewAudio = true,
  existingVoiceIds,
}: VoiceLibraryPickerProps) {
  const [libraryVoices, setLibraryVoices] = useState<SharedVoiceItem[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryTotalCount, setLibraryTotalCount] = useState<number | null>(null);
  const [libraryPage, setLibraryPage] = useState(0);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState<VoiceLibraryFilters>({});
  const [pickingVoiceId, setPickingVoiceId] = useState<string | null>(null);
  const [filtersOpened, setFiltersOpened] = useState(false);
  const isMobile = useAppStore((s) => s.isMobile);

  const loadVoiceLibrary = async (args: {
    search: string;
    filters?: VoiceLibraryFilters;
    page: number;
    pageSize: number;
  }) => {
    setLibraryLoading(true);
    setLibraryError(null);
    try {
      const qs = buildVoiceLibraryQueryString(args);
      const payload = await authFetchJson<SharedLibraryPayload>(
        `${endpoint}/voices/shared-library?${qs}`,
        undefined,
        { errorMessage: "Failed to load voice library" }
      );
      const voices = (payload.voices ?? []).filter(
        (v): v is SharedVoiceItem => typeof v?.voice_id === "string" && v.voice_id.length > 0
      );
      setLibraryVoices(voices);
      setLibraryTotalCount(typeof payload.total_count === "number" ? payload.total_count : null);
      setLibraryPage(args.page);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load voice library";
      setLibraryError(message);
      setLibraryVoices([]);
      setLibraryTotalCount(null);
      setLibraryPage(0);
    } finally {
      setLibraryLoading(false);
    }
  };

  useLayoutEffect(() => {
    if (!active) return;
    const { filters: f, search: s } = readVoiceLibraryFormFromStorage();
    setFilters(f);
    setSearchInput(s);
  }, [active]);

  useEffect(() => {
    if (!active) {
      setLibraryVoices([]);
      setLibraryTotalCount(null);
      setLibraryPage(0);
      setLibraryError(null);
      return;
    }
    const { filters: f, search: s } = readVoiceLibraryFormFromStorage();
    void loadVoiceLibrary({
      search: s.trim(),
      filters: trimFilters(f),
      page: 0,
      pageSize: VOICE_LIBRARY_PAGE_SIZE_DEFAULT,
    });
  }, [active]);

  const applyFilterAndFetch = (key: keyof VoiceLibraryFilters, value: string | null) => {
    if (!active) return;
    const next = buildNextFilters(filters, key, value);
    setFilters(next);
    writeVoiceLibraryFormToStorage(next, searchInput);
    void loadVoiceLibrary({
      search: searchInput,
      filters: trimFilters(next),
      page: 0,
      pageSize: VOICE_LIBRARY_PAGE_SIZE_DEFAULT,
    });
  };

  const fetchPage = (page: number) => {
    if (!active) return;
    void loadVoiceLibrary({
      search: searchInput,
      filters: trimFilters(filters),
      page,
      pageSize: VOICE_LIBRARY_PAGE_SIZE_DEFAULT,
    });
  };

  const handleSearchLibrary = () => {
    writeVoiceLibraryFormToStorage(filters, searchInput);
    fetchPage(0);
  };

  const handleClearFilters = () => {
    clearVoiceLibraryFormStorage();
    setSearchInput("");
    setFilters({});
    if (!active) return;
    void loadVoiceLibrary({
      search: "",
      filters: undefined,
      page: 0,
      pageSize: VOICE_LIBRARY_PAGE_SIZE_DEFAULT,
    });
  };

  const handlePick = async (voice: SharedVoiceItem) => {
    setPickingVoiceId(voice.voice_id);
    try {
      await onPick(voice);
    } finally {
      setPickingVoiceId(null);
    }
  };

  const hasQueried = libraryTotalCount !== null;
  const libraryTotalPages = useMemo(() => {
    if (libraryTotalCount == null) return 0;
    return Math.max(1, Math.ceil(libraryTotalCount / VOICE_LIBRARY_PAGE_SIZE_DEFAULT));
  }, [libraryTotalCount]);
  const activeFilterCount = useMemo(
    () =>
      Object.values(filters).filter((value) => typeof value === "string" && value.trim()).length,
    [filters]
  );

  const filterFields = (
    <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
      <Select
        label="Gender"
        placeholder="Any"
        clearable
        searchable
        data={GENDER_OPTIONS}
        value={filters.gender ?? null}
        onChange={(v) => applyFilterAndFetch("gender", v)}
      />
      <Select
        label="Language"
        placeholder="Any"
        clearable
        searchable
        data={LANGUAGE_OPTIONS}
        value={filters.language ?? null}
        onChange={(v) => applyFilterAndFetch("language", v)}
      />
      <Select
        label="Accent"
        placeholder="Any"
        clearable
        searchable
        data={ACCENT_OPTIONS}
        value={filters.accent ?? null}
        onChange={(v) => applyFilterAndFetch("accent", v)}
      />
      <Select
        label="Category"
        placeholder="Any"
        clearable
        searchable
        data={CATEGORY_OPTIONS}
        value={filters.category ?? null}
        onChange={(v) => applyFilterAndFetch("category", v)}
      />
    </SimpleGrid>
  );

  const rootStackStyle = fillContainer
    ? { flex: 1, minHeight: 0, display: "flex", flexDirection: "column" as const }
    : undefined;
  const listScrollStyle = fillContainer ? { flex: 1, minHeight: 0 } : undefined;

  return (
    <Stack gap="md" style={rootStackStyle}>
      {isMobile ? (
        <Box p="sm" bg="var(--mantine-color-default-hover)" style={{ borderRadius: 8 }}>
          <UnstyledButton type="button" w="100%" onClick={() => setFiltersOpened((open) => !open)}>
            <Group justify="space-between" wrap="nowrap">
              <Group gap="xs" wrap="nowrap">
                <RiFilter3Line size={16} />
                <Text size="sm" fw={500}>
                  Filters
                </Text>
                {activeFilterCount > 0 ? (
                  <Badge size="sm" variant="light">
                    {activeFilterCount}
                  </Badge>
                ) : null}
              </Group>
              <RiArrowDownSLine
                size={18}
                style={{ transform: filtersOpened ? "rotate(180deg)" : undefined }}
              />
            </Group>
          </UnstyledButton>
          <Collapse expanded={filtersOpened}>
            <Box pt="sm">{filterFields}</Box>
          </Collapse>
        </Box>
      ) : (
        filterFields
      )}

      <Group align="flex-end" wrap="nowrap" gap="xs">
        <TextInput
          style={{ flex: 1 }}
          placeholder="keywords"
          value={searchInput}
          onChange={(e) => setSearchInput(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearchLibrary();
          }}
        />
        <ActionIcon
          size="lg"
          variant="filled"
          aria-label="Search voices"
          onClick={handleSearchLibrary}
          loading={libraryLoading}
        >
          <RiSearchLine size={20} />
        </ActionIcon>
        <ActionIcon
          size="lg"
          variant="light"
          aria-label="Clear filters"
          onClick={handleClearFilters}
          disabled={libraryLoading}
        >
          <RiFilterOffLine size={20} />
        </ActionIcon>
      </Group>

      <Divider />

      <ScrollArea
        h={fillContainer ? undefined : scrollHeight}
        style={listScrollStyle}
        type="auto"
        offsetScrollbars="y"
      >
        {libraryLoading && libraryVoices.length === 0 ? (
          <Group justify="center" py="xl">
            <Loader size="sm" />
          </Group>
        ) : libraryVoices.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" py="md">
            {libraryError && !hasQueried
              ? libraryError
              : hasQueried
                ? "No voices match these filters."
                : "No voices returned."}
          </Text>
        ) : (
          <Stack gap="sm">
            {libraryVoices.map((v) => (
              <VoicePickRow
                key={v.voice_id}
                voice={v}
                busy={pickingVoiceId === v.voice_id}
                pickDisabled={pickDisabled}
                pickButtonLabel={pickButtonLabel}
                showPreviewAudio={showPreviewAudio}
                alreadyAdded={existingVoiceIds?.has(v.voice_id) ?? false}
                onPick={handlePick}
              />
            ))}
          </Stack>
        )}
      </ScrollArea>

      {hasQueried && libraryTotalPages > 1 ? (
        <Stack gap="xs" align="center">
          <Text size="xs" c="dimmed">
            {libraryTotalCount.toLocaleString()} matching
          </Text>
          <AppPagination
            mobileVisibleItems={isMobile ? 4 : 7}
            total={libraryTotalPages}
            value={libraryPage + 1}
            onChange={(page) => fetchPage(page - 1)}
            size="md"
            disabled={libraryLoading}
          />
        </Stack>
      ) : null}
    </Stack>
  );
}
