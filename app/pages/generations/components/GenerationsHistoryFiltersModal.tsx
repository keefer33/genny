import { Badge, Button, Group, Modal, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { RiFilter3Line } from "@remixicon/react";
import { useMemo } from "react";
import { formatGenModelDisplayName } from "~/lib/generationsHistoryUtils";
import { RunHistoryFilters } from "~/pages/generations/components/GenerationsHistoryFilters";
import { FileFilters } from "~/pages/files/components/FileFilters";
import { GenerationsHistoryClearFiltersButton } from "~/shared/GenerationsHistoryClearFiltersButton";
import useAppStore from "~/lib/stores/appStore";
import useGenerationsStore from "~/lib/stores/generateStore";

export function PlayGroundRunHistoryFiltersModal() {
  const [opened, { open, close }] = useDisclosure(false);
  const { isMobile } = useAppStore();
  const {
    allGenModels,
    allGenModelsFilters,
    generationsHistoryGenModelFilter,
    generationsHistoryBrandFilters,
    generationsHistoryModelProductFilters,
    generationsHistoryModelTypeFilters,
    generationsHistoryFileTypeFilter,
    generationsHistoryTagIds,
    setGenerationsHistoryGenModelFilter,
    setGenerationsHistoryBrandFilters,
    setGenerationsHistoryModelProductFilters,
    setGenerationsHistoryModelTypeFilters,
    setGenerationsHistoryFileTypeFilter,
    setGenerationsHistoryTagIds,
    clearGenerationsHistoryFilters,
  } = useGenerationsStore();

  const availableModels = useMemo(() => {
    const byId = new Map<string, string>();
    for (const model of allGenModels) {
      byId.set(model.id, formatGenModelDisplayName(model));
    }
    return [...byId.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allGenModels]);

  const handleModelIdChange = (value: string | null) => {
    clearGenerationsHistoryFilters();
    setGenerationsHistoryGenModelFilter(value);
  };

  const handleBrandFiltersChange = (values: string[]) => {
    clearGenerationsHistoryFilters();
    setGenerationsHistoryBrandFilters(values);
  };

  const handleProductFiltersChange = (values: string[]) => {
    clearGenerationsHistoryFilters();
    setGenerationsHistoryModelProductFilters(values);
  };

  const handleModelTypeFiltersChange = (values: string[]) => {
    clearGenerationsHistoryFilters();
    setGenerationsHistoryModelTypeFilters(values);
  };

  const handleFileTypeChange = (value: "all" | "images" | "videos" | "audio") => {
    clearGenerationsHistoryFilters();
    setGenerationsHistoryFileTypeFilter(value);
  };

  const handleTagFiltersChange = (values: string[]) => {
    clearGenerationsHistoryFilters();
    setGenerationsHistoryTagIds(values);
  };

  const selectedFiltersCount =
    (generationsHistoryGenModelFilter ? 1 : 0) +
    generationsHistoryBrandFilters.length +
    generationsHistoryModelProductFilters.length +
    generationsHistoryModelTypeFilters.length +
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
        closeOnClickOutside={false}
      >
        <Stack gap="xl">
          <RunHistoryFilters
            availableModels={availableModels}
            availableBrands={allGenModelsFilters.brands}
            availableProducts={allGenModelsFilters.model_product}
            availableModelTypes={allGenModelsFilters.model_type}
            modelId={generationsHistoryGenModelFilter}
            onModelIdChange={handleModelIdChange}
            brandFilters={generationsHistoryBrandFilters}
            onBrandFiltersChange={handleBrandFiltersChange}
            productFilters={generationsHistoryModelProductFilters}
            onProductFiltersChange={handleProductFiltersChange}
            modelTypeFilters={generationsHistoryModelTypeFilters}
            onModelTypeFiltersChange={handleModelTypeFiltersChange}
          />
          <FileFilters
            showTagManager
            showFileTypeFilter
            showClearButtons={false}
            controlled={{
              fileType: generationsHistoryFileTypeFilter,
              onFileTypeChange: handleFileTypeChange,
              selectedTags: generationsHistoryTagIds,
              onSelectedTagsChange: handleTagFiltersChange,
            }}
          />
          <Group justify="flex-end">
            <GenerationsHistoryClearFiltersButton />
            <Button onClick={close}>Apply filters</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
