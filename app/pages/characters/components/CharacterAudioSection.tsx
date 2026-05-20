import {
  Box,
  Button,
  Center,
  Card,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { RiDeleteBinLine, RiMicLine } from "@remixicon/react";
import { useState } from "react";
import {
  characterAudioFileLabel,
  characterAudioFileUrl,
  characterAudioFilesToDetailModalFiles,
  type CharacterAudioFile,
  type CharacterDeletableFile,
} from "~/pages/characters/characterFileUtils";
import FileDetailModal, { type FileDetailModalFile } from "~/shared/FileDetailModal";

type CharacterAudioSectionProps = {
  audioFiles: CharacterAudioFile[];
  loading?: boolean;
  /** Voice preview is still being designed and uploaded. */
  pendingVoice?: boolean;
  /** When false, hides the section title (e.g. inside tabs). */
  showTitle?: boolean;
  onNewSpeech: () => void;
  speechCreating?: boolean;
  onDeleteFile: (file: CharacterDeletableFile) => void;
  deletingFileId: string | null;
  onFileDeleted?: (fileId: string) => void;
};

export function CharacterAudioSection({
  audioFiles,
  loading = false,
  pendingVoice = false,
  showTitle = true,
  onNewSpeech,
  speechCreating = false,
  onDeleteFile,
  deletingFileId,
  onFileDeleted,
}: CharacterAudioSectionProps) {
  const [fileDetailOpened, { open: openFileDetailModal, close: closeFileDetailModal }] =
    useDisclosure(false);
  const [detailFiles, setDetailFiles] = useState<FileDetailModalFile | null>(null);

  const openFileDetails = (focusId?: string) => {
    const modalFiles = characterAudioFilesToDetailModalFiles(audioFiles);
    if (modalFiles.length === 0) return;

    if (focusId) {
      const idx = modalFiles.findIndex((f) => f.id === focusId);
      if (idx > 0) {
        setDetailFiles([
          modalFiles[idx],
          ...modalFiles.slice(0, idx),
          ...modalFiles.slice(idx + 1),
        ]);
        openFileDetailModal();
        return;
      }
    }

    setDetailFiles(modalFiles);
    openFileDetailModal();
  };

  const requestDeleteFile = (file: CharacterAudioFile) => {
    onDeleteFile({ id: file.id, file_name: file.file_name });
  };

  return (
    <>
      <Stack gap="sm">
        <Group justify="space-between" align="center" wrap="wrap">
          {showTitle ? (
            <Group gap="xs" align="center">
              <Title order={4}>Audio</Title>
              {audioFiles.length > 0 ? (
                <Text size="sm" c="dimmed">
                  ({audioFiles.length})
                </Text>
              ) : null}
            </Group>
          ) : (
            <Box />
          )}
          <Button
            size="compact-sm"
            variant="light"
            leftSection={<RiMicLine size={16} />}
            onClick={onNewSpeech}
            loading={speechCreating}
            disabled={loading || pendingVoice}
          >
            New dialogue
          </Button>
        </Group>

        {pendingVoice ? (
          <Card withBorder padding="lg" radius="md">
            <Center>
              <Stack gap="sm" align="center">
                <Loader size="md" />
                <Text size="sm" c="dimmed" ta="center">
                  Creating voice preview…
                </Text>
              </Stack>
            </Center>
          </Card>
        ) : loading ? (
          <Group gap="xs">
            <Loader size="xs" />
            <Text size="sm" c="dimmed">
              Loading audio…
            </Text>
          </Group>
        ) : audioFiles.length === 0 ? (
          <Text size="sm" c="dimmed">
            No audio yet. Use &quot;New dialogue&quot; to generate a clip, or create the character
            from a library voice for a default preview.
          </Text>
        ) : (
          <SimpleGrid cols={{ base: 2, xs: 3, sm: 4 }} spacing="sm">
            {audioFiles.map((file) => {
              const url = characterAudioFileUrl(file);
              const label = characterAudioFileLabel(file);
              return (
                <Stack key={file.id} gap={6}>
                  <Card padding={0}>
                    <Box
                      role="button"
                      tabIndex={0}
                      onClick={() => openFileDetails(file.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openFileDetails(file.id);
                        }
                      }}
                      style={{
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        gap: "var(--mantine-spacing-xs)",
                        cursor: "pointer",
                      }}
                    >
                      <Center style={{ flex: 1, minHeight: 0 }}>
                        <ThemeIcon size="xl" variant="light" radius="md">
                          <RiMicLine size={22} />
                        </ThemeIcon>
                      </Center>
                      <Text size="xs" fw={500} lineClamp={2} ta="center" h={40}>
                        {label}
                      </Text>
                      {url ? (
                        <Box onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0 }}>
                          <audio controls src={url} style={{ width: "100%", height: 32 }} />
                        </Box>
                      ) : (
                        <Text size="xs" c="dimmed" ta="center">
                          No playback URL
                        </Text>
                      )}
                    </Box>
                    <Button
                      size="compact-xs"
                      variant="subtle"
                      color="red"
                      fullWidth
                      leftSection={<RiDeleteBinLine size={14} />}
                      loading={deletingFileId === file.id}
                      onClick={() => requestDeleteFile(file)}
                    >
                      Delete
                    </Button>
                  </Card>
                </Stack>
              );
            })}
          </SimpleGrid>
        )}

        {speechCreating ? (
          <Center py="xs">
            <Group gap="xs">
              <Loader size="sm" />
              <Text size="sm" c="dimmed">
                Generating dialogue…
              </Text>
            </Group>
          </Center>
        ) : null}
      </Stack>

      <FileDetailModal
        opened={fileDetailOpened}
        onClose={closeFileDetailModal}
        file={detailFiles}
        onFileDeleted={(fileId) => {
          closeFileDetailModal();
          setDetailFiles(null);
          onFileDeleted?.(fileId);
        }}
      />
    </>
  );
}
