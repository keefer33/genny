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
import { ActionIcon, Box, Button, Card, Group, Stack, Text, Tooltip } from "@mantine/core";
import { RiAddLine, RiDeleteBinLine, RiPencilLine } from "@remixicon/react";
import useStoryboardsStore from "~/lib/stores/storyboardsStore";
import { layerContentLabel, normalizeLayerContent } from "~/pages/storyboards/layerContentTypes";
import { SortableDragHandle } from "~/pages/storyboards/components/SortableDragHandle";
import {
  isBaseStoryboardScene,
  layerDisplayTitle,
  layerEndFrame,
  parseSceneLayers,
  regularStoryboardScenes,
  sortLayersBySort,
  type SceneLayer,
} from "~/pages/storyboards/storyboardUtils";

type SceneLayersSectionProps = {
  storyboardId: string;
  sceneId: string;
};

type SortableLayerRowProps = {
  storyboardId: string;
  sceneId: string;
  layer: SceneLayer;
  index: number;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

function SortableLayerRow({
  layer,
  index,
  selected,
  onSelect,
  onEdit,
  onDelete,
}: SortableLayerRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: layer.id,
  });
  const contentLabel = layerContentLabel(normalizeLayerContent(layer.content));

  return (
    <Card
      ref={setNodeRef}
      p={0}
      style={{
        cursor: "pointer",
        backgroundColor: selected
          ? "var(--mantine-primary-color-light)"
          : "var(--mantine-color-default)",
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.65 : 1,
        zIndex: isDragging ? 1 : undefined,
      }}
      onClick={onSelect}
    >
      <Group justify="space-between" wrap="nowrap" gap="xs" p="xs">
        <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
          <SortableDragHandle listeners={listeners} attributes={attributes} />
          <Box
            style={{
              width: 14,
              height: 14,
              borderRadius: 4,
              backgroundColor: layer.color,
              border:
                layer.color === "transparent"
                  ? "1px solid var(--mantine-color-default-border)"
                  : undefined,
              flexShrink: 0,
            }}
          />
          <Text size="xs" lineClamp={1}>
            {layerDisplayTitle(layer, index)} · {contentLabel} · f{layer.from}–
            {layerEndFrame(layer)}
          </Text>
        </Group>
        <Group gap={4} wrap="nowrap">
          <Tooltip label="Edit layer">
            <ActionIcon
              size="sm"
              variant="subtle"
              aria-label="Edit layer"
              onClick={(event) => {
                event.stopPropagation();
                onEdit();
              }}
            >
              <RiPencilLine size={14} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Delete layer">
            <ActionIcon
              size="sm"
              variant="subtle"
              color="red"
              aria-label="Delete layer"
              onClick={(event) => {
                event.stopPropagation();
                onDelete();
              }}
            >
              <RiDeleteBinLine size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>
    </Card>
  );
}

export function SceneLayersSection({ storyboardId, sceneId }: SceneLayersSectionProps) {
  const selectedSceneId = useStoryboardsStore((s) => s.selectedSceneId);
  const selectedLayerId = useStoryboardsStore((s) => s.selectedLayerId);
  const layerItems = useStoryboardsStore((s) => s.layerItems);
  const storyboardScenes = useStoryboardsStore((s) => s.storyboardScenes);
  const saveLayersLoading = useStoryboardsStore((s) => s.saveLayersLoading);
  const selectStoryboardLayer = useStoryboardsStore((s) => s.selectStoryboardLayer);
  const addStoryboardLayer = useStoryboardsStore((s) => s.addStoryboardLayer);
  const deleteStoryboardLayer = useStoryboardsStore((s) => s.deleteStoryboardLayer);
  const openStoryboardLayerEditor = useStoryboardsStore((s) => s.openStoryboardLayerEditor);
  const reorderStoryboardLayers = useStoryboardsStore((s) => s.reorderStoryboardLayers);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const isSelected = sceneId === selectedSceneId;
  const scene = storyboardScenes.find((row) => row.id === sceneId);
  const layers = sortLayersBySort(isSelected ? layerItems : parseSceneLayers(scene?.scene));
  const savingLayers = saveLayersLoading && isSelected;
  const isBaseScene = Boolean(scene && isBaseStoryboardScene(scene));
  const hasRegularScenes = regularStoryboardScenes(storyboardScenes).length > 0;
  const canAddLayer = !isBaseScene || hasRegularScenes;
  const addLayerDisabledReason =
    isBaseScene && !hasRegularScenes
      ? "Add a scene first — global layer durations depend on the total storyboard length"
      : undefined;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = layers.findIndex((layer) => layer.id === active.id);
    const newIndex = layers.findIndex((layer) => layer.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const nextOrder = arrayMove(
      layers.map((layer) => layer.id),
      oldIndex,
      newIndex
    );
    void reorderStoryboardLayers(storyboardId, sceneId, nextOrder);
  };

  return (
    <Stack gap="xs" px="sm" pb="xs">
      {layers.length === 0 ? (
        <Text size="xs" c="dimmed" pl={4}>
          {addLayerDisabledReason ?? "No layers"}
        </Text>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={layers.map((layer) => layer.id)}
            strategy={verticalListSortingStrategy}
          >
            {layers.map((layer, index) => (
              <SortableLayerRow
                key={layer.id}
                storyboardId={storyboardId}
                sceneId={sceneId}
                layer={layer}
                index={index}
                selected={isSelected && layer.id === selectedLayerId}
                onSelect={() => selectStoryboardLayer(storyboardId, sceneId, layer.id)}
                onEdit={() => void openStoryboardLayerEditor(storyboardId, sceneId, layer.id)}
                onDelete={() => void deleteStoryboardLayer(storyboardId, sceneId, layer.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}
      <Tooltip label={addLayerDisabledReason} disabled={canAddLayer || !addLayerDisabledReason}>
        <span style={{ display: "inline-block", marginLeft: 4 }}>
          <Button
            size="compact-xs"
            variant="subtle"
            leftSection={<RiAddLine size={14} />}
            onClick={() => void addStoryboardLayer(storyboardId, sceneId)}
            loading={savingLayers}
            disabled={!canAddLayer}
          >
            Add layer
          </Button>
        </span>
      </Tooltip>
    </Stack>
  );
}
