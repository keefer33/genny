function extensionFromMime(mime: string): string {
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("mp4") || mime.includes("m4a")) return "m4a";
  if (mime.includes("wav")) return "wav";
  return "webm";
}

/** Wrap a recorded blob as a `File` for upload. */
export function blobToUploadFile(blob: Blob, baseName: string, extension?: string): File {
  const safeBase = baseName.trim().replace(/[^\w.-]+/g, "-") || "recording";
  const type = blob.type?.trim() || "audio/webm";
  const ext = extension ?? extensionFromMime(type);
  return new File([blob], `${safeBase}.${ext}`, { type });
}
