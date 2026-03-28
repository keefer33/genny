import { Box, Card, Text, Loader, Group } from "@mantine/core";
import { memo } from "react";
import "highlight.js/styles/github.min.css";
import { useTheme } from "~/lib/hooks/useTheme";
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
  const { themeColor, colorScheme } = useTheme();
  const theme = useMantineTheme();
  const { isMobile } = useAppStore();
  const text = message.content
    .map((p) => (p.type === "text" ? (p as { text?: string }).text : ""))
    .filter(Boolean)
    .join("");
  // Chat history may store attachments either as AI SDK parts (`type: "image" | "video" | "file"`)
  // or as raw attachment inputs (`type: "<mime>/..."`, with `url` + optional `thumbnail_url`).
  const imageParts = message.content.filter((p) => {
    if (p.type === "image") return !!(p.image || p.imageUrl);
    if (typeof p.type === "string" && p.type.startsWith("image/")) {
      return !!(p.url || p.image || p.imageUrl);
    }
    return false;
  });
  const videoParts = message.content.filter((p) => {
    if (p.type === "video") return !!p.videoUrl;
    if (typeof p.type === "string" && p.type.startsWith("video/")) return !!(p.url || p.videoUrl);
    return false;
  });
  const fileParts = message.content.filter((p) => {
    if (p.type === "file") return !!p.fileUrl;
    if (
      typeof p.type === "string" &&
      (p.type.startsWith("image/") || p.type.startsWith("video/"))
    ) {
      return false;
    }
    return !!p.url;
  });
  const isUser = message.role === "user";

  const imageStyle: React.CSSProperties = {
    maxWidth: "100%",
    maxHeight: 360,
    borderRadius: "var(--mantine-radius-sm)",
    objectFit: "contain",
  };

  const content = (
    <>
      <Box className="markdown-body" fz="sm" h-min={streaming ? 28 : undefined}>
        {text ? <MarkdownRenderer content={text ?? ""} /> : null}
        {streaming && streamingReasoning && (
          <Text size="sm" c="dimmed" mt="xs" style={{ whiteSpace: "pre-wrap" }}>
            {streamingReasoning}
          </Text>
        )}
        {imageParts.length > 0 && (
          <Box mt="xs" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {imageParts.map((p, i) => (
              <Box
                key={i}
                component="img"
                src={
                  (p as any).image ??
                  (p as any).imageUrl ??
                  (p as any).thumbnail_url ??
                  (p as any).url
                }
                alt="Generated"
                style={imageStyle}
              />
            ))}
          </Box>
        )}
        {videoParts.length > 0 && (
          <Box mt="xs" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {videoParts.map((p, i) => (
              <video
                key={`video-${i}`}
                src={(p as any).videoUrl ?? (p as any).url}
                controls
                style={{ ...imageStyle, background: "var(--mantine-color-dark-7)" }}
              />
            ))}
          </Box>
        )}
        {fileParts.length > 0 && (
          <Box mt="xs" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {fileParts.map((p, i) => (
              <a
                key={`file-${i}`}
                href={(p as any).fileUrl ?? (p as any).url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {(p as any).fileName ?? (p as any).name ?? (p as any).fileUrl ?? (p as any).url}
              </a>
            ))}
          </Box>
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
          bg={colorScheme === "dark" ? theme.colors.gray[9] : theme.colors.gray[0]}
        >
          {content}
        </Card>
      )}
    </Box>
  );
}

export default memo(MessageBubble);
