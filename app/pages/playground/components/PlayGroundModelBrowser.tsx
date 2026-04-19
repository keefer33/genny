import {
  Badge,
  Button,
  CloseButton,
  Group,
  Modal,
  MultiSelect,
  ScrollArea,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { RiFilter3Line } from "@remixicon/react";
import { useEffect, useMemo, useState } from "react";
import useAppStore from "~/lib/stores/appStore";
import usePlaygroundStore from "~/lib/stores/playgroundStore";
import PlayGroundModelGrid from "./PlayGroundModelGrid";
import PageLoader from "~/shared/PageLoader";
import type { PlayGroundModelBrowserProps } from "~/types/playground";

export function PlayGroundModelBrowser({
  linkMode = "segments",
  onAfterNavigate,
  showSearchLabel = true,
  fetchOnMount = true,
  singleColumnGrid = false,
}: PlayGroundModelBrowserProps) {
  const { isMobile } = useAppStore();
  const [search, setSearch] = useState("");
  const [brandFilters, setBrandFilters] = useState<string[]>([]);
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [filtersOpened, { open: openFilters, close: closeFilters }] = useDisclosure(false);
  const { searchPlayground, items, loading, error } = usePlaygroundStore();
  useEffect(() => {
    if (!fetchOnMount) return;
    /** Do not toggle global `loading` — it unmounts `PlayGroundRunForm` behind the switcher modal. */
    void searchPlayground(undefined, { silent: true });
  }, [fetchOnMount, searchPlayground]);

  /** Slug → display label for filter chips (API uses object `brand_name`). */
  const brandSlugLabelPairs = useMemo(() => {
    const map = new Map<string, string>();
    for (const i of items) {
      const slug = i.brand_name?.slug ?? "";
      if (!slug) continue;
      if (!map.has(slug)) {
        map.set(slug, i.brand_name?.name ?? slug);
      }
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [items]);
  const typeOptions = useMemo(
    () =>
      Array.from(new Set(items.map((i) => i.model_type || "").filter(Boolean))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [items]
  );

  const brandSelectData = useMemo(
    () => brandSlugLabelPairs.map(([value, label]) => ({ value, label })),
    [brandSlugLabelPairs]
  );
  const typeSelectData = useMemo(
    () => typeOptions.map((t) => ({ value: t, label: t })),
    [typeOptions]
  );

  const activeFilterCount = brandFilters.length + typeFilters.length;

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    const brandSet = new Set(brandFilters);
    const typeSet = new Set(typeFilters);
    return items.filter((item) => {
      const brandSlug = item.brand_name?.slug ?? "";
      if (brandSet.size > 0 && !brandSet.has(brandSlug)) return false;
      if (typeSet.size > 0 && (!item.model_type || !typeSet.has(item.model_type))) return false;
      if (!q) return true;
      const brandName = item.brand_name?.name ?? "";
      return [item.model_name, item.model_id, item.model_type, brandSlug, brandName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [items, search, brandFilters, typeFilters]);

  const searchRow = (
    <Group align="flex-end" wrap="nowrap" gap="sm">
      <TextInput
        label={showSearchLabel ? "Search" : undefined}
        placeholder="Search models"
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        style={{ flex: 1, minWidth: 0 }}
        rightSection={
          search ? (
            <CloseButton
              size="sm"
              onMouseDown={(e) => e.preventDefault()}
              aria-label="Clear search"
              onClick={() => setSearch("")}
            />
          ) : null
        }
        rightSectionPointerEvents="auto"
      />
      <Button
        variant="light"
        leftSection={<RiFilter3Line size={18} />}
        onClick={openFilters}
        style={{ flexShrink: 0 }}
      >
        <Group gap={6} wrap="nowrap">
          Filters
          {activeFilterCount > 0 ? (
            <Badge variant="filled" size="xs" circle>
              {activeFilterCount}
            </Badge>
          ) : null}
        </Group>
      </Button>
    </Group>
  );

  const filtersModal = (
    <Modal
      opened={filtersOpened}
      onClose={closeFilters}
      title="Playground filters"
      fullScreen={isMobile}
      size={isMobile ? undefined : "md"}
    >
      <Stack gap="md">
        <MultiSelect
          label="Brands"
          placeholder="Pick one or more brands"
          data={brandSelectData}
          value={brandFilters}
          onChange={setBrandFilters}
          searchable
          clearable
          hidePickedOptions
        />
        <MultiSelect
          label="Model types"
          placeholder="Pick one or more types"
          data={typeSelectData}
          value={typeFilters}
          onChange={setTypeFilters}
          searchable
          clearable
          hidePickedOptions
        />
        <Group justify="flex-end" gap="sm" mt="xs">
          <Button
            variant="subtle"
            onClick={() => {
              setBrandFilters([]);
              setTypeFilters([]);
            }}
            disabled={activeFilterCount === 0}
          >
            Clear all
          </Button>
          <Button onClick={closeFilters}>Done</Button>
        </Group>
      </Stack>
    </Modal>
  );

  const resultsBody = loading ? (
    <PageLoader />
  ) : error ? (
    <Text c="red" size="sm">
      {error}
    </Text>
  ) : items.length === 0 ? (
    <Text size="sm" c="dimmed">
      No playground models found.
    </Text>
  ) : filteredItems.length === 0 ? (
    <Text size="sm" c="dimmed" ta="center" py="xl">
      No models match your filters.
    </Text>
  ) : (
    <PlayGroundModelGrid
      items={filteredItems}
      linkMode={linkMode}
      onAfterNavigate={onAfterNavigate}
      singleColumn={singleColumnGrid}
    />
  );

  return (
    <Stack
      gap="md"
      style={{ height: "100%", minHeight: 0, display: "flex", flexDirection: "column" }}
    >
      {searchRow}
      {filtersModal}
      <ScrollArea h="100%" type="auto" offsetScrollbars="y">
        {resultsBody}
      </ScrollArea>
    </Stack>
  );
}
