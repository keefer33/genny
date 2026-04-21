import { Badge, Button, CloseButton, Group, Modal, MultiSelect, TextInput } from "@mantine/core";
import { RiFilter3Line } from "@remixicon/react";
import { useMemo } from "react";
import useAppStore from "~/lib/stores/appStore";
import usePlaygroundStore from "~/lib/stores/playgroundStore";

export default function PlayGroundSearchFilters() {
  const { isMobile } = useAppStore();
  const {
    items,
    playgroundSearchQuery,
    setPlaygroundSearchQuery,
    playgroundBrandFilters,
    setPlaygroundBrandFilters,
    playgroundTypeFilters,
    setPlaygroundTypeFilters,
    playgroundFiltersOpened,
    openPlaygroundFilters,
    closePlaygroundFilters,
  } = usePlaygroundStore();

  const brandSelectData = useMemo(() => {
    const map = new Map<string, string>();
    for (const i of items) {
      const slug = i.brand_name?.slug ?? "";
      if (!slug) continue;
      if (!map.has(slug)) map.set(slug, i.brand_name?.name ?? slug);
    }
    return [...map.entries()]
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([value, label]) => ({ value, label }));
  }, [items]);

  const typeSelectData = useMemo(
    () =>
      Array.from(new Set(items.map((i) => i.model_type || "").filter(Boolean)))
        .sort((a, b) => a.localeCompare(b))
        .map((value) => ({ value, label: value })),
    [items]
  );

  const activeFilterCount = playgroundBrandFilters.length + playgroundTypeFilters.length;
  const filtersControls = (
    <>
      <MultiSelect
        label="Brands"
        placeholder="Pick one or more brands"
        data={brandSelectData}
        value={playgroundBrandFilters}
        onChange={setPlaygroundBrandFilters}
        searchable
        clearable
        hidePickedOptions
      />
      <MultiSelect
        label="Model types"
        placeholder="Pick one or more types"
        data={typeSelectData}
        value={playgroundTypeFilters}
        onChange={setPlaygroundTypeFilters}
        searchable
        clearable
        hidePickedOptions
        mt="md"
      />
      <Group justify="flex-end" gap="sm" mt="md">
        <Button
          variant="subtle"
          onClick={() => {
            setPlaygroundBrandFilters([]);
            setPlaygroundTypeFilters([]);
          }}
          disabled={activeFilterCount === 0}
        >
          Clear all
        </Button>
        {isMobile ? <Button onClick={closePlaygroundFilters}>Done</Button> : null}
      </Group>
    </>
  );

  return (
    <>
      <Group align="flex-end" wrap="nowrap" gap="sm">
        <TextInput
          label="Search"
          placeholder="Search models"
          value={playgroundSearchQuery}
          onChange={(e) => setPlaygroundSearchQuery(e.currentTarget.value)}
          style={{ flex: 1, minWidth: 0 }}
          rightSection={
            playgroundSearchQuery ? (
              <CloseButton
                size="sm"
                onMouseDown={(e) => e.preventDefault()}
                aria-label="Clear search"
                onClick={() => setPlaygroundSearchQuery("")}
              />
            ) : null
          }
          rightSectionPointerEvents="auto"
        />
        {isMobile ? (
          <Button
            variant="light"
            leftSection={<RiFilter3Line size={18} />}
            onClick={openPlaygroundFilters}
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
        ) : null}
      </Group>

      {isMobile ? (
        <Modal
          opened={playgroundFiltersOpened}
          onClose={closePlaygroundFilters}
          title="Playground filters"
          fullScreen
        >
          {filtersControls}
        </Modal>
      ) : (
        filtersControls
      )}
    </>
  );
}
