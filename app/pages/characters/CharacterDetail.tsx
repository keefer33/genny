import { ActionIcon, Button, Group, Loader, Modal, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { RiDeleteBinLine, RiImageAddLine, RiPencilLine } from "@remixicon/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router";
import { authFetchJson } from "~/lib/stores/authFetch";
import useCharactersStore, { type UserCharacter } from "~/lib/stores/charactersStore";
import useVoicesStore, { type UserVoice, type UserVoiceSpeech } from "~/lib/stores/voicesStore";
import { endpoint } from "~/lib/utils";
import type { CharacterLayoutOutletContext } from "~/pages/characters/CharacterLayout";
import { EditCharacterModal } from "~/pages/characters/components/EditCharacterModal";
import { GenerateLookModal } from "~/pages/characters/components/GenerateLookModal";
import {
  buildBaseLookPickerOptionsFromLooks,
  type BaseLookPickerOption,
} from "~/pages/characters/components/CharacterBaseLookPicker";
import type { CharacterLook } from "~/pages/characters/components/CharacterLooksPanel";
import { VoiceCard } from "~/pages/voices/components/VoiceCard";
import { VoiceSpeechesHistory } from "~/pages/voices/components/VoiceSpeechesHistory";
import { inworldProviderVoiceId } from "~/pages/voices/voiceUtils";

export function meta() {
  return [{ title: "Character" }];
}

type CharacterLooksResponse = {
  looks: CharacterLook[];
};

export default function CharacterDetail() {
  const { characterId } = useParams<{ characterId: string }>();
  const navigate = useNavigate();
  const { refreshLooks } = useOutletContext<CharacterLayoutOutletContext>();

  const [character, setCharacter] = useState<UserCharacter | null>(null);
  const [characterLooks, setCharacterLooks] = useState<CharacterLook[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const [generateLookOpened, { open: openGenerateLook, close: closeGenerateLook }] =
    useDisclosure(false);
  const [characterVoice, setCharacterVoice] = useState<UserVoice | null>(null);
  const [characterVoiceLoading, setCharacterVoiceLoading] = useState(false);
  const [characterInworldVoiceId, setCharacterInworldVoiceId] = useState<string | null>(null);
  const [speeches, setSpeeches] = useState<UserVoiceSpeech[]>([]);

  const getVoiceById = useVoicesStore((s) => s.getVoiceById);
  const getVoiceSpeeches = useVoicesStore((s) => s.getVoiceSpeeches);
  const deleteVoiceSpeech = useVoicesStore((s) => s.deleteVoiceSpeech);
  const speechesLoading = useVoicesStore((s) => s.speechesLoading);
  const speechDeleteLoading = useVoicesStore((s) => s.speechDeleteLoading);

  const {
    fetchCharacterById,
    updateCharacter,
    deleteCharacter,
    generateCharacterLook,
    updateLoading,
    deleteLoading,
    generateLookLoading,
  } = useCharactersStore();

  const fetchLooks = useCallback(async (id: string) => {
    try {
      const data = await authFetchJson<CharacterLooksResponse>(
        `${endpoint}/characters/${encodeURIComponent(id)}/looks`,
        undefined,
        { errorMessage: "Failed to load character looks" }
      );
      setCharacterLooks(data.looks ?? []);
    } catch {
      setCharacterLooks([]);
    }
  }, []);

  const refresh = useCallback(async () => {
    const id = characterId?.trim();
    if (!id) {
      setCharacter(null);
      setCharacterLooks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const row = await fetchCharacterById(id);
    setCharacter(row);
    await fetchLooks(id);
    setLoading(false);
    if (!row) navigate("/characters", { replace: true });
  }, [characterId, fetchCharacterById, fetchLooks, navigate]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const characterVoiceId = character?.voice_id?.trim() || null;

  useEffect(() => {
    if (!characterVoiceId) {
      setCharacterVoice(null);
      setCharacterInworldVoiceId(null);
      setCharacterVoiceLoading(false);
      return;
    }
    let cancelled = false;
    setCharacterVoiceLoading(true);
    void (async () => {
      const voice = await getVoiceById(characterVoiceId);
      if (cancelled) return;
      setCharacterVoice(voice);
      setCharacterInworldVoiceId(voice ? inworldProviderVoiceId(voice) : null);
      setCharacterVoiceLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [characterVoiceId, getVoiceById]);

  const refreshSpeeches = useCallback(async () => {
    if (!characterVoiceId) {
      setSpeeches([]);
      return;
    }
    const rows = await getVoiceSpeeches(characterVoiceId);
    setSpeeches(rows);
  }, [characterVoiceId, getVoiceSpeeches]);

  useEffect(() => {
    void refreshSpeeches();
  }, [refreshSpeeches]);

  const handleDeleteSpeech = useCallback(
    async (speechId: string) => {
      const ok = await deleteVoiceSpeech(speechId);
      if (ok) {
        setSpeeches((prev) => prev.filter((s) => s.id !== speechId));
      }
      return ok;
    },
    [deleteVoiceSpeech]
  );

  const handleSpeechUpdated = useCallback((updated: UserVoiceSpeech) => {
    const id = updated.id?.trim();
    if (!id) return;
    setSpeeches((prev) =>
      prev.map((speech) =>
        speech.id === id ? { ...speech, ...updated, file: updated.file ?? speech.file } : speech
      )
    );
  }, []);

  const baseLookOptions: BaseLookPickerOption[] = useMemo(
    () => buildBaseLookPickerOptionsFromLooks(characterLooks),
    [characterLooks]
  );

  return (
    <Stack
      gap="xl"
      style={{
        flex: 1,
        minHeight: 0,
        overflow: "auto",
        overflowX: "hidden",
      }}
    >
      {loading && !character ? (
        <Group justify="center" py="xl">
          <Loader />
        </Group>
      ) : character ? (
        <>
          <Stack gap="xl">
            <Stack gap="xs">
              <Text size="sm" lineClamp={2} title={character.description?.trim() || undefined}>
                {character.description?.trim() || "No description"}
              </Text>
              <Group gap="xs" justify="space-between" pt="xs" wrap="wrap">
                <Group gap="xs">
                  <ActionIcon variant="transparent" aria-label="Edit character" onClick={openEdit}>
                    <RiPencilLine size={18} />
                  </ActionIcon>
                  <ActionIcon
                    variant="transparent"
                    color="red"
                    aria-label="Delete character"
                    onClick={openDelete}
                  >
                    <RiDeleteBinLine size={18} />
                  </ActionIcon>
                </Group>
                <Button
                  size="xs"
                  leftSection={<RiImageAddLine size={16} />}
                  onClick={() => {
                    void refreshSpeeches();
                    openGenerateLook();
                  }}
                >
                  Generate look
                </Button>
              </Group>
            </Stack>
            {characterVoiceId ? (
              characterVoiceLoading ? (
                <Group justify="center" py="sm">
                  <Loader size="sm" />
                </Group>
              ) : characterVoice ? (
                <VoiceCard
                  voice={characterVoice}
                  badge="Character voice"
                  onOpen={(v) => navigate(`/voices/${encodeURIComponent(v.id)}`)}
                />
              ) : (
                <Text size="sm" c="dimmed">
                  Assigned voice could not be loaded.
                </Text>
              )
            ) : null}
            {characterVoiceId ? (
              <VoiceSpeechesHistory
                embedded
                speeches={speeches}
                voice={characterVoice}
                loading={speechesLoading}
                voiceSelected={Boolean(characterVoice)}
                speechDeleteLoading={speechDeleteLoading}
                onDeleteSpeech={handleDeleteSpeech}
                onSpeechUpdated={handleSpeechUpdated}
                description="Past speech generations for this character's voice."
                emptyMessage="No speeches yet. Use Generate speech to create one."
                generateSpeech={{
                  voiceId: characterVoiceId,
                  inworldVoiceId: characterInworldVoiceId,
                  onGenerated: (speech) => setSpeeches((prev) => [speech, ...prev]),
                }}
              />
            ) : null}
          </Stack>

          <GenerateLookModal
            opened={generateLookOpened}
            onClose={closeGenerateLook}
            submitting={generateLookLoading}
            baseLookOptions={baseLookOptions}
            voiceSpeeches={speeches}
            characterVoice={characterVoice}
            onSubmit={async (values) => {
              if (!character.id) return;
              const ok = await generateCharacterLook(character.id, values);
              if (ok) {
                closeGenerateLook();
                await refresh();
                await refreshLooks();
              }
            }}
          />

          <EditCharacterModal
            opened={editOpened}
            character={character}
            submitting={updateLoading}
            onClose={closeEdit}
            onSubmit={async (values) => {
              if (!character.id) return;
              const ok = await updateCharacter(character.id, values);
              if (ok) {
                closeEdit();
                await refresh();
              }
            }}
          />

          <Modal
            opened={deleteOpened}
            onClose={() => {
              if (deleteLoading) return;
              closeDelete();
            }}
            title="Delete character?"
            centered
          >
            <Stack gap="md">
              <Text size="sm" c="dimmed">
                Remove &quot;{character.name}&quot;? This cannot be undone.
              </Text>
              <Group justify="flex-end" gap="xs">
                <Button variant="default" onClick={closeDelete} disabled={deleteLoading}>
                  Cancel
                </Button>
                <Button
                  color="red"
                  loading={deleteLoading}
                  onClick={async () => {
                    if (!character.id) return;
                    const ok = await deleteCharacter(character.id);
                    if (ok) navigate("/characters", { replace: true });
                  }}
                >
                  Delete
                </Button>
              </Group>
            </Stack>
          </Modal>
        </>
      ) : null}
    </Stack>
  );
}
