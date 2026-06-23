import type { CalculateMetadataFunction } from "remotion";
import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { getMediaMetadata } from "../../../lib/mediaMetadata";

export function RemotionRoot() {
  type MyCompProps = {
    width?: number | undefined;
    height?: number | undefined;
    durationInFrames?: number | undefined;
    fps?: number | undefined;
  };

  const calculateMetadata: CalculateMetadataFunction<MyCompProps> = async ({
    props,
    defaultProps,
  }) => {
    const metadata = await getMediaMetadata("https://aifile.link/fvrVEx.mp4");
    return {
      width: props.width ?? defaultProps.width ?? metadata.dimensions.width ?? 720,
      height: props.height ?? defaultProps.height ?? metadata.dimensions.height ?? 1280,
      durationInFrames:
        props.durationInFrames ??
        defaultProps.durationInFrames ??
        Math.round(metadata.durationInSeconds * metadata.fps) ??
        30,
      fps: props.fps ?? defaultProps.fps ?? metadata.fps ?? 10,
    };
  };

  return (
    <>
      <Composition
        id="MyComp"
        component={MyComposition}
        durationInFrames={60}
        fps={30}
        width={720}
        height={1080}
        //defaultProps={{width: 1280, height: 1080}}
        calculateMetadata={calculateMetadata}
      />
    </>
  );
}
