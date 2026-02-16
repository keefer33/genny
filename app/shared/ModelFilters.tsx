import {
  Badge,
  Box,
  Button,
  Checkbox,
  Group,
  Modal,
  SegmentedControl,
  Stack,
  Text,
  useMantineTheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { RiFilter3Line } from "@remixicon/react";
import { useMemo, useState } from "react";
import type { Model } from "~/lib/stores/generateStore";
import { getModelTags } from "~/shared/ModelCard";

export const GENERATION_TYPE_OPTIONS = [
  { value: "", label: "All" },
  { value: "image", label: "Image" },
  { value: "video", label: "Video" },
  { value: "tool", label: "Tool" },
];
export const POPUP_FILTERS_BAR_HEIGHT = 84;

export interface UseModelFiltersOptions {
  /** Initial generation type filter (e.g. from URL or parent). */
  initialFilterType?: string;
}

export function useModelFilters(models: Model[], options: UseModelFiltersOptions = {}) {
  const { initialFilterType = "" } = options;
  const [filterType, setFilterType] = useState<string>(initialFilterType);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterBrands, setFilterBrands] = useState<string[]>([]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    models.forEach((m) => getModelTags(m).forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [models]);

  const allBrands = useMemo(() => {
    const set = new Set<string>();
    models.forEach((m) => {
      const brandName = m?.brands?.name?.trim();
      if (brandName) {
        set.add(brandName);
      }
    });
    return Array.from(set).sort();
  }, [models]);

  const filteredModels = useMemo(() => {
    return models.filter((model) => {
      if (!model?.id) return false;
      if (filterType && model.generation_type !== filterType) return false;
      if (filterBrands.length > 0) {
        const modelBrand = model?.brands?.name?.trim() || "";
        if (!modelBrand || !filterBrands.includes(modelBrand)) return false;
      }
      if (filterTags.length > 0) {
        const modelTags = getModelTags(model);
        const hasTag = filterTags.some((t) => modelTags.includes(t));
        if (!hasTag) return false;
      }
      return true;
    });
  }, [models, filterType, filterBrands, filterTags]);

  return {
    filterType,
    setFilterType,
    filterTags,
    setFilterTags,
    filterBrands,
    setFilterBrands,
    allTags,
    allBrands,
    filteredModels,
  };
}

export interface ModelFilterBarProps {
  filterType: string;
  onFilterTypeChange: (value: string) => void;
  filterTags: string[];
  onFilterTagsChange: (value: string[]) => void;
  filterBrands?: string[];
  onFilterBrandsChange?: (value: string[]) => void;
  allTags: string[];
  allBrands?: string[];
}

export function ModelFilterBar({
  filterType,
  onFilterTypeChange,
  filterTags,
  onFilterTagsChange,
  filterBrands = [],
  onFilterBrandsChange = () => {},
  allTags,
  allBrands = [],
}: ModelFilterBarProps) {
  const theme = useMantineTheme();

  return (
    <Stack gap="xs">
      <SegmentedControl
        value={filterType}
        onChange={onFilterTypeChange}
        data={GENERATION_TYPE_OPTIONS}
        color={theme.primaryColor}
      />
      {allTags.length > 0 && (
        <Box>
          <Text size="xs" c="dimmed" mb="xs">
            Filter by tags
          </Text>
          <Checkbox.Group value={filterTags} onChange={onFilterTagsChange}>
            <Stack gap={6}>
              {allTags.map((tag) => (
                <Checkbox key={tag} value={tag} label={tag} color={theme.primaryColor} />
              ))}
            </Stack>
          </Checkbox.Group>
        </Box>
      )}
      {allBrands.length > 0 && (
        <Box>
          <Text size="xs" c="dimmed" mb="xs">
            Filter by brand
          </Text>
          <Checkbox.Group value={filterBrands} onChange={onFilterBrandsChange}>
            <Stack gap={6}>
              {allBrands.map((brand) => (
                <Checkbox key={brand} value={brand} label={brand} color={theme.primaryColor} />
              ))}
            </Stack>
          </Checkbox.Group>
        </Box>
      )}
    </Stack>
  );
}

interface ModelFiltersPanelProps extends ModelFilterBarProps {
  mode?: "inline" | "popup";
  buttonLabel?: string;
  modalTitle?: string;
  modalFullScreen?: boolean;
}

export function ModelFiltersPanel({
  mode = "inline",
  buttonLabel = "Filters",
  modalTitle = "Filters",
  modalFullScreen = false,
  ...filterBarProps
}: ModelFiltersPanelProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const selectedTypeLabel = GENERATION_TYPE_OPTIONS.find(
    (option) => option.value === filterBarProps.filterType
  )?.label;
  const selectedType =
    filterBarProps.filterType && selectedTypeLabel ? [`Type: ${selectedTypeLabel}`] : [];
  const selectedTags = (filterBarProps.filterTags || []).map((tag) => `Tag: ${tag}`);
  const selectedBrands = (filterBarProps.filterBrands || []).map((brand) => `Brand: ${brand}`);
  const selectedFilters = [...selectedType, ...selectedTags, ...selectedBrands];
  const visibleSelections = selectedFilters.slice(0, 2);
  const remainingSelections = selectedFilters.length - visibleSelections.length;
  const hasSelectedFilters = selectedFilters.length > 0;

  const clearAllFilters = () => {
    filterBarProps.onFilterTypeChange("");
    filterBarProps.onFilterTagsChange([]);
    filterBarProps.onFilterBrandsChange?.([]);
  };

  if (mode === "inline") {
    return (
      <Stack gap="xs">
        <ModelFilterBar {...filterBarProps} />
        <Group justify="flex-end" style={{ minHeight: 30 }}>
          {hasSelectedFilters && (
            <Button variant="subtle" size="sm" color="gray" onClick={clearAllFilters}>
              Clear all filters
            </Button>
          )}
        </Group>
      </Stack>
    );
  }

  return (
    <Stack gap="xs" style={{ height: POPUP_FILTERS_BAR_HEIGHT }}>
      <Group justify="flex-end" wrap="nowrap">
        <Button variant="light" size="sm" leftSection={<RiFilter3Line size={16} />} onClick={open}>
          {buttonLabel}
        </Button>
      </Group>
      <Box style={{ minHeight: 22, overflow: "hidden" }}>
        <Group justify="space-between" align="center" wrap="nowrap">
          <Box style={{ overflow: "hidden" }}>
            {hasSelectedFilters ? (
              <Group gap="xs" wrap="nowrap">
                {visibleSelections.map((selection) => (
                  <Badge key={selection} variant="light" size="sm">
                    {selection}
                  </Badge>
                ))}
                {remainingSelections > 0 && (
                  <Badge variant="outline" size="sm">
                    +{remainingSelections} more
                  </Badge>
                )}
              </Group>
            ) : (
              <Text size="xs" c="dimmed">
                No filters selected
              </Text>
            )}
          </Box>
          {hasSelectedFilters && (
            <Button variant="subtle" size="compact-xs" color="gray" onClick={clearAllFilters}>
              Clear all
            </Button>
          )}
        </Group>
      </Box>
      <Modal opened={opened} onClose={close} title={modalTitle} fullScreen={modalFullScreen}>
        <ModelFilterBar {...filterBarProps} />
      </Modal>
    </Stack>
  );
}
