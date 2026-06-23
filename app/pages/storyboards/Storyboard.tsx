import { Player } from "@remotion/player";
import { MyComposition } from "./remotion/Composition";

export function meta() {
  return [{ title: "Storyboard" }];
}

export default function Storyboard() {
  const props = {
    width: 1920,
    height: 1080,
    durationInFrames: 100,
    fps: 10,
  };

  return (
    <Player
      component={MyComposition}
      durationInFrames={props.durationInFrames}
      fps={props.fps}
      compositionWidth={props.width}
      compositionHeight={props.height}
      controls
      style={{ width: "720px" }}
    />
  );
}
