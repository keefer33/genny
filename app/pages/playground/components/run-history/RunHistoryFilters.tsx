import { Button, Group, Stack, Text, Select, MultiSelect } from "@mantine/core";
import usePlaygroundStore from "~/lib/stores/playgroundStore";

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
  const store = usePlaygroundStore();
  const selectedFilterModelId =
    controlledModelId !== undefined ? controlledModelId : store.selectedRunHistoryModelId;
  const setSelectedFilterModelId = onModelIdChange ?? store.setSelectedRunHistoryModelId;
  const selectedBrandFilters =
    controlledBrandFilters !== undefined ? controlledBrandFilters : store.runHistoryBrandFilters;
  const setSelectedBrandFilters = onBrandFiltersChange ?? store.setRunHistoryBrandFilters;
  const selectedProductFilters =
    controlledProductFilters !== undefined
      ? controlledProductFilters
      : store.runHistoryModelProductFilters;
  const setSelectedProductFilters =
    onProductFiltersChange ?? store.setRunHistoryModelProductFilters;

  return (
    <Stack gap="xl">
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
          {selectedFilterModelId && (
            <Button
              variant="light"
              size="xs"
              color="red"
              onClick={() => setSelectedFilterModelId(null)}
            >
              Clear filter
            </Button>
          )}
        </Group>
        <Select
          placeholder="Select a model"
          value={selectedFilterModelId}
          onChange={(value) => setSelectedFilterModelId(value)}
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
