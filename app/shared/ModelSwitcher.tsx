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
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { RiArrowDownSLine, RiImageLine, RiVideoLine, RiToolsLine } from "@remixicon/react";
import { useNavigate } from "react-router";
import { useMantineColorScheme } from "@mantine/core";
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
    color: "blue",
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
  const { isMobile } = useAppStore();

  // Get state from generateStore
  const { models, selectedModel, resetGenerateState, setModelLoading, setLoadingGenerations } =
    useGenerateStore();

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
              <Badge size="xs" variant="light" color={typeInfo?.color}>
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
        padding="2"
        fullScreen={isMobile}
        centered={!isMobile}
      >
        <>
          {models.length === 0 ? (
            <Text size="sm" c="dimmed" ta="center" py="xl">
              No models available
            </Text>
          ) : (
            <Stack gap="md" p="xs">
              {/* Group models by generation type */}
              {(() => {
                const entries: Array<[string, { name: string; icon: any; color: string }]> =
                  showAllTypes
                    ? Object.entries(GENERATION_TYPE_INFO)
                    : generationType && typeInfo
                      ? [[generationType, typeInfo]]
                      : [];

                return entries.map(([type, typeInfo]) => {
                  // Models are already sorted by generation_type and brand_id from root.tsx
                  const modelsOfType = models.filter(
                    (model) => model && model.generation_type === type
                  );

                  if (modelsOfType.length === 0) return null;

                  return (
                    <div key={type}>
                      <Group gap="xs" mb="md">
                        <ThemeIcon variant="light" size="md" color={typeInfo.color}>
                          <typeInfo.icon size={18} />
                        </ThemeIcon>
                        <Text size="md" fw={600}>
                          {typeInfo.name} Models
                        </Text>
                        <Badge size="sm" variant="light" color={typeInfo.color}>
                          {modelsOfType.length}
                        </Badge>
                      </Group>

                      <Stack gap="xs">
                        {modelsOfType.map((model) => {
                          if (!model || !model.id) return null;

                          const isCurrentModel = model.id === selectedModel?.id;
                          const modelTypeInfo =
                            GENERATION_TYPE_INFO[
                              model.generation_type as keyof typeof GENERATION_TYPE_INFO
                            ];

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
                                    <Badge size="sm" variant="filled" color={modelTypeInfo?.color}>
                                      Current
                                    </Badge>
                                  )}
                                </Group>
                              </Group>
                            </Card>
                          );
                        })}
                      </Stack>
                    </div>
                  );
                });
              })()}
            </Stack>
          )}
        </>
      </Modal>
    </>
  );
}
