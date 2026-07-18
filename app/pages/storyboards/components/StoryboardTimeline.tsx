import { Box, ScrollArea, Text } from "@mantine/core";
import type { PlayerRef } from "@remotion/player";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useStoryboardsStore from "~/lib/stores/storyboardsStore";
import { buildStoryboardTimelineTracks } from "~/pages/storyboards/storyboardUtils";

const PX_PER_FRAME = 5;
const RULER_HEIGHT = 24;
const SCENE_ROW_HEIGHT = 34;
const LAYER_ROW_HEIGHT = 28;
const ROW_GAP = 4;
const TRACK_PADDING_X = 8;

type StoryboardTimelineProps = {
  storyboardId: string;
  playerRef: React.RefObject<PlayerRef | null>;
  totalDurationInFrames: number;
  fps: number;
  /** Remount / ready signal so listeners attach after Player exists. */
  playerKey?: string;
  /** Skip playhead updates while paint-nudge seeks are in flight. */
  suppressPlayheadSyncRef?: React.RefObject<boolean>;
};

function frameFromPointerX(
  clientX: number,
  contentLeft: number,
  scrollLeft: number,
  totalDurationInFrames: number
): number {
  const x = clientX - contentLeft + scrollLeft - TRACK_PADDING_X;
  const frame = Math.round(x / PX_PER_FRAME);
  return Math.min(Math.max(0, frame), Math.max(0, totalDurationInFrames - 1));
}

