import { Button, Group, Stack, Text, Select } from "@mantine/core";
import usePlaygroundStore from "~/lib/stores/playgroundStore";

interface GenerationFiltersProps {
  availableModels?: Array<{ id: string; name: string }>;
  /** When set with `onModelIdChange`, controls model filter without using generate store. */
  modelId?: string | null;
  onModelIdChange?: (id: string | null) => void;
}

export function RunHistoryFilters({
  availableModels = [],
  modelId: controlledModelId,
  onModelIdChange,
}: GenerationFiltersProps) {
  const store = usePlaygroundStore();
  const selectedFilterModelId =
    controlledModelId !== undefined ? controlledModelId : store.selectedRunHistoryModelId;
  const setSelectedFilterModelId = onModelIdChange ?? store.setSelectedRunHistoryModelId;

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
    </Stack>
  );
}
