import { Box, Group, Loader, Stack, Text } from "@mantine/core";
import { useEffect, useMemo } from "react";
import { useParams } from "react-router";
import useCharactersStore from "~/lib/stores/charactersStore";
import useVoicesStore from "~/lib/stores/voicesStore";
import { characterFormValuesFromRow } from "~/pages/characters/characterUtils";
import { VoiceSpeechesHistory } from "~/pages/voices/components/VoiceSpeechesHistory";
import VoicePicker from "~/pages/voices/components/VoicePicker";
import { GenerateSpeechModal } from "~/shared/GenerateSpeechModal";

export function meta() {
  return [{ title: "Character speeches" }];
}

export default function CharacterSpeeches() {
  const { characterId } = useParams<{ characterId: string }>();
  const id = characterId?.trim() ?? "";

  const characters = useCharactersStore((s) => s.characters);
  const selectedCharacter = useCharactersStore((s) => s.selectedCharacter);
  const selectedCharacterLoading = useCharactersStore((s) => s.selectedCharacterLoading);
  const fetchCharacterById = useCharactersStore((s) => s.fetchCharacterById);
  const updateCharacter = useCharactersStore((s) => s.updateCharacter);
  const updateLoading = useCharactersStore((s) => s.updateLoading);
  const userVoices = useVoicesStore((s) => s.userVoices);
  const selectedVoice = useVoicesStore((s) => s.selectedVoice);
  const setSelectedVoice = useVoicesStore((s) => s.setSelectedVoice);
  const getVoiceById = useVoicesStore((s) => s.getVoiceById);

  const character = useMemo(() => {
    if (selectedCharacter?.id === id) return selectedCharacter;
    return characters.find((row) => row.id === id) ?? null;
  }, [selectedCharacter, characters, id]);

  useEffect(() => {
    if (character || !id) return;
    void fetchCharacterById(id, { silent: true });
  }, [character, id, fetchCharacterById]);

  const voiceId = character?.voice_id?.trim() ?? "";
  const voiceReady = Boolean(voiceId && selectedVoice?.id === voiceId);

  useEffect(() => {
    if (!voiceId) {
      setSelectedVoice(null);
      return;
    }

    const fromList = userVoices.find((voice) => voice.id === voiceId);
    if (fromList) {
      setSelectedVoice(fromList);
      return;
    }

    let cancelled = false;
    void getVoiceById(voiceId).then((voice) => {
      if (cancelled) return;
      if (voice?.id === voiceId) setSelectedVoice(voice);
      else setSelectedVoice(null);
    });
    return () => {
      cancelled = true;
    };
  }, [voiceId, userVoices, getVoiceById, setSelectedVoice]);

  useEffect(() => {
    return () => setSelectedVoice(null);
  }, [setSelectedVoice]);

  const handleVoiceChange = async (newVoiceId: string | null) => {
    if (!character) return;
    await updateCharacter(character.id, {
      ...characterFormValuesFromRow(character),
      voiceId: newVoiceId,
    });
  };

  const loading = !character && selectedCharacterLoading;

  return (
    <Box
      p="sm"
      style={{
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {loading ? (
        <Group justify="center" py="xl">
          <Loader size="sm" />
        </Group>
      ) : !character ? (
        <Text size="sm" c="dimmed">
          Character not found.
        </Text>
      ) : (
        <Stack gap="sm" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <Group justify="space-between" align="center" wrap="wrap" gap="xs">
            <Box style={{ flex: 1, minWidth: 220, maxWidth: 360 }}>
              <VoicePicker
                value={voiceId || null}
                onChange={(nextVoiceId) => void handleVoiceChange(nextVoiceId)}
                selecting={updateLoading}
                modalTitle="Character voice"
                placeholder="Select voice"
              />
            </Box>
            {voiceId ? <GenerateSpeechModal buttonLabel="Generate speech" /> : null}
          </Group>
          {!voiceId ? (
            <Text size="sm" c="dimmed">
              Choose a voice to generate speeches and view history for this character.
            </Text>
          ) : !voiceReady ? (
            <Group justify="center" py="xl">
              <Loader size="sm" />
            </Group>
          ) : (
            <Box
              style={{
                flex: 1,
                minHeight: 0,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <VoiceSpeechesHistory emptyHint="No speeches yet. Generate one using the button above." />
            </Box>
          )}
        </Stack>
      )}
    </Box>
  );
}
