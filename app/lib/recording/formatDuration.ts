/** Format seconds as `M:SS` (or `H:MM:SS` for long clips). */
export function formatAudioDurationSeconds(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

/** Format milliseconds as `M:SS` for recording timers. */
export function formatRecordingDuration(ms: number): string {
  return formatAudioDurationSeconds(ms / 1000);
}
