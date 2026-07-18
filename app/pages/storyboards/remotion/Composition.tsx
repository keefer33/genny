import { DEFAULT_SCENE_BACKGROUND_COLOR, sceneBackgroundData } from "../storyboardUtils";
import type { StoryboardCompositionProps } from "./sceneLayerTypes";
import { StoryboardMultiSceneCanvas } from "./StoryboardMultiSceneCanvas";
import { StoryboardSceneCanvas } from "./StoryboardSceneCanvas";

const noop = () => undefined;

const defaultProps: StoryboardCompositionProps = {
  background: sceneBackgroundData("color", DEFAULT_SCENE_BACKGROUND_COLOR),
  layers: [],
  selectedLayerId: null,
  setSelectedLayerId: noop,
  onSelectLayer: noop,
  changeLayer: noop,
  onLayersPersist: noop,
};

export function MyComposition(props: StoryboardCompositionProps) {
  if (props.scenes && props.scenes.length > 0) {
    return (
      <StoryboardMultiSceneCanvas
        scenes={props.scenes}
        baseLayers={props.baseLayers}
        baseSceneId={props.baseSceneId}
        width={props.width}
        height={props.height}
        selectedSceneIndex={props.selectedSceneIndex ?? null}
        isBaseSceneSelected={props.isBaseSceneSelected ?? false}
        selectedLayerId={props.selectedLayerId}
        setSelectedLayerId={props.setSelectedLayerId}
        onSelectLayer={props.onSelectLayer ?? noop}
        changeLayer={props.changeLayer}
        onLayersPersist={props.onLayersPersist}
      />
    );
  }

  return (
    <StoryboardSceneCanvas
      background={props.background}
      layers={props.layers}
      selectedLayerId={props.selectedLayerId}
      setSelectedLayerId={props.setSelectedLayerId}
      changeLayer={props.changeLayer}
      onLayersPersist={props.onLayersPersist}
    />
  );
}

MyComposition.defaultProps = defaultProps;
