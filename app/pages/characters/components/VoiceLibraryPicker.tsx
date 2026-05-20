import {
  ActionIcon,
  Box,
  Button,
  Card,
  Divider,
  Group,
  Loader,
  ScrollArea,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { RiFilterOffLine, RiSearchLine } from "@remixicon/react";
import { useEffect, useLayoutEffect, useState } from "react";
import useCharactersStore, {
  type SharedVoiceItem,
  type VoiceLibraryFilters,
  VOICE_LIBRARY_PAGE_SIZE_DEFAULT,
} from "~/lib/stores/charactersStore";

function trimFilters(f: VoiceLibraryFilters): VoiceLibraryFilters | undefined {
  const out: VoiceLibraryFilters = {};
  for (const [key, raw] of Object.entries(f)) {
    const v = typeof raw === "string" ? raw.trim() : "";
    if (v) (out as Record<string, string>)[key] = v;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function buildNextFilters(
  prev: VoiceLibraryFilters,
  key: keyof VoiceLibraryFilters,
  value: string | null
): VoiceLibraryFilters {
  const next = { ...prev };
  if (value == null || value === "") delete next[key];
  else next[key] = value;
  return next;
}

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
    /* ignore quota / private mode */
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
  onPick,
}: {
  voice: SharedVoiceItem;
  busy: boolean;
  pickDisabled?: boolean;
  pickButtonLabel: string;
  showPreviewAudio: boolean;
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
          <Text fw={500} size="sm" lineClamp={1}>
            {voice.name ?? voice.voice_id}
          </Text>
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
        <Button size="xs" loading={busy} onClick={() => onPick(voice)} disabled={pickDisabled}>
          {pickButtonLabel}
        </Button>
      </Group>
    </Card>
  );
}

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "neutral", label: "Neutral" },
];

/** ElevenLabs shared-voices language codes (name + code for search). */
const LANGUAGE_OPTIONS = [
  { value: "af", label: "Afrikaans (af)" },
  { value: "ar", label: "Arabic (ar)" },
  { value: "hy", label: "Armenian (hy)" },
  { value: "as", label: "Assamese (as)" },
  { value: "az", label: "Azerbaijani (az)" },
  { value: "be", label: "Belarusian (be)" },
  { value: "bn", label: "Bengali (bn)" },
  { value: "bs", label: "Bosnian (bs)" },
  { value: "bg", label: "Bulgarian (bg)" },
  { value: "ca", label: "Catalan (ca)" },
  { value: "ceb", label: "Cebuano (ceb)" },
  { value: "ny", label: "Chichewa (ny)" },
  { value: "hr", label: "Croatian (hr)" },
  { value: "cs", label: "Czech (cs)" },
  { value: "da", label: "Danish (da)" },
  { value: "nl", label: "Dutch (nl)" },
  { value: "en", label: "English (en)" },
  { value: "et", label: "Estonian (et)" },
  { value: "fil", label: "Filipino (fil)" },
  { value: "fi", label: "Finnish (fi)" },
  { value: "fr", label: "French (fr)" },
  { value: "gl", label: "Galician (gl)" },
  { value: "ka", label: "Georgian (ka)" },
  { value: "de", label: "German (de)" },
  { value: "el", label: "Greek (el)" },
  { value: "gu", label: "Gujarati (gu)" },
  { value: "ha", label: "Hausa (ha)" },
  { value: "he", label: "Hebrew (he)" },
  { value: "hi", label: "Hindi (hi)" },
  { value: "hu", label: "Hungarian (hu)" },
  { value: "is", label: "Icelandic (is)" },
  { value: "id", label: "Indonesian (id)" },
  { value: "ga", label: "Irish (ga)" },
  { value: "it", label: "Italian (it)" },
  { value: "ja", label: "Japanese (ja)" },
  { value: "jv", label: "Javanese (jv)" },
  { value: "kn", label: "Kannada (kn)" },
  { value: "kk", label: "Kazakh (kk)" },
  { value: "ky", label: "Kirghiz (ky)" },
  { value: "ko", label: "Korean (ko)" },
  { value: "lv", label: "Latvian (lv)" },
  { value: "ln", label: "Lingala (ln)" },
  { value: "lt", label: "Lithuanian (lt)" },
  { value: "lb", label: "Luxembourgish (lb)" },
  { value: "mk", label: "Macedonian (mk)" },
  { value: "ms", label: "Malay (ms)" },
  { value: "ml", label: "Malayalam (ml)" },
  { value: "zh", label: "Mandarin Chinese (zh)" },
  { value: "mr", label: "Marathi (mr)" },
  { value: "ne", label: "Nepali (ne)" },
  { value: "no", label: "Norwegian (no)" },
  { value: "ps", label: "Pashto (ps)" },
  { value: "fa", label: "Persian (fa)" },
  { value: "pl", label: "Polish (pl)" },
  { value: "pt", label: "Portuguese (pt)" },
  { value: "pa", label: "Punjabi (pa)" },
  { value: "ro", label: "Romanian (ro)" },
  { value: "ru", label: "Russian (ru)" },
  { value: "sr", label: "Serbian (sr)" },
  { value: "sd", label: "Sindhi (sd)" },
  { value: "sk", label: "Slovak (sk)" },
  { value: "sl", label: "Slovenian (sl)" },
  { value: "so", label: "Somali (so)" },
  { value: "es", label: "Spanish (es)" },
  { value: "sw", label: "Swahili (sw)" },
  { value: "sv", label: "Swedish (sv)" },
  { value: "ta", label: "Tamil (ta)" },
  { value: "te", label: "Telugu (te)" },
  { value: "th", label: "Thai (th)" },
  { value: "tr", label: "Turkish (tr)" },
  { value: "uk", label: "Ukrainian (uk)" },
  { value: "ur", label: "Urdu (ur)" },
  { value: "vi", label: "Vietnamese (vi)" },
  { value: "cy", label: "Welsh (cy)" },
];

