import { Badge, Button, Group, Modal, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { RiFilter3Line } from "@remixicon/react";
import { RunHistoryFilters } from "~/pages/playground/components/run-history/RunHistoryFilters";
import { FileFilters } from "~/pages/files/components/FileFilters";
import useAppStore from "~/lib/stores/appStore";
import usePlaygroundStore from "~/lib/stores/playgroundStore";

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
    runHistoryGenModelFilter,
    runHistoryBrandFilters,
    runHistoryModelProductFilters,
    runHistoryFileTypeFilter,
    runHistoryTagIds,
    setRunHistoryGenModelFilter,
    setRunHistoryBrandFilters,
    setRunHistoryModelProductFilters,
    setRunHistoryFileTypeFilter,
    setRunHistoryTagIds,
  } = usePlaygroundStore();

  const selectedFiltersCount =
    (runHistoryGenModelFilter ? 1 : 0) +
    runHistoryBrandFilters.length +
    runHistoryModelProductFilters.length +
    (runHistoryFileTypeFilter !== "all" ? 1 : 0) +
    runHistoryTagIds.length;

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
            modelId={runHistoryGenModelFilter}
            onModelIdChange={setRunHistoryGenModelFilter}
            brandFilters={runHistoryBrandFilters}
            onBrandFiltersChange={setRunHistoryBrandFilters}
            productFilters={runHistoryModelProductFilters}
            onProductFiltersChange={setRunHistoryModelProductFilters}
          />
          <FileFilters
            showTagManager
            showFileTypeFilter
            controlled={{
              fileType: runHistoryFileTypeFilter,
              onFileTypeChange: setRunHistoryFileTypeFilter,
              selectedTags: runHistoryTagIds,
              onSelectedTagsChange: setRunHistoryTagIds,
            }}
          />
        </Stack>
      </Modal>
    </>
  );
}
