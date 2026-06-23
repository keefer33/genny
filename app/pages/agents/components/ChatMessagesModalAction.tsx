import { ActionIcon, Modal } from "@mantine/core";
import { RiDiscussFill } from "@remixicon/react";
import { useState } from "react";
import useAppStore from "~/lib/stores/appStore";
import { useChatsStore } from "~/lib/stores/chatsStore";
import MessagesContent from "./MessagesContent";

export default function ChatMessagesModalAction() {
  const [opened, setOpened] = useState(false);
  const { isMobile } = useAppStore();
  const { chats, messages, selectedChat, setShowFullChatHistory } = useChatsStore();

  const chat = selectedChat ? chats.find((c) => c.id === selectedChat) : null;
  const title = chat?.chat_name || "New chat";

  if (!selectedChat || messages.length === 0) return null;

  const modalStyles = {
    content: {
      display: "flex",
      flexDirection: "column" as const,
      height: "100%",
      overflow: "hidden",
    },
    header: {
      flexShrink: 0,
    },
    body: {
      flex: 1,
      minHeight: 0,
      display: "flex",
      flexDirection: "column" as const,
      padding: 0,
      overflow: "hidden",
    },
  };

  return (
    <>
      <ActionIcon
        size="md"
        variant="subtle"
        aria-label="View all chat messages"
        onClick={() => (isMobile ? setOpened(true) : setShowFullChatHistory(true))}
      >
        <RiDiscussFill size={20} />
      </ActionIcon>
      {isMobile && (
        <Modal
          opened={opened}
          onClose={() => setOpened(false)}
          title={title}
          fullScreen
          size="lg"
          centered={false}
          styles={modalStyles}
        >
          <MessagesContent showAllMessages shouldScrollToBottom={false} fillContainer />
        </Modal>
      )}
    </>
  );
}
