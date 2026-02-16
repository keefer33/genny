import {
  Card,
  Container,
  Grid,
  Stack,
  Text,
  Title,
  useMantineTheme,
  Center,
  Box,
} from "@mantine/core";
import { RiImageLine } from "@remixicon/react";
import { useNavigate } from "react-router";
import useAppStore from "~/lib/stores/appStore";
import useGenerateStore from "~/lib/stores/generateStore";
import type { Model } from "~/lib/stores/generateStore";
import { ModelCard } from "~/shared/ModelCard";
import {
  ModelFiltersPanel,
  POPUP_FILTERS_BAR_HEIGHT,
  useModelFilters,
} from "~/shared/ModelFilters";

export default function Generate() {
  const navigate = useNavigate();
  const theme = useMantineTheme();
  const { isMobile } = useAppStore();
  const { models, setSelectedModel, setSelectedFilterModelId, setGenerations } = useGenerateStore();
  const {
    filterType,
    setFilterType,
    filterTags,
    setFilterTags,
    filterBrands,
    setFilterBrands,
    allTags,
    allBrands,
    filteredModels,
  } = useModelFilters(models);

  const handleModelSelect = (model: Model) => {
    setSelectedModel(model);
    setSelectedFilterModelId(model.id);
    setGenerations([]);
    navigate(`/generate/${model.generation_type}/${model.slug}`);
  };

  return (
    <Container size="lg" py="xs">
      <Grid gutter="xl">
        {/* Left: Filters (sidebar on desktop; fixed bar on mobile) */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          {isMobile ? (
            <>
              <Box style={{ height: POPUP_FILTERS_BAR_HEIGHT }} aria-hidden />
              <Box
                style={{
                  position: "fixed",
                  top: 60,
                  left: 0,
                  right: 0,
                  zIndex: 10,
                  backgroundColor: "var(--mantine-color-body)",
                  height: POPUP_FILTERS_BAR_HEIGHT,
                  padding: "var(--mantine-spacing-xs) var(--mantine-spacing-md)",
                }}
              >
                <ModelFiltersPanel
                  mode="popup"
                  modalFullScreen
                  filterType={filterType}
                  onFilterTypeChange={setFilterType}
                  filterTags={filterTags}
                  onFilterTagsChange={setFilterTags}
                  filterBrands={filterBrands}
                  onFilterBrandsChange={setFilterBrands}
                  allTags={allTags}
                  allBrands={allBrands}
                />
              </Box>
            </>
          ) : (
            <Box
              style={{
                position: "sticky",
                top: 100,
                zIndex: 10,
                backgroundColor: "var(--mantine-color-body)",
              }}
            >
              <ModelFiltersPanel
                filterType={filterType}
                onFilterTypeChange={setFilterType}
                filterTags={filterTags}
                onFilterTagsChange={setFilterTags}
                filterBrands={filterBrands}
                onFilterBrandsChange={setFilterBrands}
                allTags={allTags}
                allBrands={allBrands}
              />
            </Box>
          )}
        </Grid.Col>

        {/* Right: Results */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          {filteredModels.length === 0 ? (
            <Card withBorder radius="md" p="xl">
              <Center py="xl">
                <Stack align="center" gap="md">
                  <RiImageLine size={48} color={theme.colors.gray[5]} />
                  <Title order={3}>No models match your filters</Title>
                  <Text size="sm" c="dimmed">
                    Try changing the generation type, tags, or brand.
                  </Text>
                </Stack>
              </Center>
            </Card>
          ) : (
            <Grid>
              {filteredModels.map((model) => (
                <Grid.Col key={model.id} span={12}>
                  <ModelCard model={model} onSelect={handleModelSelect} />
                </Grid.Col>
              ))}
            </Grid>
          )}
        </Grid.Col>
      </Grid>
    </Container>
  );
}
