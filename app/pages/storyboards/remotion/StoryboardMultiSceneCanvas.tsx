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
  width?: number;
  height?: number;
  selectedSceneIndex: number | null;
  isBaseSceneSelected?: boolean;
  selectedLayerId: string | null;
  setSelectedLayerId: (id: string | null) => void;
  changeLayer: StoryboardCompositionProps["changeLayer"];
  onLayersPersist: () => void;
};

export function StoryboardMultiSceneCanvas({
  scenes,
  baseLayers = [],
  width,
  height,
  selectedSceneIndex,
  isBaseSceneSelected = false,
  selectedLayerId,
  setSelectedLayerId,
  changeLayer,
  onLayersPersist,
}: StoryboardMultiSceneCanvasProps) {
  const { isRendering } = useRemotionEnvironment();
  const resolveContext = useMemo(() => ({ width, height }), [width, height]);

  const children = useMemo(() => {
    const nodes: React.ReactNode[] = [];

    scenes.forEach((scene, index) => {
      const isActiveScene = !isBaseSceneSelected && selectedSceneIndex === index;

      nodes.push(
        <TransitionSeries.Sequence key={`scene-${index}`} durationInFrames={scene.durationInFrames}>
          <StoryboardSceneCanvas
            background={scene.background}
            layers={scene.layers}
            selectedLayerId={isActiveScene ? selectedLayerId : null}
            setSelectedLayerId={isActiveScene ? setSelectedLayerId : noop}
            changeLayer={isActiveScene ? changeLayer : noop}
            onLayersPersist={isActiveScene ? onLayersPersist : noop}
          />
        </TransitionSeries.Sequence>
      );

      if (index < scenes.length - 1 && isActiveTransition(scene.transitionToNext)) {
        const transition = scene.transitionToNext;
        nodes.push(
          <TransitionSeries.Transition
            key={`transition-${index}`}
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
    resolveContext,
    scenes,
    selectedLayerId,
    selectedSceneIndex,
    setSelectedLayerId,
  ]);

  return (
    <AbsoluteFill>
      <TransitionSeries>{children}</TransitionSeries>
      {baseLayers.length > 0 ? (
        <AbsoluteFill style={{ pointerEvents: isBaseSceneSelected ? "auto" : "none" }}>
          {baseLayers.map((layer) => (
            <SceneLayerItem key={layer.id} layer={layer} />
          ))}
          {!isRendering && isBaseSceneSelected ? (
            <SortedOutlines
              layers={baseLayers}
              selectedLayerId={selectedLayerId}
              changeLayer={changeLayer}
              setSelectedLayerId={setSelectedLayerId}
              onLayersPersist={onLayersPersist}
            />
          ) : null}
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
}
