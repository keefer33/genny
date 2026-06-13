import { Alert } from "@mantine/core";
import { RiErrorWarningLine } from "@remixicon/react";
import type { MediaRecordingError } from "~/lib/recording/types";

export function RecordingErrorAlert({ error }: { error: MediaRecordingError | null }) {
  if (!error) return null;

  return (
    <Alert
      icon={<RiErrorWarningLine size={18} />}
      color="red"
      variant="light"
      title={error.message}
    >
      {error.recovery?.trim() || "Check your microphone permissions and try again."}
    </Alert>
  );
}
