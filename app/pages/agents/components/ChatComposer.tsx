import { ActionIcon, Anchor, Card, Group, Menu, Text, Textarea } from "@mantine/core";
import { RiAddLine, RiAttachment2, RiSendPlane2Line } from "@remixicon/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useChatsStore } from "~/lib/stores/chatsStore";
import useAppStore from "~/lib/stores/appStore";
import AttachmentsModal from "~/pages/agents/components/AttachmentsModal";
import { ChatVoiceInputButton } from "~/pages/agents/components/ChatVoiceInputButton";
import { FilePickerModal } from "~/shared/FilePickerModal";
import type { FileData } from "~/lib/stores/filesFoldersStore";
import type { ChatAttachment } from "./attachmentsTypes";

const LS_SELECTED_CHAT_ID = "genny:selectedChatId";

export default function ChatComposer() {
  const { isMobile } = useAppStore();
  const [prompt, setPrompt] = useState("");
  const { runChatLoading, selectedModelName, selectedChat, setSelectedChat, createChat, runChat } =
    useChatsStore();
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const prevRunChatLoadingRef = useRef(runChatLoading);

  const focusTextarea = (delay = 0) => {
    const doFocus = () => textareaRef.current?.focus();
    if (delay > 0) {
      window.setTimeout(doFocus, delay);
      return;
    }
    requestAnimationFrame(doFocus);
  };

  useEffect(() => {
    // Focus on initial mount and whenever model selection changes.
    if (!selectedModelName) return;
    focusTextarea();
  }, [selectedModelName]);

  useEffect(() => {
    // Refocus when a run completes.
    if (prevRunChatLoadingRef.current && !runChatLoading && selectedModelName) {
      focusTextarea();
    }
    prevRunChatLoadingRef.current = runChatLoading;
  }, [runChatLoading, selectedModelName]);

  const onOpenPicker = () => {
    setAttachmentsModalOpen(false);
    setPickerOpen(true);
  };

  const onOpenAttachmentsModal = () => {
    setPickerOpen(false);
    setAttachmentsModalOpen(true);
  };

  const handleVoiceTranscript = useCallback((text: string) => {
    setPrompt((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed} ${text}` : text;
    });
    focusTextarea();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = prompt.trim();
    if (!input || runChatLoading || !selectedModelName) return;

    let chat = selectedChat;
    let justCreated = false;
    if (!chat) {
      const title = input.slice(0, 50).trim();
      const created = await createChat(title);
      if (created) {
        justCreated = true;
        chat = created.id;
      }
    }

    if (chat) {
      await runChat(chat, selectedModelName, { systemPrompt: "" }, input, attachments);
      setAttachments([]);
      setPrompt("");

      if (justCreated) {
        setSelectedChat(chat);
        window.localStorage.setItem(LS_SELECTED_CHAT_ID, chat);
      }
      focusTextarea();
      return true;
    }
    return false;
  };

  return (
    <>
      <Card p="xs" mx="xs" component="form" onSubmit={handleSubmit} style={{ flexShrink: 0 }}>
        <Textarea
          ref={textareaRef}
          w="100%"
          placeholder="Type your message..."
          variant="transparent"
          minRows={1}
          maxRows={4}
          autosize
          value={prompt}
          onChange={(e) => setPrompt(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSubmit(e as unknown as React.FormEvent);
            }
          }}
          disabled={!selectedModelName || runChatLoading}
          rightSection={
            <Group gap={4} wrap="nowrap" justify="flex-end">
              <ChatVoiceInputButton
                disabled={!selectedModelName || runChatLoading}
                onTranscript={handleVoiceTranscript}
              />
              <ActionIcon
                type="submit"
                variant="subtle"
                size="sm"
                loading={runChatLoading}
                disabled={!selectedModelName}
                aria-label="Send"
              >
                <RiSendPlane2Line size={18} />
              </ActionIcon>
            </Group>
          }
          rightSectionPointerEvents="auto"
          rightSectionWidth={72}
          leftSection={
            <Menu shadow="md" width={220} position="top-start">
              <Menu.Target>
                <ActionIcon
                  size="sm"
                  aria-label="Open attachments menu"
                  disabled={!selectedModelName || runChatLoading}
                >
                  <RiAddLine size={20} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item leftSection={<RiAttachment2 size={16} />} onClick={onOpenPicker}>
                  Add Images and Files
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          }
          leftSectionPointerEvents="auto"
          leftSectionWidth={36}
        />
        {attachments.length > 0 && (
          <Group justify="space-between" align="center" mt={6}>
            <Text size="xs" c="dimmed">
              {attachments.length} attachment{attachments.length === 1 ? "" : "s"} ready to send
            </Text>
            <Anchor size="xs" component="button" type="button" onClick={onOpenAttachmentsModal}>
              View attachments
            </Anchor>
          </Group>
        )}
      </Card>

      <AttachmentsModal
        isMobile={isMobile}
        opened={attachmentsModalOpen}
        attachments={attachments}
        onClose={() => {
          setAttachmentsModalOpen(false);
          focusTextarea(10);
        }}
        onOpenPicker={() => {
          setAttachmentsModalOpen(false);
          setPickerOpen(true);
        }}
        onClearAll={() => setAttachments([])}
        onRemove={(url) => setAttachments((prev) => prev.filter((item) => item.url !== url))}
      />
      <FilePickerModal
        opened={pickerOpen}
        onClose={() => {
          setPickerOpen(false);
          focusTextarea(10);
        }}
        title="Add Images and Files"
        allowedTypes="all"
        onSelect={(fileUrl: string, file?: FileData) => {
          if (!fileUrl) return;
          setAttachments((prev) => {
            const existing = new Set(prev.map((a) => a.url));
            if (existing.has(fileUrl)) return prev;
            return [
              ...prev,
              {
                url: fileUrl,
                name: file?.file_name,
                type: file?.file_type,
                thumbnail_url: (file as FileData | undefined)?.thumbnail_url ?? null,
              },
            ];
          });
        }}
      />
    </>
  );
}
