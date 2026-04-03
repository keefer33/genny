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
  RiArrowRightLine,
  RiChatSmile2Line,
  RiCheckLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiPencilLine,
} from "@remixicon/react";
import { useMemo, useState } from "react";
import useAppStore from "~/lib/stores/appStore";
import { useChatsStore, type ChatRow } from "~/lib/stores/chatsStore";
import { formatDate } from "~/lib/utils";

export default function ChatsList() {
  const theme = useMantineTheme();
  const themeColor = useAppStore((s) => s.themeSettings.themeColor);
  const [listEditMode, setListEditMode] = useState(false);
  const {
    chats,
    chatsLoading,
    selectedChat,
    editingChatId,
    editingTitle,
    deletingAllChats,
    setEditingTitle,
    startEditChat,
    cancelEditChat,
    saveEditedChatTitle,
    selectChatByRow,
    deleteChatFromList,
    deleteAllChatsFromList,
    clearSelectedChat,
  } = useChatsStore();

  const exitListEditMode = () => {
    setListEditMode(false);
    cancelEditChat();
  };

  const toggleListEditMode = () => {
    setListEditMode((prev) => {
      if (prev) cancelEditChat();
      return !prev;
    });
  };

  const handleDeleteChat = async (id: string) => {
    await deleteChatFromList(id);
  };

  /** Active chat first; remaining chats keep list order. */
  const orderedChats = useMemo(() => {
    if (!selectedChat) return chats;
    const current = chats.find((c) => c.id === selectedChat);
    if (!current) return chats;
    const rest = chats.filter((c) => c.id !== selectedChat);
    return [current, ...rest];
  }, [chats, selectedChat]);

  return (
    <>
      <Stack gap="xs" py="xs">
        <Group gap="xs" align="center" style={{ minWidth: 0 }} wrap="nowrap">
          <RiChatSmile2Line size={24} color={theme.colors[themeColor][7]} />
          <Text size="xl" fw={700}>
            Chats
          </Text>
        </Group>
        <Group justify="flex-end" gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
          {listEditMode && chats.length > 1 ? (
            <Button
              variant="subtle"
              color="red"
              size="compact-sm"
              leftSection={<RiDeleteBinLine size={16} />}
              onClick={deleteAllChatsFromList}
              loading={deletingAllChats}
            >
              Delete all chats
            </Button>
          ) : null}
          <ActionIcon
            variant={listEditMode ? "filled" : "subtle"}
            color={themeColor}
            size="lg"
            radius="md"
            aria-label={listEditMode ? "Done editing chat list" : "Edit chat list"}
            aria-pressed={listEditMode}
            onClick={toggleListEditMode}
          >
            <RiPencilLine size={20} />
          </ActionIcon>
          <ActionIcon
            variant="light"
            color={themeColor}
            size="lg"
            radius="md"
            aria-label="New chat"
            onClick={() => {
              exitListEditMode();
              clearSelectedChat();
            }}
          >
            <RiAddLine size={20} />
          </ActionIcon>
        </Group>
      </Stack>

      {chatsLoading ? (
        <Group justify="center">
          <Loader size="sm" />
        </Group>
      ) : (
        <Stack gap="xl">
          {chats.length === 0 && (
            <Text size="sm" c="dimmed" ta="center" py="md">
              No chats yet. Use New chat to create one.
            </Text>
          )}
          {orderedChats.map((chat) => (
            <ChatListRow
              key={chat.id}
              chat={chat}
              listEditMode={listEditMode}
              isCurrentChat={chat.id === selectedChat}
              isEditing={editingChatId === chat.id}
              editingTitle={editingTitle}
              onOpenChat={() => {
                exitListEditMode();
                void selectChatByRow(chat);
              }}
              setEditingTitle={setEditingTitle}
              startEditChat={startEditChat}
              cancelEditChat={cancelEditChat}
              saveEditedChatTitle={saveEditedChatTitle}
              deleteChatFromList={handleDeleteChat}
            />
          ))}
        </Stack>
      )}
    </>
  );
}

function ChatListRow({
  chat,
  listEditMode,
  isCurrentChat,
  isEditing,
  editingTitle,
  onOpenChat,
  setEditingTitle,
  startEditChat,
  cancelEditChat,
  saveEditedChatTitle,
  deleteChatFromList,
}: {
  chat: ChatRow;
  listEditMode: boolean;
  isCurrentChat: boolean;
  isEditing: boolean;
  editingTitle: string;
  onOpenChat: () => void;
  setEditingTitle: (t: string) => void;
  startEditChat: (c: ChatRow) => void;
  cancelEditChat: () => void;
  saveEditedChatTitle: () => Promise<void>;
  deleteChatFromList: (id: string) => Promise<void>;
}) {
  const theme = useMantineTheme();
  const colorSchemeSetting = useAppStore((s) => s.themeSettings.colorScheme);
  const showActionButtons = !isEditing && listEditMode;
  const isDarkUi =
    colorSchemeSetting === "dark" ||
    (colorSchemeSetting === "auto" &&
      (typeof window === "undefined" || window.matchMedia("(prefers-color-scheme: dark)").matches));
  const rowHighlight = isDarkUi ? theme.colors.dark[8] : theme.colors.gray[2];
  const backgroundColor = isCurrentChat ? rowHighlight : "transparent";

  return (
    <Card
      padding="0"
      radius="sm"
      style={{
        cursor: listEditMode ? "default" : "pointer",
        backgroundColor,
      }}
      onClick={() => {
        if (!listEditMode && !isEditing) onOpenChat();
      }}
    >
      <Group justify="space-between" wrap="nowrap" gap="xs">
        <Group wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
          {isEditing ? (
            <Group wrap="nowrap" gap={4} style={{ width: "100%" }}>
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
                  void saveEditedChatTitle();
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
                  cancelEditChat();
                }}
              >
                <RiCloseLine size={14} />
              </ActionIcon>
            </Group>
          ) : (
            <Text size="sm" truncate>
              {chat.chat_name || formatDate(chat.updated_at)}
            </Text>
          )}
        </Group>
        {showActionButtons && (
          <Group gap={0}>
            <ActionIcon
              variant="subtle"
              size="md"
              onClick={(e) => {
                e.stopPropagation();
                startEditChat(chat);
              }}
              aria-label="Edit chat name"
            >
              <RiPencilLine size={20} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              color="red"
              size="md"
              onClick={(e) => {
                e.stopPropagation();
                void deleteChatFromList(chat.id);
              }}
              aria-label="Delete chat"
            >
              <RiDeleteBinLine size={20} />
            </ActionIcon>
            {!isCurrentChat ? (
              <ActionIcon
                variant="subtle"
                size="md"
                color="blue"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenChat();
                }}
                aria-label="Open chat"
                title="Open chat"
              >
                <RiArrowRightLine size={20} />
              </ActionIcon>
            ) : null}
          </Group>
        )}
      </Group>
    </Card>
  );
}
