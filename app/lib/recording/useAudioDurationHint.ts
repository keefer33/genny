import { useEffect, useState } from "react";

function isUsableDuration(seconds: number): boolean {
  return Number.isFinite(seconds) && seconds > 0;
}

/**
 * Best-effort duration for players when file metadata is missing (e.g. MediaRecorder WebM).
 * Prefers `fallbackSec`, then probes `src` metadata.
 */
export function useAudioDurationHint(
  src: string | undefined,
  fallbackSec?: number
): number | undefined {
  const [probedSec, setProbedSec] = useState<number | undefined>();

  useEffect(() => {
    const url = src?.trim();
    if (!url) {
      setProbedSec(undefined);
      return;
    }

    const audio = document.createElement("audio");
    audio.preload = "metadata";
    if (url.startsWith("blob:") || url.startsWith("data:")) {
      audio.removeAttribute("crossorigin");
    } else {
      audio.crossOrigin = "anonymous";
    }

    const onLoadedMetadata = () => {
      if (isUsableDuration(audio.duration)) {
        setProbedSec(audio.duration);
      }
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.src = url;

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.src = "";
      setProbedSec(undefined);
    };
  }, [src]);

  if (fallbackSec != null && fallbackSec > 0) return fallbackSec;
  return probedSec;
}
