import { Button, Group, Modal, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { RiBookOpenLine } from "@remixicon/react";
import { useState } from "react";
import { useNavigate } from "react-router";
import useCharactersStore, { type CharacterFormValues } from "~/lib/stores/charactersStore";
import useVoicesStore from "~/lib/stores/voicesStore";
import type { SharedVoiceItem } from "~/lib/voices/voiceLibraryQuery";
import {
  buildSharedVoiceAssistSeed,
  buildSharedVoiceCloneMetadata,
  mapSharedVoiceLanguageToClone,
  normalizeSharedVoiceGender,
} from "~/lib/voices/sharedVoiceUtils";
import { CharacterUpsertModal } from "~/pages/characters/components/CharacterUpsertModal";
import { VoiceLibraryPicker } from "~/shared/VoiceLibraryPicker";

type Step = "pick" | "review";

export function CreateCharacterFromLibraryModal() {
  const [opened, { open, close }] = useDisclosure(false);
  const [step, setStep] = useState<Step>("pick");
  const [pipelineLoading, setPipelineLoading] = useState(false);
  const [reviewInitialValues, setReviewInitialValues] = useState<Partial<CharacterFormValues>>();

  const cloneVoice = useVoicesStore((s) => s.cloneVoice);
  const assistCharacterDesign = useCharactersStore((s) => s.assistCharacterDesign);
  const createCharacter = useCharactersStore((s) => s.createCharacter);
  const createLoading = useCharactersStore((s) => s.createLoading);
  const navigate = useNavigate();

  const resetModal = () => {
    setStep("pick");
    setPipelineLoading(false);
    setReviewInitialValues(undefined);
  };

  const handleClose = () => {
    if (pipelineLoading || createLoading) return;
    close();
    resetModal();
  };

  const handleOpen = () => {
    resetModal();
    open();
  };

  const runCloneAndAssist = async (voice: SharedVoiceItem): Promise<CharacterFormValues | null> => {
    const previewUrl = voice.preview_url?.trim();
    if (!previewUrl) {
      return null;
    }

    const voiceName = (voice.name ?? "").trim() || voice.voice_id;
    const cloned = await cloneVoice({
      audio: previewUrl,
      name: voiceName,
      language: mapSharedVoiceLanguageToClone(voice.language),
      description: voice.description?.trim() || undefined,
      gender: voice.gender?.trim() || undefined,
      age: voice.age?.trim() || undefined,
      accent: voice.accent?.trim() || undefined,
      metadata: buildSharedVoiceCloneMetadata(voice),
    });
    if (!cloned?.id) return null;

    const assistSeed = buildSharedVoiceAssistSeed(voice);
    const assist = await assistCharacterDesign({
      description: assistSeed,
      name: voiceName,
      gender: normalizeSharedVoiceGender(voice.gender),
      age: voice.age?.trim() || null,
      ethnicity: voice.accent?.trim() || null,
    });
    if (!assist) return null;

    return {
      name: assist.name.trim() || voiceName,
      description: assist.description,
      voiceId: cloned.id,
      gender: assist.gender,
      age: assist.age,
      ethnicity: assist.ethnicity,
    };
  };

  const handlePickVoice = async (voice: SharedVoiceItem) => {
    setPipelineLoading(true);
    try {
      const values = await runCloneAndAssist(voice);
      if (!values) return;
      setReviewInitialValues(values);
      setStep("review");
    } finally {
      setPipelineLoading(false);
    }
  };

  const handleCreate = async (values: CharacterFormValues) => {
    const created = await createCharacter(values);
    if (!created?.id) return;
    handleClose();
    navigate(`/characters/${encodeURIComponent(created.id)}/looks`);
  };

  const reviewOpen = opened && step === "review";

  return (
    <>
      <Button
        size="xs"
        variant="light"
        leftSection={<RiBookOpenLine size={18} />}
        onClick={handleOpen}
      >
        library
      </Button>

      <Modal
        opened={opened && step === "pick"}
        onClose={handleClose}
        title="Create character from voice library"
        size="xl"
        centered
        closeOnClickOutside={!pipelineLoading}
        closeOnEscape={!pipelineLoading}
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Browse the ElevenLabs shared library and select a voice. We clone it to your account and
            generate a matching character profile.
          </Text>

          <VoiceLibraryPicker
            active={opened && step === "pick"}
            onPick={handlePickVoice}
            pickDisabled={pipelineLoading}
            pickButtonLabel="Select"
            scrollHeight={360}
          />

          <Group justify="flex-end">
            <Button variant="default" onClick={handleClose} disabled={pipelineLoading}>
              Cancel
            </Button>
          </Group>
        </Stack>
      </Modal>

      <CharacterUpsertModal
        opened={reviewOpen}
        onClose={() => {
          setStep("pick");
          setReviewInitialValues(undefined);
        }}
        title="Review character"
        submitLabel="Create character"
        submitting={createLoading}
        showLookModelPicker
        initialValues={reviewInitialValues}
        onSubmit={handleCreate}
      />
    </>
  );
}
