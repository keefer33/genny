import { Audio, type AudioProps } from "@gfazioli/mantine-audio";
import { Box, type BoxProps } from "@mantine/core";
import type { MouseEvent, PointerEvent, ReactNode } from "react";

export type GennyAudioPlayerProps = Omit<AudioProps, "src"> & {
  /** Audio URL. When empty, renders `emptyFallback` or nothing. */
  src: string | null | undefined;
  /** Shown when `src` is missing */
  emptyFallback?: ReactNode;
  /** Compact inline layout for cards, grids, and lists */
  compact?: boolean;
  /** Waveform above the control bar */
  showWaveform?: boolean;
  /** Prevent parent click handlers (e.g. clickable cards) */
  stopPropagation?: boolean;
  /** Wrapper box props (width, padding, etc.) */
  wrapperProps?: BoxProps;
};

/**
 * Mantine-native audio player ([@gfazioli/mantine-audio](https://gfazioli.github.io/mantine-audio/))
 * with Genny defaults for remote files and embedded layouts.
 */
export function GennyAudioPlayer({
  src,
  emptyFallback = null,
  compact = false,
  showWaveform = false,
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

  const blockParentActivation = (event: MouseEvent | PointerEvent) => {
    if (stopPropagation) event.stopPropagation();
  };

  const player = showWaveform ? (
    <Audio
      src={url}
      size={size}
      variant={variant}
      crossOrigin={crossOrigin}
      preload={preload}
      shortcuts={shortcuts}
      controls={false}
      color="var(--mantine-color-primary)"
      w="100%"
      {...audioProps}
    >
      <Audio.Waveform height={waveformHeight} />
      <Audio.Controls />
    </Audio>
  ) : (
    <Audio
      src={url}
      size={size}
      variant={variant}
      crossOrigin={crossOrigin}
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
