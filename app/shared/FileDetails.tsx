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
  Modal,
  Button,
} from "@mantine/core";
import {
  RiDeleteBinLine,
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
import { GennyAudioPlayer } from "./GennyAudioPlayer";
import { MediaTypeBadge } from "./MediaTypeBadge";
import { notifications } from "@mantine/notifications";
import { useDisclosure } from "@mantine/hooks";
import { Fragment, useEffect, useState, type ReactNode } from "react";
import useAppStore from "~/lib/stores/appStore";
import useFilesFoldersStore from "~/lib/stores/filesFoldersStore";

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

function isPromptPath(path: string): boolean {
  return path === "prompt" || path.endsWith(".prompt");
}

/** Sort object keys so `prompt` appears first, then alphabetically. */
function sortPayloadObjectKeys(keys: string[]): string[] {
  return [...keys].sort((a, b) => {
    const ap = a === "prompt" ? 0 : 1;
    const bp = b === "prompt" ? 0 : 1;
    if (ap !== bp) return ap - bp;
    return a.localeCompare(b);
  });
}

/** Turn `input`, `max_size`, `inputMedia` into readable labels (Input, Max size, Input media). */
function formatPayloadKeyLabel(key: string): string {
  if (!key) return key;
  const spaced = key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim();
  return spaced
    .split(/\s+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
}

function isArrayOfPlainObjects(arr: unknown[]): boolean {
  return (
    arr.length > 0 &&
    arr.every((item) => item !== null && typeof item === "object" && !Array.isArray(item))
  );
}

async function copyPayloadFieldToClipboard(value: unknown) {
  const text = typeof value === "string" ? value : formatPayloadValue(value);
  try {
    await navigator.clipboard.writeText(text);
    notifications.show({
      title: "Copied",
      message: "Copied to clipboard",
      color: "green",
    });
  } catch {
    notifications.show({
      title: "Error",
      message: "Failed to copy",
      color: "red",
    });
  }
}

function PayloadEntry({
  entryKey,
  value,
  path,
}: {
  entryKey: string;
  value: unknown;
  path: string;
}): ReactNode {
  if (value == null || value === "") return null;

  const label = formatPayloadKeyLabel(entryKey);

  if (typeof value !== "object") {
    return (
      <Group gap="xs" align="flex-start" wrap="nowrap" justify="space-between">
        <Group gap={6} align="flex-start" style={{ minWidth: 0, flex: 1 }}>
          <Text size="xs" fw={600} style={{ flexShrink: 0 }}>
            {label}:
          </Text>
          <Text
            size="xs"
            c="dimmed"
            style={{ wordBreak: "break-word", overflowWrap: "anywhere", minWidth: 0 }}
          >
            {formatPayloadValue(value)}
          </Text>
        </Group>
        {isPromptPath(path) ? (
          <ActionIcon
            size="sm"
            variant="transparent"
            aria-label={`Copy ${path}`}
            title="Copy prompt"
            style={{ flexShrink: 0 }}
            onClick={() => void copyPayloadFieldToClipboard(value)}
          >
            <RiFileCopyLine size={16} />
          </ActionIcon>
        ) : null}
      </Group>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <Group gap={6} align="flex-start" wrap="nowrap">
          <Text size="xs" fw={600} style={{ flexShrink: 0 }}>
            {label}:
          </Text>
          <Text size="xs" c="dimmed">
            —
          </Text>
        </Group>
      );
    }

    if (isArrayOfPlainObjects(value)) {
      return (
        <Box>
          <Text size="xs" fw={600} mb={4}>
            {label}:
          </Text>
          <Stack gap="sm" pl="md" style={{ borderLeft: "1px solid var(--mantine-color-gray-3)" }}>
            {value.map((item, i) => {
              const rowPath = `${path}.${i}`;
              const obj = item as Record<string, unknown>;
              const keys = sortPayloadObjectKeys(Object.keys(obj)).filter((k) => {
                const v = obj[k];
                return v != null && v !== "";
              });
              return (
                <Box key={rowPath}>
                  <Text size="xs" fw={600} c="dimmed" mb={4}>
                    {i}:
                  </Text>
                  <Stack gap={6} pl="md">
                    {keys.map((k) => (
                      <PayloadEntry
                        key={`${rowPath}.${k}`}
                        entryKey={k}
                        value={obj[k]}
                        path={`${rowPath}.${k}`}
                      />
                    ))}
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        </Box>
      );
    }

    return (
      <Group gap={6} align="flex-start" wrap="nowrap">
        <Text size="xs" fw={600} style={{ flexShrink: 0 }}>
          {label}:
        </Text>
        <Text size="xs" c="dimmed" style={{ minWidth: 0, overflowWrap: "anywhere" }}>
          {formatPayloadValue(value)}
        </Text>
      </Group>
    );
  }

  const o = value as Record<string, unknown>;
  const keys = sortPayloadObjectKeys(Object.keys(o)).filter((k) => {
    const v = o[k];
    return v != null && v !== "";
  });

  if (keys.length === 0) {
    return (
      <Group gap={6} align="flex-start" wrap="nowrap">
        <Text size="xs" fw={600} style={{ flexShrink: 0 }}>
          {label}:
        </Text>
        <Text size="xs" c="dimmed">
          —
        </Text>
      </Group>
    );
  }

  return (
    <Box>
      <Text size="xs" fw={600} mb={4}>
        {label}:
      </Text>
      <Stack gap={6} pl="md" style={{ borderLeft: "1px solid var(--mantine-color-gray-3)" }}>
        {keys.map((k) => (
          <PayloadEntry key={`${path}.${k}`} entryKey={k} value={o[k]} path={`${path}.${k}`} />
        ))}
      </Stack>
    </Box>
  );
}

function PayloadTreeRoot({ value }: { value: unknown }): ReactNode {
  if (value == null) {
    return (
      <Text size="xs" c="dimmed">
        —
      </Text>
    );
  }

  if (typeof value !== "object") {
    return (
      <Text size="xs" c="dimmed" style={{ overflowWrap: "anywhere" }}>
        {formatPayloadValue(value)}
      </Text>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <Text size="xs" c="dimmed">
          —
        </Text>
      );
    }
    if (isArrayOfPlainObjects(value)) {
      return (
        <Stack gap="sm">
          {value.map((item, i) => {
            const obj = item as Record<string, unknown>;
            const keys = sortPayloadObjectKeys(Object.keys(obj)).filter((k) => {
              const v = obj[k];
              return v != null && v !== "";
            });
            return (
              <Fragment key={String(i)}>
                <Text size="xs" fw={600} c="dimmed">
                  {i}:
                </Text>
                <Stack
                  gap={6}
                  pl="md"
                  style={{ borderLeft: "1px solid var(--mantine-color-gray-3)" }}
                >
                  {keys.map((k) => (
                    <PayloadEntry
                      key={`${i}.${k}`}
                      entryKey={k}
                      value={obj[k]}
                      path={`${i}.${k}`}
                    />
                  ))}
                </Stack>
              </Fragment>
            );
          })}
        </Stack>
      );
    }
    return (
      <Text size="xs" c="dimmed" style={{ overflowWrap: "anywhere" }}>
        {formatPayloadValue(value)}
      </Text>
    );
  }

  const o = value as Record<string, unknown>;
  const keys = sortPayloadObjectKeys(Object.keys(o)).filter((k) => {
    const v = o[k];
    return v != null && v !== "";
  });
  if (keys.length === 0) {
    return (
      <Text size="xs" c="dimmed">
        —
      </Text>
    );
  }

  return (
    <Stack gap="sm">
      {keys.map((k) => (
        <PayloadEntry key={k} entryKey={k} value={o[k]} path={k} />
      ))}
    </Stack>
  );
}

type UserFileTag = {
  file_id: string;
  tag_id: string;
  created_at: string;
  user_tags: {
    id: string;
    created_at: string;
    user_id: string;
    tag_name: string;
  };
};

export type FileDetailsProps = {
  file: {
    id: string;
    character_id?: string;
    file_name: string;
    file_path: string;
    file_size: number;
    file_type: string;
    created_at: string;
    user_file_tags?: UserFileTag[];
    generated_info?: unknown;
    upload_type?: string;
  };
  onTagsUpdated?: (fileId: string, updatedTags: UserFileTag[]) => void;
  /** Called after a non-delete file mutation (e.g. switch base look). */
  onUpdated?: (fileId: string) => void;
  /** Called after the file row is removed from the API (e.g. close modal, refresh a list). */
  onDeleted?: (fileId: string) => void;
};

export function FileDetails({
  file,
  onTagsUpdated,
  onUpdated: _onUpdated,
  onDeleted,
}: FileDetailsProps) {
  const [fileDetail, setFileDetail] = useState(file);
  const [uploadTypeOverride, setUploadTypeOverride] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmOpened, { open: openDeleteConfirm, close: closeDeleteConfirm }] =
    useDisclosure(false);
  const { isMobile } = useAppStore();
  const deleteUserFileRecord = useFilesFoldersStore((s) => s.deleteUserFileRecord);

  useEffect(() => {
    setFileDetail(file);
  }, [file]);

  useEffect(() => {
    setUploadTypeOverride(null);
  }, [file.id]);

  const uploadType = (uploadTypeOverride ?? fileDetail.upload_type ?? "").trim().toLowerCase();
  const canDelete = Boolean(
    fileDetail.id?.trim() &&
      fileDetail.file_name?.trim() &&
      uploadType !== "character"
  );
  const isCharacter = uploadType === "character";

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
  const handleFileDetailTagsUpdated = (updatedTags: UserFileTag[]) => {
    setFileDetail((prev) => (prev ? { ...prev, user_file_tags: updatedTags } : fileDetail));
    onTagsUpdated?.(fileDetail.id, updatedTags);
  };

  const handleConfirmDelete = async () => {
    if (!canDelete) return;

    setDeleting(true);
    const ok = await deleteUserFileRecord(fileDetail.file_name, fileDetail.id);
    setDeleting(false);
    closeDeleteConfirm();

    if (!ok) return;
    onDeleted?.(fileDetail.id);
  };

  const generatedInfo = fileDetail.generated_info as { payload?: unknown } | undefined;
  const payload =
    generatedInfo?.payload && typeof generatedInfo.payload === "object"
      ? (generatedInfo.payload as Record<string, unknown>)
      : null;

  return (
    <>
      <Modal
        opened={deleteConfirmOpened}
        onClose={closeDeleteConfirm}
        title="Delete file"
        centered
        size="sm"
      >
        <Stack gap="md">
          <Text size="sm">
            Permanently delete &quot;{fileDetail.file_name}&quot; from storage and your library?
            This cannot be undone.
          </Text>
          <Group justify="flex-end" gap="xs">
            <Button variant="default" onClick={closeDeleteConfirm} disabled={deleting}>
              Cancel
            </Button>
            <Button color="red" loading={deleting} onClick={() => void handleConfirmDelete()}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
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
              <GennyAudioPlayer
                src={fileDetail.file_path}
                showWaveform
                size="md"
                waveformHeight={72}
                wrapperProps={{ style: { maxHeight: "60vh" } }}
              />
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
            <Group gap="xs" justify="space-between" align="flex-start" wrap="nowrap">
              {isCharacter ? <Badge size="sm">Character</Badge> : null}
            </Group>
            <Group justify="space-between" align="flex-start" wrap="nowrap">
              <Text size="md" fw={600} style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                {fileDetail.file_name}
              </Text>

              {/* Action Buttons */}
              <Group gap="sm">
                <FileShare
                  fileUrl={fileDetail.file_path}
                  fileName={fileDetail.file_name}
                  fileType={resolveFileShareType(fileDetail.file_type)}
                  variant="icon"
                  size="sm"
                />
                <ActionIcon
                  size="sm"
                  onClick={() => handleFileDetailDownload(fileDetail)}
                  variant="transparent"
                  aria-label="Download file"
                  title="Download file"
                >
                  <RiDownloadLine />
                </ActionIcon>
                {canDelete ? (
                  <ActionIcon
                    size="sm"
                    color="red"
                    variant="transparent"
                    aria-label="Delete file"
                    title="Delete file"
                    loading={deleting}
                    onClick={openDeleteConfirm}
                  >
                    <RiDeleteBinLine />
                  </ActionIcon>
                ) : null}
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
            <Anchor
              href={fileDetail.file_path}
              target="_blank"
              style={{ overflowWrap: "anywhere" }}
            >
              <Group gap="xs" style={{ minWidth: 0 }}>
                {fileDetail.file_path}

                <RiExternalLinkLine />
              </Group>
            </Anchor>
            {/* File Details Table */}
            <Table
              variant="vertical"
              layout="fixed"
              withTableBorder={true}
              style={{ width: "100%" }}
            >
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

            {/* Generation payload: indented outline (no JSON braces); any *prompt field gets copy */}
            {payload ? (
              <Box>
                <Text size="sm" fw={500} mb="xs">
                  Payload
                </Text>
                <PayloadTreeRoot value={payload} />
              </Box>
            ) : null}
          </Stack>
        </Card>
      </Flex>
    </>
  );
}