/** ElevenLabs shared-voices accents — `value` is the filter string (lowercase). */
const ACCENT_OPTIONS = [
  { value: "standard", label: "Standard" },
  { value: "american", label: "American" },
  { value: "british", label: "British" },
  { value: "australian", label: "Australian" },
  { value: "canadian", label: "Canadian" },
  { value: "indian", label: "Indian" },
  { value: "irish", label: "Irish" },
  { value: "scottish", label: "Scottish" },
  { value: "south african", label: "South African" },
  { value: "new zealand", label: "New Zealand" },
  { value: "west indies", label: "West Indies" },
  { value: "american-southern", label: "American-Southern" },
  { value: "american-new york", label: "American-New York" },
  { value: "american-midwest", label: "American-Midwest" },
  { value: "british-london (cockney or posh)", label: "British-London (Cockney or Posh)" },
  { value: "spanish-castilian", label: "Spanish-Castilian" },
  { value: "spanish-latin american", label: "Spanish-Latin American" },
  { value: "portuguese-brazilian", label: "Portuguese-Brazilian" },
];

const CATEGORY_OPTIONS = [
  { value: "professional", label: "professional" },
  { value: "famous", label: "famous" },
  { value: "high_quality", label: "high_quality" },
];

export type VoiceLibraryPickerProps = {
  userId: string;
  active: boolean;
  onPick: (voice: SharedVoiceItem) => void;
  pickDisabled?: boolean;
  pickButtonLabel?: string;
  scrollHeight?: number | string;
  /** When false, hides preview audio on each row. Default true. */
  showPreviewAudio?: boolean;
};

export function VoiceLibraryPicker({
  userId,
  active,
  onPick,
  pickDisabled,
  pickButtonLabel = "Use",
  scrollHeight = 320,
  showPreviewAudio = true,
}: VoiceLibraryPickerProps) {
  const {
    libraryVoices,
    libraryLoading,
    libraryHasMore,
    libraryTotalCount,
    libraryPage,
    error: libraryError,
    loadVoiceLibrary,
    clearVoiceLibrary,
  } = useCharactersStore();

  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState<VoiceLibraryFilters>({});
  const [pickingVoiceId, setPickingVoiceId] = useState<string | null>(null);

  useLayoutEffect(() => {
    if (!active || !userId) return;
    const { filters: f, search: s } = readVoiceLibraryFormFromStorage();
    setFilters(f);
    setSearchInput(s);
  }, [active, userId]);

  useEffect(() => {
    if (!active) {
      clearVoiceLibrary();
      return;
    }
    if (!userId) return;
    const { filters: f, search: s } = readVoiceLibraryFormFromStorage();
    void loadVoiceLibrary({
      userId,
      search: s.trim(),
      filters: trimFilters(f),
      page: 0,
      pageSize: VOICE_LIBRARY_PAGE_SIZE_DEFAULT,
    });
  }, [active, userId, loadVoiceLibrary, clearVoiceLibrary]);

  const applyFilterAndFetch = (key: keyof VoiceLibraryFilters, value: string | null) => {
    if (!userId || !active) return;
    const next = buildNextFilters(filters, key, value);
    setFilters(next);
    writeVoiceLibraryFormToStorage(next, searchInput);
    void loadVoiceLibrary({
      userId,
      search: searchInput,
      filters: trimFilters(next),
      page: 0,
      pageSize: VOICE_LIBRARY_PAGE_SIZE_DEFAULT,
    });
  };

  const fetchPage = (page: number) => {
    if (!userId || !active) return;
    void loadVoiceLibrary({
      userId,
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
    if (!userId || !active) return;
    void loadVoiceLibrary({
      userId,
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

  return (
    <Stack gap="md">
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

      <ScrollArea h={scrollHeight} type="auto" offsetScrollbars>
        {libraryLoading && libraryVoices.length === 0 ? (
          <Box
            h={scrollHeight}
            style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Loader size="sm" />
          </Box>
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
                onPick={handlePick}
              />
            ))}
          </Stack>
        )}
      </ScrollArea>

      {hasQueried ? (
        <Group justify="space-between" wrap="wrap">
          <Text size="xs" c="dimmed">
            Page {libraryPage + 1}
            {libraryTotalCount != null ? ` · ${libraryTotalCount.toLocaleString()} matching` : null}
          </Text>
          <Group gap="xs">
            <Button
              variant="default"
              size="xs"
              disabled={libraryPage <= 0 || libraryLoading}
              onClick={() => fetchPage(libraryPage - 1)}
            >
              Previous
            </Button>
            <Button
              variant="default"
              size="xs"
              disabled={!libraryHasMore || libraryLoading}
              onClick={() => fetchPage(libraryPage + 1)}
            >
              Next
            </Button>
          </Group>
        </Group>
      ) : null}
    </Stack>
  );
}
