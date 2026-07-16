import type { SceneLayer, SceneBackgroundData } from "../storyboardUtils";
import type { SceneTransitionToNext } from "../sceneTransitionTypes";

export type { SceneLayer };

export type StoryboardRenderScene = {
  durationInFrames: number;
  background: SceneBackgroundData;
  layers: SceneLayer[];
  transitionToNext?: SceneTransitionToNext;
};

export type StoryboardCompositionProps = {
  width?: number;
  height?: number;
  fps?: number;
  durationInFrames?: number;
  scenes?: StoryboardRenderScene[];
  baseLayers?: SceneLayer[];
  selectedSceneIndex?: number | null;
  isBaseSceneSelected?: boolean;
  background: SceneBackgroundData;
  layers: SceneLayer[];
  selectedLayerId: string | null;
  setSelectedLayerId: (id: string | null) => void;
  changeLayer: (layerId: string, updater: (layer: SceneLayer) => SceneLayer) => void;
  onLayersPersist: () => void;
};
