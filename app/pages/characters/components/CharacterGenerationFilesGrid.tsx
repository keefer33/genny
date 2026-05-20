import {
  Badge,
  Box,
  Button,
  Card,
  Center,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { RiDeleteBinLine, RiErrorWarningLine } from "@remixicon/react";
import { useMemo, useState } from "react";
import {
  listAllGenerationFiles,
  listGenerations,
  partitionGenerationFilesByMedia,
  partitionGenerationsByMediaKind,
  type CharacterDeletableFile,
  type CharacterGeneration,
  type CharacterGenerationFile,
} from "~/pages/characters/characterFileUtils";
import { HistoryPreviewWithBadge } from "~/pages/generations/components/HistoryPreviewWithBadge";
import FileDetailModal, { type FileDetailModalFile } from "~/shared/FileDetailModal";

function generationStatusOf(status: string | undefined): string {
  return (status ?? "").toLowerCase();
}

export type CharacterGenerationFilesGridProps = {
  metadata: unknown;
  /** When set, only the images or videos subsection is rendered. */
  section?: "images" | "videos";
  onDeleteFile: (file: CharacterDeletableFile) => void;
  deletingFileId: string | null;
  onFileDeleted?: (fileId: string) => void;
};

export function CharacterGenerationFilesGrid({
  metadata,
  section,
  onDeleteFile,
  deletingFileId,
  onFileDeleted,
}: CharacterGenerationFilesGridProps) {
  const [fileDetailOpened, { open: openFileDetailModal, close: closeFileDetailModal }] =
    useDisclosure(false);
  const [detailFiles, setDetailFiles] = useState<FileDetailModalFile | null>(null);

  const generations = useMemo(() => listGenerations(metadata), [metadata]);
  const allFiles = useMemo(() => listAllGenerationFiles(metadata), [metadata]);
  const { images: imageFiles, videos: videoFiles } = useMemo(
    () => partitionGenerationFilesByMedia(allFiles),
    [allFiles]
  );

  const emptyOutputRuns = useMemo(
    () =>
      generations.filter((gen) => {
        const status = generationStatusOf(gen.status);
        const inFlight = status === "pending" || status === "processing";
        const errored = status === "error";
        return (inFlight || errored) && (!gen.files || gen.files.length === 0);
      }),
    [generations]
  );

  const inFlightRuns = useMemo(
    () =>
      emptyOutputRuns.filter((gen) => {
        const status = generationStatusOf(gen.status);
        return status === "pending" || status === "processing";
      }),
    [emptyOutputRuns]
  );

  const errorRuns = useMemo(() => {
    return emptyOutputRuns.filter((gen) => generationStatusOf(gen.status) === "error");
  }, [emptyOutputRuns]);

  const { imageRuns: inFlightImageRuns, videoRuns: inFlightVideoRuns } = useMemo(
    () => partitionGenerationsByMediaKind(inFlightRuns),
    [inFlightRuns]
  );

  const { imageRuns: errorImageRuns, videoRuns: errorVideoRuns } = useMemo(
    () => partitionGenerationsByMediaKind(errorRuns),
    [errorRuns]
  );

  const openFileDetails = (fileList: CharacterGenerationFile[], focusId?: string) => {
    const modalFiles: FileDetailModalFile = fileList
      .filter((f): f is CharacterGenerationFile & { id: string } => Boolean(f.id?.trim()))
      .map((f) => ({
        id: f.id!,
        file_name: f.file_name ?? undefined,
        file_path: f.file_path ?? undefined,
        file_size: f.file_size ?? undefined,
        file_type: f.file_type ?? undefined,
        created_at: f.created_at ?? undefined,
        thumbnail_url: f.thumbnail_url ?? undefined,
        generated_info: f.generated_info ?? undefined,
      }));

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

  const viewableFiles = useMemo(() => [...imageFiles, ...videoFiles], [imageFiles, videoFiles]);

  const requestDeleteFile = (file: CharacterGenerationFile) => {
    const id = file.id?.trim();
    if (!id) return;
    onDeleteFile({ id, file_name: file.file_name });
  };

  const showImagesSection =
    imageFiles.length > 0 || inFlightImageRuns.length > 0 || errorImageRuns.length > 0;
  const showVideosSection =
    videoFiles.length > 0 || inFlightVideoRuns.length > 0 || errorVideoRuns.length > 0;

  const hasContent =
    section === "images"
      ? showImagesSection
      : section === "videos"
        ? showVideosSection
        : viewableFiles.length > 0 || inFlightRuns.length > 0 || errorRuns.length > 0;

  const renderStatusTiles = (
    pendingRuns: CharacterGeneration[],
    failedRuns: CharacterGeneration[]
  ) => (
    <>
      {pendingRuns.map((gen) => (
        <Box
          key={gen.id ?? `pending-${gen.status}`}
          style={{
            aspectRatio: "1 / 1",
            borderRadius: "var(--mantine-radius-md)",
            border: "1px solid var(--mantine-color-gray-3)",
            overflow: "hidden",
          }}
        >
          <Center h="100%">
            <Loader size="md" />
          </Center>
        </Box>
      ))}
      {failedRuns.map((gen) => (
        <Box
          key={gen.id ?? `error-${gen.status}`}
          style={{
            aspectRatio: "1 / 1",
            borderRadius: "var(--mantine-radius-md)",
            border: "1px solid var(--mantine-color-red-3)",
            overflow: "hidden",
          }}
        >
          <Center h="100%">
            <ThemeIcon size="xl" color="red" variant="light" radius="xl">
              <RiErrorWarningLine size={22} />
            </ThemeIcon>
          </Center>
        </Box>
      ))}
    </>
  );

  const renderImageTile = (file: CharacterGenerationFile) => {
    const previewUrl = file.thumbnail_url ?? file.file_path ?? "";
    if (!previewUrl.trim() || !file.id?.trim()) return null;
    return (
      <Stack key={file.id} gap={6}>
        <Card padding={0}>
          <Box
            role="button"
            tabIndex={0}
            onClick={() => openFileDetails(viewableFiles, file.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openFileDetails(viewableFiles, file.id);
              }
            }}
            style={{
              overflow: "hidden",
              cursor: "pointer",
            }}
          >
            <HistoryPreviewWithBadge url={previewUrl} file_type={file.file_type ?? ""} />
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
  };

  const renderVideoTile = (file: CharacterGenerationFile) => {
    const previewUrl = file.thumbnail_url ?? file.file_path ?? "";
    if (!previewUrl.trim() || !file.id?.trim()) return null;
    return (
      <Stack key={file.id} gap={6}>
        <Card padding={0}>
          <Box
            role="button"
            tabIndex={0}
            onClick={() => openFileDetails(viewableFiles, file.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openFileDetails(viewableFiles, file.id);
              }
            }}
            style={{
              overflow: "hidden",
              cursor: "pointer",
            }}
          >
            <HistoryPreviewWithBadge url={previewUrl} file_type={file.file_type ?? ""} />
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
  };

  if (!hasContent) {
    return (
      <Center py="md">
        <Text size="sm" c="dimmed">
          {section === "images"
            ? "No images yet."
            : section === "videos"
              ? "No videos yet."
              : "No generated files yet."}
        </Text>
      </Center>
    );
  }

  const imagesPanel = (
    <Stack gap="xs">
      {section == null ? (
        <Group gap="xs" align="center">
          <Title order={5}>Images</Title>
          {imageFiles.length > 0 ? (
            <Badge size="sm" variant="light">
              {imageFiles.length}
            </Badge>
          ) : null}
        </Group>
      ) : null}
      {showImagesSection ? (
        <SimpleGrid cols={{ base: 2, xs: 3, sm: 4 }} spacing="sm">
          {renderStatusTiles(inFlightImageRuns, errorImageRuns)}
          {imageFiles.map(renderImageTile)}
        </SimpleGrid>
      ) : (
        <Text size="sm" c="dimmed">
          No images yet.
        </Text>
      )}
    </Stack>
  );

  const videosPanel = (
    <Stack gap="xs">
      {section == null ? (
        <Group gap="xs" align="center">
          <Title order={5}>Videos</Title>
          {videoFiles.length > 0 ? (
            <Badge size="sm" variant="light">
              {videoFiles.length}
            </Badge>
          ) : null}
        </Group>
      ) : null}
      {showVideosSection ? (
        <SimpleGrid cols={{ base: 2, xs: 3, sm: 4 }} spacing="sm">
          {renderStatusTiles(inFlightVideoRuns, errorVideoRuns)}
          {videoFiles.map(renderVideoTile)}
        </SimpleGrid>
      ) : (
        <Text size="sm" c="dimmed">
          No videos yet.
        </Text>
      )}
    </Stack>
  );

  return (
    <>
      <Stack gap="lg">
        {section !== "videos" ? imagesPanel : null}
        {section !== "images" ? videosPanel : null}
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
