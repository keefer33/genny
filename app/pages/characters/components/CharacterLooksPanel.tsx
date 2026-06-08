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
  Switch,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { Carousel } from "@mantine/carousel";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RiAlertLine, RiDeleteBinLine, RiPencilLine } from "@remixicon/react";
import { authFetchJson } from "~/lib/stores/authFetch";
import useCharactersStore from "~/lib/stores/charactersStore";
import useVoicesStore, { type UserVoice, type UserVoiceSpeech } from "~/lib/stores/voicesStore";
import {
  extractGenerateLookRetryDraft,
  lookRetryOpensGenerateModal,
  type GenerateLookRetryDraft,
} from "~/pages/characters/characterGenerateLookRetryUtils";
import {
  getLookGenerationError,
  lookCanRetry,
  lookHasFailed,
  lookIsActivelyGenerating,
  shouldPollLook,
} from "~/pages/characters/characterLookGenerationUtils";
import {
  characterMemberFileThumbnailUrl,
  type CharacterMemberFile,
} from "~/pages/characters/characterUtils";
import { endpoint } from "~/lib/utils";
import FileDetailModal from "~/shared/FileDetailModal";
import { useDisclosure } from "@mantine/hooks";
import { buildBaseLookPickerOptionsFromLooks } from "~/pages/characters/components/CharacterBaseLookPicker";
import {
  GenerateLookModal,
  type GenerateLookSubmitValues,
} from "~/pages/characters/components/GenerateLookModal";
import { GenerateAssetPlaceholderCard } from "~/pages/characters/components/GenerateAssetPlaceholderCard";

export {
  CHARACTER_LOOK_VIEW_ORDER,
  type CharacterLookView,
} from "~/pages/characters/characterLookGenerationUtils";
import {
  CHARACTER_LOOK_VIEW_ORDER,
  type CharacterLookView,
} from "~/pages/characters/characterLookGenerationUtils";

export type CharacterLookItemFile = {
  id: string;
  file_name?: string | null;
  file_path?: string | null;
  file_type?: string | null;
  file_size?: number | null;
  created_at?: string | null;
  thumbnail_url?: string | null;
  upload_type?: string | null;
  status?: string | null;
};

export type CharacterLookItem = {
  id: string;
  created_at?: string | null;
  look_id?: string | null;
  file_id?: string | null;
  view?: CharacterLookView | string | null;
  metadata?: unknown;
  file?: CharacterLookItemFile | null;
};

export type CharacterLook = {
  id: string;
  created_at?: string | null;
  updated_at?: string | null;
  user_id?: string | null;
  character_id?: string | null;
  name?: string | null;
  base_look?: boolean | null;
  metadata?: unknown;
  items: CharacterLookItem[];
};

type CharacterLooksResponse = {
  looks: CharacterLook[];
};

const VIEW_LABELS: Record<CharacterLookView, string> = {
  front: "Front",
  back: "Back",
  right: "Right",
  left: "Left",
};

function lookItemFileToMemberFile(file: CharacterLookItemFile): CharacterMemberFile {
  return {
    id: file.id,
    file_name: file.file_name?.trim() || "Look view",
    file_path: file.file_path?.trim() || "",
    file_size: file.file_size ?? 0,
    file_type: file.file_type?.trim() || "image/png",
    created_at: file.created_at ?? "",
    thumbnail_url: file.thumbnail_url?.trim() || undefined,
    upload_type: file.upload_type,
  };
}

function itemByView(items: CharacterLookItem[]): Map<CharacterLookView, CharacterLookItem> {
  const map = new Map<CharacterLookView, CharacterLookItem>();
  for (const item of items) {
    const view = (item.view ?? "").trim().toLowerCase() as CharacterLookView;
    if (CHARACTER_LOOK_VIEW_ORDER.includes(view)) {
      map.set(view, item);
    }
  }
  return map;
}

