import { ActionIcon, Box, Button, Group, Stack, Text, Tooltip } from "@mantine/core";
import { RiAddLine, RiDeleteBinLine, RiPencilLine } from "@remixicon/react";
import { layerContentLabel, normalizeLayerContent } from "~/pages/storyboards/layerContentTypes";
import type { SceneLayer, UserStoryboardScene } from "~/pages/storyboards/storyboardUtils";
import { layerEndFrame } from "~/pages/storyboards/storyboardUtils";

type SceneLayersPanelProps = {
  scene: UserStoryboardScene | null;
  layers: SceneLayer[];
  selectedLayerId: string | null;
  savingLayers: boolean;
  onSelectLayer: (layerId: string) => void;
  onAddLayer: () => void;
  onEditLayer: (layerId: string) => void;
  onDeleteLayer: (layerId: string) => void;
};

export function SceneLayersPanel({
  scene,
  layers,
  selectedLayerId,
  savingLayers,
  onSelectLayer,
  onAddLayer,
  onEditLayer,
  onDeleteLayer,
}: SceneLayersPanelProps) {
  if (!scene) {
    return (
      <Box px="xs" pb="xs">
        <Text size="sm" c="dimmed">
          Select a scene to manage layers.
        </Text>
      </Box>
    );
  }

  return (
    <Stack gap="xs" px="xs" pb="xs">
      <Group justify="space-between" align="center" wrap="nowrap">
        <Text size="sm" fw={600}>
          Layers
        </Text>
        <Button
          size="compact-xs"
          variant="light"
          leftSection={<RiAddLine size={16} />}
          onClick={onAddLayer}
          loading={savingLayers}
        >
          Add layer
        </Button>
      </Group>
      {layers.length === 0 ? (
        <Text size="sm" c="dimmed">
          No layers yet. Add one to place draggable elements on the canvas.
        </Text>
      ) : (
        layers.map((layer, index) => {
          const selected = layer.id === selectedLayerId;
          const contentLabel = layerContentLabel(normalizeLayerContent(layer.content));
          return (
            <Group
              key={layer.id}
              justify="space-between"
              wrap="nowrap"
              gap="xs"
              p="xs"
              style={{
                borderRadius: "var(--mantine-radius-sm)",
                background: selected ? "var(--mantine-color-blue-light)" : "transparent",
                cursor: "pointer",
              }}
              onClick={() => onSelectLayer(layer.id)}
            >
              <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                <Box
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    backgroundColor: layer.color,
                    border:
                      layer.color === "transparent"
                        ? "1px solid var(--mantine-color-default-border)"
                        : undefined,
                    flexShrink: 0,
                  }}
                />
                <Text size="sm" lineClamp={1}>
                  Layer {index + 1} · {contentLabel} · f{layer.from}–{layerEndFrame(layer)}
                </Text>
              </Group>
              <Group gap={4} wrap="nowrap">
                <Tooltip label="Edit layer">
                  <ActionIcon
                    variant="subtle"
                    aria-label="Edit layer"
                    onClick={(event) => {
                      event.stopPropagation();
                      onEditLayer(layer.id);
                    }}
                  >
                    <RiPencilLine size={16} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Delete layer">
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    aria-label="Delete layer"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteLayer(layer.id);
                    }}
                  >
                    <RiDeleteBinLine size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Group>
          );
        })
      )}
    </Stack>
  );
}
