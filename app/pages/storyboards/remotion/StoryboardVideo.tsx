import { Video } from "@remotion/media";
import type { VideoPlaybackOptions } from "../videoPlaybackOptions";
import { offthreadVideoPlaybackProps } from "../videoPlaybackOptions";

type StoryboardVideoProps = {
  src: string;
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
  style?: React.CSSProperties;
} & VideoPlaybackOptions;

/**
 * Single @remotion/media Video for preview and render.
 * objectFit must be a prop (not style) — style.objectFit is ignored/warned by Remotion.
 * _experimentalInitiallyDrawCachedFrame helps avoid black frames when the same src remounts.
 */
export function StoryboardVideo({
  src,
  objectFit = "cover",
  style,
  ...playback
}: StoryboardVideoProps) {
  const playbackProps = offthreadVideoPlaybackProps(playback);

  return (
    <Video
      src={src}
      objectFit={objectFit}
      style={{ width: "100%", height: "100%", ...style }}
      _experimentalInitiallyDrawCachedFrame
      {...playbackProps}
    />
  );
}
