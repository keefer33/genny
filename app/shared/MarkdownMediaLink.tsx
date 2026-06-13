import { Anchor, Box, Text } from "@mantine/core";
import { Children, isValidElement, type CSSProperties, type ReactNode } from "react";
import { isAiFileLinkUrl } from "~/lib/files/userFileByPath";
import { extensionMediaKind } from "~/lib/utils";
import { MarkdownAiFileLink } from "~/shared/MarkdownAiFileLink";
import { GennyAudioPlayer } from "~/shared/GennyAudioPlayer";

export type MarkdownLinkMediaKind = "image" | "video" | "audio" | "file";

const mediaVisualStyle: CSSProperties = {
  display: "block",
  maxWidth: "100%",
  maxHeight: 360,
  width: "100%",
  objectFit: "contain",
  borderRadius: "var(--mantine-radius-sm)",
};

export function inferMarkdownLinkMediaKind(href: string | null | undefined): MarkdownLinkMediaKind {
  if (!href?.trim()) return "file";
  const path = href.trim().split(/[?#]/)[0] ?? href;
  return extensionMediaKind(path);
}

export function linkLabelFromChildren(children: ReactNode): string {
  const parts: string[] = [];
  Children.forEach(children, (child) => {
    if (typeof child === "string" || typeof child === "number") {
      parts.push(String(child));
      return;
    }
    if (isValidElement<{ children?: ReactNode }>(child)) {
      parts.push(linkLabelFromChildren(child.props.children));
    }
  });
  return parts.join("").trim();
}

export type MarkdownMediaLinkProps = {
  href?: string | null;
  children?: ReactNode;
  linkColor?: string;
};

export function MarkdownMediaLink({ href, children, linkColor }: MarkdownMediaLinkProps) {
  const url = href?.trim() ?? "";
  if (!url) return <>{children}</>;

  const label = linkLabelFromChildren(children);

  if (isAiFileLinkUrl(url)) {
    return <MarkdownAiFileLink url={url} label={label || undefined} />;
  }

  const kind = inferMarkdownLinkMediaKind(url);

  if (kind === "audio") {
    return (
      <Box my="xs" maw={360}>
        {label ? (
          <Text size="xs" c="dimmed" mb={4}>
            {label}
          </Text>
        ) : null}
        <GennyAudioPlayer src={url} size="xs" variant="minimal" showWaveform waveformHeight={48} />
      </Box>
    );
  }

  if (kind === "video") {
    return (
      <Box my="xs">
        {label ? (
          <Text size="xs" c="dimmed" mb={4}>
            {label}
          </Text>
        ) : null}
        <video
          src={url}
          controls
          style={{ ...mediaVisualStyle, background: "var(--mantine-color-dark-7)" }}
        />
      </Box>
    );
  }

  if (kind === "image") {
    return (
      <Box my="xs">
        <Box component="img" src={url} alt={label || "Image"} style={mediaVisualStyle} />
      </Box>
    );
  }

  return (
    <Anchor
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      c={linkColor}
      style={{ wordBreak: "break-word", textDecoration: "underline" }}
    >
      {children}
    </Anchor>
  );
}
