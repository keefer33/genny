import type { SceneLayer } from "../storyboardUtils";
import type { SceneBackgroundType } from "../storyboardUtils";
import type { SceneTransitionToNext } from "../sceneTransitionTypes";

export type { SceneLayer };

export type StoryboardRenderScene = {
  durationInFrames: number;
  background: {
    type: SceneBackgroundType;
    value: string;
  };
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
  background: {
    type: SceneBackgroundType;
    value: string;
  };
  layers: SceneLayer[];
  selectedLayerId: string | null;
  setSelectedLayerId: (id: string | null) => void;
  changeLayer: (layerId: string, updater: (layer: SceneLayer) => SceneLayer) => void;
  onLayersPersist: () => void;
};
