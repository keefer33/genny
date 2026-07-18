import { AbsoluteFill } from "remotion";
import type { SceneBackgroundData } from "../storyboardUtils";
import { StoryboardVideo } from "./StoryboardVideo";

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
      <StoryboardVideo src={value} objectFit="contain" {...videoOptions} />
    </AbsoluteFill>
  );
}
