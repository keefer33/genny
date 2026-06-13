import fixWebmDuration from "fix-webm-duration";

/** Embed duration metadata in MediaRecorder WebM blobs for seeking and waveform progress. */
export async function fixRecordedWebmBlob(blob: Blob, durationMs: number): Promise<Blob> {
  if (durationMs <= 0) return blob;
  if (!blob.type.includes("webm")) return blob;

  try {
    return await fixWebmDuration(blob, durationMs, { logger: false });
  } catch {
    return blob;
  }
}
