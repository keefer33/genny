import {
  ActionIcon,
  Box,
  Button,
  Card,
  Center,
  Group,
  Image,
  Loader,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useEffect, useState } from "react";
import type React from "react";
import { RiCloseLine } from "@remixicon/react";
import { FilePickerModal } from "~/shared/FilePickerModal";
import useAppStore from "~/lib/stores/appStore";
import { assertAuthFetchOk, authFetch } from "~/lib/stores/authFetch";
import { endpoint } from "~/lib/utils";
import { FilePreviewModal } from "~/pages/files/components/FilePreviewModal";

async function fetchUserFileByPath(filePath: string): Promise<any | null> {
  const app = useAppStore.getState();
  const session = app.getUser();
  if (!session?.user?.id || !app.getAuthApiKey()) {
    return null;
  }
  const qs = new URLSearchParams({ file_path: filePath });
  const res = await authFetch(`${endpoint}/user/files/by-path?${qs.toString()}`);
  if (res.status === 404) {
    return null;
  }
  await assertAuthFetchOk(res, "Failed to load file");
  const json = (await res.json()) as { success?: boolean; data?: { file?: any } };
  return json.data?.file ?? null;
}

const AUDIO_EXTENSIONS = ["mp3", "wav", "ogg", "m4a", "flac", "aac", "opus", "aiff", "wma"];

function extensionMediaKind(url: string): "image" | "video" | "audio" | "file" {
  if (!url) return "file";
  const extension = url.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension)) {
    return "image";
  }
  if (["mp4", "webm", "mov", "avi", "mkv"].includes(extension)) {
    return "video";
  }
  if (AUDIO_EXTENSIONS.includes(extension)) {
    return "audio";
  }
  return "file";
}

function buildMinimalFile(fileUrl: string) {
  const kind = extensionMediaKind(fileUrl);
  return {
    id: "",
    file_name: fileUrl.split("/").pop() || "File",
    file_path: fileUrl,
    file_type:
      kind === "image"
        ? "image/jpeg"
        : kind === "video"
          ? "video/mp4"
          : kind === "audio"
            ? "audio/mpeg"
            : "application/octet-stream",
  };
}

const DEFAULT_URL_PLACEHOLDER = "Or paste a media URL";
const URL_INPUT_ARIA = "Media URL (alternative to file picker)";

