import { ActionIcon, Group, Text, Tooltip } from "@mantine/core";
import { RiZoomInLine, RiZoomOutLine } from "@remixicon/react";

export const PLAYER_ZOOM_MIN = 0.25;
export const PLAYER_ZOOM_MAX = 3;
export const PLAYER_ZOOM_STEP = 0.25;

export function clampPlayerZoom(zoom: number): number {
  const stepped = Math.round(zoom / PLAYER_ZOOM_STEP) * PLAYER_ZOOM_STEP;
  return Math.min(PLAYER_ZOOM_MAX, Math.max(PLAYER_ZOOM_MIN, stepped));
}

type StoryboardPlayerToolbarProps = {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  disabled?: boolean;
};

export function StoryboardPlayerToolbar({
  zoom,
  onZoomIn,
  onZoomOut,
  disabled = false,
}: StoryboardPlayerToolbarProps) {
  const zoomPercent = Math.round(zoom * 100);
  const atMinZoom = zoom <= PLAYER_ZOOM_MIN;
  const atMaxZoom = zoom >= PLAYER_ZOOM_MAX;

  return (
    <Group gap={4} wrap="nowrap">
      <Tooltip label="Zoom out">
        <ActionIcon
          variant="default"
          size="sm"
          disabled={disabled || atMinZoom}
          onClick={onZoomOut}
          aria-label="Zoom out"
        >
          <RiZoomOutLine size={16} />
        </ActionIcon>
      </Tooltip>
      <Text size="xs" c="dimmed" style={{ minWidth: 40, textAlign: "center" }}>
        {zoomPercent}%
      </Text>
      <Tooltip label="Zoom in">
        <ActionIcon
          variant="default"
          size="sm"
          disabled={disabled || atMaxZoom}
          onClick={onZoomIn}
          aria-label="Zoom in"
        >
          <RiZoomInLine size={16} />
        </ActionIcon>
      </Tooltip>
    </Group>
  );
}
