import { ActionIcon, Anchor, Card, Group, Menu, Text, Textarea } from "@mantine/core";
import { RiAddLine, RiAttachment2, RiSendPlane2Line } from "@remixicon/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useChatsStore } from "~/lib/stores/chatsStore";
import useProjectsStore from "~/lib/stores/projectsStore";
import useAppStore from "~/lib/stores/appStore";
import AttachmentsModal from "~/pages/agents/components/AttachmentsModal";
import { ChatVoiceInputButton } from "~/pages/agents/components/ChatVoiceInputButton";
import { FilePickerModal } from "~/shared/FilePickerModal";
import type { FileData } from "~/lib/stores/filesFoldersStore";
import type { ChatAttachment } from "./attachmentsTypes";

export default function ChatComposer() {
  const { isMobile } = useAppStore();
  const [prompt, setPrompt] = useState("");
  const { runChatLoading, selectedModelName, selectedChat, runChat } = useChatsStore();
  const { selectedProject } = useProjectsStore();
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const prevRunChatLoadingRef = useRef(runChatLoading);

  const projectReady = Boolean(selectedProject?.chat_id || selectedChat);
  const composerEnabled = Boolean(selectedModelName && projectReady && !runChatLoading);

  const focusTextarea = (delay = 0) => {
    const doFocus = () => textareaRef.current?.focus();
    if (delay > 0) {
      window.setTimeout(doFocus, delay);
      return;
    }
    requestAnimationFrame(doFocus);
  };

  useEffect(() => {
    if (!composerEnabled) return;
    focusTextarea();
  }, [selectedModelName, projectReady]);

  useEffect(() => {
    if (prevRunChatLoadingRef.current && !runChatLoading && composerEnabled) {
      focusTextarea();
    }
    prevRunChatLoadingRef.current = runChatLoading;
  }, [runChatLoading, composerEnabled]);

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
    if (!input || runChatLoading || !selectedModelName || !projectReady) return;

    const chat = selectedChat || selectedProject?.chat_id || null;
    if (!chat) return;

    await runChat(chat, selectedModelName, { systemPrompt: "" }, input, attachments);
    setAttachments([]);
    setPrompt("");
    focusTextarea();
    return true;
  };

  const placeholder = !selectedModelName
    ? "Select a model to start building."
    : !projectReady
      ? "Select or create a project to start"
      : "What can I build for you today?";

  return (
    <>
      <Card p="xs" mx="xs" component="form" onSubmit={handleSubmit} style={{ flexShrink: 0 }}>
        <Textarea
          ref={textareaRef}
          w="100%"
          placeholder={placeholder}
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
          disabled={!composerEnabled}
          rightSection={
            <Group gap={4} wrap="nowrap" justify="flex-end">
              <ChatVoiceInputButton
                disabled={!composerEnabled}
                onTranscript={handleVoiceTranscript}
              />
              <ActionIcon
                type="submit"
                variant="subtle"
                size="sm"
                loading={runChatLoading}
                disabled={!composerEnabled}
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
                  disabled={!composerEnabled}
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
