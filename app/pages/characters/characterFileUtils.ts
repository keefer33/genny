export type CharacterGenerationFile = {
  id?: string;
  file_name?: string | null;
  file_path?: string | null;
  file_size?: number | null;
  file_type?: string | null;
  created_at?: string | null;
  status?: string | null;
  thumbnail_url?: string | null;
  generated_info?: unknown;
};

type CreatedAtSortable = { created_at?: string | null };

function createdAtTimestamp(createdAt: string | null | undefined): number {
  if (!createdAt?.trim()) return 0;
  const t = Date.parse(createdAt);
  return Number.isNaN(t) ? 0 : t;
}

type CharacterRowComparable = {
  id?: string;
  status?: string | null;
  name?: string | null;
  description?: string | null;
  metadata?: unknown;
};

/** Whether a fetched character row should replace React state (avoids pointless re-renders). */
export function characterRowNeedsUpdate(
  prev: CharacterRowComparable | null,
  next: CharacterRowComparable
): boolean {
  if (!prev) return true;
  if (prev.id !== next.id) return true;
  if ((prev.status ?? "") !== (next.status ?? "")) return true;
  if (prev.name !== next.name) return true;
  if (prev.description !== next.description) return true;
  return JSON.stringify(prev.metadata) !== JSON.stringify(next.metadata);
}

export function audioFileListsEqual(a: { id: string }[], b: { id: string }[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id) return false;
  }
  return true;
}

/** Newest first; items without `created_at` sort last. */
export function sortByCreatedAtDesc<T extends CreatedAtSortable>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => createdAtTimestamp(b.created_at) - createdAtTimestamp(a.created_at)
  );
}

export type CharacterGeneration = {
  id?: string;
  status?: string;
  /** Playground model UUID — used to place in-flight runs under Images vs Videos. */
  gen_model_id?: string;
  files?: CharacterGenerationFile[];
};

/** Models that produce video output for character runs. */
export const CHARACTER_VIDEO_GEN_MODEL_IDS = new Set([
  "7508e950-5461-45ec-9d99-f7c81bfca55d",
  "7d6306f7-2e13-4a5c-992d-eb317e908363",
]);

export function generationRunMediaKind(gen: CharacterGeneration): "image" | "video" {
  const id = typeof gen.gen_model_id === "string" ? gen.gen_model_id.trim() : "";
  if (id && CHARACTER_VIDEO_GEN_MODEL_IDS.has(id)) return "video";
  return "image";
}

export function genModelIdFromRunResponse(run: unknown): string | undefined {
  if (!run || typeof run !== "object") return undefined;
  const raw = (run as Record<string, unknown>).gen_model_id;
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  if (raw && typeof raw === "object" && "id" in raw) {
    const id = (raw as { id: unknown }).id;
    if (typeof id === "string" && id.trim()) return id.trim();
  }
  return undefined;
}

export function partitionGenerationsByMediaKind(generations: CharacterGeneration[]): {
  imageRuns: CharacterGeneration[];
  videoRuns: CharacterGeneration[];
} {
  const imageRuns: CharacterGeneration[] = [];
  const videoRuns: CharacterGeneration[] = [];
  for (const gen of generations) {
    if (generationRunMediaKind(gen) === "video") videoRuns.push(gen);
    else imageRuns.push(gen);
  }
  return { imageRuns, videoRuns };
}

/** Prepend or replace a run in `metadata.generations` (e.g. after starting a new character edit). */
export function mergePendingGenerationIntoMetadata(
  metadata: unknown,
  run: { id: string; status?: string; gen_model_id?: string }
): Record<string, unknown> {
  const base =
    metadata && typeof metadata === "object" ? { ...(metadata as Record<string, unknown>) } : {};
  const generations = listGenerations(base);
  const modelId = typeof run.gen_model_id === "string" ? run.gen_model_id.trim() : "";
  const pending: CharacterGeneration = {
    id: run.id,
    status: run.status ?? "pending",
    files: [],
    ...(modelId ? { gen_model_id: modelId } : {}),
  };
  const rest = generations.filter((g) => g.id !== run.id);
  return { ...base, generations: [pending, ...rest] };
}

export function listGenerations(metadata: unknown): CharacterGeneration[] {
  if (!metadata || typeof metadata !== "object") return [];
  const generations = (metadata as Record<string, unknown>).generations;
  if (!Array.isArray(generations)) return [];
  return generations.filter((g): g is CharacterGeneration => Boolean(g) && typeof g === "object");
}

export function generationFileMediaKind(file: CharacterGenerationFile): "image" | "video" | null {
  const ft = (file.file_type ?? "").toLowerCase();
  if (ft.startsWith("audio/")) return null;
  if (ft.startsWith("image/")) return "image";
  if (ft.startsWith("video/")) return "video";
  const path = (file.file_path ?? file.thumbnail_url ?? "").toLowerCase().split("?")[0];
  if (/\.(jpe?g|png|gif|webp|bmp)$/i.test(path)) return "image";
  if (/\.(mp4|webm|mov|m4v)$/i.test(path)) return "video";
  return null;
}

export function partitionGenerationFilesByMedia(files: CharacterGenerationFile[]): {
  images: CharacterGenerationFile[];
  videos: CharacterGenerationFile[];
} {
  const images: CharacterGenerationFile[] = [];
  const videos: CharacterGenerationFile[] = [];
  for (const file of files) {
    const kind = generationFileMediaKind(file);
    if (kind === "image") images.push(file);
    else if (kind === "video") videos.push(file);
  }
  return {
    images: sortByCreatedAtDesc(images),
    videos: sortByCreatedAtDesc(videos),
  };
}

