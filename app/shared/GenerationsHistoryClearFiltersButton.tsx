import { Button, Group } from "@mantine/core";
import useGenerationsStore from "~/lib/stores/generateStore";

export function GenerationsHistoryClearFiltersButton() {
  const {
    generationsHistoryGenModelFilter,
    generationsHistoryBrandFilters,
    generationsHistoryModelProductFilters,
    generationsHistoryModelTypeFilters,
    generationsHistoryFileTypeFilter,
    generationsHistoryTagIds,
    clearGenerationsHistoryFilters,
  } = useGenerationsStore();

  const hasAnyFilter =
    Boolean(generationsHistoryGenModelFilter) ||
    generationsHistoryBrandFilters.length > 0 ||
    generationsHistoryModelProductFilters.length > 0 ||
    generationsHistoryModelTypeFilters.length > 0 ||
    generationsHistoryFileTypeFilter !== "all" ||
    generationsHistoryTagIds.length > 0;

  if (!hasAnyFilter) return null;

  return (
    <Group justify="flex-end">
      <Button variant="light" size="xs" color="red" onClick={clearGenerationsHistoryFilters}>
        Clear all filters
      </Button>
    </Group>
  );
}
