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
import { Carousel } from "@mantine/carousel";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RiDeleteBinLine, RiPencilLine } from "@remixicon/react";
import { authFetchJson } from "~/lib/stores/authFetch";
import useCharactersStore from "~/lib/stores/charactersStore";
import {
  characterMemberFileThumbnailUrl,
  type CharacterMemberFile,
} from "~/pages/characters/characterUtils";
import { endpoint } from "~/lib/utils";
import FileDetailModal from "~/shared/FileDetailModal";
import { useDisclosure } from "@mantine/hooks";

export const CHARACTER_LOOK_VIEW_ORDER = ["front", "back", "right", "left"] as const;
export type CharacterLookView = (typeof CHARACTER_LOOK_VIEW_ORDER)[number];

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

function lookIsIncomplete(look: CharacterLook): boolean {
  const views = new Set(
    look.items
      .map((item) => (item.view ?? "").trim().toLowerCase())
      .filter((view) => CHARACTER_LOOK_VIEW_ORDER.includes(view as CharacterLookView))
  );
  return views.size < CHARACTER_LOOK_VIEW_ORDER.length;
}

type CharacterLooksPanelProps = {
  characterId?: string | null;
  refreshSignal?: number;
};

export default function CharacterLooksPanel({
  characterId,
  refreshSignal = 0,
}: CharacterLooksPanelProps) {
  const [looks, setLooks] = useState<CharacterLook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailFile, setDetailFile] = useState<CharacterMemberFile | null>(null);
  const [detailOpened, { open: openDetail, close: closeDetail }] = useDisclosure(false);
  const [switchingLookId, setSwitchingLookId] = useState<string | null>(null);
  const [deletingLookId, setDeletingLookId] = useState<string | null>(null);
  const [deleteConfirmLook, setDeleteConfirmLook] = useState<CharacterLook | null>(null);
  const [editLook, setEditLook] = useState<CharacterLook | null>(null);
  const [editName, setEditName] = useState("");
  const [editNameError, setEditNameError] = useState<string | null>(null);
  const [savingLookId, setSavingLookId] = useState<string | null>(null);
  const switchCharacterBaseLook = useCharactersStore((s) => s.switchCharacterBaseLook);
  const deleteCharacterLook = useCharactersStore((s) => s.deleteCharacterLook);
  const updateCharacterLookName = useCharactersStore((s) => s.updateCharacterLookName);

  const fetchLooks = useCallback(async (id: string, opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    setError(null);
    try {
      const data = await authFetchJson<CharacterLooksResponse>(
        `${endpoint}/characters/${encodeURIComponent(id)}/looks`,
        undefined,
        { errorMessage: "Failed to load character looks" }
      );
      setLooks(data.looks ?? []);
    } catch (err) {
      setLooks([]);
      setError(err instanceof Error ? err.message : "Failed to load character looks");
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = characterId?.trim();
    if (!id) {
      setLooks([]);
      setError(null);
      return;
    }
    void fetchLooks(id);
  }, [characterId, refreshSignal, fetchLooks]);

  const hasIncompleteLooks = useMemo(() => looks.some(lookIsIncomplete), [looks]);

  useEffect(() => {
    const id = characterId?.trim();
    if (!id || !hasIncompleteLooks) return;
    const interval = window.setInterval(() => {
      void fetchLooks(id, { silent: true });
    }, 4000);
    return () => window.clearInterval(interval);
  }, [characterId, fetchLooks, hasIncompleteLooks]);

  const openFileDetail = (file: CharacterLookItemFile) => {
    setDetailFile(lookItemFileToMemberFile(file));
    openDetail();
  };

  const handleMakeBaseLook = async (look: CharacterLook) => {
    const id = characterId?.trim();
    const lookId = look.id?.trim();
    if (!id || !lookId || look.base_look) return;

    setSwitchingLookId(lookId);
    try {
      const ok = await switchCharacterBaseLook(lookId, id);
      if (ok) await fetchLooks(id, { silent: true });
    } finally {
      setSwitchingLookId(null);
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

  const openEditLook = (look: CharacterLook) => {
    setEditLook(look);
    setEditName(look.name?.trim() || "");
    setEditNameError(null);
  };

  const closeEditLook = () => {
    if (savingLookId) return;
    setEditLook(null);
    setEditName("");
    setEditNameError(null);
  };

  const handleSaveLookName = async () => {
    const id = characterId?.trim();
    const lookId = editLook?.id?.trim();
    const trimmed = editName.trim();
    if (!id || !lookId) return;
    if (!trimmed) {
      setEditNameError("Look name is required");
      return;
    }

    setSavingLookId(lookId);
    setEditNameError(null);
    try {
      const ok = await updateCharacterLookName(lookId, id, trimmed);
      if (ok) {
        setEditLook(null);
        setEditName("");
        setEditNameError(null);
        await fetchLooks(id, { silent: true });
      }
    } finally {
      setSavingLookId(null);
    }
  };

  if (!characterId?.trim()) {
    return (
      <Center h="100%">
        <Text c="dimmed" size="sm">
          Select a character to view looks.
        </Text>
      </Center>
    );
  }

  if (loading && looks.length === 0) {
    return (
      <Center h="100%">
        <Loader size="sm" />
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

  if (looks.length === 0) {
    return (
      <Center h="100%">
        <Text c="dimmed" size="sm">
          No looks yet. Create a character or generate a look to get started.
        </Text>
      </Center>
    );
  }

  return (
    <>
      <ScrollArea h="100%" type="auto" offsetScrollbars="y" p="md">
        <SimpleGrid
          cols={{ base: 1, "600px": 2, "900px": 3 }}
          spacing="xl"
          type="container"
          px="sm"
        >
          {looks.map((look) => {
            const views = itemByView(look.items);
            return (
              <Card key={look.id} withBorder padding={0} radius="md">
                <Card.Section>
                  <Carousel
                    height={360}
                    withControls
                    withIndicators
                    slideSize="100%"
                    emblaOptions={{ loop: true }}
                    styles={{
                      root: { height: 360 },
                      viewport: { height: 360 },
                      container: { height: 360 },
                      slide: { height: 360 },
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
                            h={360}
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
                            ) : (
                              <Center h="100%" bg="var(--mantine-color-default-hover)">
                                <Loader size="sm" />
                              </Center>
                            )}
                            <Box
                              pos="absolute"
                              bottom={8}
                              left={8}
                              px="xs"
                              py={4}
                              style={{
                                borderRadius: 4,
                                background: "rgba(0, 0, 0, 0.55)",
                              }}
                            >
                              <Text size="xs" c="white" fw={600} tt="uppercase">
                                {VIEW_LABELS[view]}
                              </Text>
                            </Box>
                          </Box>
                        </Carousel.Slide>
                      );
                    })}
                  </Carousel>
                </Card.Section>
                <Box p="md">
                  <Stack>
                    <Group gap="xs" style={{ minWidth: 0, flex: 1 }}>
                      <Text fw={600} size="sm" lineClamp={1}>
                        {look.name?.trim() || "Look"}
                      </Text>
                    </Group>
                    <Group gap={4} wrap="nowrap" justify="space-between">
                      {look.base_look ? (
                        <Badge size="md" variant="outline">
                          Base look
                        </Badge>
                      ) : (
                        <Button
                          size="compact-xs"
                          loading={switchingLookId === look.id}
                          disabled={
                            Boolean(switchingLookId) ||
                            Boolean(deletingLookId) ||
                            Boolean(savingLookId) ||
                            lookIsIncomplete(look)
                          }
                          onClick={() => void handleMakeBaseLook(look)}
                        >
                          Make base look
                        </Button>
                      )}
                      <Group gap={4} wrap="nowrap">
                        <Tooltip label="Edit look name">
                          <ActionIcon
                            variant="subtle"
                            aria-label="Edit look name"
                            loading={savingLookId === look.id}
                            disabled={
                              Boolean(switchingLookId) ||
                              Boolean(deletingLookId) ||
                              Boolean(savingLookId)
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
                                Boolean(switchingLookId) ||
                                Boolean(deletingLookId) ||
                                Boolean(savingLookId)
                              }
                              onClick={() => setDeleteConfirmLook(look)}
                            >
                              <RiDeleteBinLine size={18} />
                            </ActionIcon>
                          </Tooltip>
                        ) : null}
                      </Group>
                    </Group>
                  </Stack>
                </Box>
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

      <Modal opened={Boolean(editLook)} onClose={closeEditLook} title="Edit look name" centered>
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
              if (event.key === "Enter") void handleSaveLookName();
            }}
          />
          <Group justify="flex-end">
            <Button variant="default" disabled={Boolean(savingLookId)} onClick={closeEditLook}>
              Cancel
            </Button>
            <Button loading={Boolean(savingLookId)} onClick={() => void handleSaveLookName()}>
              Save
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