export function StoryboardTimeline({
  storyboardId,
  playerRef,
  totalDurationInFrames,
  fps,
  playerKey,
  suppressPlayheadSyncRef,
}: StoryboardTimelineProps) {
  const storyboardScenes = useStoryboardsStore((s) => s.storyboardScenes);
  const selectedSceneId = useStoryboardsStore((s) => s.selectedSceneId);
  const selectedLayerId = useStoryboardsStore((s) => s.selectedLayerId);
  const layerItems = useStoryboardsStore((s) => s.layerItems);
  const selectStoryboardScene = useStoryboardsStore((s) => s.selectStoryboardScene);
  const selectStoryboardLayer = useStoryboardsStore((s) => s.selectStoryboardLayer);

  const [currentFrame, setCurrentFrame] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const isScrubbingRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  isScrubbingRef.current = isScrubbing;

  const tracks = useMemo(
    () => buildStoryboardTimelineTracks(storyboardScenes, selectedSceneId, layerItems),
    [storyboardScenes, selectedSceneId, layerItems]
  );

  const timelineWidth = Math.max(totalDurationInFrames * PX_PER_FRAME, 1);
  const contentWidth = timelineWidth + TRACK_PADDING_X * 2;

  const rows = useMemo(() => {
    const result: Array<
      | {
          kind: "scene";
          sceneId: string;
          title: string;
          startFrame: number;
          durationInFrames: number;
        }
      | {
          kind: "layer";
          sceneId: string;
          layerId: string;
          title: string;
          startFrame: number;
          durationInFrames: number;
          color: string;
        }
    > = [];

    for (const scene of tracks.scenes) {
      result.push({
        kind: "scene",
        sceneId: scene.sceneId,
        title: scene.title,
        startFrame: scene.startFrame,
        durationInFrames: scene.durationInFrames,
      });
      const sceneLayers = tracks.layers.filter((layer) => layer.sceneId === scene.sceneId);
      for (const layer of sceneLayers) {
        result.push({
          kind: "layer",
          sceneId: layer.sceneId,
          layerId: layer.layerId,
          title: layer.title,
          startFrame: layer.startFrame,
          durationInFrames: layer.durationInFrames,
          color: layer.color,
        });
      }
    }

    return result;
  }, [tracks]);

  const bodyHeight =
    rows.length > 0
      ? rows.reduce(
          (sum, row) =>
            sum + (row.kind === "scene" ? SCENE_ROW_HEIGHT : LAYER_ROW_HEIGHT) + ROW_GAP,
          0
        ) - ROW_GAP
      : SCENE_ROW_HEIGHT;

  const seekToFrame = useCallback(
    (frame: number) => {
      const clamped = Math.min(Math.max(0, frame), Math.max(0, totalDurationInFrames - 1));
      setCurrentFrame(clamped);
      playerRef.current?.seekTo(clamped);
    },
    [playerRef, totalDurationInFrames]
  );

  const updateFrameFromPointer = useCallback(
    (clientX: number) => {
      const content = contentRef.current;
      if (!content) return;
      const rect = content.getBoundingClientRect();
      const scrollLeft = scrollRef.current?.scrollLeft ?? 0;
      seekToFrame(frameFromPointerX(clientX, rect.left, scrollLeft, totalDurationInFrames));
    },
    [seekToFrame, totalDurationInFrames]
  );

  useEffect(() => {
    let cancelled = false;
    let remove: (() => void) | undefined;
    let intervalId: number | undefined;

    const attach = (): boolean => {
      if (cancelled) return true;
      const player = playerRef.current;
      if (!player) return false;

      const onFrameUpdate = (event: { detail: { frame: number } }) => {
        if (isScrubbingRef.current) return;
        if (suppressPlayheadSyncRef?.current) return;
        setCurrentFrame(event.detail.frame);
      };

      player.addEventListener("frameupdate", onFrameUpdate);
      player.addEventListener("seeked", onFrameUpdate);
      setCurrentFrame(player.getCurrentFrame());
      remove = () => {
        player.removeEventListener("frameupdate", onFrameUpdate);
        player.removeEventListener("seeked", onFrameUpdate);
      };
      return true;
    };

    if (!attach()) {
      // Player mounts after viewport measure — retry until ref is set.
      intervalId = window.setInterval(() => {
        if (attach() && intervalId !== undefined) {
          window.clearInterval(intervalId);
        }
      }, 50);
    }

    return () => {
      cancelled = true;
      if (intervalId !== undefined) window.clearInterval(intervalId);
      remove?.();
    };
  }, [playerRef, playerKey, storyboardScenes.length, suppressPlayheadSyncRef]);

  useEffect(() => {
    if (!isScrubbing) return;

    const onPointerMove = (event: PointerEvent) => {
      updateFrameFromPointer(event.clientX);
    };
    const onPointerUp = () => {
      setIsScrubbing(false);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [isScrubbing, updateFrameFromPointer]);

  const rulerMarks = useMemo(() => {
    const secondsPerMark = totalDurationInFrames / fps > 30 ? 5 : 1;
    const framesPerMark = Math.max(1, Math.round(secondsPerMark * fps));
    const marks: number[] = [];
    for (let frame = 0; frame <= totalDurationInFrames; frame += framesPerMark) {
      marks.push(frame);
    }
    return marks;
  }, [fps, totalDurationInFrames]);

  const playheadLeft = TRACK_PADDING_X + currentFrame * PX_PER_FRAME;

  return (
    <Box
      style={{
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        background: "var(--mantine-color-body)",
        overflow: "hidden",
      }}
    >
      <Box
        px="xs"
        py={6}
        bg="var(--mantine-color-default)"
        style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}
      >
        <Text size="xs">
          Timeline · frame {currentFrame} / {Math.max(0, totalDurationInFrames - 1)} ·{" "}
          {(currentFrame / fps).toFixed(2)}s
        </Text>
      </Box>

      <ScrollArea
        style={{ flex: 1, minHeight: 0 }}
        type="auto"
        offsetScrollbars="x"
        viewportRef={scrollRef}
      >
        <Box
          ref={contentRef}
          style={{
            position: "relative",
            width: contentWidth,
            minHeight: RULER_HEIGHT + bodyHeight + 12,
            userSelect: isScrubbing ? "none" : undefined,
          }}
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            const target = event.target as HTMLElement;
            if (target.closest("[data-timeline-block]")) return;
            setIsScrubbing(true);
            updateFrameFromPointer(event.clientX);
          }}
        >
          <Box
            style={{
              position: "sticky",
              top: 0,
              zIndex: 4,
              width: contentWidth,
              height: RULER_HEIGHT,
              background: "var(--mantine-color-body)",
              borderBottom: "1px solid var(--mantine-color-default-border)",
            }}
          >
            {rulerMarks.map((frame) => (
              <Box
                key={frame}
                style={{
                  position: "absolute",
                  left: TRACK_PADDING_X + frame * PX_PER_FRAME,
                  top: 0,
                  height: "100%",
                  borderLeft: "1px solid var(--mantine-color-default-border)",
                  paddingLeft: 4,
                  paddingTop: 4,
                }}
              >
                <Text size="xs" c="dimmed" style={{ whiteSpace: "nowrap" }}>
                  {(frame / fps).toFixed(1)}s
                </Text>
              </Box>
            ))}
          </Box>

          <Box style={{ position: "relative" }}>
            {rows.map((row, index) => {
              const rowHeight = row.kind === "scene" ? SCENE_ROW_HEIGHT : LAYER_ROW_HEIGHT;
              const top =
                RULER_HEIGHT +
                rows
                  .slice(0, index)
                  .reduce(
                    (sum, prev) =>
                      sum + (prev.kind === "scene" ? SCENE_ROW_HEIGHT : LAYER_ROW_HEIGHT) + ROW_GAP,
                    0
                  );
              const isSelected =
                row.kind === "scene"
                  ? row.sceneId === selectedSceneId
                  : row.layerId === selectedLayerId;
              const blockLeft = TRACK_PADDING_X + row.startFrame * PX_PER_FRAME;
              const blockWidth = Math.max(row.durationInFrames * PX_PER_FRAME, 4);

              return (
                <Box
                  key={row.kind === "scene" ? `scene-${row.sceneId}` : `layer-${row.layerId}`}
                  style={{
                    position: "absolute",
                    top,
                    left: 0,
                    width: contentWidth,
                    height: rowHeight,
                  }}
                >
                  <Box
                    data-timeline-block
                    onClick={(event) => {
                      event.stopPropagation();
                      if (row.kind === "scene") {
                        selectStoryboardScene(storyboardId, row.sceneId);
                      } else {
                        selectStoryboardLayer(storyboardId, row.sceneId, row.layerId);
                      }
                    }}
                    style={{
                      position: "absolute",
                      left: blockLeft,
                      width: blockWidth,
                      top: 2,
                      bottom: 2,
                      borderRadius: 4,
                      border: isSelected
                        ? "2px solid var(--mantine-primary-color-filled)"
                        : "1px solid var(--mantine-color-default-border)",
                      background:
                        row.kind === "scene"
                          ? isSelected
                            ? "var(--mantine-primary-color-light)"
                            : "var(--mantine-color-default-hover)"
                          : row.color === "transparent"
                            ? "var(--mantine-color-default)"
                            : row.color,
                      opacity: row.kind === "layer" && row.color === "transparent" ? 0.85 : 1,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      paddingInline: 6,
                      overflow: "hidden",
                      minWidth: 4,
                    }}
                  >
                    <Text size="xs" lineClamp={1} style={{ pointerEvents: "none" }}>
                      {row.title}
                    </Text>
                  </Box>
                </Box>
              );
            })}

            <Box
              onPointerDown={(event) => {
                event.stopPropagation();
                if (event.button !== 0) return;
                setIsScrubbing(true);
                updateFrameFromPointer(event.clientX);
              }}
              style={{
                position: "absolute",
                top: RULER_HEIGHT,
                left: playheadLeft - 6,
                width: 12,
                height: bodyHeight,
                cursor: "ew-resize",
                zIndex: 5,
                touchAction: "none",
              }}
            >
              <Box
                style={{
                  position: "absolute",
                  left: 5,
                  top: 0,
                  bottom: 0,
                  width: 2,
                  background: "var(--mantine-color-red-6)",
                  boxShadow: "0 0 0 1px rgba(0,0,0,0.15)",
                }}
              />
              <Box
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: 12,
                  height: 10,
                  background: "var(--mantine-color-red-6)",
                  borderRadius: 2,
                }}
              />
            </Box>
          </Box>
        </Box>
      </ScrollArea>
    </Box>
  );
}
