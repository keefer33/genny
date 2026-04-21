import { ScrollArea, Stack, Text } from "@mantine/core";
import { useEffect, useMemo } from "react";
import usePlaygroundStore from "~/lib/stores/playgroundStore";
import PlayGroundModelGrid from "./PlayGroundModelGrid";
import PageLoader from "~/shared/PageLoader";
import type { PlayGroundModelBrowserProps } from "~/types/playground";

export function PlayGroundModelBrowser({
  linkMode = "segments",
  onAfterNavigate,
  showSearchLabel: _showSearchLabel = true,
  fetchOnMount = true,
  singleColumnGrid = false,
}: PlayGroundModelBrowserProps) {
  const {
    searchPlayground,
    items,
    loading,
    error,
    playgroundSearchQuery,
    playgroundBrandFilters,
    playgroundTypeFilters,
  } = usePlaygroundStore();
  useEffect(() => {
    if (!fetchOnMount) return;
    /** Do not toggle global `loading` — it unmounts `PlayGroundRunForm` behind the switcher modal. */
    void searchPlayground(undefined, { silent: true });
  }, [fetchOnMount, searchPlayground]);

  const filteredItems = useMemo(() => {
    const q = playgroundSearchQuery.trim().toLowerCase();
    const brandSet = new Set(playgroundBrandFilters);
    const typeSet = new Set(playgroundTypeFilters);
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
  }, [items, playgroundSearchQuery, playgroundBrandFilters, playgroundTypeFilters]);

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
      <ScrollArea h="100%" type="auto" offsetScrollbars="y">
        {resultsBody}
      </ScrollArea>
    </Stack>
  );
}
