import { Button, Group } from "@mantine/core";
import {
  RiMicLine,
  RiMicOffLine,
  RiPauseLine,
  RiPlayLine,
  RiRecordCircleLine,
  RiRefreshLine,
  RiStopLine,
} from "@remixicon/react";
import type { MediaRecordingState } from "~/lib/recording/types";

type RecordingControlsProps = {
  state: MediaRecordingState;
  disabled?: boolean;
  isMicMuted?: boolean;
  onInit?: () => void;
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  onReset?: () => void;
  onToggleMic?: () => void;
  showMicToggle?: boolean;
};

export function RecordingControls({
  state,
  disabled = false,
  isMicMuted = false,
  onInit,
  onStart,
  onPause,
  onResume,
  onStop,
  onReset,
  onToggleMic,
  showMicToggle = false,
}: RecordingControlsProps) {
  const busy = disabled || state === "initializing" || state === "stopping";

  return (
    <Group gap="xs" wrap="wrap">
      {state === "idle" || state === "error" ? (
        <Button
          leftSection={<RiMicLine size={16} />}
          onClick={onInit}
          disabled={busy}
          type="button"
        >
          Allow microphone
        </Button>
      ) : null}

      {state === "ready" ? (
        <Button
          color="red"
          leftSection={<RiRecordCircleLine size={16} />}
          onClick={onStart}
          disabled={busy}
          type="button"
        >
          Start recording
        </Button>
      ) : null}

      {state === "countdown" ? (
        <Button color="red" disabled type="button">
          Starting…
        </Button>
      ) : null}

      {state === "recording" ? (
        <>
          <Button
            variant="light"
            leftSection={<RiPauseLine size={16} />}
            onClick={onPause}
            disabled={busy}
            type="button"
          >
            Pause
          </Button>
          <Button
            color="red"
            leftSection={<RiStopLine size={16} />}
            onClick={onStop}
            disabled={busy}
            type="button"
          >
            Stop
          </Button>
        </>
      ) : null}

      {state === "paused" ? (
        <>
          <Button
            leftSection={<RiPlayLine size={16} />}
            onClick={onResume}
            disabled={busy}
            type="button"
          >
            Resume
          </Button>
          <Button
            color="red"
            leftSection={<RiStopLine size={16} />}
            onClick={onStop}
            disabled={busy}
            type="button"
          >
            Stop
          </Button>
        </>
      ) : null}

      {state === "completed" ? (
        <Button
          variant="filled"
          leftSection={<RiRefreshLine size={16} />}
          onClick={onReset}
          disabled={busy}
          type="button"
        >
          Record again
        </Button>
      ) : null}

      {showMicToggle && (state === "ready" || state === "recording" || state === "paused") ? (
        <Button
          variant="default"
          leftSection={isMicMuted ? <RiMicOffLine size={16} /> : <RiMicLine size={16} />}
          onClick={onToggleMic}
          disabled={busy}
          type="button"
        >
          {isMicMuted ? "Unmute" : "Mute"}
        </Button>
      ) : null}
    </Group>
  );
}
