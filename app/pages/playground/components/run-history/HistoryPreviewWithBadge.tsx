import { Badge, Box, Checkbox, Image } from "@mantine/core";
import {
  playgroundRunBadgeLabelFromUrl,
  runHistoryBadgeColorForFileType,
} from "~/lib/playgroundRunHistoryUtils";
import { RUN_HISTORY_THUMB_H } from "./runHistoryConstants";

export function HistoryPreviewWithBadge({
  url,
  badgeLabel,
  fileId,
  showSelect,
  checked,
  onSelectChange,
  showViewButton,
  onViewClick,
}: {
  url: string;
  badgeLabel: string;
  /** When set with `showSelect`, this file can be selected for bulk delete. */
  fileId?: string;
  showSelect?: boolean;
  checked?: boolean;
  onSelectChange?: (next: boolean) => void;
  showViewButton?: boolean;
  onViewClick?: () => void;
}) {
  const mediaKindFromUrl = playgroundRunBadgeLabelFromUrl(url);
  const badgeLower = badgeLabel.trim().toLowerCase();
  const isImageLikeUrl = mediaKindFromUrl === "Image" || mediaKindFromUrl === "GIF";
  const isVideo =
    mediaKindFromUrl === "Video" || (badgeLower === "video" && !isImageLikeUrl);
  const isAudio =
    mediaKindFromUrl === "Audio" || (badgeLower === "audio" && !isImageLikeUrl);
  const isClickable = Boolean(showViewButton && fileId && onViewClick);

  return (
    <Box
      pos="relative"
      w="100%"
      h={RUN_HISTORY_THUMB_H}
      onClick={() => {
        if (!isClickable) return;
        onViewClick();
      }}
      style={{
        cursor: isClickable ? "pointer" : "default",
      }}
    >
      {isVideo ? (
        <video
          src={url}
          muted
          playsInline
          preload="metadata"
          aria-hidden
          style={{
            display: "block",
            width: "100%",
            height: RUN_HISTORY_THUMB_H,
            objectFit: "cover",
            verticalAlign: "top",
          }}
        />
      ) : isAudio ? (
        <Box
          h={RUN_HISTORY_THUMB_H}
          w="100%"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          p="xs"
        >
          <audio
            src={url}
            controls
            preload="metadata"
            aria-label="Audio preview"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "100%",
              height: 40,
            }}
          />
        </Box>
      ) : (
        <Image src={url} alt="" h={RUN_HISTORY_THUMB_H} w="100%" fit="cover" />
      )}
      <Badge
        size="sm"
        variant="filled"
        color={runHistoryBadgeColorForFileType(badgeLabel)}
        pos="absolute"
        top={6}
        left={6}
        style={{ zIndex: 2, textTransform: "none", pointerEvents: "none" }}
      >
        {badgeLabel}
      </Badge>
      {showSelect && fileId ? (
        <Checkbox
          checked={Boolean(checked)}
          onChange={(e) => onSelectChange?.(e.currentTarget.checked)}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            zIndex: 12,
          }}
        />
      ) : null}
    </Box>
  );
}