/** All output files across every generation run on this character (deduped by id). */
export function listAllGenerationFiles(metadata: unknown): CharacterGenerationFile[] {
  const out: CharacterGenerationFile[] = [];
  const seen = new Set<string>();
  for (const gen of listGenerations(metadata)) {
    if (!Array.isArray(gen.files)) continue;
    for (const f of gen.files) {
      if (!f || typeof f !== "object") continue;
      const id = typeof f.id === "string" ? f.id.trim() : "";
      if (!id || seen.has(id)) continue;
      seen.add(id);
      out.push(f);
    }
  }
  return sortByCreatedAtDesc(out);
}

export function firstGeneration(metadata: unknown): CharacterGeneration | null {
  if (!metadata || typeof metadata !== "object") return null;
  const generations = (metadata as Record<string, unknown>).generations;
  if (!Array.isArray(generations) || generations.length === 0) return null;
  const first = generations[0];
  if (!first || typeof first !== "object") return null;
  return first as CharacterGeneration;
}

export function firstGenerationThumbUrl(metadata: unknown): string | null {
  const generation = firstGeneration(metadata);
  const firstFile = generation?.files?.[0];
  const candidate = firstFile?.thumbnail_url ?? firstFile?.file_path;
  return typeof candidate === "string" && candidate.trim() ? candidate.trim() : null;
}

export type CharacterDeletableFile = {
  id: string;
  file_name?: string | null;
};

export function removeFileFromCharacterMetadata(
  metadata: unknown,
  fileId: string
): Record<string, unknown> {
  const trimmedId = fileId.trim();
  if (!trimmedId) {
    return metadata && typeof metadata === "object"
      ? { ...(metadata as Record<string, unknown>) }
      : {};
  }
  const base =
    metadata && typeof metadata === "object" ? { ...(metadata as Record<string, unknown>) } : {};
  const generations = listGenerations(base).map((gen) => ({
    ...gen,
    files: (gen.files ?? []).filter((f) => {
      const id = typeof f?.id === "string" ? f.id.trim() : "";
      return id !== trimmedId;
    }),
  }));
  return { ...base, generations };
}

export type CharacterAudioFile = {
  id: string;
  file_name?: string | null;
  file_path?: string | null;
  file_type?: string | null;
  created_at?: string | null;
  generated_info?: unknown;
};

export function characterAudioFileUrl(file: CharacterAudioFile): string | null {
  const url = (file.file_path ?? "").trim();
  return url || null;
}

/** Map character audio rows for {@link FileDetailModal}. */
export function characterAudioFilesToDetailModalFiles(files: CharacterAudioFile[]): Array<{
  id: string;
  file_name?: string;
  file_path?: string;
  file_size?: number;
  file_type?: string;
  created_at?: string;
}> {
  return files
    .filter((f): f is CharacterAudioFile & { id: string } => Boolean(f.id?.trim()))
    .map((f) => ({
      id: f.id,
      file_name: f.file_name ?? undefined,
      file_path: f.file_path ?? undefined,
      file_type: f.file_type ?? undefined,
      created_at: f.created_at ?? undefined,
    }));
}

/** ElevenLabs `voice_id` from character metadata or existing audio `generated_info`. */
export function characterVoiceId(
  metadata: unknown,
  audioFiles: CharacterAudioFile[]
): string | null {
  if (metadata && typeof metadata === "object") {
    const raw = (metadata as Record<string, unknown>).voice_id;
    if (typeof raw === "string" && raw.trim()) return raw.trim();
  }
  for (const file of audioFiles) {
    const info =
      file.generated_info && typeof file.generated_info === "object"
        ? (file.generated_info as Record<string, unknown>)
        : null;
    const id = typeof info?.voice_id === "string" ? info.voice_id.trim() : "";
    if (id) return id;
  }
  return null;
}

export function mapUserFileToCharacterAudio(
  file: Record<string, unknown>
): CharacterAudioFile | null {
  const id = typeof file.id === "string" ? file.id.trim() : "";
  if (!id) return null;
  return {
    id,
    file_name: typeof file.file_name === "string" ? file.file_name : null,
    file_path: typeof file.file_path === "string" ? file.file_path : null,
    file_type: typeof file.file_type === "string" ? file.file_type : null,
    created_at: typeof file.created_at === "string" ? file.created_at : null,
    generated_info: file.generated_info,
  };
}

/** Label for audio picker rows (speech text, voice name, or file name). */
export function characterAudioFileLabel(file: CharacterAudioFile): string {
  const info =
    file.generated_info && typeof file.generated_info === "object"
      ? (file.generated_info as Record<string, unknown>)
      : null;
  const speech = typeof info?.speech === "string" ? info.speech.trim() : "";
  if (speech) return speech.length > 120 ? `${speech.slice(0, 117)}…` : speech;
  if (info?.dialogue === true && Array.isArray(info.inputs) && info.inputs.length > 0) {
    const first = info.inputs[0];
    if (first && typeof first === "object" && !Array.isArray(first)) {
      const line =
        typeof (first as { text?: unknown }).text === "string"
          ? (first as { text: string }).text.trim()
          : "";
      if (line) return line.length > 120 ? `${line.slice(0, 117)}…` : line;
    }
  }
  const voiceName = typeof info?.voice_name === "string" ? info.voice_name.trim() : "";
  if (voiceName) return voiceName;
  const name = (file.file_name ?? "").trim();
  if (name) return name;
  return "Audio clip";
}
