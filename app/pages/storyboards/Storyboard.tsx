import type { StoryboardCompositionProps } from "./remotion/sceneLayerTypes";
import { AppShell, Box, Button, Center, Group, Loader, Stack, Text, Title } from "@mantine/core";
import { RiArrowLeftLine, RiFilmLine } from "@remixicon/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { useUserProfileUsageBalanceRealtime } from "~/lib/hooks/useUserRealtimeChannels";
import useAppStore from "~/lib/stores/appStore";
import useStoryboardsStore from "~/lib/stores/storyboardsStore";
import {
  StoryboardPlayerToolbar,
  clampPlayerZoom,
  PLAYER_ZOOM_STEP,
} from "~/pages/storyboards/components/StoryboardPlayerToolbar";
import { StoryboardPlayerViewport } from "~/pages/storyboards/components/StoryboardPlayerViewport";
import { StoryboardSceneList } from "~/pages/storyboards/components/StoryboardSceneList";
import { StoryboardTimeline } from "~/pages/storyboards/components/StoryboardTimeline";
import { StoryboardEditorAside } from "~/pages/storyboards/components/StoryboardEditorAside";
import {
  buildStoryboardBaseLayers,
  buildStoryboardPlayerScenes,
  DEFAULT_STORYBOARD_FPS,
  getBaseStoryboardScene,
  parseStoryboardSettings,
  regularStoryboardScenes,
  sceneBackgroundData,
  storyboardSeekFrameForSceneId,
  totalStoryboardDurationInFrames,
} from "~/pages/storyboards/storyboardUtils";
import { CostBadge } from "~/shared/CostBadge";
import type { PlayerRef } from "@remotion/player";

const EDITOR_HEADER_HEIGHT = 60;
const EDITOR_NAVBAR_WIDTH = 250;
const EDITOR_ASIDE_WIDTH = 320;
const EDITOR_FOOTER_HEIGHT = 220;

export function meta() {
  return [{ title: "Storyboard" }];
}

export default function Storyboard() {
  const { getCurrentUserUsageBalance, getUser, isMobile, themeSettings } = useAppStore();
  const userId = getUser()?.user?.id;
  useUserProfileUsageBalanceRealtime(userId);

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
  const [playerZoom, setPlayerZoom] = useState(1);

  const handlePlayerZoomIn = useCallback(() => {
    setPlayerZoom((current) => clampPlayerZoom(current + PLAYER_ZOOM_STEP));
  }, []);

  const handlePlayerZoomOut = useCallback(() => {
    setPlayerZoom((current) => clampPlayerZoom(current - PLAYER_ZOOM_STEP));
  }, []);

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
      background: sceneBackgroundData("color", "#000000"),
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

  const shellBg = themeSettings.colorScheme === "dark" ? "dark.7" : "white";

  return (
    <>
      <AppShell
        //layout="alt"
        h="100%"
        header={{ height: EDITOR_HEADER_HEIGHT }}
        navbar={{ width: EDITOR_NAVBAR_WIDTH, breakpoint: "sm" }}
        aside={{ width: EDITOR_ASIDE_WIDTH, breakpoint: "md" }}
        footer={{ height: EDITOR_FOOTER_HEIGHT }}
        padding="0"
        withBorder={false}
      >
        <AppShell.Header bg={shellBg} withBorder>
          <Group h="100%" px="md" justify="space-between" wrap="nowrap" gap="md">
            <Group gap="md" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
              <Group gap="xs" wrap="nowrap">
                <Button
                  component={Link}
                  to="/storyboards"
                  size="compact-sm"
                  variant="filled"
                  leftSection={<RiArrowLeftLine size={16} />}
                >
                  Storyboards
                </Button>
                <Button
                  size="compact-sm"
                  variant="light"
                  leftSection={<RiFilmLine size={16} />}
                  loading={renderStoryboardLoading}
                  disabled={regularScenes.length === 0}
                  onClick={() => void renderStoryboard(id)}
                >
                  Render video
                </Button>
              </Group>
              <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                <Title order={4} lineClamp={1}>
                  {selectedStoryboard?.title?.trim() || "Untitled storyboard"}
                </Title>
                {regularScenes.length > 0 ? (
                  <Text size="xs" c="dimmed" lineClamp={1}>
                    {regularScenes.length} scene{regularScenes.length === 1 ? "" : "s"} ·{" "}
                    {totalDurationInFrames} frames total
                  </Text>
                ) : null}
              </Stack>
            </Group>
            <Group gap="md" wrap="nowrap">
              {regularScenes.length > 0 ? (
                <StoryboardPlayerToolbar
                  zoom={playerZoom}
                  onZoomIn={handlePlayerZoomIn}
                  onZoomOut={handlePlayerZoomOut}
                />
              ) : null}
              <CostBadge cost={getCurrentUserUsageBalance()} />
            </Group>
          </Group>
        </AppShell.Header>

        <AppShell.Navbar p={0} bg={shellBg} withBorder>
          <StoryboardSceneList storyboardId={id} />
        </AppShell.Navbar>

        <AppShell.Aside p={0} bg={shellBg} withBorder>
          <StoryboardEditorAside storyboardId={id} />
        </AppShell.Aside>

        <AppShell.Main
          bg="var(--mantine-color-body)"
          style={{
            // Definite height so the absolute viewport can be measured by useResizeObserver.
            position: "relative",
            height: "100dvh",
            width: "100dvw",
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          {regularScenes.length > 0 ? (
            <StoryboardPlayerViewport
              compositionWidth={playerProps.width}
              compositionHeight={playerProps.height}
              durationInFrames={playerProps.durationInFrames}
              fps={playerProps.fps}
              inputProps={playerInputProps}
              playerRef={playerRef}
              zoom={playerZoom}
              playerKey={`${id}-${storyboardScenes.length}`}
            />
          ) : (
            <Center h="100%">
              <Text size="sm" c="dimmed">
                Add a scene to start editing.
              </Text>
            </Center>
          )}
        </AppShell.Main>

        <AppShell.Footer bg={shellBg} withBorder p={0}>
          <Box h="100%" style={{ overflow: "hidden" }}>
            {regularScenes.length > 0 ? (
              <StoryboardTimeline
                storyboardId={id}
                playerRef={playerRef}
                totalDurationInFrames={totalDurationInFrames}
                fps={playerProps.fps}
              />
            ) : null}
          </Box>
        </AppShell.Footer>
      </AppShell>
    </>
  );
}
