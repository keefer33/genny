import { ActionIcon, Box, Button, Card, Center, Group, Image, Loader, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useEffect, useState } from "react";
import type React from "react";
import { RiCloseLine } from "@remixicon/react";
import { extensionMediaKind } from "~/lib/utils";
import type { FileTypeFilter } from "~/lib/stores/filesFoldersStore";
import FileDetailModal from "~/shared/FileDetailModal";
import { GennyAudioPlayer } from "~/shared/GennyAudioPlayer";
import { FilePickerModal } from "~/shared/FilePickerModal";
import { buildMinimalFile, fetchUserFileByPath } from "./mediaFilePickerByPath";

export function PickerMediaRow({
  fileUrl,
  allowedTypes,
  genModelId,
  modalTitle,
  onReplace,
  onRemove,
  allowChange,
}: {
  fileUrl: string;
  allowedTypes: FileTypeFilter;
  genModelId?: string;
  modalTitle: string;
  onReplace: (path: string, file?: any) => void;
  onRemove: () => void;
  allowChange: boolean;
}) {
  const [modalOpen, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [previewOpen, { open: openPreview, close: closePreview }] = useDisclosure(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [loadingFile, setLoadingFile] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!fileUrl) {
        setSelectedFile(null);
        return;
      }
      setLoadingFile(true);
      try {
        const data = await fetchUserFileByPath(fileUrl);
        setSelectedFile(data);
      } catch {
        setSelectedFile(null);
      } finally {
        setLoadingFile(false);
      }
    };
    run();
  }, [fileUrl]);

  const mediaKind = fileUrl ? extensionMediaKind(fileUrl) : "file";
  const fileType =
    mediaKind === "image" || mediaKind === "video" || mediaKind === "audio" ? mediaKind : null;

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
      } catch {
        setSelectedFile(buildMinimalFile(fileUrl));
        openPreview();
      } finally {
        setLoadingFile(false);
      }
    } else {
      openPreview();
    }
  };

  return (
    <>
      <Card withBorder={false} radius="md" w="100%" p="0" onClick={(e) => e.stopPropagation()}>
        {loadingFile ? (
          <Center p="md">
            <Loader size="sm" />
          </Center>
        ) : (
          <Group gap="xs" align="center" p="sm">
            <Box style={{ cursor: "pointer" }} onClick={handlePreviewClick}>
              {fileType === "image" ? (
                <Image
                  src={selectedFile?.thumbnail_url || fileUrl}
                  alt=""
                  w={100}
                  h={100}
                  fit="cover"
                  style={{ borderRadius: 4 }}
                />
              ) : fileType === "video" ? (
                selectedFile?.thumbnail_url ? (
                  <Image
                    src={selectedFile.thumbnail_url}
                    alt=""
                    w={100}
                    h={100}
                    fit="cover"
                    style={{ borderRadius: 4 }}
                  />
                ) : (
                  <video
                    src={fileUrl}
                    muted
                    preload="metadata"
                    style={{ maxWidth: 200, maxHeight: 100, borderRadius: 4, objectFit: "contain" }}
                  />
                )
              ) : fileType === "audio" ? (
                <GennyAudioPlayer
                  src={fileUrl}
                  compact
                  stopPropagation
                  wrapperProps={{ style: { maxWidth: 220 } }}
                />
              ) : (
                <Text size="sm" c="dimmed">
                  📄
                </Text>
              )}
            </Box>
            <Group gap="xs" ml="auto">
              {allowChange ? (
                <Button
                  size="xs"
                  variant="light"
                  onClick={(e) => {
                    e.stopPropagation();
                    openModal();
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
                  onRemove();
                }}
              >
                <RiCloseLine size={16} />
              </ActionIcon>
            </Group>
          </Group>
        )}
      </Card>

      <FilePickerModal
        opened={modalOpen}
        onClose={closeModal}
        onSelect={(path, file) => {
          onReplace(path, file);
        }}
        title={modalTitle}
        allowedTypes={allowedTypes}
        genModelId={genModelId}
      />

      {previewOpen && selectedFile && (
        <FileDetailModal
          opened={previewOpen}
          onClose={closePreview}
          file={selectedFile}
          onFileDeleted={() => {
            onRemove();
            closePreview();
          }}
        />
      )}
    </>
  );
}
