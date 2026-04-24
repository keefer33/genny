import { Badge, Button, Group, Modal, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { RiFilter3Line } from "@remixicon/react";
import { RunHistoryFilters } from "~/pages/generations/components/GenerationsHistoryFilters";
import { FileFilters } from "~/pages/files/components/FileFilters";
import useAppStore from "~/lib/stores/appStore";
import useGenerationsStore from "~/lib/stores/generateStore";

export function PlayGroundRunHistoryFiltersModal({
  availableModels,
  availableBrands = [],
  availableProducts = [],
}: {
  availableModels: Array<{ id: string; name: string }>;
  availableBrands?: string[];
  availableProducts?: string[];
}) {
  const [opened, { open, close }] = useDisclosure(false);
  const { isMobile } = useAppStore();
  const {
    generationsHistoryGenModelFilter,
    generationsHistoryBrandFilters,
    generationsHistoryModelProductFilters,
    generationsHistoryFileTypeFilter,
    generationsHistoryTagIds,
    setGenerationsHistoryGenModelFilter,
    setGenerationsHistoryBrandFilters,
    setGenerationsHistoryModelProductFilters,
    setGenerationsHistoryFileTypeFilter,
    setGenerationsHistoryTagIds,
  } = useGenerationsStore();

  const selectedFiltersCount =
    (generationsHistoryGenModelFilter ? 1 : 0) +
    generationsHistoryBrandFilters.length +
    generationsHistoryModelProductFilters.length +
    (generationsHistoryFileTypeFilter !== "all" ? 1 : 0) +
    generationsHistoryTagIds.length;

  return (
    <>
      <Group align="center" gap="xs">
        <Button variant="light" size="sm" leftSection={<RiFilter3Line size={16} />} onClick={open}>
          <Group gap={6} align="center">
            Filters
            <Badge variant="filled" size="xs">
              {selectedFiltersCount}
            </Badge>
          </Group>
        </Button>
      </Group>

      <Modal
        opened={opened}
        onClose={close}
        title="Filters"
        fullScreen={isMobile}
        size={isMobile ? undefined : "lg"}
      >
        <Stack gap="xl">
          <RunHistoryFilters
            availableModels={availableModels}
            availableBrands={availableBrands}
            availableProducts={availableProducts}
            modelId={generationsHistoryGenModelFilter}
            onModelIdChange={setGenerationsHistoryGenModelFilter}
            brandFilters={generationsHistoryBrandFilters}
            onBrandFiltersChange={setGenerationsHistoryBrandFilters}
            productFilters={generationsHistoryModelProductFilters}
            onProductFiltersChange={setGenerationsHistoryModelProductFilters}
          />
          <FileFilters
            showTagManager
            showFileTypeFilter
            controlled={{
              fileType: generationsHistoryFileTypeFilter,
              onFileTypeChange: setGenerationsHistoryFileTypeFilter,
              selectedTags: generationsHistoryTagIds,
              onSelectedTagsChange: setGenerationsHistoryTagIds,
            }}
          />
        </Stack>
      </Modal>
    </>
  );
}
