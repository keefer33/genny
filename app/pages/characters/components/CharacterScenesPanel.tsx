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
  getSceneGenerationError,
  sceneHasFailed,
  sceneIsActivelyGenerating,
  shouldPollScene,
  type CharacterScene,
} from "~/pages/characters/characterSceneGenerationUtils";
import {
  characterMemberFileThumbnailUrl,
  type CharacterMemberFile,
} from "~/pages/characters/characterUtils";
import { endpoint } from "~/lib/utils";
import FileDetailModal from "~/shared/FileDetailModal";
import { GenerateLookModal } from "~/pages/characters/components/GenerateLookModal";
import { GenerateAssetPlaceholderCard } from "~/pages/characters/components/GenerateAssetPlaceholderCard";

type CharacterScenesResponse = {
  scenes: CharacterScene[];
};

function sceneFileToMemberFile(file: NonNullable<CharacterScene["file"]>): CharacterMemberFile {
  return {
    id: file.id,
    file_name: file.file_name?.trim() || "Scene",
    file_path: file.file_path?.trim() || "",
    file_size: file.file_size ?? 0,
    file_type: file.file_type?.trim() || "image/png",
    created_at: file.created_at ?? "",
    thumbnail_url: file.thumbnail_url?.trim() || undefined,
    upload_type: file.upload_type,
  };
}

type CharacterScenesPanelProps = {
  characterId?: string | null;
  refreshSignal?: number;
  onGenerated?: () => void | Promise<void>;
};

