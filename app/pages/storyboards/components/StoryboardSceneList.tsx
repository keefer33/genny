import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Box, Button, Group, ScrollArea, Stack, Text } from "@mantine/core";
import { RiAddLine } from "@remixicon/react";
import useStoryboardsStore from "~/lib/stores/storyboardsStore";
import { SceneLayersSection } from "~/pages/storyboards/components/SceneLayersSection";
import { SortableDragHandle } from "~/pages/storyboards/components/SortableDragHandle";
import {
  BASE_SCENE_TITLE,
  getBaseStoryboardScene,
  parseSceneDurationInFrames,
  parseTransitionToNext,
  regularStoryboardScenes,
  type UserStoryboardScene,
} from "~/pages/storyboards/storyboardUtils";
import {
  defaultTransitionToNext,
  normalizeTransitionToNext,
  transitionSummaryLabel,
} from "~/pages/storyboards/sceneTransitionTypes";

type StoryboardSceneListProps = {
  storyboardId: string;
};

function BaseSceneCard({
  storyboardId,
  scene,
  isSelected,
}: {
  storyboardId: string;
  scene: { id: string; title?: string | null };
  isSelected: boolean;
}) {
  const selectStoryboardScene = useStoryboardsStore((s) => s.selectStoryboardScene);

  return (
    <Stack gap="xs">
      <Group
        justify="space-between"
        wrap="nowrap"
        gap="xs"
        p={2}
        style={{
          cursor: "pointer",
          backgroundColor: isSelected
            ? "var(--mantine-primary-color-light)"
            : "var(--mantine-color-default)",
        }}
        onClick={() => selectStoryboardScene(storyboardId, scene.id)}
      >
        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
          <Text size="sm" fw={600} lineClamp={1}>
            {scene.title?.trim() || BASE_SCENE_TITLE}
          </Text>
          <Text size="xs" c="dimmed">
            Global layers · spans all scenes
          </Text>
        </Stack>
      </Group>
      <SceneLayersSection storyboardId={storyboardId} sceneId={scene.id} />
    </Stack>
  );
}

function SortableRegularSceneCard({
  storyboardId,
  scene,
  index,
  nextSceneDuration,
  isSelected,
}: {
  storyboardId: string;
  scene: UserStoryboardScene;
  index: number;
  nextSceneDuration: number;
  isSelected: boolean;
}) {
  const selectStoryboardScene = useStoryboardsStore((s) => s.selectStoryboardScene);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition: sortableTransition,
    isDragging,
  } = useSortable({
    id: scene.id,
  });

  const sceneDuration = parseSceneDurationInFrames(scene.scene);
  const sceneTransition = parseTransitionToNext(scene.scene) ?? defaultTransitionToNext();
  const transitionLabel = transitionSummaryLabel(
    normalizeTransitionToNext(sceneTransition, sceneDuration, nextSceneDuration)
  );

  return (
    <Box
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: sortableTransition,
        opacity: isDragging ? 0.65 : 1,
      }}
    >
      <Stack gap="xs">
        <Group
          justify="space-between"
          wrap="nowrap"
          gap="xs"
          p={2}
          style={{
            cursor: "pointer",
            backgroundColor: isSelected
              ? "var(--mantine-primary-color-light)"
              : "var(--mantine-color-default)",
          }}
          onClick={() => selectStoryboardScene(storyboardId, scene.id)}
        >
          <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
            <SortableDragHandle listeners={listeners} attributes={attributes} />
            <Text size="sm" style={{ flex: 1, minWidth: 0 }} lineClamp={1}>
              {scene.title?.trim() || `Scene ${index + 1}`}
              {" · "}
              {sceneDuration}f{transitionLabel ? ` ${transitionLabel}` : ""}
            </Text>
          </Group>
        </Group>
        <SceneLayersSection storyboardId={storyboardId} sceneId={scene.id} />
      </Stack>
    </Box>
  );
}

export function StoryboardSceneList({ storyboardId }: StoryboardSceneListProps) {
  const storyboardScenes = useStoryboardsStore((s) => s.storyboardScenes);
  const selectedSceneId = useStoryboardsStore((s) => s.selectedSceneId);
  const createSceneLoading = useStoryboardsStore((s) => s.createSceneLoading);
  const openCreateSceneModal = useStoryboardsStore((s) => s.openCreateSceneModal);
  const reorderStoryboardScenes = useStoryboardsStore((s) => s.reorderStoryboardScenes);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const baseScene = getBaseStoryboardScene(storyboardScenes);
  const regularScenes = regularStoryboardScenes(storyboardScenes);

  const handleSceneDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const ids = regularScenes.map((scene) => scene.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    void reorderStoryboardScenes(storyboardId, arrayMove(ids, oldIndex, newIndex));
  };

  return (
    <ScrollArea h="100%" type="auto">
      <Stack gap="xs" p="xs">
        {baseScene ? (
          <BaseSceneCard
            storyboardId={storyboardId}
            scene={baseScene}
            isSelected={baseScene.id === selectedSceneId}
          />
        ) : null}

        {regularScenes.length === 0 ? (
          <Text size="sm" c="dimmed">
            No scenes yet.
          </Text>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleSceneDragEnd}
          >
            <SortableContext
              items={regularScenes.map((scene) => scene.id)}
              strategy={verticalListSortingStrategy}
            >
              {regularScenes.map((scene, index) => (
                <SortableRegularSceneCard
                  key={scene.id}
                  storyboardId={storyboardId}
                  scene={scene}
                  index={index}
                  nextSceneDuration={
                    regularScenes[index + 1]
                      ? parseSceneDurationInFrames(regularScenes[index + 1].scene)
                      : parseSceneDurationInFrames(scene.scene)
                  }
                  isSelected={scene.id === selectedSceneId}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}

        <Button
          leftSection={<RiAddLine size={18} />}
          onClick={openCreateSceneModal}
          loading={createSceneLoading}
          fullWidth
        >
          Add scene
        </Button>
      </Stack>
    </ScrollArea>
  );
}
