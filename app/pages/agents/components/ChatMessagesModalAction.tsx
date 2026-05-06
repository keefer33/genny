import { ActionIcon, Box, Modal } from "@mantine/core";
import { RiFullscreenLine } from "@remixicon/react";
import { useState } from "react";
import useAppStore from "~/lib/stores/appStore";
import { useChatsStore } from "~/lib/stores/chatsStore";
import ChatMessagesUsageSummary from "./ChatMessagesUsageSummary";
import MessagesContent from "./MessagesContent";

export default function ChatMessagesModalAction() {
  const [opened, setOpened] = useState(false);
  const { isMobile } = useAppStore();
  const { chats, messages, selectedChat } = useChatsStore();

  const chat = selectedChat ? chats.find((c) => c.id === selectedChat) : null;
  const title = chat?.chat_name || "New chat";

  if (!selectedChat || messages.length === 0) return null;

  return (
    <>
      <ActionIcon
        size="md"
        variant="subtle"
        aria-label="View all chat messages"
        onClick={() => setOpened(true)}
      >
        <RiFullscreenLine size={20} />
      </ActionIcon>
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={title}
        fullScreen={isMobile}
        size="lg"
        styles={{
          content: { display: "flex", flexDirection: "column" },
          body: { flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: 0 },
        }}
      >
        <Box style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <ChatMessagesUsageSummary chat={chat} messages={messages} />
          <MessagesContent showAllMessages shouldScrollToBottom={false} />
        </Box>
      </Modal>
    </>
  );
}
