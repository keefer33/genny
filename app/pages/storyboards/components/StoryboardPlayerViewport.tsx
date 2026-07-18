import { Player, type PlayerRef } from "@remotion/player";
import { Box } from "@mantine/core";
import { useResizeObserver } from "@mantine/hooks";
import { useEffect, useMemo } from "react";
import { MyComposition } from "~/pages/storyboards/remotion/Composition";
import type { StoryboardCompositionProps } from "~/pages/storyboards/remotion/sceneLayerTypes";

type StoryboardPlayerViewportProps = {
  compositionWidth: number;
  compositionHeight: number;
  durationInFrames: number;
  fps: number;
  inputProps: StoryboardCompositionProps;
  playerRef: React.RefObject<PlayerRef | null>;
  zoom: number;
  playerKey: string;
  /** Re-run first-frame paint nudge when the editor seeks (e.g. scene select). */
  paintNudgeKey?: string | number | null;
  /** When set, flipped true during paint-nudge seeks so the timeline playhead stays put. */
  suppressPlayheadSyncRef?: React.MutableRefObject<boolean>;
};

/** Contain the composition in the measured viewport (Remotion fit). */
function fitPlayerSize(
  containerWidth: number,
  containerHeight: number,
  compositionWidth: number,
  compositionHeight: number,
  zoom: number
): { width: number; height: number } | null {
  if (containerWidth <= 0 || containerHeight <= 0) return null;
  const scale =
    Math.min(containerWidth / compositionWidth, containerHeight / compositionHeight) * zoom;
  if (!Number.isFinite(scale) || scale <= 0) return null;
  return {
    width: compositionWidth * scale,
    height: compositionHeight * scale,
  };
}

function mediaSignatureFromProps(inputProps: StoryboardCompositionProps): string {
  const parts: string[] = [];
  const scenes = inputProps.scenes ?? [];
  for (const scene of scenes) {
    if (scene.background?.type === "video" && scene.background.value?.trim()) {
      parts.push(`b:${scene.background.value.trim()}`);
    }
    for (const layer of scene.layers ?? []) {
      const content = layer.content;
      if (content?.type === "video" && content.url?.trim()) {
        parts.push(`l:${content.url.trim()}`);
      }
    }
  }
  const bg = inputProps.background;
  if (bg?.type === "video" && bg.value?.trim()) {
    parts.push(`root:${bg.value.trim()}`);
  }
  return parts.join("|");
}

export function StoryboardPlayerViewport({
  compositionWidth,
  compositionHeight,
  durationInFrames,
  fps,
  inputProps,
  playerRef,
  zoom,
  playerKey,
  paintNudgeKey,
  suppressPlayheadSyncRef,
}: StoryboardPlayerViewportProps) {
  const [viewportRef, viewportRect] = useResizeObserver<HTMLDivElement>();

  const playerSize = useMemo(
    () =>
      fitPlayerSize(
        viewportRect.width,
        viewportRect.height,
        compositionWidth,
        compositionHeight,
        zoom
      ),
    [viewportRect.width, viewportRect.height, compositionWidth, compositionHeight, zoom]
  );

  const mediaSignature = useMemo(() => mediaSignatureFromProps(inputProps), [inputProps]);
  const hasMedia = mediaSignature.length > 0;

  // @remotion/media Video often mounts paused without painting until the timeline moves.
  // Quiet neighbor-frame seeks (playhead sync suppressed) — at most one in flight.
  useEffect(() => {
    if (!playerSize || !hasMedia) return;

    let cancelled = false;
    let inFlight = false;
    const timers: number[] = [];
    const delaysMs = [500, 1800];

    const endSuppress = () => {
      if (suppressPlayheadSyncRef) {
        suppressPlayheadSyncRef.current = false;
      }
    };

    const nudge = () => {
      if (cancelled || inFlight) return;
      const player = playerRef.current;
      if (!player || player.isPlaying()) return;
      const current = player.getCurrentFrame();
      const maxFrame = Math.max(0, durationInFrames - 1);
      if (maxFrame <= 0) return;
      const neighbor = current >= maxFrame ? current - 1 : current + 1;

      inFlight = true;
      if (suppressPlayheadSyncRef) {
        suppressPlayheadSyncRef.current = true;
      }
      player.seekTo(neighbor);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          timers.push(
            window.setTimeout(() => {
              if (cancelled) {
                endSuppress();
                inFlight = false;
                return;
              }
              if (!player.isPlaying() && player.getCurrentFrame() === neighbor) {
                player.seekTo(current);
              }
              endSuppress();
              inFlight = false;
            }, 48)
          );
        });
      });
    };

    for (const delay of delaysMs) {
      timers.push(window.setTimeout(nudge, delay));
    }

    return () => {
      cancelled = true;
      endSuppress();
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, [
    playerKey,
    paintNudgeKey,
    hasMedia,
    durationInFrames,
    playerRef,
    playerSize,
    suppressPlayheadSyncRef,
  ]);

  return (
    <Box
      ref={viewportRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
      }}
    >
      <Box
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          margin: "auto",
          aspectRatio: `${compositionWidth} / ${compositionHeight}`,
          maxHeight: "100%",
          maxWidth: "100%",
        }}
      >
        {playerSize ? (
          <Player
            ref={playerRef}
            key={playerKey}
            component={MyComposition}
            durationInFrames={durationInFrames}
            fps={fps}
            compositionWidth={compositionWidth}
            compositionHeight={compositionHeight}
            inputProps={inputProps}
            overflowVisible
            controls
            style={{
              width: playerSize.width,
              height: playerSize.height,
            }}
          />
        ) : null}
      </Box>
    </Box>
  );
}
