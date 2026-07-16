import { AbsoluteFill } from "remotion";
import { Video } from "@remotion/media";
import type { SceneBackgroundData } from "../storyboardUtils";
import { offthreadVideoPlaybackProps } from "../videoPlaybackOptions";

export function SceneBackground({ type, value, ...videoOptions }: SceneBackgroundData) {
  if (type === "color") {
    return <AbsoluteFill style={{ backgroundColor: value || "#000000" }} />;
  }

  if (type === "image") {
    return (
      <AbsoluteFill>
        <img src={value} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </AbsoluteFill>
    );
  }

  if (!value.trim()) {
    return <AbsoluteFill style={{ backgroundColor: "#000000" }} />;
  }

  return (
    <AbsoluteFill>
      <Video
        src={value}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
        {...offthreadVideoPlaybackProps(videoOptions)}
      />
    </AbsoluteFill>
  );
}
