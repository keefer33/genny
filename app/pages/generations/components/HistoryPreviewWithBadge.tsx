import { Box, Image } from "@mantine/core";
import { GENERATIONS_HISTORY_THUMB_H } from "~/lib/generationsHistoryUtils";
import { MediaTypeBadge } from "~/shared/MediaTypeBadge";

export function HistoryPreviewWithBadge({ url, file_type }: { url: string; file_type: string }) {
  const isVideo = file_type.startsWith("video/");
  const isAudio = file_type.startsWith("audio/");

  return (
    <Box pos="relative" w="100%" h={GENERATIONS_HISTORY_THUMB_H}>
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
            height: GENERATIONS_HISTORY_THUMB_H,
            objectFit: "cover",
            verticalAlign: "top",
          }}
        />
      ) : isAudio ? (
        <Box
          h={GENERATIONS_HISTORY_THUMB_H}
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
        <Image src={url} alt="" h={GENERATIONS_HISTORY_THUMB_H} w="100%" fit="cover" />
      )}
      <MediaTypeBadge
        size="sm"
        variant="filled"
        file_type={file_type}
        pos="absolute"
        top={6}
        left={6}
        style={{ zIndex: 2, textTransform: "none", pointerEvents: "none" }}
      />
    </Box>
  );
}
