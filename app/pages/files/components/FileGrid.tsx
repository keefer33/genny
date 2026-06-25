import { Card, SimpleGrid, Stack, Image, Box, Group, Text, ThemeIcon } from "@mantine/core";
import { RiFileLine, RiImageLine, RiMusic2Line, RiVideoLine } from "@remixicon/react";
import type { FileData } from "~/lib/stores/filesFoldersStore";
import { GennyAudioPlayer } from "~/shared/GennyAudioPlayer";
import { MediaTypeBadge } from "~/shared/MediaTypeBadge";

interface FileGridProps {
  files: FileData[];
  onFileClick?: (file: FileData) => void;
  renderFileCard?: (file: FileData) => React.ReactNode;
  cols?: { base?: number; sm?: number; md?: number; lg?: number };
  showPreview?: boolean;
}

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith("image/")) {
    return <RiImageLine size={20} />;
  }
  if (fileType.startsWith("video/")) {
    return <RiVideoLine size={20} />;
  }
  if (fileType.startsWith("audio/")) {
    return <RiMusic2Line size={20} />;
  }
  return <RiFileLine size={20} />;
};

const getFileTypeColor = (fileType: string) => {
  if (fileType.startsWith("image/")) {
    return "blue";
  }
  if (fileType.startsWith("video/")) {
    return "purple";
  }
  if (fileType.startsWith("audio/")) {
    return "cyan";
  }
  return "gray";
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export function FileGrid({
  files,
  onFileClick,
  renderFileCard,
  cols = { base: 1, sm: 2, md: 3, lg: 4 },
  showPreview = true,
}: FileGridProps) {
  console.log("files", files);
  if (renderFileCard) {
    return (
      <SimpleGrid cols={cols} spacing="md">
        {files.map((file) => (
          <div key={file.id}>{renderFileCard(file)}</div>
        ))}
      </SimpleGrid>
    );
  }

  return (
    <SimpleGrid cols={cols} spacing="md">
      {files.map((file) => (
        <Card
          key={file.id}
          withBorder
          radius="md"
          p="sm"
          style={{ cursor: onFileClick ? "pointer" : "default" }}
          onClick={() => onFileClick?.(file)}
          onMouseEnter={(e) => {
            if (onFileClick) {
              e.currentTarget.style.backgroundColor = "var(--mantine-color-gray-0)";
            }
          }}
          onMouseLeave={(e) => {
            if (onFileClick) {
              e.currentTarget.style.backgroundColor = "transparent";
            }
          }}
        >
          <Stack gap="xs">
            {/* File Preview */}
            {showPreview && (
              <Box
                style={{
                  height: 120,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "var(--mantine-color-gray-1)",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                {file.file_type.startsWith("image/") ? (
                  <Image
                    src={file.thumbnail_url || file.file_path}
                    alt={file.file_name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : file.file_type.startsWith("video/") ? (
                  // For videos, use thumbnail_url if available, otherwise use video element
                  file.thumbnail_url ? (
                    <Image
                      src={file.thumbnail_url}
                      alt={file.file_name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <video
                      src={file.file_path}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      muted
                      preload="metadata"
                    />
                  )
                ) : file.file_type.startsWith("audio/") ? (
                  <GennyAudioPlayer src={file.file_path} compact stopPropagation />
                ) : (
                  <ThemeIcon size="xl" color={getFileTypeColor(file.file_type)} variant="light">
                    {getFileIcon(file.file_type)}
                  </ThemeIcon>
                )}
              </Box>
            )}

            {/* File Info */}
            <Stack gap="xs">
              <Text size="sm" fw={500} lineClamp={2} title={file.file_name}>
                {file.file_name}
              </Text>
              <Group justify="space-between" align="center">
                <MediaTypeBadge type={file.file_type} size="xs" />
                <Text size="xs" c="dimmed">
                  {formatFileSize(file.file_size)}
                </Text>
              </Group>
            </Stack>
          </Stack>
        </Card>
      ))}
    </SimpleGrid>
  );
}
