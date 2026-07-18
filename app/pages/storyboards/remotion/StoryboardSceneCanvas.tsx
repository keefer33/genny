import { useCallback } from "react";
import { AbsoluteFill, useRemotionEnvironment } from "remotion";
import type { SceneBackgroundData, SceneLayer } from "../storyboardUtils";
import { SceneBackground } from "./SceneBackground";
import { SceneLayerItem } from "./SceneLayerItem";
import { SortedOutlines } from "./SortedOutlines";

const layerContainer: React.CSSProperties = {
  overflow: "hidden",
};

type StoryboardSceneCanvasProps = {
  background: SceneBackgroundData;
  layers: SceneLayer[];
  selectedLayerId: string | null;
  setSelectedLayerId: (id: string | null) => void;
  changeLayer: (layerId: string, updater: (layer: SceneLayer) => SceneLayer) => void;
  onLayersPersist: () => void;
};

export function StoryboardSceneCanvas({
  background,
  layers,
  selectedLayerId,
  setSelectedLayerId,
  changeLayer,
  onLayersPersist,
}: StoryboardSceneCanvasProps) {
  const { isRendering } = useRemotionEnvironment();
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      // Only clear when clicking the empty canvas, not when a child (layer) handles it.
      if (e.target !== e.currentTarget) return;
      setSelectedLayerId(null);
    },
    [setSelectedLayerId]
  );

  return (
    <AbsoluteFill onPointerDown={onPointerDown}>
      <SceneBackground {...background} />
      <AbsoluteFill style={layerContainer}>
        {layers.map((layer) => (
          <SceneLayerItem key={layer.id} layer={layer} />
        ))}
      </AbsoluteFill>
      {!isRendering ? (
        <SortedOutlines
          layers={layers}
          selectedLayerId={selectedLayerId}
          changeLayer={changeLayer}
          setSelectedLayerId={setSelectedLayerId}
          onLayersPersist={onLayersPersist}
        />
      ) : null}
    </AbsoluteFill>
  );
}
