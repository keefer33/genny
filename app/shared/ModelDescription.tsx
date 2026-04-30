import { ActionIcon, Popover, Stack, Text } from "@mantine/core";
import { RiInformationLine } from "@remixicon/react";

export type ModelDescriptionProps = {
  /** `gen_models.model_name` (or equivalent display name). */
  modelName?: string | null;
  /** Plain text model description. */
  description?: string | null;
};

export default function ModelDescription({ modelName, description }: ModelDescriptionProps) {
  const title = (modelName ?? "").trim();
  const body = (description ?? "").trim();
  if (!title && !body) return null;

  return (
    <Popover width={320} position="bottom-end" withArrow shadow="md">
      <Popover.Target>
        <ActionIcon
          variant="transparent"
          size="lg"
          aria-label={title ? `About ${title}` : "Model description"}
          style={{ flexShrink: 0 }}
        >
          <RiInformationLine size={26} />
        </ActionIcon>
      </Popover.Target>
      <Popover.Dropdown>
        <Stack gap="xs">
          {title ? (
            <Text size="sm" fw={600}>
              {title}
            </Text>
          ) : null}
          {body ? (
            <Text size="sm" c={title ? "dimmed" : undefined} style={{ whiteSpace: "pre-wrap" }}>
              {body}
            </Text>
          ) : null}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}
