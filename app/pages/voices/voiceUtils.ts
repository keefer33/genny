import type { UserVoice, UserVoiceSpeech } from "~/lib/stores/voicesStore";

export function isEditableUserVoice(voice: UserVoice): boolean {
  return (voice.type ?? "").toLowerCase() !== "system";
}

/** Default voice preview — excludes generated `voice_speech` clips on the same voice. */
export function voicePreviewUrl(voice: UserVoice): string | null {
  const files = voice.files ?? [];
  const previewFile =
    files.find((f) => {
      const t = (f.upload_type ?? "").toLowerCase();
      return t === "voice_clone" || t === "voice_design";
    }) ??
    files.find((f) => (f.upload_type ?? "").toLowerCase() !== "voice_speech") ??
    files[0];
  return previewFile?.file_path?.trim() || null;
}

export function speechAudioUrl(speech: UserVoiceSpeech, voice?: UserVoice | null): string | null {
  const embedded = speech.file?.file_path?.trim();
  if (embedded) return embedded;

  const fileId = speech.file_id?.trim();
  if (!fileId || !voice?.files?.length) return null;

  const linked = voice.files.find((f) => f.id?.trim() === fileId);
  return linked?.file_path?.trim() || null;
}

export function voiceMetaLine(voice: UserVoice): string | null {
  const bits = [voice.gender, voice.accent, voice.age].filter(Boolean);
  return bits.length > 0 ? bits.join(" · ") : null;
}

/** Inworld `voiceId` from `user_voices.metadata.provider.voice_id` (and legacy shapes). */
export function inworldProviderVoiceIdFromMetadata(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const meta = metadata as Record<string, unknown>;

  const provider = meta.provider;
  if (provider && typeof provider === "object" && !Array.isArray(provider)) {
    const id = (provider as { voice_id?: unknown }).voice_id;
    if (typeof id === "string" && id.trim()) return id.trim();
  }

  const inworld = meta.inworld;
  if (inworld && typeof inworld === "object" && !Array.isArray(inworld)) {
    const row = inworld as { voiceId?: unknown; voice_id?: unknown };
    const id =
      (typeof row.voiceId === "string" ? row.voiceId.trim() : "") ||
      (typeof row.voice_id === "string" ? row.voice_id.trim() : "");
    if (id) return id;
  }

  const legacy = meta.inworld_voice_id;
  if (typeof legacy === "string" && legacy.trim()) return legacy.trim();

  return null;
}

export function inworldProviderVoiceId(voice: UserVoice): string | null {
  return inworldProviderVoiceIdFromMetadata(voice.metadata);
}

export function voiceMetadataDescription(voice: UserVoice): string | null {
  const d = voice.description?.trim();
  if (d) return d;
  const meta = voice.metadata;
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return null;
  const design = (meta as { design?: { designPrompt?: string } }).design;
  const prompt = design?.designPrompt?.trim();
  return prompt || null;
}
