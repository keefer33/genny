import { Player, type PlayerRef } from "@remotion/player";
import { Box } from "@mantine/core";
import { useResizeObserver } from "@mantine/hooks";
import { useMemo } from "react";
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

export function StoryboardPlayerViewport({
  compositionWidth,
  compositionHeight,
  durationInFrames,
  fps,
  inputProps,
  playerRef,
  zoom,
  playerKey,
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
