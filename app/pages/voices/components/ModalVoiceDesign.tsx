import {
  ActionIcon,
  Box,
  Button,
  Group,
  Loader,
  Modal,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { RiAddLine, RiDeleteBinLine, RiSparklingLine } from "@remixicon/react";
import { useEffect, useState } from "react";
import useVoicesStore, { getVoicePreviewUrl, type UserVoice } from "~/lib/stores/voicesStore";
import { showNotification } from "~/lib/notificationUtils";
import { GennyAudioPlayer } from "~/shared/GennyAudioPlayer";
import {
  VOICE_ACCENT_OPTIONS,
  VOICE_AGE_OPTIONS,
  VOICE_DESIGN_PREVIEW_MAX,
  VOICE_DESIGN_PREVIEW_MIN,
  VOICE_DESIGN_PROMPT_MAX,
  VOICE_DESIGN_PROMPT_MIN,
  VOICE_GENDER_OPTIONS,
} from "~/pages/voices/voiceFormOptions";
import useAppStore from "~/lib/stores/appStore";

type DesignedVoiceDraft = {
  voice: UserVoice;
  name: string;
  saving: boolean;
  deleting: boolean;
};

function voiceDraftFromUserVoice(voice: UserVoice): DesignedVoiceDraft {
  return {
    voice,
    name: voice.name?.trim() || "My voice",
    saving: false,
    deleting: false,
  };
}

export function ModalVoiceDesign() {
  const {
    designVoice,
    assistVoiceDesign,
    updateVoice,
    deleteVoice,
    loadUserVoices,
    designLoading,
    assistLoading,
    designVoiceOpened,
    openDesignVoice,
    closeDesignVoice,
  } = useVoicesStore();
  const [step, setStep] = useState<"form" | "previews">("form");
  const [designPrompt, setDesignPrompt] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [baseName, setBaseName] = useState("");
  const [gender, setGender] = useState<string | null>(null);
  const [age, setAge] = useState<string | null>(null);
  const [accent, setAccent] = useState<string | null>(null);
  const [designedVoices, setDesignedVoices] = useState<DesignedVoiceDraft[]>([]);
  const [designPromptError, setDesignPromptError] = useState<string | null>(null);
  const [previewTextError, setPreviewTextError] = useState<string | null>(null);
  const { isMobile } = useAppStore();

  const reset = () => {
    setStep("form");
    setDesignPrompt("");
    setPreviewText("");
    setBaseName("");
    setGender(null);
    setAge(null);
    setAccent(null);
    setDesignedVoices([]);
    setDesignPromptError(null);
    setPreviewTextError(null);
  };

  useEffect(() => {
    if (!designVoiceOpened) reset();
  }, [designVoiceOpened]);

  const handleAiAssist = async () => {
    const result = await assistVoiceDesign({
      designPrompt: designPrompt.trim() || undefined,
      previewText: previewText.trim() || undefined,
      gender,
      age,
      accent,
      defaultName: baseName.trim() === "My voice" ? undefined : baseName,
    });
    if (!result) return;
    setDesignPrompt(result.designPrompt);
    setPreviewText(result.previewText);
    setGender(result.gender);
    setAge(result.age);
    setAccent(result.accent);
    if (result.defaultName.trim()) setBaseName(result.defaultName.trim());
    setDesignPromptError(null);
    setPreviewTextError(null);
  };

  const handleGenerate = async () => {
    const prompt = designPrompt.trim();
    let hasError = false;
    if (prompt.length < VOICE_DESIGN_PROMPT_MIN || prompt.length > VOICE_DESIGN_PROMPT_MAX) {
      setDesignPromptError(
        `Description must be between ${VOICE_DESIGN_PROMPT_MIN} and ${VOICE_DESIGN_PROMPT_MAX} characters.`
      );
      hasError = true;
    } else {
      setDesignPromptError(null);
    }

    const text = previewText.trim();
    if (!text) {
      setPreviewTextError("Preview script is required.");
      hasError = true;
    } else if (text.length < VOICE_DESIGN_PREVIEW_MIN || text.length > VOICE_DESIGN_PREVIEW_MAX) {
      setPreviewTextError(
        `Preview script must be between ${VOICE_DESIGN_PREVIEW_MIN} and ${VOICE_DESIGN_PREVIEW_MAX} characters (~5–15 seconds spoken).`
      );
      hasError = true;
    } else {
      setPreviewTextError(null);
    }
    if (hasError) return;

    const result = await designVoice({
      designPrompt: prompt,
      previewText: text,
      numberOfSamples: 3,
      baseName: baseName.trim() || undefined,
      gender,
      age,
      accent,
    });
    if (!result?.voices?.length) {
      showNotification({
        title: "No voices saved",
        message:
          "Voice design finished but no voices were saved to your library. Try again or adjust your script.",
        type: "error",
      });
      return;
    }

    setDesignedVoices(result.voices.map(voiceDraftFromUserVoice));
    setStep("previews");
  };

  const handleSaveVoiceName = async (voiceId: string) => {
    const draft = designedVoices.find((row) => row.voice.id === voiceId);
    if (!draft?.voice.id) return;

    const nextName = draft.name.trim() || baseName.trim() || "My voice";
    if (nextName === draft.voice.name?.trim()) return;

    setDesignedVoices((rows) =>
      rows.map((row) => (row.voice.id === voiceId ? { ...row, saving: true } : row))
    );

    const ok = await updateVoice(
      voiceId,
      {
        name: nextName,
        description: designPrompt.trim(),
        gender,
        age,
        accent,
      },
      { quiet: true }
    );

    setDesignedVoices((rows) =>
      rows.map((row) =>
        row.voice.id === voiceId
          ? {
              ...row,
              saving: false,
              name: ok ? nextName : row.name,
              voice: ok ? { ...row.voice, name: nextName } : row.voice,
            }
          : row
      )
    );

    if (!ok) {
      showNotification({
        title: "Could not update voice",
        message: "Please try saving the name again.",
        type: "error",
      });
    }
  };

  const handleDeleteVoice = async (voiceId: string) => {
    setDesignedVoices((rows) =>
      rows.map((row) => (row.voice.id === voiceId ? { ...row, deleting: true } : row))
    );

    const ok = await deleteVoice(voiceId, { quiet: true });
    if (ok) {
      setDesignedVoices((rows) => rows.filter((row) => row.voice.id !== voiceId));
      return;
    }

    setDesignedVoices((rows) =>
      rows.map((row) => (row.voice.id === voiceId ? { ...row, deleting: false } : row))
    );
    showNotification({
      title: "Could not delete voice",
      message: "Please try again.",
      type: "error",
    });
  };

  const handleDone = async () => {
    await loadUserVoices({ page: 1, paginate: true });
    closeDesignVoice();
    showNotification({
      title: "Voices saved",
      message:
        designedVoices.length === 1
          ? "Your designed voice is in your library."
          : `${designedVoices.length} designed voices are in your library.`,
      type: "success",
    });
  };

  return (
    <>
      <Button leftSection={<RiAddLine size={18} />} onClick={openDesignVoice} size="compact-sm">
        Design
      </Button>

      <Modal
        opened={designVoiceOpened}
        onClose={closeDesignVoice}
        title={step === "form" ? "Design a new voice" : "Your designed voices"}
        size="lg"
        centered
        fullScreen={isMobile}
      >
        {step === "form" ? (
          <Stack gap="md">
            <Group justify="space-between" align="center" wrap="wrap">
              <Text size="sm" c="dimmed" style={{ flex: 1, minWidth: 200 }}>
                Describe the voice (tone, pace, character). Gender, age, and accent guide AI Assist
                and are saved on each generated voice. Preview script should be about 5–15 seconds
                when spoken.
              </Text>
              <Button
                variant="light"
                leftSection={<RiSparklingLine size={16} />}
                loading={assistLoading}
                disabled={designLoading}
                onClick={() => void handleAiAssist()}
              >
                AI Assist
              </Button>
            </Group>
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
              <Select
                label="Gender"
                placeholder="Optional"
                clearable
                data={[...VOICE_GENDER_OPTIONS]}
                value={gender}
                onChange={(value) => setGender(value)}
              />
              <Select
                label="Age"
                placeholder="Optional"
                clearable
                data={[...VOICE_AGE_OPTIONS]}
                value={age}
                onChange={(value) => setAge(value)}
              />
              <Select
                label="Accent"
                placeholder="Optional"
                clearable
                searchable
                data={VOICE_ACCENT_OPTIONS}
                value={accent}
                onChange={(value) => setAccent(value)}
              />
            </SimpleGrid>
            <Textarea
              label="Voice description"
              description={`${designPrompt.trim().length}/${VOICE_DESIGN_PROMPT_MAX} characters (min ${VOICE_DESIGN_PROMPT_MIN})`}
              minRows={3}
              value={designPrompt}
              onChange={(e) => {
                setDesignPrompt(e.currentTarget.value);
                if (designPromptError) setDesignPromptError(null);
              }}
              error={designPromptError}
              required
            />
            <Textarea
              label="Preview script"
              description={`${previewText.trim().length}/${VOICE_DESIGN_PREVIEW_MAX} characters (min ${VOICE_DESIGN_PREVIEW_MIN}) — about 5–15 seconds when spoken`}
              minRows={3}
              value={previewText}
              onChange={(e) => {
                setPreviewText(e.currentTarget.value);
                if (previewTextError) setPreviewTextError(null);
              }}
              error={previewTextError}
              required
            />
            <TextInput
              label="Default name"
              description="Used as a base name for each generated voice; you can rename them next."
              value={baseName}
              onChange={(e) => setBaseName(e.currentTarget.value)}
            />
            <Group justify="flex-end">
              <Button
                variant="default"
                onClick={closeDesignVoice}
                disabled={designLoading || assistLoading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void handleGenerate()}
                loading={designLoading}
                disabled={assistLoading}
              >
                Generate 3 voices
              </Button>
            </Group>
          </Stack>
        ) : (
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              Three voices were saved to your library. Listen to each preview, rename the ones you
              want to keep, and delete any you do not want.
            </Text>
            {designLoading ? (
              <Group justify="center" py="xl">
                <Loader />
              </Group>
            ) : (
              designedVoices.map((draft, index) => {
                const previewUrl = getVoicePreviewUrl(draft.voice);
                return (
                  <Box
                    key={draft.voice.id}
                    p="sm"
                    style={{
                      border: "1px solid var(--mantine-color-default-border)",
                      borderRadius: 8,
                    }}
                  >
                    <Stack gap="xs">
                      <Group justify="space-between" wrap="nowrap">
                        <Title order={6}>Voice {index + 1}</Title>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          aria-label="Delete voice"
                          title="Delete voice"
                          loading={draft.deleting}
                          onClick={() => void handleDeleteVoice(draft.voice.id)}
                        >
                          <RiDeleteBinLine size={16} />
                        </ActionIcon>
                      </Group>
                      {previewUrl ? (
                        <GennyAudioPlayer src={previewUrl} crossOrigin="" compact />
                      ) : (
                        <Text size="sm" c="dimmed">
                          Preview unavailable
                        </Text>
                      )}
                      <Group align="flex-end" wrap="nowrap" gap="xs">
                        <TextInput
                          label="Display name"
                          style={{ flex: 1 }}
                          value={draft.name}
                          disabled={draft.saving || draft.deleting}
                          onChange={(e) => {
                            const value = e.currentTarget.value;
                            setDesignedVoices((rows) =>
                              rows.map((row) =>
                                row.voice.id === draft.voice.id ? { ...row, name: value } : row
                              )
                            );
                          }}
                        />
                        <Button
                          variant="light"
                          loading={draft.saving}
                          disabled={draft.deleting}
                          onClick={() => void handleSaveVoiceName(draft.voice.id)}
                        >
                          Save
                        </Button>
                      </Group>
                    </Stack>
                  </Box>
                );
              })
            )}
            <Group justify="flex-end">
              <Button variant="default" onClick={closeDesignVoice}>
                Close
              </Button>
              <Button onClick={() => void handleDone()} disabled={designedVoices.length === 0}>
                Done
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </>
  );
}
