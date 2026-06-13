import { Card, SegmentedControl, Stack, Text } from "@mantine/core";
import { useEffect, useState } from "react";
import { useAudioDurationHint } from "~/lib/recording/useAudioDurationHint";
import { AddMediaZone } from "~/pages/generate/components/x-ui-components/MediaFilePicker/AddMediaZone";
import { GennyAudioPlayer } from "~/shared/GennyAudioPlayer";
import { AudioRecorderPanel } from "~/shared/recording/AudioRecorderPanel";

export type AudioSampleSource = "record" | "upload";

export type AudioSampleCaptureProps = {
  audioUrl: string;
  onAudioUrlChange: (url: string) => void;
  disabled?: boolean;
  maxDurationSec?: number;
};

export function AudioSampleCapture({
  audioUrl,
  onAudioUrlChange,
  disabled = false,
  maxDurationSec = 120,
}: AudioSampleCaptureProps) {
  const [source, setSource] = useState<AudioSampleSource>("upload");
  const [recordingUploading, setRecordingUploading] = useState(false);
  const [selectedDurationSec, setSelectedDurationSec] = useState<number | undefined>();

  const trimmedUrl = audioUrl.trim();
  const knownDurationSec = useAudioDurationHint(trimmedUrl || undefined, selectedDurationSec);
  const panelDisabled = disabled || recordingUploading;

  const selectAudioUrl = (url: string, durationSec?: number) => {
    onAudioUrlChange(url);
    setSelectedDurationSec(durationSec);
  };

  useEffect(() => {
    if (!trimmedUrl) setSelectedDurationSec(undefined);
  }, [trimmedUrl]);

  return (
    <Stack gap="sm">
      <SegmentedControl
        value={source}
        onChange={(value) => setSource(value as AudioSampleSource)}
        disabled={panelDisabled}
        data={[
          { label: "Upload", value: "upload" },
          { label: "Record", value: "record" },
        ]}
        fullWidth
      />

      {source === "record" ? (
        <AudioRecorderPanel
          disabled={panelDisabled}
          maxDurationSec={maxDurationSec}
          onSampleReady={selectAudioUrl}
          onUploadingChange={setRecordingUploading}
        />
      ) : null}

      {source === "upload" ? (
        <Stack gap={6}>
          {!panelDisabled ? (
            <AddMediaZone
              selectLabel="Select audio sample"
              modalTitle="Select audio sample"
              allowedTypes="audio"
              onPickPath={(path) => selectAudioUrl(path.trim())}
              onAddUrl={(url) => selectAudioUrl(url.trim())}
            />
          ) : null}
        </Stack>
      ) : null}

      {trimmedUrl ? (
        <Card>
          <Stack gap={6}>
            <Text size="sm" fw={500}>
              Selected sample
            </Text>
            <GennyAudioPlayer
              src={trimmedUrl}
              compact
              showWaveform
              knownDurationSec={knownDurationSec}
            />
            <Text size="xs" c="dimmed">
              {trimmedUrl}
            </Text>
          </Stack>
        </Card>
      ) : (
        <Text size="sm" c="red">
          No audio sample selected
        </Text>
      )}
    </Stack>
  );
}
