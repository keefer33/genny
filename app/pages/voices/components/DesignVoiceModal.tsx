import {
  Box,
  Button,
  Checkbox,
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
import { RiSparklingLine } from "@remixicon/react";
import { useEffect, useMemo, useState } from "react";
import useVoicesStore, {
  type DesignPreviewVoice,
  previewAudioDataUrl,
} from "~/lib/stores/voicesStore";
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

type PreviewSelection = DesignPreviewVoice & {
  selected: boolean;
  displayName: string;
};

type DesignVoiceModalProps = {
  opened: boolean;
  onClose: () => void;
  onPublished: () => void;
};

export function DesignVoiceModal({ opened, onClose, onPublished }: DesignVoiceModalProps) {
  const {
    designVoice,
    assistVoiceDesign,
    publishVoices,
    designLoading,
    assistLoading,
    publishLoading,
  } = useVoicesStore();

  const [step, setStep] = useState<"form" | "previews">("form");
  const [designPrompt, setDesignPrompt] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [baseName, setBaseName] = useState("");
  const [gender, setGender] = useState<string | null>(null);
  const [age, setAge] = useState<string | null>(null);
  const [accent, setAccent] = useState<string | null>(null);
  const [previews, setPreviews] = useState<PreviewSelection[]>([]);
  const [designPromptError, setDesignPromptError] = useState<string | null>(null);
  const [previewTextError, setPreviewTextError] = useState<string | null>(null);

  const reset = () => {
    setStep("form");
    setDesignPrompt("");
    setPreviewText("");
    setBaseName("");
    setGender(null);
    setAge(null);
    setAccent(null);
    setPreviews([]);
    setDesignPromptError(null);
    setPreviewTextError(null);
  };

  useEffect(() => {
    if (!opened) reset();
  }, [opened]);

  const selectedCount = useMemo(() => previews.filter((p) => p.selected).length, [previews]);

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
    });
    if (!result?.previewVoices?.length) {
      showNotification({
        title: "No previews returned",
        message:
          "Voice design finished but no preview audio was returned. Try again or adjust your script.",
        type: "error",
      });
      return;
    }

    setPreviews(
      result.previewVoices.map((preview, index) => ({
        ...preview,
        selected: true,
        displayName:
          result.previewVoices.length > 1
            ? `${baseName.trim() || "My voice"} ${index + 1}`
            : baseName.trim() || "My voice",
      }))
    );
    setStep("previews");
  };

  const handlePublish = async () => {
    const selected = previews.filter((p) => p.selected);
    if (selected.length === 0) return;

    const ok = await publishVoices(
      selected.map((p) => ({
        voiceId: p.voiceId,
        displayName: p.displayName.trim() || baseName.trim() || "My voice",
        previewAudio: p.previewAudio,
        previewText: p.previewText,
        designPrompt: designPrompt.trim(),
        description: designPrompt.trim(),
        gender: gender ?? undefined,
        age: age ?? undefined,
        accent: accent ?? undefined,
      }))
    );
    if (ok) {
      onPublished();
      onClose();
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={step === "form" ? "Design a new voice" : "Choose previews to publish"}
      size="lg"
      centered
    >
      {step === "form" ? (
        <Stack gap="md">
          <Group justify="space-between" align="center" wrap="wrap">
            <Text size="sm" c="dimmed" style={{ flex: 1, minWidth: 200 }}>
              Describe the voice (tone, pace, character). Gender, age, and accent guide AI Assist
              and are saved on publish. Preview script should be about 5–15 seconds when spoken.
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
            description="Used when publishing; each preview can be renamed in the next step."
            value={baseName}
            onChange={(e) => setBaseName(e.currentTarget.value)}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose} disabled={designLoading || assistLoading}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleGenerate()}
              loading={designLoading}
              disabled={assistLoading}
            >
              Generate 3 previews
            </Button>
          </Group>
        </Stack>
      ) : (
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Listen to each preview, select the ones you want, and publish them to your voice
            library.
          </Text>
          {designLoading ? (
            <Group justify="center" py="xl">
              <Loader />
            </Group>
          ) : (
            previews.map((preview, index) => (
              <Box
                key={preview.voiceId}
                p="sm"
                style={{ border: "1px solid var(--mantine-color-default-border)", borderRadius: 8 }}
              >
                <Stack gap="xs">
                  <Group justify="space-between" wrap="nowrap">
                    <Checkbox
                      label={<Title order={6}>Preview {index + 1}</Title>}
                      checked={preview.selected}
                      onChange={(e) => {
                        const checked = e.currentTarget.checked;
                        setPreviews((prev) =>
                          prev.map((p) =>
                            p.voiceId === preview.voiceId ? { ...p, selected: checked } : p
                          )
                        );
                      }}
                    />
                  </Group>
                  <GennyAudioPlayer
                    src={previewAudioDataUrl(preview.previewAudio)}
                    crossOrigin=""
                    compact
                  />
                  <TextInput
                    label="Display name"
                    value={preview.displayName}
                    disabled={!preview.selected}
                    onChange={(e) => {
                      const value = e.currentTarget.value;
                      setPreviews((prev) =>
                        prev.map((p) =>
                          p.voiceId === preview.voiceId ? { ...p, displayName: value } : p
                        )
                      );
                    }}
                  />
                </Stack>
              </Box>
            ))
          )}
          <Group justify="space-between">
            <Button variant="subtle" onClick={() => setStep("form")} disabled={publishLoading}>
              Back
            </Button>
            <Group gap="xs">
              <Button variant="default" onClick={onClose} disabled={publishLoading}>
                Cancel
              </Button>
              <Button
                onClick={() => void handlePublish()}
                loading={publishLoading}
                disabled={selectedCount === 0}
              >
                Publish {selectedCount > 0 ? `(${selectedCount})` : ""}
              </Button>
            </Group>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
