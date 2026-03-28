import { ActionIcon, Modal } from "@mantine/core";
import { RiChatSmile2Line } from "@remixicon/react";
import useAppStore from "~/lib/stores/appStore";
import { useChatsStore } from "~/lib/stores/chatsStore";
import ChatsList from "./ChatsList";

/**
 * Icon that opens the full-screen chats list on mobile when there is at least one chat.
 * Place wherever you need the control; mount {@link MobileChatsListModal} once in the tree.
 */
export function MobileChatsListModalTrigger() {
  const { isMobile } = useAppStore();
  const { chats, setChatsListModalOpen } = useChatsStore();

  if (!isMobile || chats.length === 0) return null;

  return (
    <ActionIcon
      size="md"
      variant="subtle"
      aria-label="Manage chats"
      onClick={() => setChatsListModalOpen(true)}
    >
      <RiChatSmile2Line size={24} />
    </ActionIcon>
  );
}

/**
 * Full-screen “Chats” modal listing {@link ChatsList}. State lives in `chatsStore` (`chatsListModalOpen`).
 * Mount once per screen; opening is done via {@link MobileChatsListModalTrigger} or `setChatsListModalOpen(true)`.
 */
export function MobileChatsListModal() {
  const { isMobile } = useAppStore();
  const { chats, chatsListModalOpen, setChatsListModalOpen } = useChatsStore();

  if (!isMobile || chats.length === 0) return null;

  return (
    <Modal
      opened={chatsListModalOpen}
      onClose={() => setChatsListModalOpen(false)}
      title="Chats"
      fullScreen
    >
      <ChatsList />
    </Modal>
  );
}
