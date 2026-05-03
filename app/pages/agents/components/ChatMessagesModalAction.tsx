import { ActionIcon, Box, Modal } from "@mantine/core";
import { RiFullscreenLine } from "@remixicon/react";
import { useState } from "react";
import { useChatsStore } from "~/lib/stores/chatsStore";
import MessagesContent from "./MessagesContent";

export default function ChatMessagesModalAction() {
  const [opened, setOpened] = useState(false);
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
        fullScreen
        styles={{
          content: { display: "flex", flexDirection: "column" },
          body: { flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: 0 },
        }}
      >
        <Box style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <MessagesContent showAllMessages shouldScrollToBottom={false} />
        </Box>
      </Modal>
    </>
  );
}
