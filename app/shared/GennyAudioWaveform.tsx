import { useAudioContext } from "@gfazioli/mantine-audio";
import { Box } from "@mantine/core";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  playbackProgressRatio,
  useGennyAudioDurationHint,
} from "~/shared/gennyAudioDurationContext";

type GennyAudioWaveformProps = {
  height?: number;
};

/**
 * Waveform with duration fallback for MediaRecorder WebM (mantine-audio uses raw `audio.duration`).
 */
export function GennyAudioWaveform({ height = 56 }: GennyAudioWaveformProps) {
  const knownDurationSec = useGennyAudioDurationHint();
  const ctx = useAudioContext();
  const audioRef = ctx.audioRef;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderRef = useRef<(ratio: number) => void>(() => undefined);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    setWidth(el.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!ctx.peaks || ctx.peaks.length === 0 || width <= 0) {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      const c = canvas.getContext("2d");
      c?.clearRect(0, 0, canvas.width, canvas.height);
      renderRef.current = () => undefined;
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const c = canvas.getContext("2d");
    if (!c) return;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);

    const barGap = 2;
    const totalBars = Math.min(ctx.peaks.length, Math.max(1, Math.floor((width + barGap) / 4)));
    const effectiveBarWidth = Math.max(1, (width - barGap * (totalBars - 1)) / totalBars);
    const peaksPerBar = ctx.peaks.length / totalBars;
    const playedColor =
      getComputedStyle(canvas).getPropertyValue("--audio-waveform-played-color").trim() ||
      "#228be6";
    const unplayedColor =
      getComputedStyle(canvas).getPropertyValue("--audio-waveform-color").trim() ||
      "rgba(120, 120, 120, 0.4)";

    const aggregated = new Float32Array(totalBars);
    for (let i = 0; i < totalBars; i += 1) {
      const sliceStart = Math.floor(i * peaksPerBar);
      const sliceEnd = Math.floor((i + 1) * peaksPerBar);
      let peak = 0;
      for (let k = sliceStart; k < sliceEnd; k += 1) {
        peak = Math.max(peak, ctx.peaks[k] ?? 0);
      }
      aggregated[i] = peak;
    }

    renderRef.current = (progressRatio) => {
      c.clearRect(0, 0, width, height);
      const playedBars = Math.floor(progressRatio * totalBars);
      const center = height / 2;
      for (let i = 0; i < totalBars; i += 1) {
        const peak = aggregated[i];
        const x = i * (effectiveBarWidth + barGap);
        const color = i < playedBars ? playedColor : unplayedColor;
        const halfPeak = Math.max(1, peak * center);
        c.fillStyle = color;
        c.fillRect(x, center - halfPeak, effectiveBarWidth, halfPeak);
        c.fillRect(x, center, effectiveBarWidth, halfPeak);
      }
    };

    const ratio = playbackProgressRatio(
      audioRef.current?.currentTime ?? 0,
      ctx.duration,
      knownDurationSec
    );
    renderRef.current(ratio);
  }, [audioRef, ctx.duration, ctx.peaks, height, knownDurationSec, width]);

  const paint = useCallback(() => {
    const el = audioRef.current;
    const ratio = playbackProgressRatio(el?.currentTime ?? 0, el?.duration ?? 0, knownDurationSec);
    renderRef.current(ratio);
  }, [audioRef, knownDurationSec]);

  useEffect(() => {
    let raf: number | null = null;
    const tick = () => {
      paint();
      if (ctx.playing) {
        raf = requestAnimationFrame(tick);
      }
    };

    if (ctx.playing) {
      raf = requestAnimationFrame(tick);
    } else {
      paint();
    }

    return () => {
      if (raf != null) cancelAnimationFrame(raf);
    };
  }, [ctx.playing, ctx.currentTime, paint]);

  return (
    <Box ref={containerRef} {...ctx.getStyles("waveform")} style={{ height, width: "100%" }}>
      <canvas ref={canvasRef} {...ctx.getStyles("waveformCanvas")} />
    </Box>
  );
}
