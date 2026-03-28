import { ActionIcon, Box, Group, Menu, Modal, Text, TextInput } from "@mantine/core";
import {
  RiAddLine,
  RiCheckLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiFullscreenLine,
  RiMoreLine,
  RiPencilLine,
} from "@remixicon/react";
import { useState } from "react";
import { useChatsStore } from "~/lib/stores/chatsStore";
import MessagesContent from "./MessagesContent";
import { MobileChatsListModal, MobileChatsListModalTrigger } from "./MobileChatsListModal";

export default function SelectedChatBar() {
  const [messagesModalOpen, setMessagesModalOpen] = useState(false);
  const {
    chats,
    selectedChat,
    editingChatId,
    editingTitle,
    setEditingTitle,
    startEditChat,
    cancelEditChat,
    saveEditedChatTitle,
    deleteChatFromList,
    clearSelectedChat,
  } = useChatsStore();

  if (chats.length === 0) return null;

  const chat = selectedChat ? chats.find((c) => c?.id === selectedChat) : null;
  const displayTitle = chat?.chat_name || "New chat";

  return (
    <Group gap="xs" wrap="nowrap" align="center" style={{ minWidth: 0 }} py="xs">
      {editingChatId === chat?.id ? (
        <>
          <TextInput
            size="xs"
            value={editingTitle}
            onChange={(e) => setEditingTitle(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void saveEditedChatTitle();
              } else if (e.key === "Escape") {
                cancelEditChat();
              }
            }}
            autoFocus
            styles={{ input: { minHeight: 28 } }}
            style={{ flex: 1, minWidth: 0 }}
          />
          <ActionIcon
            size="sm"
            variant="subtle"
            color="green"
            aria-label="Save chat name"
            onClick={() => void saveEditedChatTitle()}
          >
            <RiCheckLine size={14} />
          </ActionIcon>
          <ActionIcon
            size="sm"
            variant="subtle"
            color="gray"
            aria-label="Cancel edit"
            onClick={cancelEditChat}
          >
            <RiCloseLine size={14} />
          </ActionIcon>
        </>
      ) : (
        <>
          <Text size="sm" c="dimmed" truncate style={{ flex: 1, minWidth: 0 }}>
            {displayTitle}
          </Text>
          {selectedChat ? (
            <>
              <Menu shadow="md" width={200} position="bottom-end">
                <Menu.Target>
                  <ActionIcon size="md" variant="transparent" aria-label="Chat actions">
                    <RiMoreLine size={24} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    leftSection={<RiPencilLine size={16} />}
                    onClick={() => startEditChat(chat)}
                  >
                    Edit
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<RiFullscreenLine size={16} />}
                    onClick={() => setMessagesModalOpen(true)}
                  >
                    View messages
                  </Menu.Item>
                  <Menu.Item
                    color="red"
                    leftSection={<RiDeleteBinLine size={16} />}
                    onClick={() => void deleteChatFromList(chat.id)}
                  >
                    Delete
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </>
          ) : null}

          <MobileChatsListModalTrigger />
          <ActionIcon
            size="md"
            variant="transparent"
            aria-label="New Chat"
            onClick={clearSelectedChat}
          >
            <RiAddLine size={24} />
          </ActionIcon>
        </>
      )}
      <MobileChatsListModal />
      <Modal
        opened={messagesModalOpen}
        onClose={() => setMessagesModalOpen(false)}
        title={displayTitle}
        fullScreen
        styles={{
          content: { display: "flex", flexDirection: "column" },
          body: { flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: 0 },
        }}
      >
        <Box style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <MessagesContent />
        </Box>
      </Modal>
    </Group>
  );
}
