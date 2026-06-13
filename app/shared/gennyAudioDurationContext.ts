import { createContext, useContext } from "react";

export const GennyAudioDurationContext = createContext<number | undefined>(undefined);

export function useGennyAudioDurationHint(): number | undefined {
  return useContext(GennyAudioDurationContext);
}

export function resolvePlaybackDuration(
  duration: number,
  knownDurationSec?: number
): number {
  if (Number.isFinite(duration) && duration > 0 && duration !== Infinity) return duration;
  if (knownDurationSec != null && knownDurationSec > 0) return knownDurationSec;
  return 0;
}

export function playbackProgressRatio(
  currentTime: number,
  duration: number,
  knownDurationSec?: number
): number {
  const total = resolvePlaybackDuration(duration, knownDurationSec);
  if (total <= 0) return 0;
  return Math.max(0, Math.min(1, currentTime / total));
}
