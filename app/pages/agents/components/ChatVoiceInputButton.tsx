import { ActionIcon, Loader, Tooltip } from "@mantine/core";
import { RiMicFill, RiMicLine } from "@remixicon/react";
import { useChatVoiceInput } from "~/lib/recording/hooks/useChatVoiceInput";
import { formatRecordingDuration } from "~/lib/recording/formatDuration";
import { showNotification } from "~/lib/notificationUtils";

type ChatVoiceInputButtonProps = {
  disabled?: boolean;
  onTranscript: (text: string) => void;
};

export function ChatVoiceInputButton({
  disabled = false,
  onTranscript,
}: ChatVoiceInputButtonProps) {
  const voice = useChatVoiceInput({
    disabled,
    onTranscript,
    onError: (message) => {
      showNotification({ title: "Voice input", message, type: "error" });
    },
  });

  const { isRecording, isTranscribing, durationMs, toggle } = voice;

  const label = isTranscribing
    ? "Transcribing…"
    : isRecording
      ? `Stop dictation (${formatRecordingDuration(durationMs)})`
      : "Dictate message";

  return (
    <Tooltip label={label}>
      <ActionIcon
        type="button"
        variant={isRecording ? "filled" : "subtle"}
        color={isRecording ? "red" : undefined}
        size="sm"
        loading={isTranscribing}
        disabled={disabled || isTranscribing}
        aria-label={label}
        aria-pressed={isRecording}
        onClick={() => void toggle()}
      >
        {isTranscribing ? (
          <Loader size={16} />
        ) : isRecording ? (
          <RiMicFill size={18} />
        ) : (
          <RiMicLine size={18} />
        )}
      </ActionIcon>
    </Tooltip>
  );
}
