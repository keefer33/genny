import {
  Stack,
  Box,
  Image,
  Group,
  Text,
  Badge,
  Anchor,
  Table,
  ActionIcon,
  Center,
  Flex,
  Card,
} from "@mantine/core";
import {
  RiDownloadLine,
  RiExternalLinkLine,
  RiFileCopyLine,
  RiFileLine,
  RiFileTextLine,
  RiFilePdf2Fill,
  RiMusic2Line,
  RiPlayLine,
  RiImageLine,
} from "@remixicon/react";
import dayjs from "dayjs";
import { formatFileSize, formatDate, isTextFile, getFileExtension } from "~/lib/utils";
import FileShare from "./FileShare";
import FileTagModal from "~/pages/files/components/FileTagModal";
import { MediaTypeBadge } from "./MediaTypeBadge";
import { notifications } from "@mantine/notifications";
import { useState } from "react";
import useAppStore from "~/lib/stores/appStore";

function resolveFileShareType(fileType: string): "image" | "video" | "audio" | "other" {
  if (fileType.startsWith("image/")) return "image";
  if (fileType.startsWith("video/")) return "video";
  if (fileType.startsWith("audio/")) return "audio";
  return "other";
}

function formatPayloadValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function FileDetails({
  file,
  onTagsUpdated,
}: {
  file: any;
  onTagsUpdated: (fileId: string, updatedTags: any) => void;
}) {
  const [fileDetail, setFileDetail] = useState(file);
  const { isMobile } = useAppStore();
  const getFileIcon = (size: number = 24) => {
    if (file.file_type.startsWith("image/")) {
      return <RiImageLine size={size} />;
    }
    if (file.file_type.startsWith("video/")) {
      return <RiPlayLine size={size} />;
    }
    if (file.file_type.startsWith("audio/")) {
      return <RiMusic2Line size={size} />;
    }
    if (file.file_type === "application/pdf") {
      return <RiFilePdf2Fill size={size} />;
    }
    if (file.file_type.startsWith("text/") || isTextFile(file.file_name)) {
      return <RiFileTextLine size={size} />;
    }
    return <RiFileLine size={size} />;
  };

  const getFileTypeBadge = () => {
    const ext = getFileExtension(file.file_name);
    if (file.file_type.startsWith("image/")) {
      return <MediaTypeBadge type="image" size="sm" variant="filled" />;
    }
    if (file.file_type.startsWith("video/")) {
      return <MediaTypeBadge type="video" size="sm" variant="filled" />;
    }
    if (file.file_type.startsWith("audio/")) {
      return <MediaTypeBadge type="audio" size="sm" variant="filled" />;
    }
    if (file.file_type === "application/pdf") {
      return (
        <Badge color="red" variant="light" size="sm">
          PDF
        </Badge>
      );
    }
    if (file.file_type.startsWith("text/") || isTextFile(file.file_name)) {
      return (
        <Badge color="blue" variant="light" size="sm">
          Text
        </Badge>
      );
    }
    return (
      <Badge color="gray" variant="light" size="sm">
        {ext.toUpperCase()}
      </Badge>
    );
  };

  const handleFileDetailDownload = async (fileDetail) => {
    if (!fileDetail) return;
    try {
      const res = await fetch(fileDetail.file_path, { mode: "cors" });
      if (!res.ok) throw new Error("Fetch failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileDetail.file_name || "download";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(fileDetail.file_path, "_blank");
    }
  };
  const handleFileDetailTagsUpdated = (updatedTags) => {
    setFileDetail((prev) => (prev ? { ...prev, user_file_tags: updatedTags } : fileDetail));
    onTagsUpdated(fileDetail.id, updatedTags);
  };

  const payload =
    fileDetail.generated_info?.payload && typeof fileDetail.generated_info.payload === "object"
      ? (fileDetail.generated_info.payload as Record<string, unknown>)
      : null;
  const payloadDetails = payload
    ? Object.entries(payload).filter(
        ([key, value]) => key !== "prompt" && value != null && value !== ""
      )
    : [];

  return (
    <Flex direction={isMobile ? "column" : "row"} gap="xs" p="xs" align="stretch" w="100%">
      {/* File Preview Section */}
      <Box
        pos="relative"
        style={{
          flex: isMobile ? "0 0 auto" : "1 1 calc(80% - var(--mantine-spacing-lg))",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <Center>
          {fileDetail.file_type.startsWith("image/") ? (
            <Image
              src={fileDetail.file_path}
              alt={fileDetail.file_name}
              style={{ maxWidth: "100%", width: "auto", height: "auto", objectFit: "contain" }}
              radius="md"
            />
          ) : fileDetail.file_type.startsWith("video/") ? (
            <video
              src={fileDetail.file_path}
              style={{
                maxWidth: "100%",
                width: "auto",
                height: "auto",
                //maxHeight: "60vh",
                objectFit: "contain",
                borderRadius: "8px",
              }}
              controls
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          ) : fileDetail.file_type.startsWith("audio/") ? (
            <audio
              src={fileDetail.file_path}
              style={{
                width: "100%",
                maxHeight: "60vh",
                borderRadius: "8px",
              }}
              controls
              preload="metadata"
            >
              Your browser does not support the audio element.
            </audio>
          ) : (
            <Center
              h={400}
              style={{ backgroundColor: "var(--mantine-color-gray-0)", borderRadius: "8px" }}
            >
              <Stack align="center" gap="md">
                <Box>{getFileIcon(120)}</Box>
                <Text size="lg" fw={500}>
                  {fileDetail.file_name}
                </Text>
              </Stack>
            </Center>
          )}
        </Center>
      </Box>

      {/* File Information */}
      <Card
        style={{
          flex: isMobile ? "0 0 auto" : "0 1 310px",
          minWidth: 300,
          overflow: "hidden",
        }}
      >
        <Stack gap="xs">
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <Text size="xl" fw={600} style={{ minWidth: 0, overflowWrap: "anywhere" }}>
              {fileDetail.file_name}
            </Text>

            {/* Action Buttons */}
            <Group gap="sm">
              <FileShare
                fileUrl={fileDetail.file_path}
                fileName={fileDetail.file_name}
                fileType={resolveFileShareType(fileDetail.file_type)}
                variant="icon"
                size="lg"
              />
              <ActionIcon
                size="xl"
                onClick={() => handleFileDetailDownload(fileDetail)}
                variant="transparent"
              >
                <RiDownloadLine />
              </ActionIcon>
            </Group>
          </Group>
          <Group gap="xs">
            {getFileTypeBadge()}
            <Text size="sm" c="dimmed">
              {formatFileSize(fileDetail.file_size)}
            </Text>
            <Text size="sm" c="dimmed">
              {formatDate(fileDetail.created_at)}
            </Text>
          </Group>
          {/* Tags Section */}
          <Box>
            <Group gap="xs" justify="space-between" align="center" mb="xs">
              <Text size="sm" fw={500}>
                Tags
              </Text>
              <FileTagModal
                fileId={fileDetail.id}
                fileTags={fileDetail.user_file_tags || []}
                onTagsUpdated={(updatedTags) => handleFileDetailTagsUpdated(updatedTags)}
              />
            </Group>
            <Group gap="xs">
              {fileDetail.user_file_tags && fileDetail.user_file_tags.length > 0 ? (
                fileDetail.user_file_tags.map((fileTag) => (
                  <Badge key={fileTag.tag_id} size="sm">
                    {fileTag.user_tags.tag_name}
                  </Badge>
                ))
              ) : (
                <Text size="sm" c="dimmed">
                  No tags assigned
                </Text>
              )}
            </Group>
          </Box>
          <Anchor href={fileDetail.file_path} target="_blank" style={{ overflowWrap: "anywhere" }}>
            <Group gap="xs" style={{ minWidth: 0 }}>
              {fileDetail.file_path}

              <RiExternalLinkLine />
            </Group>
          </Anchor>
          {/* File Details Table */}
          <Table variant="vertical" layout="fixed" withTableBorder={true} style={{ width: "100%" }}>
            <Table.Tbody>
              <Table.Tr>
                <Table.Th w={120}>File Name</Table.Th>
                <Table.Td style={{ overflowWrap: "anywhere" }}>{fileDetail.file_name}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Th>Date Created</Table.Th>
                <Table.Td>{`${dayjs(fileDetail.created_at).format("MM/DD/YYYY h:mm A")}`}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Th>File Size</Table.Th>
                <Table.Td>{formatFileSize(fileDetail.file_size)}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Th>File Type</Table.Th>
                <Table.Td style={{ overflowWrap: "anywhere" }}>
                  {fileDetail.file_type.toUpperCase()}
                </Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>

          {/* Prompt Section */}
          {payload?.prompt && (
            <Box>
              <Group gap="xs" justify="space-between" align="center" mb="xs">
                <Text size="sm" fw={500}>
                  Prompt
                </Text>
                <ActionIcon
                  size="sm"
                  variant="transparent"
                  aria-label="Copy prompt"
                  title="Copy prompt"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        typeof payload.prompt === "string"
                          ? payload.prompt
                          : formatPayloadValue(payload.prompt)
                      );
                      notifications.show({
                        title: "Copied",
                        message: "Prompt copied to clipboard",
                        color: "green",
                      });
                    } catch {
                      notifications.show({
                        title: "Error",
                        message: "Failed to copy prompt",
                        color: "red",
                      });
                    }
                  }}
                >
                  <RiFileCopyLine size={16} />
                </ActionIcon>
              </Group>
              <Text size="xs" style={{ wordBreak: "break-word" }}>
                {formatPayloadValue(payload.prompt)}
              </Text>
              {payloadDetails.length > 0 ? (
                <Stack gap={4} mt="sm">
                  {payloadDetails.map(([key, value]) => (
                    <Group key={key} gap={6} align="flex-start" wrap="nowrap">
                      <Text size="xs" fw={600} style={{ flex: "0 0 auto" }}>
                        {key}:
                      </Text>
                      <Text size="xs" c="dimmed" style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                        {formatPayloadValue(value)}
                      </Text>
                    </Group>
                  ))}
                </Stack>
              ) : null}
            </Box>
          )}
        </Stack>
      </Card>
    </Flex>
  );
}
