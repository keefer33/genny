import {
  Avatar,
  Badge,
  Group,
  Modal,
  Text,
  ThemeIcon,
  UnstyledButton,
  Stack,
  Card,
  Tabs,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useState, useEffect } from "react";
import { RiArrowDownSLine, RiImageLine, RiVideoLine, RiToolsLine } from "@remixicon/react";
import { useNavigate } from "react-router";
import { useMantineColorScheme, useMantineTheme } from "@mantine/core";
import useGenerateStore from "~/lib/stores/generateStore";
import useAppStore from "~/lib/stores/appStore";
import type { Model } from "~/lib/stores/generateStore";

interface ModelSwitcherProps {
  generationType?: string;
  _autoLoad?: boolean;
  showAllTypes?: boolean;
}

const GENERATION_TYPE_INFO = {
  image: {
    name: "Image",
    icon: RiImageLine,
    color: "primary.7",
  },
  video: {
    name: "Video",
    icon: RiVideoLine,
    color: "green.3",
  },
  tools: {
    name: "Tools",
    icon: RiToolsLine,
    color: "orange",
  },
};

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
  showAllTypes = true,
}: ModelSwitcherProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const navigate = useNavigate();
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const { isMobile } = useAppStore();

  // Get state from generateStore
  const { models, selectedModel, resetGenerateState, setModelLoading, setLoadingGenerations } =
    useGenerateStore();

  // Track the active tab for badge styling
  const getInitialTab = () => {
    // Priority: selectedModel's generation_type > generationType prop > first available type
    if (selectedModel?.generation_type) {
      const modelsOfType = models.filter(
        (model) => model && model.generation_type === selectedModel.generation_type
      );
      if (modelsOfType.length > 0) {
        return selectedModel.generation_type;
      }
    }
    if (generationType) {
      const modelsOfType = models.filter(
        (model) => model && model.generation_type === generationType
      );
      if (modelsOfType.length > 0) {
        return generationType;
      }
    }
    const availableTypes = Object.keys(GENERATION_TYPE_INFO).filter((type) => {
      const modelsOfType = models.filter((model) => model && model.generation_type === type);
      return modelsOfType.length > 0;
    });
    return availableTypes[0] || Object.keys(GENERATION_TYPE_INFO)[0];
  };

  const [activeTab, setActiveTab] = useState<string>(getInitialTab);

  // Update activeTab only when selectedModel changes (not on every render)
  useEffect(() => {
    if (selectedModel?.generation_type) {
      const modelsOfType = models.filter(
        (model) => model && model.generation_type === selectedModel.generation_type
      );
      if (modelsOfType.length > 0) {
        setActiveTab(selectedModel.generation_type);
      }
    }
  }, [selectedModel?.generation_type, models]);

  const typeInfo = GENERATION_TYPE_INFO[generationType as keyof typeof GENERATION_TYPE_INFO];

  const handleModelSwitch = (model: Model) => {
    resetGenerateState();
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
        title={
          <Group gap="xs" p="xs">
            <Text size="lg" fw={600}>
              Select AI Model
            </Text>
          </Group>
        }
        size="lg"
        fullScreen={isMobile}
        //centered={!isMobile}
      >
        <>
          {models.length === 0 ? (
            <Text size="sm" c="dimmed" ta="center" py="xl">
              No models available
            </Text>
          ) : (
            <Tabs
              variant="pills"
              color={theme.primaryColor}
              value={activeTab}
              onChange={setActiveTab}
            >
              <Tabs.List>
                {(() => {
                  const entries: Array<[string, { name: string; icon: any; color: string }]> =
                    showAllTypes
                      ? Object.entries(GENERATION_TYPE_INFO)
                      : generationType && typeInfo
                        ? [[generationType, typeInfo]]
                        : [];

                  return entries
                    .filter(([type]) => {
                      // Only show tabs that have models
                      const modelsOfType = models.filter(
                        (model) => model && model.generation_type === type
                      );
                      return modelsOfType.length > 0;
                    })
                    .map(([type, typeInfo]) => {
                      const modelsOfType = models.filter(
                        (model) => model && model.generation_type === type
                      );
                      const IconComponent = typeInfo.icon;

                      const isSelected = activeTab === type;

                      return (
                        <Tabs.Tab
                          key={type}
                          value={type}
                          leftSection={<IconComponent size={16} />}
                          rightSection={
                            <Badge
                              size="xs"
                              variant={isSelected ? "filled" : "light"}
                              color={isSelected ? "white" : theme.primaryColor}
                              style={
                                isSelected
                                  ? {
                                      color: theme.colors[theme.primaryColor][6],
                                    }
                                  : undefined
                              }
                            >
                              {modelsOfType.length}
                            </Badge>
                          }
                        >
                          {typeInfo.name}
                        </Tabs.Tab>
                      );
                    });
                })()}
              </Tabs.List>

              {(() => {
                const entries: Array<[string, { name: string; icon: any; color: string }]> =
                  showAllTypes
                    ? Object.entries(GENERATION_TYPE_INFO)
                    : generationType && typeInfo
                      ? [[generationType, typeInfo]]
                      : [];

                return entries.map(([type]) => {
                  const modelsOfType = models.filter(
                    (model) => model && model.generation_type === type
                  );

                  if (modelsOfType.length === 0) return null;

                  return (
                    <Tabs.Panel key={type} value={type}>
                      <Stack gap="sm" pt="xs">
                        {modelsOfType.map((model) => {
                          if (!model || !model.id) return null;

                          const isCurrentModel = model.id === selectedModel?.id;

                          return (
                            <Card
                              key={model.id}
                              p="xs"
                              bg={colorScheme === "dark" ? "dark.6" : "gray.0"}
                              onClick={() => !isCurrentModel && handleModelSwitch(model)}
                              style={{
                                transition: "all 0.2s ease",
                                cursor: isCurrentModel ? "default" : "pointer",
                                opacity: isCurrentModel ? 0.7 : 1,
                              }}
                            >
                              <Group gap="md" align="center" justify="space-between" wrap="nowrap">
                                <Group gap="sm" align="center" wrap="nowrap">
                                  {renderLogo(model, "md")}
                                  <Text size="md" fw={isCurrentModel ? 600 : 400}>
                                    {model.name}
                                  </Text>
                                </Group>
                                <Group gap="xs" align="center" wrap="wrap">
                                  {model.tags && model.tags.length > 0 && (
                                    <Group gap="xs">
                                      {model.tags.slice(0, 2).map((tag, index) => (
                                        <Badge key={index} size="sm" variant="light" color="gray">
                                          {tag}
                                        </Badge>
                                      ))}
                                      {model.tags.length > 2 && (
                                        <Text size="sm" c="dimmed">
                                          +{model.tags.length - 2} more
                                        </Text>
                                      )}
                                    </Group>
                                  )}
                                  {isCurrentModel && (
                                    <Badge size="sm" variant="filled" color={theme.primaryColor}>
                                      Current
                                    </Badge>
                                  )}
                                </Group>
                              </Group>
                            </Card>
                          );
                        })}
                      </Stack>
                    </Tabs.Panel>
                  );
                });
              })()}
            </Tabs>
          )}
        </>
      </Modal>
    </>
  );
}
