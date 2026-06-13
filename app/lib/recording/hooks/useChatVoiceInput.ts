import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { transcribeChatAudio } from "~/lib/agents/transcribeChatAudio";
import { blobToUploadFile } from "~/lib/recording/blobToFile";
import { useRecordingSession } from "~/lib/recording/hooks/useRecordingSession";
import type { MediaRecordingState } from "~/lib/recording/types";

export const CHAT_VOICE_MAX_DURATION_SEC = 120;
const CHAT_VOICE_MIN_DURATION_SEC = 0.5;

export type ChatVoiceInputPhase = "idle" | "recording" | "transcribing";

export type UseChatVoiceInputOptions = {
  disabled?: boolean;
  onTranscript?: (text: string) => void;
  onError?: (message: string) => void;
};

const ACTIVE_RECORDING_STATES = new Set<MediaRecordingState>(["recording", "paused", "stopping"]);

export function useChatVoiceInput({
  disabled = false,
  onTranscript,
  onError,
}: UseChatVoiceInputOptions = {}) {
  const recordingConfig = useMemo(
    () => ({
      mode: "audio" as const,
      maxDurationSec: CHAT_VOICE_MAX_DURATION_SEC,
      countdownSec: 0,
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    }),
    []
  );

  const session = useRecordingSession(recordingConfig, "native");
  const { snapshot, isRecording, isBusy } = session;
  const sessionRef = useRef(session);
  sessionRef.current = session;

  const [phase, setPhase] = useState<ChatVoiceInputPhase>("idle");
  const phaseRef = useRef(phase);
  const processingRef = useRef(false);
  const prevSnapshotStateRef = useRef(snapshot.state);
  phaseRef.current = phase;

  const transcribeBlob = useCallback(
    async (blob: Blob, durationMs: number) => {
      if (processingRef.current) return;
      processingRef.current = true;
      setPhase("transcribing");

      try {
        const durationSec = durationMs / 1000;
        if (durationSec < CHAT_VOICE_MIN_DURATION_SEC) {
          throw new Error("Recording was too short. Try speaking a bit longer.");
        }

        const file = blobToUploadFile(blob, "chat-dictation");
        const text = await transcribeChatAudio(file);
        if (!text.trim()) {
          throw new Error("No speech was detected. Try again.");
        }
        onTranscript?.(text.trim());
      } catch (err) {
        const message = err instanceof Error ? err.message : "Transcription failed";
        onError?.(message);
      } finally {
        processingRef.current = false;
        sessionRef.current.reset();
        setPhase("idle");
      }
    },
    [onError, onTranscript]
  );

  useEffect(() => {
    if (phase !== "recording") return;
    if (snapshot.state === "completed" && snapshot.error) {
      setPhase("idle");
      onError?.(snapshot.error.message);
      sessionRef.current.reset();
    }
  }, [onError, phase, snapshot.error, snapshot.state]);

  useEffect(() => {
    const prevState = prevSnapshotStateRef.current;
    prevSnapshotStateRef.current = snapshot.state;

    if (phase !== "recording") return;
    if (snapshot.state !== "completed" || !snapshot.blob) return;
    if (!ACTIVE_RECORDING_STATES.has(prevState)) return;

    void transcribeBlob(snapshot.blob, snapshot.durationMs);
  }, [phase, snapshot.blob, snapshot.durationMs, snapshot.state, transcribeBlob]);

  useEffect(() => {
    return () => {
      if (phaseRef.current === "recording") {
        void sessionRef.current.stop().catch(() => undefined);
        sessionRef.current.reset();
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    if (disabled || phase !== "idle") return;

    try {
      sessionRef.current.reset();
      await sessionRef.current.init();
      sessionRef.current.start();
      setPhase("recording");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not access microphone";
      onError?.(message);
      sessionRef.current.reset();
      setPhase("idle");
    }
  }, [disabled, onError, phase]);

  const finishRecording = useCallback(async () => {
    if (phase !== "recording" || processingRef.current) return;

    try {
      if (snapshot.state !== "completed") {
        await sessionRef.current.stop();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Recording failed";
      onError?.(message);
      sessionRef.current.reset();
      setPhase("idle");
    }
  }, [onError, phase, snapshot.state]);

  const toggle = useCallback(async () => {
    if (disabled || phase === "transcribing" || isBusy) return;
    if (phase === "recording" || isRecording) {
      await finishRecording();
      return;
    }
    await startRecording();
  }, [disabled, finishRecording, isBusy, isRecording, phase, startRecording]);

  const cancel = useCallback(() => {
    if (phase !== "recording") return;
    void sessionRef.current.stop().catch(() => undefined);
    sessionRef.current.reset();
    setPhase("idle");
  }, [phase]);

  return {
    phase,
    isRecording: phase === "recording" || isRecording,
    isTranscribing: phase === "transcribing",
    isActive: phase !== "idle",
    durationMs: snapshot.durationMs,
    error: snapshot.error,
    toggle,
    cancel,
  };
}
