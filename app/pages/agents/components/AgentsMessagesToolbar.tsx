import { ActionIcon, Group, Tooltip } from "@mantine/core";
import { RiToolsLine } from "@remixicon/react";
import { Link } from "react-router";
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
        <Tooltip label="Tools">
          <ActionIcon component={Link} to="/tools" size="md" variant="subtle" aria-label="Tools">
            <RiToolsLine size={26} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Group>
  );
}
