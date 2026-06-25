import { Button, Modal, Tooltip } from "@mantine/core";
import { RiMoneyDollarCircleLine } from "@remixicon/react";
import { useMemo, useState } from "react";
import useAppStore from "~/lib/stores/appStore";
import { useChatsStore, type ChatUIMessage } from "~/lib/stores/chatsStore";
import ChatMessagesUsageSummary, { formatUsd, summarizeUsage } from "./ChatMessagesUsageSummary";

export type ChatMessagesUsageSummaryActionProps = {
  chatId: string | null | undefined;
  messages?: ChatUIMessage[];
};

export default function ChatMessagesUsageSummaryAction({
  chatId,
  messages: messagesProp,
}: ChatMessagesUsageSummaryActionProps) {
  const [opened, setOpened] = useState(false);
  const { isMobile } = useAppStore();
  const { chats, messages: storeMessages, selectedChat } = useChatsStore();

  const chat = chatId ? chats.find((c) => c.id === chatId) : null;
  const messages = messagesProp ?? (selectedChat === chatId ? storeMessages : []);

  const { grandTotal } = useMemo(() => summarizeUsage(chat, messages), [chat, messages]);

  if (!chatId || messages.length === 0) return null;

  return (
    <>
      <Tooltip label="Usage">
        <Button
          variant="outline"
          size="compact-sm"
          aria-label="Chat usage"
          leftSection={<RiMoneyDollarCircleLine size={14} />}
          onClick={() => setOpened(true)}
        >
          {formatUsd(grandTotal)}
        </Button>
      </Tooltip>
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Usage"
        fullScreen={isMobile}
        size="sm"
        centered={!isMobile}
      >
        <ChatMessagesUsageSummary chat={chat} messages={messages} variant="popover" />
      </Modal>
    </>
  );
}
