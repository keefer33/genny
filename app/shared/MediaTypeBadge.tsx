import { Badge } from "@mantine/core";
import type { ReactNode } from "react";

export type MediaType = "image" | "video" | "audio";

const MEDIA_TYPE_COLORS: Record<MediaType, string> = {
  image: "orange",
  video: "violet",
  audio: "cyan",
};

function capitalize(value: string): string {
  if (!value) return value;
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

export function normalizeMediaType(value: string | null | undefined): MediaType | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;

  if (
    normalized === "image" ||
    normalized === "images" ||
    normalized.startsWith("image/")
  ) {
    return "image";
  }
  if (
    normalized === "video" ||
    normalized === "videos" ||
    normalized.startsWith("video/")
  ) {
    return "video";
  }
  if (
    normalized === "audio" ||
    normalized === "audios" ||
    normalized.startsWith("audio/")
  ) {
    return "audio";
  }
  return null;
}

export function MediaTypeBadge({
  type,
  size = "sm",
  variant = "light",
  unknownColor = "gray",
  showUnknown = true,
  unknownLabel,
}: {
  type: string | null | undefined;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "filled" | "light" | "outline" | "dot" | "default";
  unknownColor?: string;
  showUnknown?: boolean;
  unknownLabel?: ReactNode;
}) {
  const mediaType = normalizeMediaType(type);

  if (mediaType) {
    return (
      <Badge size={size} variant={variant} color={MEDIA_TYPE_COLORS[mediaType]}>
        {capitalize(mediaType)}
      </Badge>
    );
  }

  if (!showUnknown) return null;

  const fallbackLabel =
    unknownLabel ?? capitalize((typeof type === "string" ? type.trim() : "") || "Unknown");
  return (
    <Badge size={size} variant={variant} color={unknownColor}>
      {fallbackLabel}
    </Badge>
  );
}

