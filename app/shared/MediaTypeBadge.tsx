import { Badge, type BadgeProps } from "@mantine/core";
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

  if (normalized === "image" || normalized === "images" || normalized.startsWith("image/")) {
    return "image";
  }
  if (normalized === "video" || normalized === "videos" || normalized.startsWith("video/")) {
    return "video";
  }
  if (normalized === "audio" || normalized === "audios" || normalized.startsWith("audio/")) {
    return "audio";
  }
  return null;
}

export function MediaTypeBadge({
  file_type,
  file_name,
  type,
  size = "sm",
  variant = "light",
  unknownColor = "gray",
  showUnknown = true,
  unknownLabel,
  ...badgeProps
}: Omit<BadgeProps, "children" | "color" | "size" | "variant"> & {
  file_type?: string | null;
  file_name?: string | null;
  type?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "filled" | "light" | "outline" | "dot" | "default";
  unknownColor?: string;
  showUnknown?: boolean;
  unknownLabel?: ReactNode;
}) {
  const value = file_type ?? type;
  const mediaType = normalizeMediaType(value);

  if (mediaType) {
    return (
      <Badge {...badgeProps} size={size} variant={variant} color={MEDIA_TYPE_COLORS[mediaType]}>
        {capitalize(mediaType)}
      </Badge>
    );
  }

  if (!showUnknown) return null;

  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (normalized === "application/pdf") {
    return (
      <Badge {...badgeProps} size={size} variant={variant} color="red">
        PDF
      </Badge>
    );
  }
  if (normalized.startsWith("text/")) {
    return (
      <Badge {...badgeProps} size={size} variant={variant} color="blue">
        Text
      </Badge>
    );
  }

  const fileExt =
    typeof file_name === "string" && file_name.includes(".")
      ? file_name.split(".").pop()?.trim().toUpperCase()
      : null;
  const fallbackLabel =
    unknownLabel ??
    fileExt ??
    capitalize((typeof value === "string" ? value.trim() : "") || "Unknown");
  return (
    <Badge {...badgeProps} size={size} variant={variant} color={unknownColor}>
      {fallbackLabel}
    </Badge>
  );
}
