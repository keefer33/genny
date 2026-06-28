import { Player, type PlayerRef } from "@remotion/player";
import { MyComposition } from "./remotion/Composition";
import type { StoryboardCompositionProps } from "./remotion/sceneLayerTypes";
import { Box, Button, Group, Loader, Paper, ScrollArea, Stack, Text, Title } from "@mantine/core";
import { RiArrowLeftLine, RiFilmLine } from "@remixicon/react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import useAppStore from "~/lib/stores/appStore";
import useStoryboardsStore from "~/lib/stores/storyboardsStore";
import { StoryboardSceneList } from "~/pages/storyboards/components/StoryboardSceneList";
import { StoryboardTimeline } from "~/pages/storyboards/components/StoryboardTimeline";
import { SceneTransitionModal } from "~/pages/storyboards/components/SceneTransitionModal";
import { EditLayerModal } from "~/pages/storyboards/components/EditLayerModal";
import { StoryboardSceneUpsertModal } from "~/pages/storyboards/components/StoryboardSceneUpsertModal";
import {
  buildStoryboardBaseLayers,
  buildStoryboardPlayerScenes,
  DEFAULT_STORYBOARD_FPS,
  getBaseStoryboardScene,
  parseStoryboardSettings,
  regularStoryboardScenes,
  storyboardSeekFrameForSceneId,
  totalStoryboardDurationInFrames,
} from "~/pages/storyboards/storyboardUtils";
import DesktopSplitLayout from "~/shared/DesktopSplitLayout";

const PLAYER_MAX_HEIGHT = 650;

export function meta() {
  return [{ title: "Storyboard" }];
}

