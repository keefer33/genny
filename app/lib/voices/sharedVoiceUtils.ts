import type { SharedVoiceItem } from "~/lib/voices/voiceLibraryQuery";

/** Map ElevenLabs language codes to Inworld `langCode` values used by voice clone. */
export function mapSharedVoiceLanguageToClone(language?: string | null): string {
  const raw = language?.trim();
  if (!raw) return "EN_US";
  if (raw.includes("_")) return raw.toUpperCase();
  const code = raw.toLowerCase();
  const map: Record<string, string> = {
    en: "EN_US",
    es: "ES_ES",
    fr: "FR_FR",
    de: "DE_DE",
    it: "IT_IT",
    pt: "PT_BR",
    ja: "JA_JP",
    ko: "KO_KR",
    zh: "ZH_CN",
    hi: "HI_IN",
    ar: "AR_SA",
    ru: "RU_RU",
    pl: "PL_PL",
    nl: "NL_NL",
    sv: "SV_SE",
    tr: "TR_TR",
    vi: "VI_VN",
  };
  return map[code] ?? "EN_US";
}

export function buildSharedVoiceAssistSeed(voice: SharedVoiceItem): string {
  const lines = [
    voice.description?.trim(),
    voice.name?.trim() ? `Voice name: ${voice.name.trim()}` : null,
    voice.gender?.trim() ? `Voice gender: ${voice.gender.trim()}` : null,
    voice.age?.trim() ? `Voice age: ${voice.age.trim()}` : null,
    voice.accent?.trim() ? `Voice accent: ${voice.accent.trim()}` : null,
    voice.language?.trim() ? `Voice language: ${voice.language.trim()}` : null,
    voice.category?.trim() ? `Voice category: ${voice.category.trim()}` : null,
    voice.use_case?.trim() ? `Use case: ${voice.use_case.trim()}` : null,
  ].filter((line): line is string => Boolean(line));
  if (lines.length > 0) return lines.join("\n");
  return `Create a character that matches this voice profile (${voice.name ?? voice.voice_id}).`;
}

export function buildSharedVoiceCloneMetadata(voice: SharedVoiceItem) {
  return {
    clone: {
      source: "elevenlabs",
      voice_id: voice.voice_id,
    },
  };
}

export function normalizeSharedVoiceGender(gender?: string | null): string | null {
  const g = gender?.trim().toLowerCase();
  if (!g) return null;
  if (g === "male" || g === "female" || g === "neutral") return g;
  return null;
}
