import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Center,
  Group,
  Image,
  Loader,
  Modal,
  ScrollArea,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { RiAlertLine, RiDeleteBinLine, RiPencilLine } from "@remixicon/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { authFetchJson } from "~/lib/stores/authFetch";
import useCharactersStore from "~/lib/stores/charactersStore";
import {
  getVideoGenerationError,
  videoHasFailed,
  videoIsActivelyGenerating,
  shouldPollVideo,
  type CharacterVideo,
} from "~/pages/characters/characterVideoGenerationUtils";
import {
  characterMemberFileThumbnailUrl,
  type CharacterMemberFile,
} from "~/pages/characters/characterUtils";
import { endpoint } from "~/lib/utils";
import FileDetailModal from "~/shared/FileDetailModal";
import { GenerateLookModal } from "~/pages/characters/components/GenerateLookModal";
import { GenerateAssetPlaceholderCard } from "~/pages/characters/components/GenerateAssetPlaceholderCard";

type CharacterVideosResponse = {
  videos: CharacterVideo[];
};

function videoFileToMemberFile(file: NonNullable<CharacterVideo["file"]>): CharacterMemberFile {
  return {
    id: file.id,
    file_name: file.file_name?.trim() || "Video",
    file_path: file.file_path?.trim() || "",
    file_size: file.file_size ?? 0,
    file_type: file.file_type?.trim() || "video/mp4",
    created_at: file.created_at ?? "",
    thumbnail_url: file.thumbnail_url?.trim() || undefined,
    upload_type: file.upload_type,
  };
}

type CharacterVideosPanelProps = {
  characterId?: string | null;
};

