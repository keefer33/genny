import { useCallback, useMemo, useState } from "react";
import { useCurrentScale } from "remotion";
import type { SceneLayer } from "../storyboardUtils";
import { ResizeHandle } from "./ResizeHandle";

export function SelectionOutline({
  layer,
  changeLayer,
  setSelectedLayerId,
  selectedLayerId,
  isDragging,
  onLayersPersist,
}: {
  layer: SceneLayer;
  changeLayer: (layerId: string, updater: (item: SceneLayer) => SceneLayer) => void;
  setSelectedLayerId: (id: string | null) => void;
  selectedLayerId: string | null;
  isDragging: boolean;
  onLayersPersist: () => void;
}) {
  const scale = useCurrentScale();
  const scaledBorder = Math.ceil(2 / scale);
  const [hovered, setHovered] = useState(false);

  const isSelected = layer.id === selectedLayerId;

  const style: React.CSSProperties = useMemo(
    () => ({
      width: layer.width,
      height: layer.height,
      left: layer.left,
      top: layer.top,
      position: "absolute",
      outline:
        (hovered && !isDragging) || isSelected ? `${scaledBorder}px solid #0B84F3` : undefined,
      userSelect: "none",
      touchAction: "none",
    }),
    [
      hovered,
      isDragging,
      isSelected,
      layer.height,
      layer.left,
      layer.top,
      layer.width,
      scaledBorder,
    ]
  );

  const startDragging = useCallback(
    (e: PointerEvent | React.PointerEvent) => {
      const initialX = e.clientX;
      const initialY = e.clientY;
      const snapshot = layer;

      const onPointerMove = (pointerMoveEvent: PointerEvent) => {
        const offsetX = (pointerMoveEvent.clientX - initialX) / scale;
        const offsetY = (pointerMoveEvent.clientY - initialY) / scale;
        changeLayer(layer.id, (item) => ({
          ...item,
          left: Math.round(snapshot.left + offsetX),
          top: Math.round(snapshot.top + offsetY),
          isDragging: true,
        }));
      };

      const onPointerUp = () => {
        changeLayer(layer.id, (item) => ({ ...item, isDragging: false }));
        window.removeEventListener("pointermove", onPointerMove);
        requestAnimationFrame(() => onLayersPersist());
      };

      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("pointerup", onPointerUp, { once: true });
    },
    [changeLayer, layer, onLayersPersist, scale]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      if (e.button !== 0) return;
      setSelectedLayerId(layer.id);
      startDragging(e);
    },
    [layer.id, setSelectedLayerId, startDragging]
  );

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      style={style}
    >
      {isSelected ? (
        <>
          <ResizeHandle
            type="top-left"
            layer={layer}
            changeLayer={changeLayer}
            onLayersPersist={onLayersPersist}
          />
          <ResizeHandle
            type="top-right"
            layer={layer}
            changeLayer={changeLayer}
            onLayersPersist={onLayersPersist}
          />
          <ResizeHandle
            type="bottom-left"
            layer={layer}
            changeLayer={changeLayer}
            onLayersPersist={onLayersPersist}
          />
          <ResizeHandle
            type="bottom-right"
            layer={layer}
            changeLayer={changeLayer}
            onLayersPersist={onLayersPersist}
          />
        </>
      ) : null}
    </div>
  );
}
