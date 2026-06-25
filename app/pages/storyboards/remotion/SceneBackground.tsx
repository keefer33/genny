import { AbsoluteFill, OffthreadVideo } from "remotion";
import type { SceneBackgroundType } from "../storyboardUtils";

export function SceneBackground({ type, value }: { type: SceneBackgroundType; value: string }) {
  if (type === "color") {
    return <AbsoluteFill style={{ backgroundColor: value || "#000000" }} />;
  }

  if (type === "image") {
    return (
      <AbsoluteFill>
        <img src={value} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
    );
  }

  if (!value.trim()) {
    return <AbsoluteFill style={{ backgroundColor: "#000000" }} />;
  }

  return (
    <AbsoluteFill>
      <OffthreadVideo src={value} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </AbsoluteFill>
  );
}