export function FilePickerPreview({
  fileUrl,
  placeholder,
  onSelect,
  onClear,
  onFileSelect,
  allowedTypes = "all",
  title,
  autoOpen = false,
  showUrlInput = false,
  urlInputReadOnly = false,
  onUrlChange,
  urlPlaceholder = DEFAULT_URL_PLACEHOLDER,
  allowPickerChange = true,
}: {
  fileUrl: string;
  placeholder: string;
  onSelect: () => void;
  onClear: () => void;
  onFileSelect: (fileUrl: string, file?: any) => void;
  allowedTypes?: "images" | "videos" | "audio" | "all";
  title?: string;
  autoOpen?: boolean;
  /** Stack a URL field under the picker: filled rows show the current URL; empty row shows pending URL + Add / Enter. */
  showUrlInput?: boolean;
  /** When a URL is already set, show the field read-only (e.g. multi-item rows). */
  urlInputReadOnly?: boolean;
  /** Required when `showUrlInput` and not `urlInputReadOnly` and `fileUrl` is set — updates value as the user types. */
  onUrlChange?: (url: string) => void;
  urlPlaceholder?: string;
  /** When false and a file is selected, hide the library "Change" action (e.g. manual URL rows). */
  allowPickerChange?: boolean;
}) {
  const [opened, { open, close }] = useDisclosure(false);
  const [pendingUrl, setPendingUrl] = useState("");

  useEffect(() => {
    if (autoOpen && !fileUrl) {
      open();
    }
  }, [autoOpen, fileUrl, open]);

  const [previewOpened, { open: openPreview, close: closePreview }] = useDisclosure(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [loadingFile, setLoadingFile] = useState(false);

  useEffect(() => {
    const fetchFile = async () => {
      if (!fileUrl) {
        setSelectedFile(null);
        return;
      }

      setLoadingFile(true);
      try {
        const data = await fetchUserFileByPath(fileUrl);
        setSelectedFile(data);
      } catch (err: any) {
        console.error("Error fetching file:", err);
        setSelectedFile(null);
      } finally {
        setLoadingFile(false);
      }
    };

    fetchFile();
  }, [fileUrl]);

  const handleFileSelect = (url: string, file?: any) => {
    setPendingUrl("");
    onFileSelect(url, file);
    if (file) {
      setSelectedFile(file);
    }
    close();
  };

  const getFileType = (url: string) => {
    const kind = extensionMediaKind(url);
    if (kind === "file") return null;
    return kind;
  };

  const handlePreviewClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!fileUrl) return;

    if (!selectedFile) {
      setLoadingFile(true);
      try {
        const data = await fetchUserFileByPath(fileUrl);
        if (data) {
          setSelectedFile(data);
          openPreview();
        } else {
          setSelectedFile(buildMinimalFile(fileUrl));
          openPreview();
        }
      } catch (err: any) {
        console.error("Error fetching file:", err);
        setSelectedFile(buildMinimalFile(fileUrl));
        openPreview();
      } finally {
        setLoadingFile(false);
      }
    } else {
      openPreview();
    }
  };

  const fileType = fileUrl ? getFileType(fileUrl) : null;

  const flushPendingUrl = () => {
    const t = pendingUrl.trim();
    if (!t) return;
    onFileSelect(t);
    setPendingUrl("");
  };

  const pickerBlock = fileUrl ? (
    <Card
      withBorder={false}
      radius="md"
      w="100%"
      p="0"
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      {loadingFile ? (
        <Center p="md">
          <Loader size="sm" />
        </Center>
      ) : (
        <Group gap="xs" align="center" p="sm">
          <Box style={{ cursor: fileUrl ? "pointer" : "default" }} onClick={handlePreviewClick}>
            {fileType === "image" ? (
              <Image
                src={selectedFile?.thumbnail_url || fileUrl}
                alt="Selected file"
                style={{
                  width: "100px",
                  height: "100px",
                  objectFit: "cover",
                  borderRadius: "4px",
                }}
              />
            ) : fileType === "video" ? (
              selectedFile?.thumbnail_url ? (
                <Image
                  src={selectedFile.thumbnail_url}
                  alt="Video thumbnail"
                  style={{
                    width: "100px",
                    height: "100px",
                    objectFit: "cover",
                    borderRadius: "4px",
                  }}
                />
              ) : (
                <video
                  src={fileUrl}
                  style={{
                    maxWidth: "200px",
                    maxHeight: "100px",
                    objectFit: "contain",
                    borderRadius: "4px",
                  }}
                  muted
                  preload="metadata"
                />
              )
            ) : fileType === "audio" ? (
              <audio
                src={fileUrl}
                controls
                preload="metadata"
                style={{ maxWidth: "220px", height: "36px" }}
              />
            ) : (
              <Box>
                <Text size="sm" c="dimmed">
                  📄
                </Text>
              </Box>
            )}
          </Box>
          <Group gap="xs" ml="auto">
            {allowPickerChange ? (
              <Button
                size="xs"
                variant="light"
                onClick={(e) => {
                  e.stopPropagation();
                  open();
                  onSelect();
                }}
              >
                Change
              </Button>
            ) : null}
            <ActionIcon
              size="sm"
              variant="light"
              color="red"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
            >
              <RiCloseLine size={16} />
            </ActionIcon>
          </Group>
        </Group>
      )}
    </Card>
  ) : (
    <Button
      variant="light"
      onClick={() => {
        open();
        onSelect();
      }}
      fullWidth
    >
      {placeholder}
    </Button>
  );

  const urlBlock =
    showUrlInput && fileUrl ? (
      <TextInput
        size="sm"
        placeholder={urlPlaceholder}
        aria-label={URL_INPUT_ARIA}
        value={fileUrl}
        readOnly={urlInputReadOnly}
        onChange={
          urlInputReadOnly
            ? undefined
            : (e) => {
                onUrlChange?.(e.currentTarget.value);
              }
        }
      />
    ) : showUrlInput && !fileUrl ? (
      <Group align="flex-end" gap="xs" wrap="nowrap">
        <TextInput
          style={{ flex: 1 }}
          size="sm"
          placeholder={`${urlPlaceholder}, then Enter`}
          aria-label={URL_INPUT_ARIA}
          value={pendingUrl}
          onChange={(e) => setPendingUrl(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              flushPendingUrl();
            }
          }}
        />
        <Button size="xs" variant="light" type="button" onClick={flushPendingUrl}>
          Add URL
        </Button>
      </Group>
    ) : null;

  return (
    <>
      {showUrlInput ? (
        <Stack gap="xs" w="100%">
          {pickerBlock}
          {urlBlock}
        </Stack>
      ) : (
        pickerBlock
      )}

      <FilePickerModal
        opened={opened}
        onClose={close}
        onSelect={handleFileSelect}
        title={title || "Select File"}
        allowedTypes={allowedTypes}
      />

      {previewOpened && selectedFile && (
        <FilePreviewModal
          opened={previewOpened}
          onClose={closePreview}
          file={selectedFile}
          showActions={true}
          onDelete={() => {
            onClear();
            closePreview();
          }}
        />
      )}
    </>
  );
}
