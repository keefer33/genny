import { useMemo } from "react";
import { AbsoluteFill, useRemotionEnvironment } from "remotion";
import { TransitionSeries, type TransitionPresentation } from "@remotion/transitions";
import type { StoryboardCompositionProps, StoryboardRenderScene } from "./sceneLayerTypes";
import { resolveTransitionPresentation, resolveTransitionTiming } from "./resolveTransition";
import { StoryboardSceneCanvas } from "./StoryboardSceneCanvas";
import { SceneLayerItem } from "./SceneLayerItem";
import { SortedOutlines } from "./SortedOutlines";
import { isActiveTransition } from "../sceneTransitionTypes";

const noop = () => undefined;

type StoryboardMultiSceneCanvasProps = {
  scenes: StoryboardRenderScene[];
  baseLayers?: StoryboardCompositionProps["baseLayers"];
  baseSceneId?: string | null;
  width?: number;
  height?: number;
  selectedSceneIndex: number | null;
  isBaseSceneSelected?: boolean;
  selectedLayerId: string | null;
  setSelectedLayerId: (id: string | null) => void;
  onSelectLayer: (sceneId: string, layerId: string) => void;
  changeLayer: StoryboardCompositionProps["changeLayer"];
  onLayersPersist: () => void;
};

export function StoryboardMultiSceneCanvas({
  scenes,
  baseLayers = [],
  baseSceneId = null,
  width,
  height,
  selectedSceneIndex,
  isBaseSceneSelected = false,
  selectedLayerId,
  setSelectedLayerId,
  onSelectLayer,
  changeLayer,
  onLayersPersist,
}: StoryboardMultiSceneCanvasProps) {
  const { isRendering } = useRemotionEnvironment();
  const resolveContext = useMemo(() => ({ width, height }), [width, height]);

  const children = useMemo(() => {
    const nodes: React.ReactNode[] = [];

    scenes.forEach((scene, index) => {
      const isActiveScene = !isBaseSceneSelected && selectedSceneIndex === index;

      const handleSetSelectedLayerId = (layerId: string | null) => {
        if (!layerId) {
          // Only the active scene may clear selection via background click.
          if (isActiveScene) setSelectedLayerId(null);
          return;
        }
        // Selecting a layer in any scene switches to that scene and opens the editor.
        onSelectLayer(scene.id, layerId);
      };

      nodes.push(
        <TransitionSeries.Sequence
          key={`scene-${scene.id}`}
          durationInFrames={scene.durationInFrames}
        >
          <StoryboardSceneCanvas
            background={scene.background}
            layers={scene.layers}
            selectedLayerId={isActiveScene ? selectedLayerId : null}
            setSelectedLayerId={handleSetSelectedLayerId}
            changeLayer={isActiveScene ? changeLayer : noop}
            onLayersPersist={isActiveScene ? onLayersPersist : noop}
          />
        </TransitionSeries.Sequence>
      );

      if (index < scenes.length - 1 && isActiveTransition(scene.transitionToNext)) {
        const transition = scene.transitionToNext;
        nodes.push(
          <TransitionSeries.Transition
            key={`transition-${scene.id}`}
            presentation={
              resolveTransitionPresentation(transition, resolveContext) as TransitionPresentation<
                Record<string, unknown>
              >
            }
            timing={resolveTransitionTiming(transition)}
          />
        );
      }
    });

    return nodes;
  }, [
    changeLayer,
    isBaseSceneSelected,
    onLayersPersist,
    onSelectLayer,
    resolveContext,
    scenes,
    selectedLayerId,
    selectedSceneIndex,
    setSelectedLayerId,
  ]);

  return (
    <AbsoluteFill>
      <TransitionSeries>{children}</TransitionSeries>
      {baseLayers.length > 0 && baseSceneId ? (
        <AbsoluteFill style={{ pointerEvents: isBaseSceneSelected ? "auto" : "none" }}>
          {baseLayers.map((layer) => (
            <SceneLayerItem key={layer.id} layer={layer} />
          ))}
          {!isRendering && isBaseSceneSelected ? (
            <SortedOutlines
              layers={baseLayers}
              selectedLayerId={selectedLayerId}
              changeLayer={changeLayer}
              setSelectedLayerId={(layerId) => {
                if (!layerId) {
                  setSelectedLayerId(null);
                  return;
                }
                onSelectLayer(baseSceneId, layerId);
              }}
              onLayersPersist={onLayersPersist}
            />
          ) : null}
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
}
