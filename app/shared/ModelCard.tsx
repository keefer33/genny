import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Card,
  Group,
  Popover,
  Stack,
  Text,
  useMantineTheme,
} from "@mantine/core";
import { RiImageLine, RiInformationLine, RiVideoLine, RiToolsLine } from "@remixicon/react";
import type { Model } from "~/lib/stores/generateStore";

const TYPE_ICONS: Record<string, typeof RiImageLine> = {
  image: RiImageLine,
  video: RiVideoLine,
  tool: RiToolsLine,
  tools: RiToolsLine,
};

export function getModelTags(model: Model): string[] {
  const fromMeta = model.meta?.tags;
  if (Array.isArray(fromMeta) && fromMeta.length > 0) return fromMeta;
  if (Array.isArray(model.tags) && model.tags.length > 0) return model.tags;
  return [];
}

export interface ModelCardProps {
  model: Model;
  onSelect?: (model: Model) => void;
  /** Show the info icon and description popover. Default true. */
  showDescriptionPopover?: boolean;
  /** When true, show "Current" badge and do not trigger onSelect. Default false. */
  selected?: boolean;
  /** Card padding. Default "xs". */
  padding?: "xs" | "sm" | "md";
}

export function ModelCard({
  model,
  onSelect,
  showDescriptionPopover = true,
  selected = false,
  padding = "xs",
}: ModelCardProps) {
  const theme = useMantineTheme();
  const modelTags = getModelTags(model);
  const IconComponent = TYPE_ICONS[model.generation_type] || RiImageLine;

  const handleCardClick = () => {
    if (!selected && onSelect) onSelect(model);
  };

  return (
    <Card
      withBorder
      radius="xs"
      p={padding}
      style={{
        cursor: selected ? "default" : "pointer",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        opacity: selected ? 0.85 : 1,
      }}
      onMouseEnter={(e) => {
        if (selected) return;
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = theme.shadows.md;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
      onClick={handleCardClick}
    >
      <Stack gap="md">
        <Group justify="space-between" align="flex-start">
          <Group gap="xs" wrap="nowrap">
            <Avatar size="sm" color="gray" src={model.brands?.logo || ""} />
            <Box miw={0}>
              <Text size="lg" fw={selected ? 600 : 500} lineClamp={1}>
                {model.name}
              </Text>
            </Box>
          </Group>
          <Group gap="xs">
            {showDescriptionPopover && (
              <Box onClick={(e) => e.stopPropagation()}>
                <Popover position="bottom-end" withArrow shadow="md">
                  <Popover.Target>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size="sm"
                      aria-label="View description"
                    >
                      <RiInformationLine size={18} />
                    </ActionIcon>
                  </Popover.Target>
                  <Popover.Dropdown>
                    <Text size="sm" maw={320} style={{ whiteSpace: "pre-wrap" }}>
                      {model.description || "No description."}
                    </Text>
                  </Popover.Dropdown>
                </Popover>
              </Box>
            )}
            {selected && (
              <Badge size="sm" variant="filled" color={theme.primaryColor}>
                Current
              </Badge>
            )}
          </Group>
        </Group>
        <Group gap="xs" wrap="nowrap" style={{ overflow: "hidden" }}>
          <Badge
            size="sm"
            variant="light"
            color={
              model.generation_type === "image"
                ? "blue"
                : model.generation_type === "video"
                  ? "violet"
                  : "orange"
            }
            leftSection={<IconComponent size={12} />}
          >
            {model.generation_type}
          </Badge>
          {modelTags.slice(0, 4).map((tag) => (
            <Badge key={tag} variant="outline" size="xs">
              {tag}
            </Badge>
          ))}
          {modelTags.length > 4 && (
            <Text size="xs" c="dimmed">
              +{modelTags.length - 4}
            </Text>
          )}
        </Group>
      </Stack>
    </Card>
  );
}
