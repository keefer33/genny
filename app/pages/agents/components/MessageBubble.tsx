import { Box, Card, Text, Code, Loader, ScrollArea, useMantineTheme, Group } from "@mantine/core";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.min.css";

import type { ChatUIMessage } from "~/lib/stores/chatsStore";
import { RiMoneyDollarCircleFill, RiRobot2Fill, RiUser2Fill } from "@remixicon/react";

const STREAM_STATUS_LABELS: Record<string, string> = {
  start: "Starting",
  reasoning: "Thinking",
  reasoning_end: "Writing",
  tool_input_end: "Tool finished",
  step_start: "Processing",
  step_finish: "Step complete",
  finish: "Finishing",
};

interface MessageBubbleProps {
  message: ChatUIMessage;
  streaming?: boolean;
  /** When streaming, optional status to show after the dots (no spinner) */
  streamStatus?: { status: string; tool_name?: string } | null;
}

function getStreamStatusLabel(streamStatus: { status: string; tool_name?: string }): string {
  if (streamStatus.status === "tool_input") {
    return streamStatus.tool_name ? `Using tool: ${streamStatus.tool_name}` : "Using tool…";
  }
  return STREAM_STATUS_LABELS[streamStatus.status] ?? "Working…";
}

export default function MessageBubble({ message, streaming, streamStatus }: MessageBubbleProps) {
  const theme = useMantineTheme();
  const text = message.content
    .map((p) => (p.type === "text" ? (p as { text?: string }).text : ""))
    .filter(Boolean)
    .join("");
  const imageParts = message.content.filter(
    (p): p is { type: "image"; imageUrl: string } => p.type === "image" && !!p.imageUrl
  );
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
        {text ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              img: ({ src, alt, ...props }) => (
                <Box
                  component="img"
                  src={src}
                  alt={alt ?? "Generated"}
                  style={imageStyle}
                  {...props}
                />
              ),
              code: ({ className, children, ...props }) => {
                const isInline = !className;
                if (isInline) {
                  return (
                    <Code fz="sm" {...props}>
                      {children}
                    </Code>
                  );
                }
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
              pre: ({ children, ...props }) => (
                <ScrollArea type="auto" style={{ maxHeight: 360 }} offsetScrollbars>
                  <pre
                    style={{
                      margin: 0,
                      padding: "var(--mantine-spacing-sm)",
                      borderRadius: "var(--mantine-radius-sm)",
                      overflow: "auto",
                    }}
                    {...props}
                  >
                    {children}
                  </pre>
                </ScrollArea>
              ),
              a: ({ href, children, ...props }) => (
                <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                  {children}
                </a>
              ),
            }}
          >
            {text}
          </ReactMarkdown>
        ) : null}
        {imageParts.length > 0 && (
          <Box mt="xs" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {imageParts.map((p, i) => (
              <Box key={i} component="img" src={p.imageUrl} alt="Generated" style={imageStyle} />
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
            <Loader type="dots" size="sm" color={theme.primaryColor} />
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
        maxWidth: isUser ? "85%" : "100%",
      }}
    >
      {isUser ? (
        <Card p="sm" radius="md">
          {content}
        </Card>
      ) : (
        content
      )}
    </Box>
  );
}
