type GenerationFile = {
  thumbnail_url?: string | null;
  file_path?: string | null;
};

export type CharacterGeneration = {
  id?: string;
  status?: string;
  files?: GenerationFile[];
};

export function voicePreviewUrl(files: unknown): string | null {
  if (!files || typeof files !== "object") return null;
  const v = (files as Record<string, unknown>).voice;
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

export function firstGeneration(files: unknown): CharacterGeneration | null {
  if (!files || typeof files !== "object") return null;
  const generations = (files as Record<string, unknown>).generations;
  if (!Array.isArray(generations) || generations.length === 0) return null;
  const first = generations[0];
  if (!first || typeof first !== "object") return null;
  return first as CharacterGeneration;
}

export function firstGenerationThumbUrl(files: unknown): string | null {
  const generation = firstGeneration(files);
  const firstFile = generation?.files?.[0];
  const candidate = firstFile?.thumbnail_url ?? firstFile?.file_path;
  return typeof candidate === "string" && candidate.trim() ? candidate.trim() : null;
}
