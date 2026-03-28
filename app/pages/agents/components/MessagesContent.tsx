import { ScrollArea, Stack, Text } from "@mantine/core";
import { useEffect, useMemo } from "react";
import { useChatScroll } from "~/lib/hooks/useChatScroll";
import MessageBubble from "~/pages/agents/components/MessageBubble";
import { useChatsStore } from "~/lib/stores/chatsStore";

export default function MessagesContent() {
  const { viewportRef, scrollToBottom } = useChatScroll();
  const {
    messages,
    runChatLoading,
    streamingContent,
    streamingReasoning,
    streamedFileUrls,
    streamStatus,
  } = useChatsStore();

  // Streaming / content height changes: stick to bottom only if user stayed near bottom.
  useEffect(() => {
    scrollToBottom();
  }, [
    messages,
    runChatLoading,
    streamingContent,
    streamingReasoning,
    streamedFileUrls.length,
    scrollToBottom,
  ]);

  const visibleMessages = useMemo(() => {
    if (!runChatLoading) return messages;

    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i]?.role === "user") {
        return [messages[i]];
      }
    }
    return [];
  }, [messages, runChatLoading]);

  const renderedMessages = useMemo(
    () => messages.map((msg) => <MessageBubble key={msg.id} message={msg} />),
    [messages]
  );

  return (
    <ScrollArea viewportRef={viewportRef} style={{ flex: 1, minHeight: 0 }}>
      <Stack gap="md" p="md" pb="xl">
        {visibleMessages.length === 0 && !runChatLoading && (
          <Text size="sm" c="dimmed">
            Send a message to start. Pick a model and optionally add a system prompt.
          </Text>
        )}
        {renderedMessages}
        {runChatLoading && (
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