export default function Storyboard() {
  const isMobile = useAppStore((s) => s.isMobile);
  const navigate = useNavigate();
  const { storyboardId } = useParams<{ storyboardId: string }>();
  const id = storyboardId?.trim() ?? "";

  const storyboards = useStoryboardsStore((s) => s.storyboards);
  const selectedStoryboard = useStoryboardsStore((s) => s.selectedStoryboard);
  const storyboardScenes = useStoryboardsStore((s) => s.storyboardScenes);
  const selectedStoryboardLoading = useStoryboardsStore((s) => s.selectedStoryboardLoading);
  const setSelectedStoryboard = useStoryboardsStore((s) => s.setSelectedStoryboard);
  const loadStoryboardDetail = useStoryboardsStore((s) => s.loadStoryboardDetail);
  const saveStoryboardSceneLayers = useStoryboardsStore((s) => s.saveStoryboardSceneLayers);
  const renderStoryboard = useStoryboardsStore((s) => s.renderStoryboard);
  const renderStoryboardLoading = useStoryboardsStore((s) => s.renderStoryboardLoading);
  const selectedSceneId = useStoryboardsStore((s) => s.selectedSceneId);
  const selectedLayerId = useStoryboardsStore((s) => s.selectedLayerId);
  const layerItems = useStoryboardsStore((s) => s.layerItems);
  const setSelectedLayerId = useStoryboardsStore((s) => s.setSelectedLayerId);
  const changeLayer = useStoryboardsStore((s) => s.changeLayer);
  const syncSceneSelection = useStoryboardsStore((s) => s.syncSceneSelection);
  const syncLayersFromSelectedScene = useStoryboardsStore((s) => s.syncLayersFromSelectedScene);
  const clearTransitionSaveTimers = useStoryboardsStore((s) => s.clearTransitionSaveTimers);
  const playerRef = useRef<PlayerRef>(null);

  useEffect(() => {
    if (!id) {
      setSelectedStoryboard(null);
      return;
    }

    const fromList = storyboards.find((row) => row.id === id);
    if (fromList) {
      setSelectedStoryboard(fromList);
    }

    let cancelled = false;
    void loadStoryboardDetail(id).then((storyboard) => {
      if (cancelled) return;
      if (!storyboard?.id) {
        navigate("/storyboards", { replace: true });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [id, storyboards, loadStoryboardDetail, setSelectedStoryboard, navigate]);

  useEffect(() => {
    syncSceneSelection();
  }, [storyboardScenes, syncSceneSelection]);

  useEffect(() => {
    return () => {
      clearTransitionSaveTimers();
    };
  }, [clearTransitionSaveTimers]);

  useEffect(() => {
    syncLayersFromSelectedScene();
  }, [selectedSceneId, storyboardScenes, syncLayersFromSelectedScene]);

  const regularScenes = useMemo(
    () => regularStoryboardScenes(storyboardScenes),
    [storyboardScenes]
  );

  const totalDurationInFrames = useMemo(
    () => Math.max(1, totalStoryboardDurationInFrames(storyboardScenes)),
    [storyboardScenes]
  );

  const selectedRegularSceneIndex = useMemo(
    () => regularScenes.findIndex((scene) => scene.id === selectedSceneId),
    [regularScenes, selectedSceneId]
  );

  const isBaseSceneSelected = useMemo(() => {
    const baseScene = getBaseStoryboardScene(storyboardScenes);
    return Boolean(baseScene && baseScene.id === selectedSceneId);
  }, [storyboardScenes, selectedSceneId]);

  useEffect(() => {
    if (!selectedSceneId) return;

    const layer =
      selectedLayerId && selectedSceneId
        ? layerItems.find((row) => row.id === selectedLayerId)
        : undefined;
    const frame = storyboardSeekFrameForSceneId(storyboardScenes, selectedSceneId, layer?.from);
    const clampedFrame = Math.min(Math.max(0, frame), Math.max(0, totalDurationInFrames - 1));
    playerRef.current?.seekTo(clampedFrame);
  }, [selectedSceneId, selectedLayerId, storyboardScenes, totalDurationInFrames]);

  const settings = useMemo(
    () => parseStoryboardSettings(selectedStoryboard?.settings),
    [selectedStoryboard?.settings]
  );

  const playerScenes = useMemo(
    () => buildStoryboardPlayerScenes(storyboardScenes, selectedSceneId, layerItems),
    [storyboardScenes, selectedSceneId, layerItems]
  );

  const baseLayers = useMemo(
    () => buildStoryboardBaseLayers(storyboardScenes, selectedSceneId, layerItems),
    [storyboardScenes, selectedSceneId, layerItems]
  );

  const handleLayersPersist = useCallback(() => {
    if (!selectedSceneId) return;
    const layers = useStoryboardsStore.getState().layerItems;
    void saveStoryboardSceneLayers(id, selectedSceneId, layers, { silent: true });
  }, [id, saveStoryboardSceneLayers, selectedSceneId]);

  const playerInputProps = useMemo<StoryboardCompositionProps>(
    () => ({
      width: settings.width ?? 1920,
      height: settings.height ?? 1080,
      fps: settings.fps ?? DEFAULT_STORYBOARD_FPS,
      durationInFrames: totalDurationInFrames,
      scenes: playerScenes,
      baseLayers,
      selectedSceneIndex: selectedRegularSceneIndex >= 0 ? selectedRegularSceneIndex : null,
      isBaseSceneSelected,
      background: { type: "color", value: "#000000" },
      layers: [],
      selectedLayerId,
      setSelectedLayerId,
      changeLayer,
      onLayersPersist: handleLayersPersist,
    }),
    [
      baseLayers,
      changeLayer,
      handleLayersPersist,
      isBaseSceneSelected,
      playerScenes,
      selectedLayerId,
      selectedRegularSceneIndex,
      settings,
      totalDurationInFrames,
    ]
  );

  if (!id) {
    return <Navigate to="/storyboards" replace />;
  }

  const storyboardReady = Boolean(selectedStoryboard?.id === id);
  const playerProps = {
    width: settings.width ?? 1920,
    height: settings.height ?? 1080,
    durationInFrames: totalDurationInFrames,
    fps: settings.fps ?? DEFAULT_STORYBOARD_FPS,
  };

  if (isMobile) {
    return <Box p="xs">Sorry, this page is not available on mobile.</Box>;
  }

  if (selectedStoryboardLoading && !storyboardReady) {
    return (
      <Group justify="center" py="xl">
        <Loader size="sm" />
      </Group>
    );
  }

  if (!storyboardReady) {
    return null;
  }

  return (
    <DesktopSplitLayout>
      <StoryboardSceneUpsertModal mode="create" storyboardId={id} />
      <StoryboardSceneUpsertModal mode="edit" storyboardId={id} />
      <EditLayerModal storyboardId={id} />
      <SceneTransitionModal storyboardId={id} />
      <Paper
        w={420}
        p="sm"
        style={{
          flex: "0 0 auto",
          alignSelf: "stretch",
          minHeight: 0,
          maxHeight: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Stack
          gap="xs"
          style={{
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Group gap="xs" justify="space-between" wrap="nowrap">
            <Button
              component={Link}
              to="/storyboards"
              size="compact-xs"
              variant="filled"
              leftSection={<RiArrowLeftLine size={16} />}
            >
              Storyboards
            </Button>
            <Button
              size="compact-xs"
              variant="light"
              leftSection={<RiFilmLine size={16} />}
              loading={renderStoryboardLoading}
              disabled={regularScenes.length === 0}
              onClick={() => void renderStoryboard(id)}
            >
              Render video
            </Button>
          </Group>
          <Title order={4} lineClamp={1}>
            {selectedStoryboard?.title?.trim() || "Untitled storyboard"}
          </Title>
          {regularScenes.length > 0 ? (
            <Text size="xs" c="dimmed">
              {regularScenes.length} scene{regularScenes.length === 1 ? "" : "s"} ·{" "}
              {totalDurationInFrames} frames total
            </Text>
          ) : null}
          <ScrollArea style={{ flex: 1, minHeight: 0 }} type="auto" offsetScrollbars="y">
            <StoryboardSceneList storyboardId={id} />
          </ScrollArea>
        </Stack>
      </Paper>
      <Box
        style={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          width: "100%",
        }}
        pt="xs"
      >
        {regularScenes.length > 0 ? (
          <Stack
            gap={0}
            style={{ flex: 1, minHeight: 0, minWidth: 0, overflow: "hidden", width: "100%" }}
          >
            <Box
              style={{
                flex: "0 0 auto",
                position: "relative",
                width: "100%",
                height: PLAYER_MAX_HEIGHT,
                maxHeight: PLAYER_MAX_HEIGHT,
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
                  aspectRatio: `${playerProps.width} / ${playerProps.height}`,
                  maxHeight: "100%",
                  maxWidth: "100%",
                }}
              >
                <Player
                  ref={playerRef}
                  key={`${id}-${storyboardScenes.length}`}
                  component={MyComposition}
                  durationInFrames={playerProps.durationInFrames}
                  fps={playerProps.fps}
                  compositionWidth={playerProps.width}
                  compositionHeight={playerProps.height}
                  inputProps={playerInputProps}
                  overflowVisible
                  controls
                  style={{ width: "100%" }}
                />
              </Box>
            </Box>
            <StoryboardTimeline
              storyboardId={id}
              playerRef={playerRef}
              totalDurationInFrames={totalDurationInFrames}
              fps={playerProps.fps}
            />
          </Stack>
        ) : (
          <Text size="sm" c="dimmed" p="md">
            Add a scene to start editing.
          </Text>
        )}
      </Box>
    </DesktopSplitLayout>
  );
}
