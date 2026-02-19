import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Group,
  Modal,
  Stack,
  Text,
  ThemeIcon,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { RiArrowDownSLine, RiCloseLine, RiImageLine } from "@remixicon/react";
import { useNavigate } from "react-router";
import { useMantineColorScheme, useMantineTheme } from "@mantine/core";
import useGenerateStore from "~/lib/stores/generateStore";
import useAppStore from "~/lib/stores/appStore";
import type { Model } from "~/lib/stores/generateStore";
import { ModelCard } from "~/shared/ModelCard";
import { ModelFiltersPanel, useModelFilters } from "~/shared/ModelFilters";

interface ModelSwitcherProps {
  generationType?: string;
  _autoLoad?: boolean;
  showAllTypes?: boolean;
}

// Get brand logo from brands table or fallback to emoji
const getBrandLogo = (model: Model) => {
  // Use logo from brands table if available
  if (model.brands?.logo) {
    return model.brands.logo;
  }

  // Fallback to emoji based on model name
  return "🤖"; // Default AI logo
};

// Render logo as avatar
const renderLogo = (model: Model, size: "sm" | "md" | "lg" = "md") => {
  const logo = getBrandLogo(model);
  const isUrl = logo.startsWith("http") || logo.startsWith("/");

  const avatarSize = size === "sm" ? 24 : size === "md" ? 32 : 40;

  if (isUrl) {
    return (
      <Avatar src={logo} alt={model.brands?.name || model.name} size={avatarSize} radius="sm" />
    );
  }

  return (
    <Avatar size={avatarSize} radius="sm" color="blue">
      {logo}
    </Avatar>
  );
};

export function ModelSwitcher({
  generationType,
  _autoLoad = true,
  showAllTypes: _showAllTypes = true,
}: ModelSwitcherProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const navigate = useNavigate();
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const { isMobile } = useAppStore();

  // Get state from generateStore
  const {
    models,
    selectedModel,
    resetGenerateState,
    setModelLoading,
    setLoadingGenerations,
    setSelectedModel,
    setSelectedFilterModelId,
    setGenerations,
  } = useGenerateStore();

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
  } = useModelFilters(models, { initialFilterType: generationType ?? "" });

  const handleModelSwitch = (model: Model) => {
    resetGenerateState();
    setSelectedModel(model);
    setSelectedFilterModelId(model.id);
    setGenerations([]);
    setModelLoading(true);
    setLoadingGenerations(true);
    navigate(`/generate/${model.generation_type}/${model.slug}`, { replace: true });
    close();
  };

  return (
    <>
      <UnstyledButton
        onClick={open}
        style={{
          padding: "6px 8px",
          borderRadius: "4px",
          border: `1px solid ${colorScheme === "dark" ? "var(--mantine-color-dark-5)" : "var(--mantine-color-gray-1)"}`,
          backgroundColor:
            colorScheme === "dark" ? "var(--mantine-color-dark-6)" : "var(--mantine-color-gray-0)",
          transition: "all 0.2s ease",
          cursor: "pointer",
          width: "100%",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor =
            colorScheme === "dark" ? "var(--mantine-color-dark-5)" : "var(--mantine-color-gray-1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor =
            colorScheme === "dark" ? "var(--mantine-color-dark-6)" : "var(--mantine-color-gray-0)";
        }}
      >
        <Group justify="space-between" align="center">
          <Group gap="sm">
            {selectedModel ? (
              <Group gap="sm">
                {renderLogo(selectedModel, "sm")}
                <Group justify="space-between" align="center">
                  <Text size="sm" fw={500} truncate="end">
                    {selectedModel.name.length > 24
                      ? `${selectedModel.name.slice(0, 24)}...`
                      : selectedModel.name}
                  </Text>
                </Group>
              </Group>
            ) : (
              <>
                <ThemeIcon size={24} radius="sm" color="gray" variant="light">
                  <RiImageLine size={16} />
                </ThemeIcon>
                <Stack gap={1}>
                  <Text size="sm" c="dimmed" fw={500}>
                    Choose your AI Model
                  </Text>
                  <Text size="xs" c="dimmed">
                    Select a model to get started
                  </Text>
                </Stack>
              </>
            )}
          </Group>
          <Group gap="sm">
            {selectedModel && (
              <Badge size="xs" variant="light" color={theme.primaryColor}>
                {selectedModel.generation_type}
              </Badge>
            )}
            <ThemeIcon variant="subtle" size="sm" color="gray">
              <RiArrowDownSLine size={16} />
            </ThemeIcon>
          </Group>
        </Group>
      </UnstyledButton>

      <Modal
        opened={opened}
        onClose={close}
        size="lg"
        fullScreen={isMobile}
        withCloseButton={false}
        styles={{ body: { padding: 0 } }}
      >
        <>
          <Box
            style={{
              position: "sticky",
              top: 0,
              zIndex: 20,
              backgroundColor: "var(--mantine-color-body)",
              borderBottom: "1px solid var(--mantine-color-default-border)",
              padding: "var(--mantine-spacing-xs) var(--mantine-spacing-md)",
            }}
          >
            <Stack gap="xs">
              <Group justify="flex-end">
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  onClick={close}
                  aria-label="Close model switcher"
                >
                  <RiCloseLine size={24} />
                </ActionIcon>
              </Group>
              <ModelFiltersPanel
                mode="popup"
                modalFullScreen={isMobile}
                showTypeControlInPopup
                filterType={filterType}
                onFilterTypeChange={setFilterType}
                filterTags={filterTags}
                onFilterTagsChange={setFilterTags}
                filterBrands={filterBrands}
                onFilterBrandsChange={setFilterBrands}
                allTags={allTags}
                allBrands={allBrands}
              />
            </Stack>
          </Box>
          {models.length === 0 ? (
            <Text size="sm" c="dimmed" ta="center" py="xl">
              No models available
            </Text>
          ) : (
            <Stack gap="md" p="md">
              {filteredModels.length === 0 ? (
                <Text size="sm" c="dimmed" ta="center" py="xl">
                  No models match your filters
                </Text>
              ) : (
                <Stack gap="sm">
                  {filteredModels.map((model) => {
                    const isCurrentModel = model.id === selectedModel?.id;
                    return (
                      <ModelCard
                        key={model.id}
                        model={model}
                        onSelect={handleModelSwitch}
                        selected={isCurrentModel}
                        showDescriptionPopover
                      />
                    );
                  })}
                </Stack>
              )}
            </Stack>
          )}
        </>
      </Modal>
    </>
  );
}
