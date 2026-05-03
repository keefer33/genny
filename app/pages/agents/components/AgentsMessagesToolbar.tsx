import { Group } from "@mantine/core";
import ChatGenerationsHistoryAction from "./ChatGenerationsHistoryAction";
import ChatInteractionPagination from "./ChatInteractionPagination";
import ChatMessagesModalAction from "./ChatMessagesModalAction";

export default function AgentsMessagesToolbar() {
  return (
    <Group justify="space-between" px="xs" py={4} wrap="nowrap" style={{ flexShrink: 0 }}>
      <Group gap="xs" wrap="nowrap">
        <ChatInteractionPagination />
        <ChatMessagesModalAction />
      </Group>
      <Group gap="xs" wrap="nowrap">
        <ChatGenerationsHistoryAction />
      </Group>
    </Group>
  );
}
