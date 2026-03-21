import { ActionIcon, Box, Button, Card, Center, Group, Image, Loader, Text } from "@mantine/core";
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

function buildMinimalFile(fileUrl: string) {
  const getFileType = (url: string) => {
    if (!url) return null;
    const extension = url.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension || "")) {
      return "image";
    }
    if (["mp4", "webm", "mov", "avi"].includes(extension || "")) {
      return "video";
    }
    return "file";
  };
  const fileType = getFileType(fileUrl);
  return {
    id: "",
    file_name: fileUrl.split("/").pop() || "File",
    file_path: fileUrl,
    file_type:
      fileType === "image"
        ? "image/jpeg"
        : fileType === "video"
          ? "video/mp4"
          : "application/octet-stream",
  };
}

export function FilePickerPreview({
  fileUrl,
  placeholder,
  onSelect,
  onClear,
  onFileSelect,
  allowedTypes = "all",
  title,
  autoOpen = false,
}: {
  fileUrl: string;
  placeholder: string;
  onSelect: () => void;
  onClear: () => void;
  onFileSelect: (fileUrl: string, file?: any) => void;
  allowedTypes?: "images" | "videos" | "all";
  title?: string;
  autoOpen?: boolean;
}) {
  const [opened, { open, close }] = useDisclosure(false);

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
    onFileSelect(url, file);
    if (file) {
      setSelectedFile(file);
    }
    close();
  };

  const getFileType = (url: string) => {
    if (!url) return null;
    const extension = url.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension || "")) {
      return "image";
    }
    if (["mp4", "webm", "mov", "avi"].includes(extension || "")) {
      return "video";
    }
    return "file";
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

  return (
    <>
      {fileUrl ? (
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
                ) : (
                  <Box>
                    <Text size="sm" c="dimmed">
                      📄
                    </Text>
                  </Box>
                )}
              </Box>
              <Group gap="xs" ml="auto">
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
