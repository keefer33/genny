import { Audio, useAudioContext, type AudioProps } from "@gfazioli/mantine-audio";
import { Box, Text, type BoxProps } from "@mantine/core";
import type { MouseEvent, PointerEvent, ReactNode } from "react";
import { formatAudioDurationSeconds } from "~/lib/recording/formatDuration";
import { GennyAudioTimeline } from "~/shared/GennyAudioTimeline";
import { GennyAudioWaveform } from "~/shared/GennyAudioWaveform";
import {
  GennyAudioDurationContext,
  resolvePlaybackDuration,
  useGennyAudioDurationHint,
} from "~/shared/gennyAudioDurationContext";

export type GennyAudioPlayerProps = Omit<AudioProps, "src"> & {
  /** Audio URL. When empty, renders `emptyFallback` or nothing. */
  src: string | null | undefined;
  /** Shown when `src` is missing */
  emptyFallback?: ReactNode;
  /** Compact inline layout for cards, grids, and lists */
  compact?: boolean;
  /** Waveform above the control bar */
  showWaveform?: boolean;
  /**
   * Fallback total duration when browser metadata is missing (common for MediaRecorder blobs).
   */
  knownDurationSec?: number;
  /** Prevent parent click handlers (e.g. clickable cards) */
  stopPropagation?: boolean;
  /** Wrapper box props (width, padding, etc.) */
  wrapperProps?: BoxProps;
};

function GennyAudioTimeDisplay() {
  const knownDurationSec = useGennyAudioDurationHint();
  const ctx = useAudioContext();
  const duration = resolvePlaybackDuration(ctx.duration, knownDurationSec);
  return (
    <Text size="sm" ff="monospace" ta="center" {...ctx.getStyles("timeDisplay")}>
      {formatAudioDurationSeconds(ctx.currentTime)} / {formatAudioDurationSeconds(duration)}
    </Text>
  );
}

/**
 * Mantine-native audio player ([@gfazioli/mantine-audio](https://gfazioli.github.io/mantine-audio/))
 * with Genny defaults for remote files and embedded layouts.
 */
export function GennyAudioPlayer({
  src,
  emptyFallback = null,
  compact = false,
  showWaveform = false,
  knownDurationSec,
  stopPropagation = false,
  wrapperProps,
  size = compact ? "xs" : "sm",
  variant = compact ? "minimal" : "bordered",
  crossOrigin = "anonymous",
  preload = "metadata",
  shortcuts = false,
  controls = !showWaveform,
  waveformHeight = compact ? 40 : 56,
  ...audioProps
}: GennyAudioPlayerProps & { waveformHeight?: number }) {
  const url = src?.trim();
  if (!url) return <>{emptyFallback}</>;

  const resolvedCrossOrigin =
    crossOrigin === "anonymous" && (url.startsWith("blob:") || url.startsWith("data:"))
      ? ""
      : crossOrigin;

  const blockParentActivation = (event: MouseEvent | PointerEvent) => {
    if (stopPropagation) event.stopPropagation();
  };

  const player = showWaveform ? (
    <GennyAudioDurationContext.Provider value={knownDurationSec}>
      <Audio
        src={url}
        size={size}
        variant={variant}
        crossOrigin={resolvedCrossOrigin}
        preload={preload}
        shortcuts={shortcuts}
        controls={false}
        color="var(--mantine-color-primary)"
        w="100%"
        {...audioProps}
      >
        <GennyAudioWaveform height={waveformHeight} />
        <Audio.Controls>
          <Audio.PlayButton />
          <GennyAudioTimeline />
          <GennyAudioTimeDisplay />
          <Audio.MuteButton />
          <Audio.VolumeSlider />
        </Audio.Controls>
      </Audio>
    </GennyAudioDurationContext.Provider>
  ) : (
    <Audio
      src={url}
      size={size}
      variant={variant}
      crossOrigin={resolvedCrossOrigin}
      preload={preload}
      shortcuts={shortcuts}
      controls={controls}
      color="var(--mantine-color-primary)"
      w="100%"
      {...audioProps}
    />
  );

  return (
    <Box
      w="100%"
      onClick={blockParentActivation}
      onPointerDown={blockParentActivation}
      {...wrapperProps}
    >
      {player}
    </Box>
  );
}
