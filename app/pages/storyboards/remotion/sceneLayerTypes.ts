import type { SceneLayer, SceneBackgroundData } from "../storyboardUtils";
import type { SceneTransitionToNext } from "../sceneTransitionTypes";

export type { SceneLayer };

export type StoryboardRenderScene = {
  id: string;
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
  baseSceneId?: string | null;
  selectedSceneIndex?: number | null;
  isBaseSceneSelected?: boolean;
  background: SceneBackgroundData;
  layers: SceneLayer[];
  selectedLayerId: string | null;
  setSelectedLayerId: (id: string | null) => void;
  /** Select a layer in a specific scene (switches scene when needed). */
  onSelectLayer?: (sceneId: string, layerId: string) => void;
  changeLayer: (layerId: string, updater: (layer: SceneLayer) => SceneLayer) => void;
  onLayersPersist: () => void;
};
