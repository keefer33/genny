import { ActionIcon, Avatar, Card, Group, Stack, Text, Tooltip } from "@mantine/core";
import type { ModelPricing } from "~/shared/ModelPricingDetails";
import { formatContextWindowRoundedUp, ModelPricingDetails } from "~/shared/ModelPricingDetails";
import {
  RiAttachmentLine,
  RiBrainLine,
  RiDatabaseLine,
  RiEyeLine,
  RiPriceTag3Line,
  RiToolsLine,
} from "@remixicon/react";

type AgentModelLike = {
  id: string;
  model_name?: string | null;
  brand_name?: { name?: string | null; logo?: string | null } | null;
  api_id?: { pricing?: ModelPricing | null } | null;
  meta?: {
    context_window?: unknown;
    name?: string | null;
    tags?: string[];
  } | null;
};

export function AgentModelCard({
  model,
  isSelected,
  onSelect,
}: {
  model: AgentModelLike;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const formattedContext = formatContextWindowRoundedUp(model.meta?.context_window);

  const getTagIcon = (tag: string) => {
    const t = tag.trim().toLowerCase();
    switch (t) {
      case "reasoning":
        return RiBrainLine;
      case "tool-use":
        return RiToolsLine;
      case "vision":
        return RiEyeLine;
      case "file-input":
        return RiAttachmentLine;
      case "implicit-caching":
        return RiDatabaseLine;
      default:
        return RiPriceTag3Line;
    }
  };

  const getTagColor = (tag: string) => {
    const t = tag.trim().toLowerCase();
    switch (t) {
      case "reasoning":
        return "indigo";
      case "tool-use":
        return "teal";
      case "vision":
        return "cyan";
      case "file-input":
        return "violet";
      case "implicit-caching":
        return "orange";
      default:
        return "gray";
    }
  };

  return (
    <Card
      onClick={onSelect}
      style={{
        cursor: "pointer",
        borderColor: isSelected ? "var(--mantine-color-blue-6)" : undefined,
        backgroundColor: isSelected ? "var(--mantine-color-blue-light)" : undefined,
      }}
    >
      <Stack gap={4}>
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Group wrap="nowrap" gap="sm" style={{ minWidth: 0 }}>
            <Avatar src={model.brand_name?.logo ?? undefined} radius="sm" size="md" color="blue">
              {(model.brand_name?.name || "?")[0].toUpperCase()}
            </Avatar>
            <Stack gap={0} style={{ minWidth: 0 }}>
              <Text fw={700} size="md" truncate>
                {model.meta?.name || model.model_name || model.id}
              </Text>
              {model.brand_name?.name && (
                <Text size="xs" c="dimmed" truncate>
                  {model.brand_name.name}
                </Text>
              )}
            </Stack>
          </Group>
        </Group>

        <ModelPricingDetails
          pricing={model.api_id?.pricing ?? null}
          contextWindow={model.meta?.context_window}
          showContext={false}
        />

        {(model.meta?.tags && model.meta.tags.length > 0) || formattedContext ? (
          <Group gap="xs" mt={4} wrap="wrap" align="center" justify="space-between">
            {formattedContext && (
              <Text size="xs" c="dimmed">
                Context: {formattedContext}
              </Text>
            )}
            <Group gap="xs">
              {model.meta?.tags?.map((tag) => (
                <Tooltip key={tag} label={tag} withArrow>
                  <ActionIcon variant="light" color={getTagColor(tag)} size="sm" aria-label={tag}>
                    {(() => {
                      const Icon = getTagIcon(tag);
                      return <Icon size={14} />;
                    })()}
                  </ActionIcon>
                </Tooltip>
              ))}
            </Group>
          </Group>
        ) : null}
      </Stack>
    </Card>
  );
}
