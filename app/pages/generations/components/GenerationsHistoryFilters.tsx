import { Button, Group, Stack, Text, Select, MultiSelect } from "@mantine/core";
import useGenerationsStore from "~/lib/stores/generateStore";

interface GenerationFiltersProps {
  availableModels?: Array<{ id: string; name: string }>;
  availableBrands?: string[];
  availableProducts?: string[];
  /** When set with `onModelIdChange`, controls model filter without using generate store. */
  modelId?: string | null;
  onModelIdChange?: (id: string | null) => void;
  brandFilters?: string[];
  onBrandFiltersChange?: (values: string[]) => void;
  productFilters?: string[];
  onProductFiltersChange?: (values: string[]) => void;
}

export function RunHistoryFilters({
  availableModels = [],
  availableBrands = [],
  availableProducts = [],
  modelId: controlledModelId,
  onModelIdChange,
  brandFilters: controlledBrandFilters,
  onBrandFiltersChange,
  productFilters: controlledProductFilters,
  onProductFiltersChange,
}: GenerationFiltersProps) {
  const store = useGenerationsStore();
  const {
    generationsHistoryGenModelFilter,
    setGenerationsHistoryGenModelFilter,
    setGenerationsHistoryBrandFilters,
    setGenerationsHistoryModelProductFilters,
    setGenerationsHistoryFileTypeFilter,
    setGenerationsHistoryTagIds,
    generationsHistoryBrandFilters,
    generationsHistoryModelProductFilters,
    generationsHistoryFileTypeFilter,
    generationsHistoryTagIds,
  } = store;
  const selectedFilterModelId =
    controlledModelId !== undefined ? controlledModelId : generationsHistoryGenModelFilter;
  const setSelectedFilterModelId = onModelIdChange ?? setGenerationsHistoryGenModelFilter;
  const selectedBrandFilters =
    controlledBrandFilters !== undefined ? controlledBrandFilters : generationsHistoryBrandFilters;
  const setSelectedBrandFilters = onBrandFiltersChange ?? setGenerationsHistoryBrandFilters;
  const selectedProductFilters =
    controlledProductFilters !== undefined
      ? controlledProductFilters
      : generationsHistoryModelProductFilters;
  const setSelectedProductFilters =
    onProductFiltersChange ?? setGenerationsHistoryModelProductFilters;

  const hasAnyFilter =
    Boolean(selectedFilterModelId) ||
    selectedBrandFilters.length > 0 ||
    selectedProductFilters.length > 0 ||
    generationsHistoryFileTypeFilter !== "all" ||
    generationsHistoryTagIds.length > 0;

  const clearAllFilters = () => {
    setGenerationsHistoryGenModelFilter(null);
    setGenerationsHistoryBrandFilters([]);
    setGenerationsHistoryModelProductFilters([]);
    setGenerationsHistoryFileTypeFilter("all");
    setGenerationsHistoryTagIds([]);
  };

  return (
    <Stack gap="xl">
      {hasAnyFilter ? (
        <Group justify="flex-end">
          <Button variant="light" size="xs" color="red" onClick={clearAllFilters}>
            Clear all filters
          </Button>
        </Group>
      ) : null}

      {/* Model Filter */}
      <Stack gap="sm">
        <Group justify="space-between" align="center">
          <Text size="sm" fw={500}>
            Filter by model
            {selectedFilterModelId && (
              <Text component="span" size="xs" c="blue" ml="xs">
                (selected)
              </Text>
            )}
          </Text>
        </Group>
        <Select
          placeholder="Select a model"
          value={selectedFilterModelId}
          onChange={(value) => setGenerationsHistoryGenModelFilter(value)}
          data={availableModels.map((model) => ({
            value: model.id,
            label: model.name,
          }))}
          clearable
          searchable
        />
      </Stack>

      <Stack gap="sm">
        <Text size="sm" fw={500}>
          Filter by brand
        </Text>
        <MultiSelect
          placeholder="Select one or more brands"
          value={selectedBrandFilters}
          onChange={setSelectedBrandFilters}
          data={availableBrands.map((value) => ({ value, label: value }))}
          clearable
          searchable
        />
      </Stack>

      <Stack gap="sm">
        <Text size="sm" fw={500}>
          Filter by product
        </Text>
        <MultiSelect
          placeholder="Select one or more products"
          value={selectedProductFilters}
          onChange={setSelectedProductFilters}
          data={availableProducts.map((value) => ({ value, label: value }))}
          clearable
          searchable
        />
      </Stack>
    </Stack>
  );
}
