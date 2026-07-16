import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";
import { ActionIcon, type ActionIconProps } from "@mantine/core";
import { RiDraggable } from "@remixicon/react";

type SortableDragHandleProps = {
  listeners?: DraggableSyntheticListeners;
  attributes?: DraggableAttributes;
  disabled?: boolean;
  size?: ActionIconProps["size"];
};

export function SortableDragHandle({
  listeners,
  attributes,
  disabled,
  size = "sm",
}: SortableDragHandleProps) {
  return (
    <ActionIcon
      {...attributes}
      {...listeners}
      variant="subtle"
      color="gray"
      size={size}
      aria-label="Drag to reorder"
      disabled={disabled}
      style={{ cursor: disabled ? "not-allowed" : "grab", touchAction: "none", flexShrink: 0 }}
      onClick={(event) => event.stopPropagation()}
    >
      <RiDraggable size={16} />
    </ActionIcon>
  );
}
