import { ActionIcon, Group, Text } from "@mantine/core";
import { RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/react";
import { useChatsStore } from "~/lib/stores/chatsStore";
import { buildChatInteractions } from "./chatInteractions";

export default function ChatInteractionPagination() {
  const { messages, selectedInteractionIndex, goToPreviousInteraction, goToNextInteraction } =
    useChatsStore();
  const total = buildChatInteractions(messages).length;
  if (total <= 1) return null;

  const current = Math.min(selectedInteractionIndex, total - 1);

  return (
    <Group gap={4} wrap="nowrap">
      <ActionIcon
        size="md"
        variant="subtle"
        aria-label="Previous chat interaction"
        disabled={current <= 0}
        onClick={goToPreviousInteraction}
      >
        <RiArrowLeftSLine size={20} />
      </ActionIcon>
      <Text size="xs" c="dimmed" style={{ minWidth: 44, textAlign: "center" }}>
        {current + 1} / {total}
      </Text>
      <ActionIcon
        size="md"
        variant="subtle"
        aria-label="Next chat interaction"
        disabled={current >= total - 1}
        onClick={goToNextInteraction}
      >
        <RiArrowRightSLine size={20} />
      </ActionIcon>
    </Group>
  );
}
