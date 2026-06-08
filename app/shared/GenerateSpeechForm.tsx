import { Button, Group, Stack, Text, TextInput } from "@mantine/core";
import { useState } from "react";
import useVoicesStore, { type UserVoiceSpeech } from "~/lib/stores/voicesStore";
import { SpeechScriptEditor } from "~/shared/SpeechScriptEditor";

export const MAX_SPEECH_CHARS = 2000;

export type GenerateSpeechFormProps = {
  /** Genny `user_voices.id` */
  voiceId: string;
  /** Inworld voice id from `metadata.provider.voice_id` */
  inworldVoiceId: string | null;
  /** Called after speech is synthesized and saved */
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
  voiceId,
  inworldVoiceId,
  onGenerated,
  description = "Write your script below. Use Delivery for mood and pacing, Non-verbal for sounds like [laugh]. Audio is saved to your speech history.",
  submitLabel = "Generate speech",
  showCancel = false,
  onCancel,
}: GenerateSpeechFormProps) {
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");

  const synthesizeSpeech = useVoicesStore((s) => s.synthesizeSpeech);
  const speechSynthesizeLoading = useVoicesStore((s) => s.speechSynthesizeLoading);

  const hasInworldVoice = Boolean(inworldVoiceId?.trim());
  const charCount = text.length;
  const canSubmit =
    hasInworldVoice &&
    text.trim().length > 0 &&
    charCount <= MAX_SPEECH_CHARS &&
    !speechSynthesizeLoading;

  const resetForm = () => {
    setText("");
    setTitle("");
  };

  const handleGenerate = async () => {
    const trimmedText = text.trim();
    const providerVoiceId = inworldVoiceId?.trim();
    if (!trimmedText || charCount > MAX_SPEECH_CHARS || !providerVoiceId) return;

    const result = await synthesizeSpeech({
      voiceId,
      inworldVoiceId: providerVoiceId,
      text: trimmedText,
      title: title.trim() || undefined,
    });
    if (!result) return;

    onGenerated?.(result.speech);
    resetForm();
  };

  return (
    <Stack gap="md">
      {description ? (
        <Text size="sm" c="dimmed">
          {description}
        </Text>
      ) : null}
      <SpeechScriptEditor
        value={text}
        onChange={setText}
        maxLength={MAX_SPEECH_CHARS}
        disabled={!hasInworldVoice || speechSynthesizeLoading}
      />
      <TextInput
        label="Title (optional)"
        placeholder="Short label for this speech"
        value={title}
        disabled={!hasInworldVoice || speechSynthesizeLoading}
        onChange={(event) => setTitle(event.currentTarget.value)}
      />
      <Group justify="flex-end" gap="sm">
        {showCancel ? (
          <Button variant="default" onClick={onCancel} disabled={speechSynthesizeLoading}>
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
