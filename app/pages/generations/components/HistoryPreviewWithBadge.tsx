import { Box } from "@mantine/core";
import { MediaTypeBadge } from "~/shared/MediaTypeBadge";

export function HistoryPreviewWithBadge({ url, file_type }: { url: string; file_type: string }) {
  const isAudio = file_type.startsWith("audio/");

  return (
    <Box pos="relative" w="100%" h="100%">
      {isAudio ? (
        <Box
          h="100%"
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
        <img
          src={url}
          alt=""
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
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
