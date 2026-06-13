import { NativeAudioRecordingAdapter } from "~/lib/recording/adapters/nativeAudioRecordingAdapter";
import { ReechyRecordingAdapter } from "~/lib/recording/adapters/reechyRecordingAdapter";
import type {
  MediaRecordingAdapter,
  MediaRecordingMode,
  MediaRecordingProviderId,
} from "~/lib/recording/types";

/** Factory — swap provider here when adding a new SDK. */
export function createMediaRecordingAdapter(
  providerId: MediaRecordingProviderId = "reechy",
  mode?: MediaRecordingMode
): MediaRecordingAdapter {
  // Reechy acquires mic only through camera init; use native MediaRecorder for audio-only.
  if (mode === "audio") {
    return new NativeAudioRecordingAdapter();
  }

  switch (providerId) {
    case "reechy":
      return new ReechyRecordingAdapter();
    case "native":
      return new NativeAudioRecordingAdapter();
    default:
      return new ReechyRecordingAdapter();
  }
}
