import type { SceneLayer } from "../storyboardUtils";
import type { SceneBackgroundType } from "../storyboardUtils";

export type { SceneLayer };

export type StoryboardRenderScene = {
  durationInFrames: number;
  background: {
    type: SceneBackgroundType;
    value: string;
  };
  layers: SceneLayer[];
};

export type StoryboardCompositionProps = {
  width?: number;
  height?: number;
  fps?: number;
  durationInFrames?: number;
  scenes?: StoryboardRenderScene[];
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
