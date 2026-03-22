import {
  Button,
  Card,
  Group,
  Loader,
  Stack,
  Text,
  TextInput,
  ActionIcon,
  useMantineTheme,
} from "@mantine/core";
import {
  RiAddLine,
  RiChatSmile2Line,
  RiCheckLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiPencilLine,
} from "@remixicon/react";
import { useState } from "react";
import useAppStore from "~/lib/stores/appStore";
import { useChatsStore, type ChatRow } from "~/lib/stores/chatsStore";
import { formatDate } from "~/lib/utils";
import { useTheme } from "~/lib/hooks/useTheme";

interface ChatsListProps {
  form: { setValues: (values: Record<string, unknown>) => void };
  /** Optional callback when a chat is selected (e.g. close modal on mobile) */
  onSelectChat?: () => void;
}

export default function ChatsList({ form, onSelectChat }: ChatsListProps) {
  const { getUser } = useAppStore();
  const theme = useMantineTheme();
  const { colorScheme, themeColor } = useTheme();
  const user = getUser();
  const {
    chats,
    chatsLoading,
    selectedChat,
    setSelectedChat,
    setMessages,
    deleteChat,
    loadMessagesForChat,
    updateChat,
  } = useChatsStore();
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [deletingAll, setDeletingAll] = useState(false);

  const clearChat = () => {
    setSelectedChat(null);
    setMessages([]);
    form.setValues({ tools: {}, systemPrompt: "" });
  };

  const handleNewChat = () => {
    clearChat();
  };

  const handleSelectChat = (chat: ChatRow) => {
    loadMessagesForChat(user.user.id, chat.id);
    setSelectedChat(chat);
    onSelectChat?.();
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user?.user?.id) return;
    const ok = await deleteChat(user.user.id, chatId);
    if (ok && selectedChat?.id === chatId) {
      clearChat();
    }
  };

  const startEdit = (e: React.MouseEvent, chat: ChatRow) => {
    e.preventDefault();
    e.stopPropagation();
    const title = (chat.metadata as { title?: string })?.title ?? "";
    setEditingChatId(chat.id);
    setEditingTitle(title);
  };

  const saveEdit = async () => {
    if (!user?.user?.id || !editingChatId) return;
    const chat = chats.find((c) => c.id === editingChatId);
    if (!chat) {
      setEditingChatId(null);
      return;
    }
    const currentMeta = (chat.metadata as Record<string, unknown>) ?? {};
    const newTitle = editingTitle.trim();
    await updateChat(user.user.id, editingChatId, {
      ...currentMeta,
      title: newTitle || formatDate(chat.updated_at),
    });
    setEditingChatId(null);
  };

  const cancelEdit = () => {
    setEditingChatId(null);
    setEditingTitle("");
  };

  const handleDeleteAllChats = async () => {
    if (!user?.user?.id || chats.length === 0) return;
    setDeletingAll(true);
    try {
      for (const chat of chats) {
        await deleteChat(user.user.id, chat.id);
      }
      clearChat();
    } finally {
      setDeletingAll(false);
    }
  };

  return (
    <>
      <Group gap="xs" justify="space-between" align="center" py="xs">
        <Group gap="xs" align="center">
          <RiChatSmile2Line size={24} color={theme.colors[themeColor][7]} />
          <Text size="xl" fw={700}>
            Chats
          </Text>
        </Group>
        <Button leftSection={<RiAddLine size={16} />} onClick={handleNewChat} variant="light">
          New chat
        </Button>
      </Group>

      {chatsLoading ? (
        <Group justify="center">
          <Loader size="sm" />
        </Group>
      ) : (
        <Stack gap="xs">
          {chats.length === 0 && (
            <Text size="sm" c="dimmed" ta="center" py="md">
              No chats yet. Start a new chat above.
            </Text>
          )}
          {chats.map((chat) => (
            <Card
              key={chat.id}
              padding="sm"
              radius="sm"
              style={{
                cursor: "pointer",
                backgroundColor:
                  selectedChat?.id === chat.id
                    ? colorScheme === "dark"
                      ? theme.colors.dark[8]
                      : theme.colors.gray[2]
                    : "transparent",
              }}
              onClick={() => handleSelectChat(chat)}
            >
              <Group justify="space-between" wrap="nowrap" gap="xs">
                <Group wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                  {editingChatId === chat.id ? (
                    <Group wrap="nowrap" gap={4} style={{ width: "100%" }}>
                      <TextInput
                        size="xs"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.currentTarget.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            saveEdit();
                          } else if (e.key === "Escape") {
                            cancelEdit();
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        styles={{ input: { minHeight: 28 } }}
                        style={{ flex: 1 }}
                      />
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        color="green"
                        aria-label="Save chat name"
                        onClick={(e) => {
                          e.stopPropagation();
                          void saveEdit();
                        }}
                      >
                        <RiCheckLine size={14} />
                      </ActionIcon>
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        color="gray"
                        aria-label="Cancel edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelEdit();
                        }}
                      >
                        <RiCloseLine size={14} />
                      </ActionIcon>
                    </Group>
                  ) : (
                    <Text size="sm" truncate>
                      {(chat.metadata as { title?: string })?.title || formatDate(chat.updated_at)}
                    </Text>
                  )}
                </Group>
                {selectedChat?.id === chat.id && (
                  <Group gap={0}>
                    {editingChatId !== chat.id && (
                      <ActionIcon
                        variant="subtle"
                        size="sm"
                        onClick={(e) => startEdit(e, chat)}
                        aria-label="Edit chat name"
                      >
                        <RiPencilLine size={14} />
                      </ActionIcon>
                    )}
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="sm"
                      onClick={(e) => handleDeleteChat(chat.id, e)}
                      aria-label="Delete chat"
                    >
                      <RiDeleteBinLine size={14} />
                    </ActionIcon>
                  </Group>
                )}
              </Group>
            </Card>
          ))}
          {chats.length > 1 && (
            <Button
              variant="subtle"
              color="red"
              size="sm"
              leftSection={<RiDeleteBinLine size={16} />}
              onClick={handleDeleteAllChats}
              loading={deletingAll}
              mt="xs"
            >
              Delete all chats
            </Button>
          )}
        </Stack>
      )}
    </>
  );
}
