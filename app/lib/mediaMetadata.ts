import { ALL_FORMATS, Input, UrlSource } from "mediabunny";

export const getMediaMetadata = async (src: string) => {
  const input = new Input({
    formats: ALL_FORMATS,
    source: new UrlSource(src, {
      getRetryDelay: () => null,
    }),
  });

  const durationInSeconds = await input.computeDuration();
  const videoTrack = await input.getPrimaryVideoTrack();
  const dimensions = videoTrack
    ? {
        width: await videoTrack.getDisplayWidth(),
        height: await videoTrack.getDisplayHeight(),
      }
    : null;
  const packetStats = await videoTrack?.computePacketStats(50);
  const fps = packetStats?.averagePacketRate ?? null;

  return {
    durationInSeconds,
    dimensions,
    fps,
  };
};

export async function getVideoDurationInFrames(
  src: string,
  compositionFps: number
): Promise<number> {
  const metadata = await getMediaMetadata(src);
  const fps = metadata.fps ?? compositionFps;
  return Math.max(1, Math.round(metadata.durationInSeconds * fps));
}
