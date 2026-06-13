import { Button, Group, Stack, Text, TextInput } from "@mantine/core";
import { RiSparklingLine } from "@remixicon/react";
import { useState } from "react";
import useVoicesStore, { type UserVoiceSpeech } from "~/lib/stores/voicesStore";
import { inworldProviderVoiceId } from "~/pages/voices/voiceUtils";
import { SpeechScriptEditor } from "~/shared/SpeechScriptEditor";
import { SPEECH_SCRIPT_ASSIST_MAX_CHARS } from "~/shared/speechSteering";

export const MAX_SPEECH_CHARS = 2000;

export type GenerateSpeechFormProps = {
  /** Optional callback after speech is synthesized and added to history. */
  onGenerated?: (speech: UserVoiceSpeech) => void;
  /** Helper text above the fields */
  description?: string;
  /** Primary submit button label */
  submitLabel?: string;
  /** Show a cancel button (e.g. inside a modal) */
  showCancel?: boolean;
  onCancel?: () => void;
};

export function GenerateSpeechForm({
  onGenerated,
  description = "Write your script below. Use Delivery for mood and pacing, Non-verbal for sounds like [laugh]. Audio is saved to your speech history.",
  submitLabel = "Generate speech",
  showCancel = false,
  onCancel,
}: GenerateSpeechFormProps) {
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");

  const selectedVoice = useVoicesStore((s) => s.selectedVoice);
  const synthesizeSpeech = useVoicesStore((s) => s.synthesizeSpeech);
  const prependVoiceSpeech = useVoicesStore((s) => s.prependVoiceSpeech);
  const assistSpeechScript = useVoicesStore((s) => s.assistSpeechScript);
  const speechSynthesizeLoading = useVoicesStore((s) => s.speechSynthesizeLoading);
  const speechAssistLoading = useVoicesStore((s) => s.speechAssistLoading);

  const voiceId = selectedVoice?.id?.trim() ?? "";
  const inworldVoiceId = selectedVoice ? inworldProviderVoiceId(selectedVoice) : null;
  const hasSelectedVoice = Boolean(voiceId);
  const hasInworldVoice = Boolean(inworldVoiceId?.trim());
  const charCount = text.length;
  const busy = speechSynthesizeLoading || speechAssistLoading;
  const canSubmit =
    hasInworldVoice && text.trim().length > 0 && charCount <= MAX_SPEECH_CHARS && !busy;

  const runSpeechAssist = async (random: boolean) => {
    if (!hasInworldVoice || busy) return;
    const result = await assistSpeechScript({
      text: random ? undefined : text.trim() || undefined,
      title: title.trim() || undefined,
      voiceName: selectedVoice?.name,
      voiceDescription: selectedVoice?.description,
      gender: selectedVoice?.gender,
      age: selectedVoice?.age,
      accent: selectedVoice?.accent,
      random,
    });
    if (!result) return;
    setText(result.text.slice(0, SPEECH_SCRIPT_ASSIST_MAX_CHARS));
    if (!title.trim() && result.title.trim()) {
      setTitle(result.title.trim());
    }
  };

  const resetForm = () => {
    setText("");
    setTitle("");
  };

  const handleGenerate = async () => {
    const trimmedText = text.trim();
    const providerVoiceId = inworldVoiceId?.trim();
    if (!trimmedText || charCount > MAX_SPEECH_CHARS || !providerVoiceId || !voiceId) return;

    const result = await synthesizeSpeech({
      voiceId,
      inworldVoiceId: providerVoiceId,
      text: trimmedText,
      title: title.trim() || undefined,
    });
    if (!result) return;

    prependVoiceSpeech(result.speech);
    onGenerated?.(result.speech);
    resetForm();
  };

  if (!hasSelectedVoice) {
    return (
      <Text size="sm" c="dimmed">
        Select a voice to generate speech.
      </Text>
    );
  }

  return (
    <Stack gap="md">
      {description ? (
        <Text size="sm" c="dimmed">
          {description}
        </Text>
      ) : null}
      {!hasInworldVoice ? (
        <Text size="sm" c="dimmed">
          This voice is not linked to Inworld (missing metadata.provider.voice_id), so speech cannot
          be generated.
        </Text>
      ) : null}
      <Group justify="flex-end" gap="xs">
        <Button
          variant="light"
          size="compact-sm"
          leftSection={<RiSparklingLine size={16} />}
          loading={speechAssistLoading}
          disabled={!hasInworldVoice || speechSynthesizeLoading}
          onClick={() => void runSpeechAssist(false)}
        >
          AI Assist
        </Button>
        <Button
          variant="default"
          size="compact-sm"
          loading={speechAssistLoading}
          disabled={!hasInworldVoice || speechSynthesizeLoading}
          onClick={() => void runSpeechAssist(true)}
        >
          Random
        </Button>
      </Group>
      <SpeechScriptEditor
        value={text}
        onChange={setText}
        maxLength={MAX_SPEECH_CHARS}
        disabled={!hasInworldVoice || busy}
      />
      <TextInput
        label="Title (optional)"
        placeholder="Short label for this speech"
        value={title}
        disabled={!hasInworldVoice || busy}
        onChange={(event) => setTitle(event.currentTarget.value)}
      />
      <Group justify="flex-end" gap="sm">
        {showCancel ? (
          <Button variant="default" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
        ) : null}
        <Button
          onClick={() => void handleGenerate()}
          loading={speechSynthesizeLoading}
          disabled={!canSubmit}
        >
          {submitLabel}
        </Button>
      </Group>
    </Stack>
  );
}
