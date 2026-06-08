import { ActionIcon, Group, Loader, Tooltip } from "@mantine/core";
import { RiSparklingLine } from "@remixicon/react";

type CharacterAiAssistBarProps = {
  loading?: boolean;
  disabled?: boolean;
  onAssist: () => void;
};

export function CharacterAiAssistBar({
  loading = false,
  disabled = false,
  onAssist,
}: CharacterAiAssistBarProps) {
  return (
    <Group justify="flex-end" align="center" wrap="wrap">
      <Tooltip label="AI Assist">
        <ActionIcon
          size="lg"
          variant="transparent"
          aria-label="AI Assist"
          title="AI Assist"
          onClick={onAssist}
          disabled={disabled}
        >
          {loading ? <Loader size={24} /> : <RiSparklingLine size={24} />}
        </ActionIcon>
      </Tooltip>
    </Group>
  );
}
