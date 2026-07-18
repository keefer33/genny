import { useMemo } from "react";
import { Sequence } from "remotion";
import type { SceneLayer } from "../storyboardUtils";
import { LayerContentRenderer } from "./LayerContentRenderer";

function layerBoxShadow(layer: SceneLayer): string | undefined {
  if (!layer.shadow) return undefined;
  return `${layer.shadowOffsetX}px ${layer.shadowOffsetY}px ${Math.max(0, layer.shadowBlur)}px ${layer.shadowSpread}px ${layer.shadowColor}`;
}

export function SceneLayerItem({ layer }: { layer: SceneLayer }) {
  // Outer div carries the shadow (overflow must stay visible). Inner clips content.
  const outerStyle = useMemo(
    () => ({
      position: "absolute" as const,
      left: layer.left,
      top: layer.top,
      width: layer.width,
      height: layer.height,
      borderRadius: layer.borderRadius,
      boxShadow: layerBoxShadow(layer),
    }),
    [
      layer.borderRadius,
      layer.height,
      layer.left,
      layer.shadow,
      layer.shadowBlur,
      layer.shadowColor,
      layer.shadowOffsetX,
      layer.shadowOffsetY,
      layer.shadowSpread,
      layer.top,
      layer.width,
    ]
  );

  const innerStyle = useMemo(
    () => ({
      width: "100%",
      height: "100%",
      backgroundColor: layer.color,
      overflow: "hidden" as const,
      boxSizing: "border-box" as const,
      padding: layer.padding,
      borderRadius: layer.borderRadius,
      border: layer.border
        ? `${Math.max(0, layer.borderWidth)}px solid ${layer.borderColor}`
        : "none",
    }),
    [
      layer.border,
      layer.borderColor,
      layer.borderRadius,
      layer.borderWidth,
      layer.color,
      layer.padding,
    ]
  );

  return (
    <Sequence
      key={layer.id}
      from={layer.from}
      durationInFrames={layer.durationInFrames}
      layout="none"
    >
      <div style={outerStyle}>
        <div style={innerStyle}>
          <LayerContentRenderer content={layer.content} />
        </div>
      </div>
    </Sequence>
  );
}
