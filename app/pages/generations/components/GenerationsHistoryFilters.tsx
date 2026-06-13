import { Group, Stack, Text, Select, MultiSelect } from "@mantine/core";
import useGenerationsStore from "~/lib/stores/generateStore";
import useAppStore from "~/lib/stores/appStore";

interface GenerationFiltersProps {
  availableModels?: Array<{ id: string; name: string }>;
  availableBrands?: string[];
  availableProducts?: string[];
  availableModelTypes?: string[];
  /** When set with `onModelIdChange`, controls model filter without using generate store. */
  modelId?: string | null;
  onModelIdChange?: (id: string | null) => void;
  brandFilters?: string[];
  onBrandFiltersChange?: (values: string[]) => void;
  productFilters?: string[];
  onProductFiltersChange?: (values: string[]) => void;
  modelTypeFilters?: string[];
  onModelTypeFiltersChange?: (values: string[]) => void;
}

export function RunHistoryFilters({
  availableModels = [],
  availableBrands = [],
  availableProducts = [],
  availableModelTypes = [],
  modelId: controlledModelId,
  onModelIdChange,
  brandFilters: controlledBrandFilters,
  onBrandFiltersChange,
  productFilters: controlledProductFilters,
  onProductFiltersChange,
  modelTypeFilters: controlledModelTypeFilters,
  onModelTypeFiltersChange,
}: GenerationFiltersProps) {
  const store = useGenerationsStore();
  const {
    generationsHistoryGenModelFilter,
    setGenerationsHistoryGenModelFilter,
    setGenerationsHistoryBrandFilters,
    setGenerationsHistoryModelProductFilters,
    setGenerationsHistoryModelTypeFilters,
    generationsHistoryBrandFilters,
    generationsHistoryModelProductFilters,
    generationsHistoryModelTypeFilters,
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
  const selectedModelTypeFilters =
    controlledModelTypeFilters !== undefined
      ? controlledModelTypeFilters
      : generationsHistoryModelTypeFilters;
  const setSelectedModelTypeFilters =
    onModelTypeFiltersChange ?? setGenerationsHistoryModelTypeFilters;

  const { themeSettings } = useAppStore();
  return (
    <Stack gap="xl">
      {/* Model Filter */}
      <Stack gap="sm">
        <Group justify="space-between" align="center">
          <Text size="sm" fw={500}>
            Filter by model
            {selectedFilterModelId && (
              <Text component="span" size="xs" ml="xs" c={themeSettings.themeColor}>
                (selected)
              </Text>
            )}
          </Text>
        </Group>
        <Select
          placeholder="Select a model"
          value={selectedFilterModelId}
          onChange={setSelectedFilterModelId}
          data={availableModels.map((model) => ({
            value: model.id,
            label: model.name,
          }))}
          clearable
          searchable
          comboboxProps={{ withinPortal: false }}
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
          comboboxProps={{ withinPortal: false }}
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
          comboboxProps={{ withinPortal: false }}
        />
      </Stack>

      <Stack gap="sm">
        <Text size="sm" fw={500}>
          Filter by model type
        </Text>
        <MultiSelect
          placeholder="Select one or more model types"
          value={selectedModelTypeFilters}
          onChange={setSelectedModelTypeFilters}
          data={availableModelTypes.map((value) => ({ value, label: value }))}
          clearable
          searchable
          comboboxProps={{ withinPortal: false }}
        />
      </Stack>
    </Stack>
  );
}
