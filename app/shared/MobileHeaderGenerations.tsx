import { Badge, Modal, Group, Button, Stack } from "@mantine/core";
import { Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import useGenerateStore from "~/lib/stores/generateStore";
import useFilesFoldersStore from "~/lib/stores/filesFoldersStore";
import { useMemo } from "react";
import { RiFilterLine } from "@remixicon/react";
import { GenerationFilters } from "~/pages/generate/components/GenerationFilters";
import { FileFilters } from "~/pages/files/components/FileFilters";

export const MobileHeaderGenerations = () => {
  const [filtersModalOpened, { open: openFiltersModal, close: closeFiltersModal }] =
    useDisclosure(false);
  const { selectedFilterModelId, models } = useGenerateStore();
  const { fileTypeFilter, selectedTags } = useFilesFoldersStore();
  
  // Get available models from store (all models, not just from loaded generations)
  const availableModels = useMemo(() => {
    return models.map((model) => ({
      id: model.id,
      name: model.name,
    }));
  }, [models]);

  // Calculate active filter count
  const activeFilterCount =
    (selectedFilterModelId ? 1 : 0) +
    (fileTypeFilter !== "all" ? 1 : 0) +
    (selectedTags.length > 0 ? 1 : 0);

  return (
    <>
      <Group gap="xs" justify="space-between" align="center" p="xs">
        <Title order={3}>Generations</Title>
        <Button leftSection={<RiFilterLine size={16} />} variant="light" onClick={openFiltersModal}>
          Filters
          {activeFilterCount > 0 && (
            <Badge size="sm" ml="xs" variant="filled" color="blue">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </Group>
      <Modal opened={filtersModalOpened} onClose={closeFiltersModal} title="Filters" size="lg">
        <Stack gap="xl">
          <GenerationFilters availableModels={availableModels} />
          <FileFilters showTagManager showFileTypeFilter />
        </Stack>
      </Modal>
    </>
  );
};
