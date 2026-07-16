export type VideoPlaybackOptions = {
  trimBeforeFrames: number;
  trimAfterFrames: number | null;
  volume: number;
  playbackRate: number;
};

export type VideoPlaybackFormValues = {
  trimBefore: number;
  trimAfter: number | null;
  volume: number;
  playbackRate: number;
};

export function defaultVideoPlaybackOptions(): VideoPlaybackOptions {
  return {
    trimBeforeFrames: 0,
    trimAfterFrames: null,
    volume: 1,
    playbackRate: 1,
  };
}

export function defaultVideoPlaybackFormValues(): VideoPlaybackFormValues {
  const defaults = defaultVideoPlaybackOptions();
  return {
    trimBefore: defaults.trimBeforeFrames,
    trimAfter: defaults.trimAfterFrames,
    volume: defaults.volume,
    playbackRate: defaults.playbackRate,
  };
}

export function normalizeVideoPlaybackOptions(
  record: Record<string, unknown>
): VideoPlaybackOptions {
  const defaults = defaultVideoPlaybackOptions();
  const trimBeforeRaw = record.trimBeforeFrames ?? record.trimBefore;
  const trimAfterRaw = record.trimAfterFrames ?? record.trimAfter;
  const trimBefore =
    typeof trimBeforeRaw === "number" && Number.isFinite(trimBeforeRaw)
      ? Math.max(0, Math.round(trimBeforeRaw))
      : defaults.trimBeforeFrames;
  let trimAfter: number | null = defaults.trimAfterFrames;
  if (trimAfterRaw === null) {
    trimAfter = null;
  } else if (typeof trimAfterRaw === "number" && Number.isFinite(trimAfterRaw)) {
    const rounded = Math.max(0, Math.round(trimAfterRaw));
    trimAfter = rounded > trimBefore ? rounded : null;
  }
  const volumeRaw = record.volume;
  const volume =
    typeof volumeRaw === "number" && Number.isFinite(volumeRaw)
      ? Math.min(1, Math.max(0, volumeRaw))
      : defaults.volume;
  const playbackRateRaw = record.playbackRate;
  const playbackRate =
    typeof playbackRateRaw === "number" && Number.isFinite(playbackRateRaw)
      ? Math.min(4, Math.max(0.25, playbackRateRaw))
      : defaults.playbackRate;

  return {
    trimBeforeFrames: trimBefore,
    trimAfterFrames: trimAfter,
    volume,
    playbackRate,
  };
}

export function videoPlaybackOptionsFromForm(
  values: VideoPlaybackFormValues
): VideoPlaybackOptions {
  const trimBefore = Math.max(0, Math.round(values.trimBefore));
  const trimAfterRaw = values.trimAfter;
  const trimAfter =
    trimAfterRaw != null && Number.isFinite(trimAfterRaw) && trimAfterRaw > trimBefore
      ? Math.round(trimAfterRaw)
      : null;

  return {
    trimBeforeFrames: trimBefore,
    trimAfterFrames: trimAfter,
    volume: Math.min(1, Math.max(0, values.volume)),
    playbackRate: Math.min(4, Math.max(0.25, values.playbackRate)),
  };
}

export function videoPlaybackFormValuesFromOptions(
  options: VideoPlaybackOptions
): VideoPlaybackFormValues {
  return {
    trimBefore: options.trimBeforeFrames,
    trimAfter: options.trimAfterFrames,
    volume: options.volume,
    playbackRate: options.playbackRate,
  };
}

export function offthreadVideoPlaybackProps(options: VideoPlaybackOptions) {
  const trimBefore = options.trimBeforeFrames > 0 ? options.trimBeforeFrames : undefined;
  const trimAfter =
    options.trimAfterFrames != null && options.trimAfterFrames > options.trimBeforeFrames
      ? options.trimAfterFrames
      : undefined;

  return {
    volume: options.volume,
    playbackRate: options.playbackRate,
    trimBefore,
    trimAfter,
  };
}

export const html5AudioPlaybackProps = offthreadVideoPlaybackProps;
