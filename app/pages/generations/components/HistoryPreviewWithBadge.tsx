import { Badge, Box } from "@mantine/core";
import { GennyAudioPlayer } from "~/shared/GennyAudioPlayer";
import { MediaTypeBadge } from "~/shared/MediaTypeBadge";

function formatUploadTypeLabel(uploadType: string): string {
  return uploadType.trim().replace(/_/g, " ");
}

export function HistoryPreviewWithBadge({
  url,
  file_type,
  upload_type,
  entityName,
  isBaseLook = false,
}: {
  url: string;
  file_type: string;
  upload_type?: string | null;
  /** Character or voice display name when the file is linked. */
  entityName?: string | null;
  isBaseLook?: boolean;
}) {
  const isAudio = file_type.startsWith("audio/");
  const uploadTypeLabel = upload_type?.trim() ? formatUploadTypeLabel(upload_type) : "";
  const entityLabel = entityName?.trim() || "";

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
          <GennyAudioPlayer src={url} compact stopPropagation aria-label="Audio preview" />
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
      {isBaseLook ? (
        <Badge
          size="sm"
          variant="filled"
          pos="absolute"
          top={6}
          right={6}
          style={{ zIndex: 2, textTransform: "none", pointerEvents: "none" }}
        >
          Base look
        </Badge>
      ) : null}
      {uploadTypeLabel ? (
        <Badge
          size="sm"
          variant="light"
          color="gray"
          pos="absolute"
          bottom={6}
          left={6}
          style={{ zIndex: 2, textTransform: "none", pointerEvents: "none" }}
        >
          {uploadTypeLabel}
        </Badge>
      ) : null}
      {entityLabel ? (
        <Badge
          size="sm"
          variant="filled"
          color="blue"
          pos="absolute"
          bottom={6}
          right={6}
          style={{
            zIndex: 2,
            textTransform: "none",
            pointerEvents: "none",
            maxWidth: "45%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={entityLabel}
        >
          {entityLabel}
        </Badge>
      ) : null}
    </Box>
  );
}
