import { voiceAccentSelectData } from "~/pages/voices/voiceAccentOptions";

/** Inworld voice design limits (must match gennyapi assist/design). */
export const VOICE_DESIGN_PROMPT_MIN = 30;
export const VOICE_DESIGN_PROMPT_MAX = 250;
export const VOICE_DESIGN_PREVIEW_MIN = 50;
export const VOICE_DESIGN_PREVIEW_MAX = 200;

export const VOICE_GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "neutral", label: "Neutral" },
] as const;

/** Stored on `user_voices.age` (Genny only; not sent to Inworld publish). */
export const VOICE_AGE_OPTIONS = [
  { value: "young", label: "Young" },
  { value: "young_adult", label: "Young adult" },
  { value: "early_middle_aged", label: "Early middle aged" },
  { value: "late_middle_aged", label: "Late middle aged" },
  { value: "senior", label: "Senior" },
] as const;

export { voiceAccentSelectData as VOICE_ACCENT_OPTIONS };