export default function CharacterVideosPanel({ characterId }: CharacterVideosPanelProps) {
  const [videos, setVideos] = useState<CharacterVideo[]>([]);
  const [_loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailFile, setDetailFile] = useState<CharacterMemberFile | null>(null);
  const [detailOpened, { open: openDetail, close: closeDetail }] = useDisclosure(false);
  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);
  const [deleteConfirmVideo, setDeleteConfirmVideo] = useState<CharacterVideo | null>(null);
  const [editVideo, setEditVideo] = useState<CharacterVideo | null>(null);
  const [editName, setEditName] = useState("");
  const [editNameError, setEditNameError] = useState<string | null>(null);
  const [savingVideoId, setSavingVideoId] = useState<string | null>(null);

  const deleteCharacterVideo = useCharactersStore((s) => s.deleteCharacterVideo);
  const updateCharacterVideoName = useCharactersStore((s) => s.updateCharacterVideoName);

  const fetchVideos = useCallback(async (id: string, opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    setError(null);
    try {
      const data = await authFetchJson<CharacterVideosResponse>(
        `${endpoint}/characters/${encodeURIComponent(id)}/videos`,
        undefined,
        { errorMessage: "Failed to load character videos" }
      );
      setVideos(data.videos ?? []);
    } catch (err) {
      setVideos([]);
      setError(err instanceof Error ? err.message : "Failed to load character videos");
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = characterId?.trim();
    if (!id) {
      setVideos([]);
      setError(null);
      return;
    }
    void fetchVideos(id);
  }, [characterId, fetchVideos]);

  const hasActiveGeneratingVideos = useMemo(() => videos.some(shouldPollVideo), [videos]);

  useEffect(() => {
    const id = characterId?.trim();
    if (!id || !hasActiveGeneratingVideos) return;
    const interval = window.setInterval(() => {
      void fetchVideos(id, { silent: true });
    }, 4000);
    return () => window.clearInterval(interval);
  }, [characterId, fetchVideos, hasActiveGeneratingVideos]);

  const openFileDetail = (file: NonNullable<CharacterVideo["file"]>) => {
    setDetailFile(videoFileToMemberFile(file));
    openDetail();
  };

  const handleConfirmDeleteVideo = async () => {
    const id = characterId?.trim();
    const video = deleteConfirmVideo;
    const videoId = video?.id?.trim();
    if (!id || !videoId) return;

    setDeletingVideoId(videoId);
    try {
      const ok = await deleteCharacterVideo(videoId, id);
      if (ok) {
        setDeleteConfirmVideo(null);
        await fetchVideos(id, { silent: true });
      }
    } finally {
      setDeletingVideoId(null);
    }
  };

  const closeEditVideo = () => {
    if (savingVideoId) return;
    setEditVideo(null);
    setEditName("");
    setEditNameError(null);
  };

  const handleSaveVideoName = async () => {
    const id = characterId?.trim();
    const videoId = editVideo?.id?.trim();
    const trimmed = editName.trim();
    if (!id || !videoId) return;
    if (!trimmed) {
      setEditNameError("Video name is required");
      return;
    }

    setSavingVideoId(videoId);
    setEditNameError(null);
    try {
      const ok = await updateCharacterVideoName(videoId, id, trimmed);
      if (ok) {
        setEditVideo(null);
        setEditName("");
        await fetchVideos(id, { silent: true });
      }
    } finally {
      setSavingVideoId(null);
    }
  };

  const handleVideoGenerated = useCallback(async () => {
    const id = characterId?.trim();
    if (id) await fetchVideos(id, { silent: true });
  }, [characterId, fetchVideos]);

  if (!characterId?.trim()) {
    return (
      <Center h="100%">
        <Text c="dimmed" size="sm">
          Select a character to view videos.
        </Text>
      </Center>
    );
  }

  if (error && videos.length === 0) {
    return (
      <Center h="100%">
        <Text c="red" size="sm">
          {error}
        </Text>
      </Center>
    );
  }

  return (
    <Box
      style={{
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <ScrollArea style={{ flex: 1, minHeight: 0 }} type="auto">
        <SimpleGrid
          cols={{ base: 1, "600px": 2, "900px": 3 }}
          spacing="md"
          type="container"
          px="sm"
        >
          <GenerateLookModal
            kind="video"
            characterId={characterId}
            onGenerated={handleVideoGenerated}
            renderTrigger={({ open, opening, label }) => (
              <GenerateAssetPlaceholderCard
                label={label}
                description="Generate a video of this character"
                onClick={open}
                loading={opening}
              />
            )}
          />
          {videos.map((video) => {
            const failed = videoHasFailed(video);
            const generating = videoIsActivelyGenerating(video);
            const generationError = getVideoGenerationError(video);
            const file = video.file;
            const thumbUrl = file
              ? characterMemberFileThumbnailUrl(videoFileToMemberFile(file))
              : "";

            return (
              <Card key={video.id} padding={0} radius="md">
                <Card.Section>
                  <Box
                    h={200}
                    w="100%"
                    pos="relative"
                    style={{ cursor: file ? "pointer" : "default" }}
                    onClick={() => {
                      if (file) openFileDetail(file);
                    }}
                  >
                    {thumbUrl ? (
                      <Image src={thumbUrl} alt="" h={200} fit="cover" />
                    ) : (
                      <Center h={200} bg="dark.6">
                        {generating ? (
                          <Loader size="md" />
                        ) : failed ? (
                          <RiAlertLine size={32} />
                        ) : null}
                      </Center>
                    )}
                    {generating ? (
                      <Badge color="blue" variant="filled" pos="absolute" top={8} left={8}>
                        Generating
                      </Badge>
                    ) : failed ? (
                      <Badge color="red" variant="filled" pos="absolute" top={8} left={8}>
                        Failed
                      </Badge>
                    ) : null}
                  </Box>
                </Card.Section>
                <Stack gap="xs" p="xs">
                  <Group justify="space-between" wrap="nowrap" align="flex-start">
                    <Text fw={600} size="sm" lineClamp={1}>
                      {video.name?.trim() || "Untitled video"}
                    </Text>
                    <Group gap={4} wrap="nowrap">
                      <Tooltip label="Edit name">
                        <ActionIcon
                          variant="subtle"
                          aria-label="Edit video name"
                          onClick={() => {
                            setEditVideo(video);
                            setEditName(video.name?.trim() || "");
                            setEditNameError(null);
                          }}
                        >
                          <RiPencilLine size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Delete">
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          aria-label="Delete video"
                          onClick={() => setDeleteConfirmVideo(video)}
                        >
                          <RiDeleteBinLine size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Group>
                  {failed && generationError ? (
                    <Text size="xs" c="red">
                      {generationError.message}
                    </Text>
                  ) : null}
                </Stack>
              </Card>
            );
          })}
        </SimpleGrid>
      </ScrollArea>

      <FileDetailModal opened={detailOpened} onClose={closeDetail} file={detailFile} />

      <Modal
        opened={Boolean(deleteConfirmVideo)}
        onClose={() => {
          if (deletingVideoId) return;
          setDeleteConfirmVideo(null);
        }}
        title="Delete video?"
        centered
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Remove &quot;{deleteConfirmVideo?.name?.trim() || "this video"}&quot;? This cannot be
            undone.
          </Text>
          <Group justify="flex-end">
            <Button
              variant="default"
              disabled={Boolean(deletingVideoId)}
              onClick={() => setDeleteConfirmVideo(null)}
            >
              Cancel
            </Button>
            <Button
              color="red"
              loading={Boolean(deletingVideoId)}
              onClick={() => void handleConfirmDeleteVideo()}
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={Boolean(editVideo)} onClose={closeEditVideo} title="Edit video name" centered>
        <Stack gap="md">
          <TextInput
            label="Video name"
            value={editName}
            error={editNameError}
            disabled={Boolean(savingVideoId)}
            onChange={(event) => {
              setEditName(event.currentTarget.value);
              if (editNameError) setEditNameError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") void handleSaveVideoName();
            }}
          />
          <Group justify="flex-end">
            <Button variant="default" disabled={Boolean(savingVideoId)} onClick={closeEditVideo}>
              Cancel
            </Button>
            <Button loading={Boolean(savingVideoId)} onClick={() => void handleSaveVideoName()}>
              Save
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
