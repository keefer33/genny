import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createMediaRecordingAdapter } from "~/lib/recording/createMediaRecordingAdapter";
import type {
  MediaRecordingConfig,
  MediaRecordingProviderId,
  MediaRecordingSnapshot,
} from "~/lib/recording/types";
import { EMPTY_RECORDING_SNAPSHOT } from "~/lib/recording/types";

export function useRecordingSession(
  config: MediaRecordingConfig,
  providerId: MediaRecordingProviderId = "reechy"
) {
  const adapterRef = useRef<ReturnType<typeof createMediaRecordingAdapter> | null>(null);
  const [snapshot, setSnapshot] = useState<MediaRecordingSnapshot>(EMPTY_RECORDING_SNAPSHOT);

  const stableConfig = useMemo(
    () => config,
    [config.mode, config.maxDurationSec, config.countdownSec, config.audio]
  );

  useEffect(() => {
    const adapter = createMediaRecordingAdapter(providerId, stableConfig.mode);
    adapterRef.current = adapter;
    const unsubscribe = adapter.subscribe((patch) => {
      setSnapshot((prev) => ({ ...prev, ...patch }));
    });
    return () => {
      unsubscribe();
      adapter.destroy();
      adapterRef.current = null;
    };
  }, [providerId, stableConfig.mode]);

  const init = useCallback(async () => {
    const adapter = adapterRef.current;
    if (!adapter) return;
    setSnapshot(EMPTY_RECORDING_SNAPSHOT);
    await adapter.init(stableConfig);
    setSnapshot(adapter.getSnapshot());
  }, [stableConfig]);

  const start = useCallback(() => {
    adapterRef.current?.start();
  }, []);

  const pause = useCallback(() => {
    adapterRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    adapterRef.current?.resume();
  }, []);

  const stop = useCallback(async () => {
    const adapter = adapterRef.current;
    if (!adapter) throw new Error("Recorder not ready");
    const blob = await adapter.stop();
    setSnapshot(adapter.getSnapshot());
    return blob;
  }, []);

  const reset = useCallback(() => {
    adapterRef.current?.reset();
    setSnapshot(EMPTY_RECORDING_SNAPSHOT);
  }, []);

  const toggleMic = useCallback(() => {
    const micEnabled = adapterRef.current?.toggleMic?.() ?? true;
    setSnapshot((prev) => ({ ...prev, isMicMuted: !micEnabled }));
    return micEnabled;
  }, []);

  const isRecording = snapshot.state === "recording";
  const isPaused = snapshot.state === "paused";
  const isReady = snapshot.state === "ready";
  const isCompleted = snapshot.state === "completed";
  const isBusy =
    snapshot.state === "initializing" ||
    snapshot.state === "countdown" ||
    snapshot.state === "stopping";

  return {
    providerId,
    snapshot,
    init,
    start,
    pause,
    resume,
    stop,
    reset,
    toggleMic,
    isRecording,
    isPaused,
    isReady,
    isCompleted,
    isBusy,
  };
}
