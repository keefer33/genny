import { ScrollArea, Stack, Text } from "@mantine/core";
import { useEffect, useMemo } from "react";
import { useChatScroll } from "~/lib/hooks/useChatScroll";
import MessageBubble from "~/pages/agents/components/MessageBubble";
import { useChatsStore } from "~/lib/stores/chatsStore";
import { buildChatInteractions } from "./chatInteractions";

export default function MessagesContent({
  showAllMessages = false,
  shouldScrollToBottom = true,
}: {
  showAllMessages?: boolean;
  shouldScrollToBottom?: boolean;
}) {
  const { viewportRef, scrollToBottom } = useChatScroll();
  const {
    messages,
    selectedInteractionIndex,
    runChatLoading,
    streamingContent,
    streamingReasoning,
    streamedFileUrls,
    streamStatus,
  } = useChatsStore();

  // Streaming / content height changes: stick to bottom only if user stayed near bottom.
  useEffect(() => {
    if (shouldScrollToBottom && streamStatus !== null) {
      scrollToBottom();
    }
  }, [
    messages,
    runChatLoading,
    streamingContent,
    streamingReasoning,
    streamedFileUrls.length,
    scrollToBottom,
  ]);

  const interactions = useMemo(() => buildChatInteractions(messages), [messages]);
  const selectedInteraction =
    interactions[Math.min(selectedInteractionIndex, Math.max(0, interactions.length - 1))];
  const shouldShowStreamingAssistant =
    runChatLoading &&
    (showAllMessages || selectedInteractionIndex >= Math.max(0, interactions.length - 1));

  const visibleMessages = useMemo(() => {
    if (showAllMessages) return messages;
    return selectedInteraction
      ? [selectedInteraction.user, selectedInteraction.assistant].filter(Boolean)
      : [];
  }, [messages, selectedInteraction, showAllMessages]);

  const renderedMessages = useMemo(
    () => visibleMessages.map((msg) => <MessageBubble key={msg.id} message={msg} />),
    [visibleMessages]
  );

  return (
    <ScrollArea viewportRef={viewportRef} style={{ flex: 1, minHeight: 0 }} py="xs">
      <Stack gap="md" p="md" pb="xl">
        {visibleMessages.length === 0 && !shouldShowStreamingAssistant && (
          <Text size="sm" c="dimmed">
            Send a message to start. Pick a model and optionally add a system prompt.
          </Text>
        )}
        {renderedMessages}
        {shouldShowStreamingAssistant && (
          <MessageBubble
            message={{
              id: "streaming",
              role: "assistant",
              content: [
                { type: "text", text: streamingContent },
                ...streamedFileUrls.map((url) => ({
                  type: "image" as const,
                  imageUrl: url,
                })),
              ],
            }}
            streaming
            streamStatus={streamStatus}
            streamingReasoning={streamingReasoning}
          />
        )}
      </Stack>
    </ScrollArea>
  );
}
