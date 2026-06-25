import { useCallback, useMemo } from "react";
import { useCurrentScale } from "remotion";
import type { SceneLayer } from "../storyboardUtils";

const HANDLE_SIZE = 8;

export function ResizeHandle({
  type,
  layer,
  changeLayer,
  onLayersPersist,
}: {
  type: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  layer: SceneLayer;
  changeLayer: (layerId: string, updater: (item: SceneLayer) => SceneLayer) => void;
  onLayersPersist: () => void;
}) {
  const scale = useCurrentScale();
  const size = Math.round(HANDLE_SIZE / scale);
  const borderSize = 1 / scale;

  const sizeStyle = useMemo(
    () => ({
      position: "absolute" as const,
      height: size,
      width: size,
      backgroundColor: "white",
      border: `${borderSize}px solid #0B84F3`,
    }),
    [borderSize, size]
  );

  const margin = -size / 2 - borderSize;

  const style: React.CSSProperties = useMemo(() => {
    if (type === "top-left") {
      return { ...sizeStyle, marginLeft: margin, marginTop: margin, cursor: "nwse-resize" };
    }
    if (type === "top-right") {
      return {
        ...sizeStyle,
        marginTop: margin,
        marginRight: margin,
        right: 0,
        cursor: "nesw-resize",
      };
    }
    if (type === "bottom-left") {
      return {
        ...sizeStyle,
        marginBottom: margin,
        marginLeft: margin,
        bottom: 0,
        cursor: "nesw-resize",
      };
    }
    return {
      ...sizeStyle,
      marginBottom: margin,
      marginRight: margin,
      right: 0,
      bottom: 0,
      cursor: "nwse-resize",
    };
  }, [margin, sizeStyle, type]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      if (e.button !== 0) return;

      const initialX = e.clientX;
      const initialY = e.clientY;
      const snapshot = layer;

      const onPointerMove = (pointerMoveEvent: PointerEvent) => {
        const offsetX = (pointerMoveEvent.clientX - initialX) / scale;
        const offsetY = (pointerMoveEvent.clientY - initialY) / scale;
        const isLeft = type === "top-left" || type === "bottom-left";
        const isTop = type === "top-left" || type === "top-right";

        changeLayer(layer.id, (item) => {
          const newWidth = snapshot.width + (isLeft ? -offsetX : offsetX);
          const newHeight = snapshot.height + (isTop ? -offsetY : offsetY);
          const newLeft = snapshot.left + (isLeft ? offsetX : 0);
          const newTop = snapshot.top + (isTop ? offsetY : 0);

          return {
            ...item,
            width: Math.max(1, Math.round(newWidth)),
            height: Math.max(1, Math.round(newHeight)),
            left: Math.min(snapshot.left + snapshot.width - 1, Math.round(newLeft)),
            top: Math.min(snapshot.top + snapshot.height - 1, Math.round(newTop)),
            isDragging: true,
          };
        });
      };

      const onPointerUp = () => {
        changeLayer(layer.id, (item) => ({ ...item, isDragging: false }));
        window.removeEventListener("pointermove", onPointerMove);
        requestAnimationFrame(() => onLayersPersist());
      };

      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("pointerup", onPointerUp, { once: true });
    },
    [changeLayer, layer, onLayersPersist, scale, type]
  );

  return <div onPointerDown={onPointerDown} style={style} />;
}