export default function CharacterScenesPanel({
  characterId,
  refreshSignal = 0,
  onGenerated,
}: CharacterScenesPanelProps) {
  const [scenes, setScenes] = useState<CharacterScene[]>([]);
  const [_loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailFile, setDetailFile] = useState<CharacterMemberFile | null>(null);
  const [detailOpened, { open: openDetail, close: closeDetail }] = useDisclosure(false);
  const [deletingSceneId, setDeletingSceneId] = useState<string | null>(null);
  const [deleteConfirmScene, setDeleteConfirmScene] = useState<CharacterScene | null>(null);
  const [editScene, setEditScene] = useState<CharacterScene | null>(null);
  const [editName, setEditName] = useState("");
  const [editNameError, setEditNameError] = useState<string | null>(null);
  const [savingSceneId, setSavingSceneId] = useState<string | null>(null);

  const deleteCharacterScene = useCharactersStore((s) => s.deleteCharacterScene);
  const updateCharacterSceneName = useCharactersStore((s) => s.updateCharacterSceneName);

  const fetchScenes = useCallback(async (id: string, opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    setError(null);
    try {
      const data = await authFetchJson<CharacterScenesResponse>(
        `${endpoint}/characters/${encodeURIComponent(id)}/scenes`,
        undefined,
        { errorMessage: "Failed to load character scenes" }
      );
      setScenes(data.scenes ?? []);
    } catch (err) {
      setScenes([]);
      setError(err instanceof Error ? err.message : "Failed to load character scenes");
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = characterId?.trim();
    if (!id) {
      setScenes([]);
      setError(null);
      return;
    }
    void fetchScenes(id);
  }, [characterId, refreshSignal, fetchScenes]);

  const hasActiveGeneratingScenes = useMemo(() => scenes.some(shouldPollScene), [scenes]);

  useEffect(() => {
    const id = characterId?.trim();
    if (!id || !hasActiveGeneratingScenes) return;
    const interval = window.setInterval(() => {
      void fetchScenes(id, { silent: true });
    }, 4000);
    return () => window.clearInterval(interval);
  }, [characterId, fetchScenes, hasActiveGeneratingScenes]);

  const openFileDetail = (file: NonNullable<CharacterScene["file"]>) => {
    setDetailFile(sceneFileToMemberFile(file));
    openDetail();
  };

  const handleConfirmDeleteScene = async () => {
    const id = characterId?.trim();
    const scene = deleteConfirmScene;
    const sceneId = scene?.id?.trim();
    if (!id || !sceneId) return;

    setDeletingSceneId(sceneId);
    try {
      const ok = await deleteCharacterScene(sceneId, id);
      if (ok) {
        setDeleteConfirmScene(null);
        await fetchScenes(id, { silent: true });
      }
    } finally {
      setDeletingSceneId(null);
    }
  };

  const closeEditScene = () => {
    if (savingSceneId) return;
    setEditScene(null);
    setEditName("");
    setEditNameError(null);
  };

  const handleSaveSceneName = async () => {
    const id = characterId?.trim();
    const sceneId = editScene?.id?.trim();
    const trimmed = editName.trim();
    if (!id || !sceneId) return;
    if (!trimmed) {
      setEditNameError("Scene name is required");
      return;
    }

    setSavingSceneId(sceneId);
    setEditNameError(null);
    try {
      const ok = await updateCharacterSceneName(sceneId, id, trimmed);
      if (ok) {
        setEditScene(null);
        setEditName("");
        await fetchScenes(id, { silent: true });
      }
    } finally {
      setSavingSceneId(null);
    }
  };

  const handleSceneGenerated = useCallback(async () => {
    const id = characterId?.trim();
    if (id) await fetchScenes(id, { silent: true });
    await onGenerated?.();
  }, [characterId, fetchScenes, onGenerated]);

  if (!characterId?.trim()) {
    return (
      <Center h="100%">
        <Text c="dimmed" size="sm">
          Select a character to view scenes.
        </Text>
      </Center>
    );
  }

  if (error && scenes.length === 0) {
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
            kind="scene"
            characterId={characterId}
            onGenerated={handleSceneGenerated}
            renderTrigger={({ open, opening, label }) => (
              <GenerateAssetPlaceholderCard
                label={label}
                description="Place this character in a setting"
                onClick={open}
                loading={opening}
              />
            )}
          />
          {scenes.map((scene) => {
            const failed = sceneHasFailed(scene);
            const generating = sceneIsActivelyGenerating(scene);
            const generationError = getSceneGenerationError(scene);
            const file = scene.file;
            const thumbUrl = file
              ? characterMemberFileThumbnailUrl(sceneFileToMemberFile(file))
              : "";

            return (
              <Card key={scene.id} padding={0} radius="md">
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
                      {scene.name?.trim() || "Untitled scene"}
                    </Text>
                    <Group gap={4} wrap="nowrap">
                      <Tooltip label="Edit name">
                        <ActionIcon
                          variant="subtle"
                          aria-label="Edit scene name"
                          onClick={() => {
                            setEditScene(scene);
                            setEditName(scene.name?.trim() || "");
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
                          aria-label="Delete scene"
                          onClick={() => setDeleteConfirmScene(scene)}
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
        opened={Boolean(deleteConfirmScene)}
        onClose={() => {
          if (deletingSceneId) return;
          setDeleteConfirmScene(null);
        }}
        title="Delete scene?"
        centered
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Remove &quot;{deleteConfirmScene?.name?.trim() || "this scene"}&quot;? This cannot be
            undone.
          </Text>
          <Group justify="flex-end">
            <Button
              variant="default"
              disabled={Boolean(deletingSceneId)}
              onClick={() => setDeleteConfirmScene(null)}
            >
              Cancel
            </Button>
            <Button
              color="red"
              loading={Boolean(deletingSceneId)}
              onClick={() => void handleConfirmDeleteScene()}
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={Boolean(editScene)} onClose={closeEditScene} title="Edit scene name" centered>
        <Stack gap="md">
          <TextInput
            label="Scene name"
            value={editName}
            error={editNameError}
            disabled={Boolean(savingSceneId)}
            onChange={(event) => {
              setEditName(event.currentTarget.value);
              if (editNameError) setEditNameError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") void handleSaveSceneName();
            }}
          />
          <Group justify="flex-end">
            <Button variant="default" disabled={Boolean(savingSceneId)} onClick={closeEditScene}>
              Cancel
            </Button>
            <Button loading={Boolean(savingSceneId)} onClick={() => void handleSaveSceneName()}>
              Save
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
