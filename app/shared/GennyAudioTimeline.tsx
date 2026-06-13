import { useAudioContext } from "@gfazioli/mantine-audio";
import { Box, Slider } from "@mantine/core";
import { useCallback, useRef, useState } from "react";
import { formatAudioDurationSeconds } from "~/lib/recording/formatDuration";
import {
  resolvePlaybackDuration,
  useGennyAudioDurationHint,
} from "~/shared/gennyAudioDurationContext";

export function GennyAudioTimeline() {
  const knownDurationSec = useGennyAudioDurationHint();
  const ctx = useAudioContext();
  const [scrubbing, setScrubbing] = useState<number | null>(null);
  const isScrubbingRef = useRef(false);
  const wasPlayingRef = useRef(false);

  const max = resolvePlaybackDuration(ctx.duration, knownDurationSec);
  const value = scrubbing ?? ctx.currentTime;
  const bufferedPercent = max > 0 ? (ctx.buffered / max) * 100 : 0;

  const handleChange = useCallback(
    (next: number) => {
      if (!isScrubbingRef.current) {
        isScrubbingRef.current = true;
        wasPlayingRef.current = ctx.playing;
        if (ctx.playing) ctx.pause();
      }
      setScrubbing(next);
    },
    [ctx]
  );

  const handleChangeEnd = useCallback(
    (next: number) => {
      ctx.seek(next);
      setScrubbing(null);
      isScrubbingRef.current = false;
      if (wasPlayingRef.current) ctx.play();
      wasPlayingRef.current = false;
    },
    [ctx]
  );

  return (
    <Box {...ctx.getStyles("timeline")}>
      <Box
        {...ctx.getStyles("timelineBuffered")}
        style={{ width: `${bufferedPercent}%` }}
        aria-hidden
      />
      <Slider
        value={Math.min(value, max || value)}
        onChange={handleChange}
        onChangeEnd={handleChangeEnd}
        min={0}
        max={max || 1e-4}
        step={0.01}
        label={(v) => formatAudioDurationSeconds(v)}
        showLabelOnHover
        color="var(--audio-timeline-color)"
        size="xs"
        aria-label="Seek"
        styles={{
          root: { flex: 1, width: "100%" },
          bar: { backgroundColor: "var(--audio-timeline-color)" },
          thumb: {
            backgroundColor: "var(--audio-timeline-thumb-color)",
            borderColor: "var(--audio-timeline-thumb-color)",
          },
        }}
      />
    </Box>
  );
}
