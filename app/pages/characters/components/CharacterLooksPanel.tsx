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
import { useCallback, useEffect, useMemo, useState } from "react";
import { RiAlertLine, RiDeleteBinLine, RiPencilLine } from "@remixicon/react";
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
  CHARACTER_LOOK_VIEW_ORDER,
  type CharacterLookView,
} from "~/pages/characters/characterLookGenerationUtils";
import {
  EMPTY_CHARACTER_LOOKS,
  type CharacterLook,
  type CharacterLookItem,
  type CharacterLookItemFile,
} from "~/pages/characters/characterLookTypes";
import {
  characterMemberFileThumbnailUrl,
  type CharacterMemberFile,
} from "~/pages/characters/characterUtils";
import FileDetailModal from "~/shared/FileDetailModal";
import { useDisclosure } from "@mantine/hooks";
import { buildBaseLookPickerOptionsFromLooks } from "~/pages/characters/components/CharacterBaseLookPicker";
import {
  GenerateLookModal,
  type GenerateLookSubmitValues,
} from "~/pages/characters/components/GenerateLookModal";
import { GenerateAssetPlaceholderCard } from "~/pages/characters/components/GenerateAssetPlaceholderCard";

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
    generated_info: file.generated_info,
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

type CharacterLooksPanelProps = {
  characterId?: string | null;
};

export default function CharacterLooksPanel({ characterId }: CharacterLooksPanelProps) {
  const id = characterId?.trim() ?? "";
  const looks = useCharactersStore((s) =>
    id ? (s.characterLooksById[id] ?? EMPTY_CHARACTER_LOOKS) : EMPTY_CHARACTER_LOOKS
  );
  const error = useCharactersStore((s) => (id ? (s.characterLooksErrorById[id] ?? null) : null));
  const fetchCharacterLooks = useCharactersStore((s) => s.fetchCharacterLooks);
  const clearCharacterLooks = useCharactersStore((s) => s.clearCharacterLooks);
  const switchCharacterBaseLook = useCharactersStore((s) => s.switchCharacterBaseLook);
  const deleteCharacterLook = useCharactersStore((s) => s.deleteCharacterLook);
  const updateCharacterLookName = useCharactersStore((s) => s.updateCharacterLookName);
  const retryCharacterLookGeneration = useCharactersStore((s) => s.retryCharacterLookGeneration);
  const loadLookModelOptions = useCharactersStore((s) => s.loadLookModelOptions);
  const fetchCharacterById = useCharactersStore((s) => s.fetchCharacterById);
  const getVoiceById = useVoicesStore((s) => s.getVoiceById);
  const getVoiceSpeeches = useVoicesStore((s) => s.getVoiceSpeeches);

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

  const baseLookOptions = useMemo(() => buildBaseLookPickerOptionsFromLooks(looks), [looks]);

  useEffect(() => {
    if (!id) {
      return;
    }
    void fetchCharacterLooks(id);
    return () => clearCharacterLooks(id);
  }, [id, fetchCharacterLooks, clearCharacterLooks]);

  const hasActiveGeneratingLooks = useMemo(() => looks.some(shouldPollLook), [looks]);

  useEffect(() => {
    if (!id || !hasActiveGeneratingLooks) return;
    const interval = window.setInterval(() => {
      void fetchCharacterLooks(id, { silent: true });
    }, 4000);
    return () => window.clearInterval(interval);
  }, [id, fetchCharacterLooks, hasActiveGeneratingLooks]);

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
      await fetchCharacterLooks(id, { silent: true });
    } finally {
      setSavingLookId(null);
    }
  };

  const handleConfirmDeleteLook = async () => {
    const look = deleteConfirmLook;
    const lookId = look?.id?.trim();
    if (!id || !lookId || look?.base_look) return;

    setDeletingLookId(lookId);
    try {
      const ok = await deleteCharacterLook(lookId, id);
      if (ok) {
        setDeleteConfirmLook(null);
        await fetchCharacterLooks(id, { silent: true });
      }
    } finally {
      setDeletingLookId(null);
    }
  };

  const handleRetryLook = async (look: CharacterLook) => {
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

        const character = await fetchCharacterById(id, { silent: true });
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
        await fetchCharacterLooks(id, { silent: true });
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
        await fetchCharacterLooks(id, { silent: true });
      }
    } finally {
      setRetryModalSubmitting(false);
    }
  };

  const handleLookGenerated = useCallback(async () => {
    if (id) await fetchCharacterLooks(id, { silent: true });
  }, [id, fetchCharacterLooks]);

  if (!id) {
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
          cols={{ base: 2, "600px": 2, "900px": 5 }}
          spacing="md"
          type="container"
          px="sm"
        >
          <GenerateLookModal
            characterId={id}
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
                    //height={200}
                    withControls
                    withIndicators
                    slideSize="100%"
                    emblaOptions={{ loop: true }}
                    styles={{
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
                            // h={200}
                            w="100%"
                            pos="relative"
                            style={{
                              cursor: file ? "pointer" : "default",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                            onClick={() => {
                              if (file) openFileDetail(file);
                            }}
                          >
                            {thumbUrl ? (
                              <Image
                                src={thumbUrl}
                                alt={VIEW_LABELS[view]}
                                fit="cover"
                                style={{ objectPosition: "bottom" }}
                                w="100%"
                                h="100%"
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
