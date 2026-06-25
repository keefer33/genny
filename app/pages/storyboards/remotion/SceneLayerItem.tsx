import { useMemo } from "react";
import { Sequence } from "remotion";
import type { SceneLayer } from "../storyboardUtils";
import { LayerContentRenderer } from "./LayerContentRenderer";

export function SceneLayerItem({ layer }: { layer: SceneLayer }) {
  const style = useMemo(
    () => ({
      backgroundColor: layer.color,
      position: "absolute" as const,
      left: layer.left,
      top: layer.top,
      width: layer.width,
      height: layer.height,
      overflow: "hidden" as const,
    }),
    [layer.color, layer.height, layer.left, layer.top, layer.width]
  );

  return (
    <Sequence
      key={layer.id}
      from={layer.from}
      durationInFrames={layer.durationInFrames}
      layout="none"
    >
      <div style={style}>
        <LayerContentRenderer content={layer.content} />
      </div>
    </Sequence>
  );
}