/** Tracks front-view URLs and base-look flags for thumbnail / picker refresh. */
export function looksVisualSignature(looks: CharacterLook[]): string {
  return looks
    .map((look) => {
      const front = look.items.find((item) => (item.view ?? "").trim().toLowerCase() === "front");
      const file = front?.file;
      const url = file?.file_path?.trim() || file?.thumbnail_url?.trim() || "";
      return `${look.id}:${look.base_look ? 1 : 0}:${url}`;
    })
    .sort()
    .join("|");
}

type CharacterLooksPanelProps = {
  characterId?: string | null;
  refreshSignal?: number;
  onLooksVisualsUpdated?: () => void;
  onGenerated?: () => void | Promise<void>;
};

export default function CharacterLooksPanel({
  characterId,
  refreshSignal = 0,
  onLooksVisualsUpdated,
  onGenerated,
}: CharacterLooksPanelProps) {
  const [looks, setLooks] = useState<CharacterLook[]>([]);
  const [_loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastVisualSignatureRef = useRef("");
  const [detailFile, setDetailFile] = useState<CharacterMemberFile | null>(null);
  const [detailOpened, { open: openDetail, close: closeDetail }] = useDisclosure(false);
  const [deletingLookId, setDeletingLookId] = useState<string | null>(null);
  const [deleteConfirmLook, setDeleteConfirmLook] = useState<CharacterLook | null>(null);
  const [editLook, setEditLook] = useState<CharacterLook | null>(null);
  const [editName, setEditName] = useState("");
  const [editIsBaseLook, setEditIsBaseLook] = useState(false);
  const [editNameError, setEditNameError] = useState<string | null>(null);
  const [savingLookId, setSavingLookId] = useState<string | null>(null);
  const [retryingLookId, setRetryingLookId] = useState<string | null>(null);
  const [retryDraft, setRetryDraft] = useState<GenerateLookRetryDraft | null>(null);
  const [retryModalOpened, setRetryModalOpened] = useState(false);
  const [retryModalSubmitting, setRetryModalSubmitting] = useState(false);
  const [characterVoice, setCharacterVoice] = useState<UserVoice | null>(null);
  const [voiceSpeeches, setVoiceSpeeches] = useState<UserVoiceSpeech[]>([]);
  const switchCharacterBaseLook = useCharactersStore((s) => s.switchCharacterBaseLook);
  const deleteCharacterLook = useCharactersStore((s) => s.deleteCharacterLook);
  const updateCharacterLookName = useCharactersStore((s) => s.updateCharacterLookName);
  const retryCharacterLookGeneration = useCharactersStore((s) => s.retryCharacterLookGeneration);
  const loadLookModelOptions = useCharactersStore((s) => s.loadLookModelOptions);
  const fetchCharacterById = useCharactersStore((s) => s.fetchCharacterById);
  const getVoiceById = useVoicesStore((s) => s.getVoiceById);
  const getVoiceSpeeches = useVoicesStore((s) => s.getVoiceSpeeches);

  const baseLookOptions = useMemo(() => buildBaseLookPickerOptionsFromLooks(looks), [looks]);

  const fetchLooks = useCallback(
    async (id: string, opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoading(true);
      setError(null);
      try {
        const data = await authFetchJson<CharacterLooksResponse>(
          `${endpoint}/characters/${encodeURIComponent(id)}/looks`,
          undefined,
          { errorMessage: "Failed to load character looks" }
        );
        const nextLooks = data.looks ?? [];
        setLooks(nextLooks);

        const signature = looksVisualSignature(nextLooks);
        if (lastVisualSignatureRef.current !== "" && signature !== lastVisualSignatureRef.current) {
          onLooksVisualsUpdated?.();
        }
        lastVisualSignatureRef.current = signature;
      } catch (err) {
        setLooks([]);
        setError(err instanceof Error ? err.message : "Failed to load character looks");
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [onLooksVisualsUpdated]
  );

  useEffect(() => {
    lastVisualSignatureRef.current = "";
  }, [characterId]);

  useEffect(() => {
    const id = characterId?.trim();
    if (!id) {
      setLooks([]);
      setError(null);
      return;
    }
    void fetchLooks(id);
  }, [characterId, refreshSignal, fetchLooks]);

  const hasActiveGeneratingLooks = useMemo(() => looks.some(shouldPollLook), [looks]);

  useEffect(() => {
    const id = characterId?.trim();
    if (!id || !hasActiveGeneratingLooks) return;
    const interval = window.setInterval(() => {
      void fetchLooks(id, { silent: true });
    }, 4000);
    return () => window.clearInterval(interval);
  }, [characterId, fetchLooks, hasActiveGeneratingLooks]);

  const openFileDetail = (file: CharacterLookItemFile) => {
    setDetailFile(lookItemFileToMemberFile(file));
    openDetail();
  };

  const openEditLook = (look: CharacterLook) => {
    setEditLook(look);
    setEditName(look.name?.trim() || "");
    setEditIsBaseLook(Boolean(look.base_look));
    setEditNameError(null);
  };

  const closeEditLook = () => {
    if (savingLookId) return;
    setEditLook(null);
    setEditName("");
    setEditIsBaseLook(false);
    setEditNameError(null);
  };

  const handleSaveLook = async () => {
    const id = characterId?.trim();
    const lookId = editLook?.id?.trim();
    const trimmed = editName.trim();
    if (!id || !lookId || !editLook) return;
    if (!trimmed) {
      setEditNameError("Look name is required");
      return;
    }

    const nameChanged = trimmed !== (editLook.name?.trim() || "");
    const setAsBase = editIsBaseLook && !editLook.base_look;
    if (!nameChanged && !setAsBase) {
      closeEditLook();
      return;
    }

    setSavingLookId(lookId);
    setEditNameError(null);
    try {
      if (nameChanged) {
        const ok = await updateCharacterLookName(lookId, id, trimmed);
        if (!ok) return;
      }

      if (setAsBase) {
        const ok = await switchCharacterBaseLook(lookId, id);
        if (!ok) return;
      }

      closeEditLook();
      await fetchLooks(id, { silent: true });
    } finally {
      setSavingLookId(null);
    }
  };

  const handleConfirmDeleteLook = async () => {
    const id = characterId?.trim();
    const look = deleteConfirmLook;
    const lookId = look?.id?.trim();
    if (!id || !lookId || look?.base_look) return;

    setDeletingLookId(lookId);
    try {
      const ok = await deleteCharacterLook(lookId, id);
      if (ok) {
        setDeleteConfirmLook(null);
        await fetchLooks(id, { silent: true });
      }
    } finally {
      setDeletingLookId(null);
    }
  };

  const handleRetryLook = async (look: CharacterLook) => {
    const id = characterId?.trim();
    const lookId = look.id?.trim();
    if (!id || !lookId) return;

    if (lookRetryOpensGenerateModal(look)) {
      setRetryingLookId(lookId);
      try {
        const options = await loadLookModelOptions();
        const draft = extractGenerateLookRetryDraft(look, options);
        if (!draft) return;

        setRetryDraft(draft);
        setCharacterVoice(null);
        setVoiceSpeeches([]);

        const character = await fetchCharacterById(id);
        const voiceId = character?.voice_id?.trim();
        if (voiceId) {
          const voice = await getVoiceById(voiceId);
          setCharacterVoice(voice);
          setVoiceSpeeches(await getVoiceSpeeches(voiceId));
        }

        setRetryModalOpened(true);
      } finally {
        setRetryingLookId(null);
      }
      return;
    }

    setRetryingLookId(lookId);
    try {
      const ok = await retryCharacterLookGeneration(id, lookId);
      if (ok) {
        await fetchLooks(id, { silent: true });
      }
    } finally {
      setRetryingLookId(null);
    }
  };

  const closeRetryModal = () => {
    if (retryModalSubmitting) return;
    setRetryModalOpened(false);
    setRetryDraft(null);
    setCharacterVoice(null);
    setVoiceSpeeches([]);
  };

  const handleRetryModalSubmit = async (values: GenerateLookSubmitValues) => {
    const id = characterId?.trim();
    const lookId = values.lookId?.trim();
    if (!id || !lookId) return;

    setRetryModalSubmitting(true);
    try {
      const ok = await retryCharacterLookGeneration(id, lookId, {
        modelId: values.modelId,
        payload: values.payload,
        name: values.name,
      });
      if (ok) {
        setRetryModalOpened(false);
        setRetryDraft(null);
        setCharacterVoice(null);
        setVoiceSpeeches([]);
        await fetchLooks(id, { silent: true });
      }
    } finally {
      setRetryModalSubmitting(false);
    }
  };

  const handleLookGenerated = useCallback(async () => {
    const id = characterId?.trim();
    if (id) await fetchLooks(id, { silent: true });
    await onGenerated?.();
  }, [characterId, fetchLooks, onGenerated]);

  if (!characterId?.trim()) {
    return (
      <Center h="100%">
        <Text c="dimmed" size="sm">
          Select a character to view looks.
        </Text>
      </Center>
    );
  }

  if (error && looks.length === 0) {
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
            characterId={characterId}
            onGenerated={handleLookGenerated}
            renderTrigger={({ open, opening, label }) => (
              <GenerateAssetPlaceholderCard
                label={label}
                description="Generate front, back, and side views"
                onClick={open}
                loading={opening}
              />
            )}
          />
          {looks.map((look) => {
            const views = itemByView(look.items);
            const failed = lookHasFailed(look);
            const generating = lookIsActivelyGenerating(look);
            const generationError = getLookGenerationError(look);
            const showRetry = lookCanRetry(look);
            const opensEditModal = lookRetryOpensGenerateModal(look);
            return (
              <Card key={look.id} padding={0} radius="md" pos="relative">
                <Box pos="absolute" top={8} right={8} style={{ zIndex: 10 }}>
                  {look.base_look ? (
                    <Badge size="md" variant="default">
                      Base look
                    </Badge>
                  ) : null}
                </Box>
                <Card.Section>
                  <Carousel
                    height={200}
                    withControls
                    withIndicators
                    slideSize="100%"
                    emblaOptions={{ loop: true }}
                    styles={{
                      root: { height: 200 },
                      viewport: { height: 200 },
                      container: { height: 200 },
                      slide: { height: 200 },
                      controls: { top: "50%", transform: "translateY(-50%)" },
                      indicator: { width: 6, height: 6 },
                    }}
                  >
                    {CHARACTER_LOOK_VIEW_ORDER.map((view) => {
                      const item = views.get(view);
                      const file = item?.file;
                      const thumbUrl = file
                        ? characterMemberFileThumbnailUrl(lookItemFileToMemberFile(file))
                        : "";

                      return (
                        <Carousel.Slide key={view}>
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
                              <Image
                                src={thumbUrl}
                                alt={VIEW_LABELS[view]}
                                fit="cover"
                                h="100%"
                                w="100%"
                              />
                            ) : failed ? (
                              <Center h="100%" bg="var(--mantine-color-default-hover)">
                                <Stack align="center" gap={4}>
                                  <RiAlertLine size={20} color="var(--mantine-color-red-6)" />
                                  <Text size="xs" c="dimmed" ta="center" px="sm">
                                    Not generated
                                  </Text>
                                </Stack>
                              </Center>
                            ) : generating ? (
                              <Center h="100%" bg="var(--mantine-color-default-hover)">
                                <Loader size="sm" />
                              </Center>
                            ) : (
                              <Center h="100%" bg="var(--mantine-color-default-hover)">
                                <Loader size="sm" />
                              </Center>
                            )}
                          </Box>
                        </Carousel.Slide>
                      );
                    })}
                  </Carousel>
                </Card.Section>

                <Stack gap="xs" p="xs">
                  <Group justify="space-between" wrap="nowrap" align="flex-start">
                    <Text fw={600} size="sm" lineClamp={1}>
                      {look.name?.trim() || "Look"}
                    </Text>
                    <Group gap={4} wrap="nowrap">
                      <Tooltip label="Edit look name">
                        <ActionIcon
                          variant="subtle"
                          aria-label="Edit look name"
                          loading={savingLookId === look.id}
                          disabled={
                            Boolean(deletingLookId) ||
                            Boolean(savingLookId) ||
                            Boolean(retryingLookId)
                          }
                          onClick={() => openEditLook(look)}
                        >
                          <RiPencilLine size={18} />
                        </ActionIcon>
                      </Tooltip>
                      {!look.base_look ? (
                        <Tooltip label="Delete look">
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            aria-label="Delete look"
                            loading={deletingLookId === look.id}
                            disabled={
                              Boolean(deletingLookId) ||
                              Boolean(savingLookId) ||
                              Boolean(retryingLookId)
                            }
                            onClick={() => setDeleteConfirmLook(look)}
                          >
                            <RiDeleteBinLine size={18} />
                          </ActionIcon>
                        </Tooltip>
                      ) : null}
                    </Group>
                    {failed ? (
                      <Badge size="sm" color="red" variant="light">
                        Failed
                      </Badge>
                    ) : generating ? (
                      <Badge size="sm" color="blue" variant="light">
                        Generating
                      </Badge>
                    ) : null}
                  </Group>
                  {generationError ? (
                    <Text size="xs" c="red">
                      {generationError.message}
                    </Text>
                  ) : null}
                  {showRetry ? (
                    <Button
                      size="compact-xs"
                      variant="light"
                      color="red"
                      loading={retryingLookId === look.id}
                      disabled={
                        Boolean(retryingLookId) || Boolean(deletingLookId) || Boolean(savingLookId)
                      }
                      onClick={() => void handleRetryLook(look)}
                    >
                      {opensEditModal ? "Edit & retry" : "Retry generation"}
                    </Button>
                  ) : null}
                </Stack>
              </Card>
            );
          })}
        </SimpleGrid>
      </ScrollArea>

      <FileDetailModal opened={detailOpened} onClose={closeDetail} file={detailFile} />

      <Modal
        opened={Boolean(deleteConfirmLook)}
        onClose={() => {
          if (!deletingLookId) setDeleteConfirmLook(null);
        }}
        title="Delete look"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            Delete{" "}
            <Text span fw={600}>
              {deleteConfirmLook?.name?.trim() || "this look"}
            </Text>
            ? Its view items and files will be removed.
          </Text>
          <Group justify="flex-end">
            <Button
              variant="default"
              disabled={Boolean(deletingLookId)}
              onClick={() => setDeleteConfirmLook(null)}
            >
              Cancel
            </Button>
            <Button
              color="red"
              loading={Boolean(deletingLookId)}
              onClick={() => void handleConfirmDeleteLook()}
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={Boolean(editLook)} onClose={closeEditLook} title="Edit look" centered>
        <Stack gap="md">
          <TextInput
            label="Look name"
            value={editName}
            error={editNameError}
            disabled={Boolean(savingLookId)}
            onChange={(event) => {
              setEditName(event.currentTarget.value);
              if (editNameError) setEditNameError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") void handleSaveLook();
            }}
          />
          <Switch
            label="Base look"
            description="Use this look as the character's default thumbnail and reference."
            checked={editIsBaseLook}
            disabled={
              Boolean(savingLookId) ||
              Boolean(editLook?.base_look) ||
              (editLook ? lookHasFailed(editLook) : false)
            }
            onChange={(event) => setEditIsBaseLook(event.currentTarget.checked)}
          />
          <Group justify="flex-end">
            <Button variant="default" disabled={Boolean(savingLookId)} onClick={closeEditLook}>
              Cancel
            </Button>
            <Button loading={Boolean(savingLookId)} onClick={() => void handleSaveLook()}>
              Save
            </Button>
          </Group>
        </Stack>
      </Modal>

      <GenerateLookModal
        opened={retryModalOpened}
        onClose={closeRetryModal}
        title="Retry look generation"
        submitLabel="Retry generation"
        submitting={retryModalSubmitting}
        retryDraft={retryDraft}
        baseLookOptions={baseLookOptions}
        voiceSpeeches={voiceSpeeches}
        characterVoice={characterVoice}
        onSubmit={(values) => void handleRetryModalSubmit(values)}
      />
    </Box>
  );
}
