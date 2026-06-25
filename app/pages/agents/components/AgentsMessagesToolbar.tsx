import { ActionIcon, Group, Tooltip } from "@mantine/core";
import { RiToolsLine } from "@remixicon/react";
import { Link } from "react-router";
import { useChatsStore } from "~/lib/stores/chatsStore";
import ChatInteractionPagination from "./ChatInteractionPagination";
import ChatMessagesModalAction from "./ChatMessagesModalAction";
import ChatMessagesUsageSummaryAction from "./ChatMessagesUsageSummaryAction";

export default function AgentsMessagesToolbar() {
  const { selectedChat } = useChatsStore();

  return (
    <Group justify="space-between" px="xs" py={4} wrap="nowrap" style={{ flexShrink: 0 }}>
      <Group gap="xs" wrap="nowrap">
        <ChatInteractionPagination />
        <ChatMessagesModalAction />
        <ChatMessagesUsageSummaryAction chatId={selectedChat} />
      </Group>
      <Group gap="xs" wrap="nowrap">
        <Tooltip label="Tools">
          <ActionIcon component={Link} to="/tools" size="md" variant="subtle" aria-label="Tools">
            <RiToolsLine size={26} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Group>
  );
}
