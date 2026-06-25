import { Player } from "@remotion/player";
import { MyComposition } from "./remotion/Composition";
import type { StoryboardCompositionProps } from "./remotion/sceneLayerTypes";
import {
  Box,
  Button,
  Group,
  Loader,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Title,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import {
  RiAddLine,
  RiArrowLeftLine,
  RiDeleteBinLine,
  RiFilmLine,
  RiPencilLine,
} from "@remixicon/react";
import { useDisclosure } from "@mantine/hooks";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import useAppStore from "~/lib/stores/appStore";
import useStoryboardsStore from "~/lib/stores/storyboardsStore";
import { SceneLayersPanel } from "~/pages/storyboards/components/SceneLayersPanel";
import { EditLayerModal } from "~/pages/storyboards/components/EditLayerModal";
import { StoryboardSceneUpsertModal } from "~/pages/storyboards/components/StoryboardSceneUpsertModal";
import {
  createDefaultSceneLayer,
  DEFAULT_STORYBOARD_FPS,
  parseSceneBackground,
  parseSceneDurationInFrames,
  parseSceneLayers,
  parseStoryboardSettings,
  type SceneLayer,
  type UserStoryboardScene,
} from "~/pages/storyboards/storyboardUtils";
import DesktopSplitLayout from "~/shared/DesktopSplitLayout";

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
  const createSceneLoading = useStoryboardsStore((s) => s.createSceneLoading);
  const saveLayersLoading = useStoryboardsStore((s) => s.saveLayersLoading);
  const deletingSceneId = useStoryboardsStore((s) => s.deletingSceneId);
  const setSelectedStoryboard = useStoryboardsStore((s) => s.setSelectedStoryboard);
  const loadStoryboardDetail = useStoryboardsStore((s) => s.loadStoryboardDetail);
  const deleteStoryboardScene = useStoryboardsStore((s) => s.deleteStoryboardScene);
  const saveStoryboardSceneLayers = useStoryboardsStore((s) => s.saveStoryboardSceneLayers);
  const renderStoryboard = useStoryboardsStore((s) => s.renderStoryboard);
  const renderStoryboardLoading = useStoryboardsStore((s) => s.renderStoryboardLoading);
  const [createSceneOpened, { open: openCreateScene, close: closeCreateScene }] =
    useDisclosure(false);
  const [editingScene, setEditingScene] = useState<UserStoryboardScene | null>(null);
  const [editSceneOpened, { open: openEditScene, close: closeEditScene }] = useDisclosure(false);
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editLayerOpened, { open: openEditLayer, close: closeEditLayer }] = useDisclosure(false);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [layerItems, setLayerItems] = useState<SceneLayer[]>([]);
  const layerItemsRef = useRef(layerItems);
  layerItemsRef.current = layerItems;

  const selectedScene = useMemo(
    () => storyboardScenes.find((scene) => scene.id === selectedSceneId) ?? null,
    [storyboardScenes, selectedSceneId]
  );

  const editingLayer = useMemo(
    () => layerItems.find((layer) => layer.id === editingLayerId) ?? null,
    [editingLayerId, layerItems]
  );

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
    if (storyboardScenes.length === 0) {
      setSelectedSceneId(null);
      setLayerItems([]);
      setSelectedLayerId(null);
      return;
    }

    setSelectedSceneId((current) => {
      if (current && storyboardScenes.some((scene) => scene.id === current)) {
        return current;
      }
      return storyboardScenes[0]?.id ?? null;
    });
  }, [storyboardScenes]);

  useEffect(() => {
    if (!selectedScene) {
      setLayerItems([]);
      setSelectedLayerId(null);
      return;
    }
    const layers = parseSceneLayers(selectedScene.scene);
    setLayerItems(layers);
    setSelectedLayerId((current) =>
      current && layers.some((layer) => layer.id === current) ? current : null
    );
  }, [selectedScene]);

  const sceneDurationInFrames = useMemo(
    () => parseSceneDurationInFrames(selectedScene?.scene),
    [selectedScene?.scene]
  );

  const storyboardFps = useMemo(() => {
    return parseStoryboardSettings(selectedStoryboard?.settings).fps ?? DEFAULT_STORYBOARD_FPS;
  }, [selectedStoryboard?.settings]);

  if (!id) {
    return <Navigate to="/storyboards" replace />;
  }

  const storyboardReady = Boolean(selectedStoryboard?.id === id);
  const settings = parseStoryboardSettings(selectedStoryboard?.settings);
  const playerProps = {
    width: settings.width ?? 1920,
    height: settings.height ?? 1080,
    durationInFrames: sceneDurationInFrames,
    fps: settings.fps ?? 24,
  };

  const sceneBackground = useMemo(
    () => parseSceneBackground(selectedScene?.scene),
    [selectedScene?.scene]
  );

  const handleLayersPersist = useCallback(() => {
    if (!selectedSceneId) return;
    void saveStoryboardSceneLayers(id, selectedSceneId, layerItemsRef.current, { silent: true });
  }, [id, saveStoryboardSceneLayers, selectedSceneId]);

  const changeLayer = useCallback((layerId: string, updater: (layer: SceneLayer) => SceneLayer) => {
    setLayerItems((prev) => prev.map((layer) => (layer.id === layerId ? updater(layer) : layer)));
  }, []);

  const playerInputProps = useMemo<StoryboardCompositionProps>(
    () => ({
      background: sceneBackground,
      layers: layerItems,
      selectedLayerId,
      setSelectedLayerId,
      changeLayer,
      onLayersPersist: handleLayersPersist,
    }),
    [changeLayer, handleLayersPersist, layerItems, sceneBackground, selectedLayerId]
  );

  const handleAddScene = () => {
    openCreateScene();
  };

  const handleEditScene = (scene: UserStoryboardScene) => {
    setEditingScene(scene);
    openEditScene();
  };

  const handleCloseEditScene = () => {
    closeEditScene();
    setEditingScene(null);
  };

  const handleSelectScene = (sceneId: string) => {
    setSelectedSceneId(sceneId);
    setSelectedLayerId(null);
  };

  const handleAddLayer = async () => {
    if (!selectedSceneId) return;
    const nextLayers = [...layerItems, createDefaultSceneLayer(layerItems, sceneDurationInFrames)];
    setLayerItems(nextLayers);
    setSelectedLayerId(nextLayers[nextLayers.length - 1]?.id ?? null);
    await saveStoryboardSceneLayers(id, selectedSceneId, nextLayers);
  };

  const handleDeleteLayer = async (layerId: string) => {
    if (!selectedSceneId) return;
    const nextLayers = layerItems.filter((layer) => layer.id !== layerId);
    setLayerItems(nextLayers);
    if (selectedLayerId === layerId) {
      setSelectedLayerId(null);
    }
    if (editingLayerId === layerId) {
      setEditingLayerId(null);
      closeEditLayer();
    }
    await saveStoryboardSceneLayers(id, selectedSceneId, nextLayers);
  };

  const handleEditLayer = (layerId: string) => {
    setEditingLayerId(layerId);
    openEditLayer();
  };

  const handleCloseEditLayer = () => {
    closeEditLayer();
    setEditingLayerId(null);
  };

  const handleSaveLayer = async (layer: SceneLayer) => {
    if (!selectedSceneId) return;
    const nextLayers = layerItems.map((item) => (item.id === layer.id ? layer : item));
    setLayerItems(nextLayers);
    await saveStoryboardSceneLayers(id, selectedSceneId, nextLayers);
  };

  const handleRenderVideo = () => {
    void renderStoryboard(id);
  };

  const sceneList = (
    <Stack gap="xs" p="xs">
      <Button
        leftSection={<RiAddLine size={18} />}
        onClick={handleAddScene}
        loading={createSceneLoading}
        fullWidth
      >
        Add scene
      </Button>
      {storyboardScenes.length === 0 ? (
        <Text size="sm" c="dimmed">
          No scenes yet.
        </Text>
      ) : (
        storyboardScenes.map((scene) => {
          const isSelected = scene.id === selectedSceneId;
          return (
            <Group
              key={scene.id}
              justify="space-between"
              wrap="nowrap"
              gap="xs"
              p="xs"
              style={{
                borderRadius: "var(--mantine-radius-sm)",
                background: isSelected ? "var(--mantine-color-blue-light)" : "transparent",
                cursor: "pointer",
              }}
              onClick={() => handleSelectScene(scene.id)}
            >
              <Text size="sm" style={{ flex: 1, minWidth: 0 }} lineClamp={1}>
                {scene.title?.trim() || "Untitled scene"}
              </Text>
              <Group gap={4} wrap="nowrap">
                <Tooltip label="Edit scene">
                  <ActionIcon
                    variant="subtle"
                    aria-label="Edit scene"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleEditScene(scene);
                    }}
                  >
                    <RiPencilLine size={18} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Delete scene">
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    aria-label="Delete scene"
                    loading={deletingSceneId === scene.id}
                    disabled={Boolean(deletingSceneId && deletingSceneId !== scene.id)}
                    onClick={(event) => {
                      event.stopPropagation();
                      void deleteStoryboardScene(id, scene.id);
                    }}
                  >
                    <RiDeleteBinLine size={18} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Group>
          );
        })
      )}
      <SceneLayersPanel
        scene={selectedScene}
        layers={layerItems}
        selectedLayerId={selectedLayerId}
        savingLayers={saveLayersLoading}
        onSelectLayer={setSelectedLayerId}
        onAddLayer={() => void handleAddLayer()}
        onEditLayer={handleEditLayer}
        onDeleteLayer={(layerId) => void handleDeleteLayer(layerId)}
      />
    </Stack>
  );

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
      <StoryboardSceneUpsertModal
        opened={createSceneOpened}
        onClose={closeCreateScene}
        storyboardId={id}
        sceneCount={storyboardScenes.length}
        storyboardFps={storyboardFps}
      />
      <StoryboardSceneUpsertModal
        opened={editSceneOpened}
        onClose={handleCloseEditScene}
        storyboardId={id}
        sceneCount={storyboardScenes.length}
        storyboardFps={storyboardFps}
        scene={editingScene}
      />
      <EditLayerModal
        opened={editLayerOpened}
        onClose={handleCloseEditLayer}
        layer={editingLayer}
        sceneDurationInFrames={sceneDurationInFrames}
        submitting={saveLayersLoading}
        onSave={handleSaveLayer}
      />
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
              disabled={storyboardScenes.length === 0}
              onClick={handleRenderVideo}
            >
              Render video
            </Button>
          </Group>
          <Title order={4} lineClamp={1}>
            {selectedStoryboard?.title?.trim() || "Untitled storyboard"}
          </Title>
          <ScrollArea style={{ flex: 1, minHeight: 0 }} type="auto" offsetScrollbars="y">
            {sceneList}
          </ScrollArea>
        </Stack>
      </Paper>
      <Box
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        pt="xs"
      >
        {selectedScene ? (
          <Player
            component={MyComposition}
            durationInFrames={playerProps.durationInFrames}
            fps={playerProps.fps}
            compositionWidth={playerProps.width}
            compositionHeight={playerProps.height}
            inputProps={playerInputProps}
            overflowVisible
            controls
            style={{ width: "720px" }}
          />
        ) : (
          <Text size="sm" c="dimmed" p="md">
            Add a scene to start editing.
          </Text>
        )}
      </Box>
    </DesktopSplitLayout>
  );
}
