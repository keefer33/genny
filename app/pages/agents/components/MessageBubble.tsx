import { Box, Card, Text, Loader, Group } from "@mantine/core";
import { memo } from "react";
import "highlight.js/styles/github.min.css";
import { useMantineTheme } from "@mantine/core";
import type { ChatUIMessage } from "~/lib/stores/chatsStore";
import { RiMoneyDollarCircleFill, RiRobot2Fill, RiUser2Fill } from "@remixicon/react";
import useAppStore from "~/lib/stores/appStore";
import MarkdownRenderer from "~/shared/MarkdownRenderer";

const STREAM_STATUS_LABELS: Record<string, string> = {
  start: "Starting",
  "reasoning-start": "Reasoning started",
  "reasoning-end": "Reasoning ended",
  "tool-input-start": "Tool input started",
  "tool-input-end": "Tool input ended",
  "tool-call": "Tool call",
  "tool-result": "Tool result",
  "start-step": "Step started",
  "finish-step": "Step finished",
  finish: "Finishing",
};

interface MessageBubbleProps {
  message: ChatUIMessage;
  streaming?: boolean;
  /** When streaming, optional status to show after the dots (no spinner) */
  streamStatus?: { status: string; tool_name?: string } | null;
  /** Temporary reasoning text (dimmed), cleared on reasoning-end */
  streamingReasoning?: string;
}

function getStreamStatusLabel(streamStatus: { status: string; tool_name?: string }): string {
  if (
    (streamStatus.status === "tool-input-start" ||
      streamStatus.status === "tool-call" ||
      streamStatus.status === "tool-result") &&
    streamStatus.tool_name
  ) {
    return `${streamStatus.status}: ${streamStatus.tool_name}`;
  }
  return STREAM_STATUS_LABELS[streamStatus.status] ?? "Working…";
}

function MessageBubble({
  message,
  streaming,
  streamStatus,
  streamingReasoning,
}: MessageBubbleProps) {
  const theme = useMantineTheme();
  const { isMobile, themeSettings } = useAppStore();
  const themeColor = themeSettings.themeColor;
  const text = message.content
    .map((p) => (p.type === "text" ? (p as { text?: string }).text : ""))
    .filter(Boolean)
    .join("");
  const isUser = message.role === "user";

  const content = (
    <>
      <Box className="markdown-body" fz="sm" h-min={streaming ? 28 : undefined}>
        {text ? <MarkdownRenderer content={text} /> : null}
        {streaming && streamingReasoning && (
          <Text size="sm" c="dimmed" mt="xs" style={{ whiteSpace: "pre-wrap" }}>
            {streamingReasoning}
          </Text>
        )}
        {streaming && (
          <Box
            component="span"
            style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}
          >
            {streamStatus && (
              <Text size="xs" c="dimmed" component="span">
                {getStreamStatusLabel(streamStatus)}
              </Text>
            )}
            <Loader type="dots" size="sm" color={themeColor} />
          </Box>
        )}
      </Box>
      {message.usage && !streaming && (
        <Group gap="xs" justify="flex-end" align="center">
          <Group gap="xs" align="center" c="gray.5">
            <RiUser2Fill size={12} />
            <Text size="xs" c="dimmed">
              Input tokens:
            </Text>
            <Text size="xs" c="gray.5">
              {message.usage.input_tokens}
            </Text>
          </Group>
          <Group gap="xs" align="center" c="blue.5">
            <RiRobot2Fill size={12} />
            <Text size="xs" c="dimmed">
              Ouput tokens:
            </Text>
            <Text size="xs" c="blue.5">
              {message.usage.output_tokens}
            </Text>
          </Group>
          <Group gap="xs" align="center" c="green.5">
            <RiMoneyDollarCircleFill size={12} />
            <Text size="xs" c="dimmed">
              Cost:
            </Text>
            <Text size="xs" c="green.5">
              {message.usage.total_cost}
            </Text>
          </Group>
        </Group>
      )}
    </>
  );

  return (
    <Box
      style={{
        alignSelf: isUser ? "flex-end" : "flex-start",
        maxWidth: isUser ? "85%" : isMobile ? "100%" : "85%",
      }}
    >
      {isUser ? (
        <Card p="sm" radius="md">
          {content}
        </Card>
      ) : (
        <Card
          p="sm"
          radius="md"
          bg={themeSettings.colorScheme === "dark" ? theme.colors.gray[9] : theme.colors.gray[0]}
        >
          {content}
        </Card>
      )}
    </Box>
  );
}

export default memo(MessageBubble);
