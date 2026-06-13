import { ActionIcon, Badge, Button, Group, Modal, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { RiCloseLine, RiFilter3Line } from "@remixicon/react";
import { useMemo } from "react";
import { formatGenModelDisplayName } from "~/lib/generationsHistoryUtils";
import { RunHistoryFilters } from "~/pages/generations/components/GenerationsHistoryFilters";
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
    setGenerationsHistoryGenModelFilter,
    setGenerationsHistoryBrandFilters,
    setGenerationsHistoryModelProductFilters,
    setGenerationsHistoryModelTypeFilters,
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

  const selectedFiltersCount =
    (generationsHistoryGenModelFilter ? 1 : 0) +
    generationsHistoryBrandFilters.length +
    generationsHistoryModelProductFilters.length +
    generationsHistoryModelTypeFilters.length;

  return (
    <>
      <Group align="center" gap="0">
        <Button
          variant="filled"
          size="compact-md"
          leftSection={<RiFilter3Line size={16} />}
          onClick={open}
        >
          <Group gap={6} align="center">
            <Badge variant="light" size="xs">
              {selectedFiltersCount}
            </Badge>
          </Group>
        </Button>
        {selectedFiltersCount > 0 ? (
          <ActionIcon
            variant="transparent"
            color="red"
            size="md"
            onClick={clearGenerationsHistoryFilters}
          >
            <RiCloseLine size={26} />
          </ActionIcon>
        ) : null}
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
          <Group justify="flex-end">
            <GenerationsHistoryClearFiltersButton />
            <Button size="xs" onClick={close}>
              Apply filters
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
