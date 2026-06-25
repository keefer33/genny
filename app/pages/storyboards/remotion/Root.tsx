import type { CalculateMetadataFunction } from "remotion";
import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import type { StoryboardCompositionProps } from "./sceneLayerTypes";

const DEFAULT_WIDTH = 1920;
const DEFAULT_HEIGHT = 1080;
const DEFAULT_FPS = 24;
const DEFAULT_DURATION = 90;

export function RemotionRoot() {
  const calculateMetadata: CalculateMetadataFunction<StoryboardCompositionProps> = async ({
    props,
  }) => {
    return {
      width: props.width ?? DEFAULT_WIDTH,
      height: props.height ?? DEFAULT_HEIGHT,
      fps: props.fps ?? DEFAULT_FPS,
      durationInFrames: props.durationInFrames ?? DEFAULT_DURATION,
    };
  };

  return (
    <>
      <Composition
        id="MyComp"
        component={MyComposition}
        durationInFrames={DEFAULT_DURATION}
        fps={DEFAULT_FPS}
        width={DEFAULT_WIDTH}
        height={DEFAULT_HEIGHT}
        calculateMetadata={calculateMetadata}
      />
    </>
  );
}
