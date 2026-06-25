import { useCallback } from "react";
import { AbsoluteFill, useRemotionEnvironment } from "remotion";
import type { StoryboardCompositionProps } from "./sceneLayerTypes";
import { SceneBackground } from "./SceneBackground";
import { SceneLayerItem } from "./SceneLayerItem";
import { SortedOutlines } from "./SortedOutlines";

const layerContainer: React.CSSProperties = {
  overflow: "hidden",
};

export function StoryboardSceneCanvas({
  background,
  layers,
  selectedLayerId,
  setSelectedLayerId,
  changeLayer,
  onLayersPersist,
}: StoryboardCompositionProps) {
  const { isRendering } = useRemotionEnvironment();
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      setSelectedLayerId(null);
    },
    [setSelectedLayerId]
  );

  return (
    <AbsoluteFill onPointerDown={onPointerDown}>
      <SceneBackground type={background.type} value={background.value} />
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
