import { Alert, Box, Button, Paper, Stack, Text } from "@mantine/core";
import { RiCheckLine } from "@remixicon/react";
import { useCallback, useMemo, useState } from "react";
import { blobToUploadFile } from "~/lib/recording/blobToFile";
import { useRecordingSession } from "~/lib/recording/hooks/useRecordingSession";
import type { MediaRecordingProviderId } from "~/lib/recording/types";
import { uploadMediaFile } from "~/lib/media/uploadMediaFile";
import { showNotification } from "~/lib/notificationUtils";
import {
  VOICE_CLONE_READING_SCRIPT,
  VOICE_CLONE_SAMPLE_MIN_SEC,
} from "~/pages/voices/voiceCloneRecordingOptions";
import { GennyAudioPlayer } from "~/shared/GennyAudioPlayer";
import { RecordingControls } from "~/shared/recording/RecordingControls";
import { RecordingErrorAlert } from "~/shared/recording/RecordingErrorAlert";
import { RecordingTimer } from "~/shared/recording/RecordingTimer";

export type AudioRecorderPanelProps = {
  disabled?: boolean;
  maxDurationSec?: number;
  readingScript?: string;
  providerId?: MediaRecordingProviderId;
  onSampleReady?: (url: string, durationSec: number) => void;
  onUploadingChange?: (uploading: boolean) => void;
};

export function AudioRecorderPanel({
  disabled = false,
  maxDurationSec = 120,
  readingScript = VOICE_CLONE_READING_SCRIPT,
  providerId = "reechy",
  onSampleReady,
  onUploadingChange,
}: AudioRecorderPanelProps) {
  const recordingConfig = useMemo(
    () => ({
      mode: "audio" as const,
      maxDurationSec,
      countdownSec: 0,
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    }),
    [maxDurationSec]
  );

  const session = useRecordingSession(recordingConfig, providerId);
  const { snapshot, isRecording } = session;
  const [uploading, setUploading] = useState(false);

  const setUploadingState = useCallback(
    (next: boolean) => {
      setUploading(next);
      onUploadingChange?.(next);
    },
    [onUploadingChange]
  );

  const handleInit = useCallback(async () => {
    try {
      await session.init();
    } catch {
      // Error surfaced via snapshot.error
    }
  }, [session]);

  const handleStop = useCallback(async () => {
    try {
      await session.stop();
    } catch (err) {
      showNotification({
        title: "Recording failed",
        message: err instanceof Error ? err.message : "Could not stop recording",
        type: "error",
      });
    }
  }, [session]);

  const handleUseRecording = useCallback(async () => {
    const blob = snapshot.blob;
    if (!blob) return;

    const durationSec = snapshot.durationMs / 1000;
    if (durationSec < VOICE_CLONE_SAMPLE_MIN_SEC) {
      showNotification({
        title: "Recording too short",
        message: `Please record at least ${VOICE_CLONE_SAMPLE_MIN_SEC} seconds.`,
        type: "warning",
      });
      return;
    }

    setUploadingState(true);
    try {
      const file = blobToUploadFile(blob, "voice-clone-sample");
      const uploaded = await uploadMediaFile(file);
      if (!uploaded?.url) {
        showNotification({
          title: "Upload failed",
          message: "Could not upload your recording. Try again.",
          type: "error",
        });
        return;
      }
      onSampleReady?.(uploaded.url, durationSec);
      session.reset();
      showNotification({
        title: "Sample ready",
        message: "Your recording was uploaded and selected for cloning.",
        type: "success",
      });
    } catch (err) {
      showNotification({
        title: "Upload failed",
        message: err instanceof Error ? err.message : "Could not upload recording",
        type: "error",
      });
    } finally {
      setUploadingState(false);
    }
  }, [onSampleReady, session, setUploadingState, snapshot.blob, snapshot.durationMs]);

  const panelDisabled = disabled || uploading;

  return (
    <Stack gap="sm">
      <Paper withBorder p="md" radius="md" bg="var(--mantine-color-body)">
        <Stack gap="xs">
          <Text size="sm" fw={500}>
            Read aloud
          </Text>
          <Text size="sm" c="dimmed" style={{ lineHeight: 1.6 }}>
            {readingScript}
          </Text>
        </Stack>
      </Paper>

      {snapshot.state === "countdown" && snapshot.countdown != null ? (
        <Box ta="center">
          <Text size="xl" fw={700}>
            {snapshot.countdown}
          </Text>
        </Box>
      ) : null}

      <RecordingTimer
        durationMs={snapshot.durationMs}
        maxDurationSec={maxDurationSec}
        recording={isRecording}
      />

      <RecordingErrorAlert error={snapshot.error} />

      {snapshot.state === "completed" && snapshot.previewUrl ? (
        <Alert variant="default" title="Preview your recording">
          <Stack gap="sm">
            <GennyAudioPlayer
              src={snapshot.previewUrl}
              compact
              showWaveform
              knownDurationSec={snapshot.durationMs / 1000}
            />
            <Button
              leftSection={<RiCheckLine size={16} />}
              onClick={handleUseRecording}
              loading={uploading}
              disabled={panelDisabled}
              fullWidth
              type="button"
            >
              Use this recording
            </Button>
          </Stack>
        </Alert>
      ) : null}

      <RecordingControls
        state={snapshot.state}
        disabled={panelDisabled || session.isBusy}
        isMicMuted={snapshot.isMicMuted}
        onInit={handleInit}
        onStart={session.start}
        onPause={session.pause}
        onResume={session.resume}
        onStop={handleStop}
        onReset={session.reset}
        onToggleMic={session.toggleMic}
        showMicToggle
      />

      <Text size="xs" c="dimmed">
        Record at least {VOICE_CLONE_SAMPLE_MIN_SEC} seconds in a quiet room. Maximum{" "}
        {maxDurationSec} seconds.
      </Text>
    </Stack>
  );
}
