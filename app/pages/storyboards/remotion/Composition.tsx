import { DEFAULT_SCENE_BACKGROUND_COLOR } from "../storyboardUtils";
import type { StoryboardCompositionProps } from "./sceneLayerTypes";
import { StoryboardMultiSceneCanvas } from "./StoryboardMultiSceneCanvas";
import { StoryboardSceneCanvas } from "./StoryboardSceneCanvas";

const noop = () => undefined;

const defaultProps: StoryboardCompositionProps = {
  background: { type: "color", value: DEFAULT_SCENE_BACKGROUND_COLOR },
  layers: [],
  selectedLayerId: null,
  setSelectedLayerId: noop,
  changeLayer: noop,
  onLayersPersist: noop,
};

export function MyComposition(props: StoryboardCompositionProps) {
  if (props.scenes && props.scenes.length > 0) {
    return <StoryboardMultiSceneCanvas scenes={props.scenes} />;
  }

  return <StoryboardSceneCanvas {...props} />;
}

MyComposition.defaultProps = defaultProps;
