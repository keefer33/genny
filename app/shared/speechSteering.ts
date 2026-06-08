/** Helpers for Inworld TTS steering, non-verbals, and SSML pauses in speech scripts. */

export type SpeechScriptGuideSection = {
  title: string;
  description: string;
  example?: string;
};

export const SPEECH_SCRIPT_GUIDE = {
  title: "Script writing guide",
  intro:
    "Use the toolbar to build your script. Everything is sent as plain text to the voice engine.",
  sections: [
    {
      title: "Delivery (once at the start)",
      description:
        "Pick Delivery to set how the whole line is performed — mood, pace, pitch, or style. Use a single English instruction in square brackets before your words. Replace it anytime; do not add a second delivery block later in the script.",
      example: "[say with deliberate pauses in a low voice] I have been waiting for this moment.",
    },
    {
      title: "Non-verbals (inline)",
      description:
        "Insert sounds anywhere in the script with the Non-verbal menu — laughs, sighs, breaths, and similar cues.",
      example: "I can't believe you did that [laugh] that is unbelievable.",
    },
    {
      title: "Pauses (inline)",
      description:
        "Use Pause to add silence at the cursor. Each break can be up to 10 seconds. You can use up to 20 pause tags per script.",
      example: 'Welcome back <break time="1s" /> let us get started.',
    },
    {
      title: "Emphasis",
      description:
        "Capitalize a whole WORD for strong stress, or a syllable inside a word (e.g. absoLUTEly) for finer emphasis.",
      example: "That is NOT what I meant.",
    },
    {
      title: "Good habits",
      description:
        "Keep delivery instructions simple and in English. Match the tone to what is being said. Avoid opposite directions in one tag (for example, very loud and whisper together).",
    },
  ] satisfies SpeechScriptGuideSection[],
} as const;

/** Inworld allows up to 20 `<break>` tags per request; each break max 10s. */
export const MAX_PAUSE_TAGS_PER_SCRIPT = 20;
export const MAX_PAUSE_DURATION_MS = 10_000;

export type SteeringPreset = {
  id: string;
  label: string;
  /** Inner instruction (without brackets). */
  instruction: string;
};

export type SteeringPresetGroup = {
  id: string;
  label: string;
  presets: SteeringPreset[];
};

/** Inline tags — may appear anywhere in the script. */
export const NON_VERBAL_TAGS = [
  { id: "laugh", label: "Laugh", tag: "[laugh]" },
  { id: "breathe", label: "Breathe", tag: "[breathe]" },
  { id: "clear-throat", label: "Clear throat", tag: "[clear throat]" },
  { id: "sigh", label: "Sigh", tag: "[sigh]" },
  { id: "cough", label: "Cough", tag: "[cough]" },
  { id: "yawn", label: "Yawn", tag: "[yawn]" },
] as const;

/** SSML break tags — insert inline at the cursor. */
export const PAUSE_PRESETS = [
  { id: "250ms", label: "Brief (0.25s)", tag: '<break time="250ms" />' },
  { id: "500ms", label: "Short (0.5s)", tag: '<break time="500ms" />' },
  { id: "1s", label: "1 second", tag: '<break time="1s" />' },
  { id: "1500ms", label: "1.5 seconds", tag: '<break time="1500ms" />' },
  { id: "2s", label: "2 seconds", tag: '<break time="2s" />' },
  { id: "3s", label: "3 seconds", tag: '<break time="3s" />' },
  { id: "5s", label: "5 seconds", tag: '<break time="5s" />' },
] as const;

const NON_VERBAL_INNER = new Set(
  NON_VERBAL_TAGS.map((t) => t.tag.slice(1, -1).toLowerCase())
);

export const DELIVERY_PRESET_GROUPS: SteeringPresetGroup[] = [
  {
    id: "freeform",
    label: "Scene direction",
    presets: [
      {
        id: "excited",
        label: "Excited",
        instruction: "overwhelmed with excitement and barely able to contain yourself",
      },
      {
        id: "grief",
        label: "Grief",
        instruction: "slow and hushed with every word weighted by grief",
      },
      {
        id: "rage",
        label: "Controlled rage",
        instruction: "speak as if barely holding back rage forcing every word through gritted teeth",
      },
      {
        id: "amused",
        label: "Amused",
        instruction: "say with a hint of amusement",
      },
    ],
  },
  {
    id: "articulation",
    label: "Articulation",
    presets: [
      { id: "force", label: "With force", instruction: "say with force" },
      { id: "clear", label: "Clear", instruction: "articulate clearly" },
      { id: "pauses", label: "Deliberate pauses", instruction: "say with deliberate pauses" },
    ],
  },
  {
    id: "intonation",
    label: "Intonation",
    presets: [
      { id: "falling", label: "Falling pitch", instruction: "say with a falling pitch" },
      { id: "rising", label: "Rising pitch", instruction: "say with a rising pitch" },
    ],
  },
  {
    id: "volume",
    label: "Volume",
    presets: [
      { id: "loud", label: "Very loud", instruction: "very loud" },
      { id: "quiet", label: "Very quiet", instruction: "very quiet" },
    ],
  },
  {
    id: "pitch",
    label: "Pitch",
    presets: [
      { id: "low", label: "Low tone", instruction: "say in a low tone" },
      { id: "high", label: "High pitch", instruction: "say in a high pitch" },
    ],
  },
  {
    id: "range",
    label: "Range",
    presets: [
      { id: "playful", label: "Playful", instruction: "say playfully" },
      { id: "flat", label: "Flat", instruction: "say with no pitch variation" },
    ],
  },
  {
    id: "speed",
    label: "Speed",
    presets: [
      { id: "fast", label: "Very fast", instruction: "very fast" },
      { id: "slow", label: "Very slow", instruction: "very slow" },
    ],
  },
  {
    id: "vocal-style",
    label: "Vocal style",
    presets: [
      { id: "sing", label: "Sing joyfully", instruction: "sing joyfully" },
      { id: "whisper", label: "Whisper", instruction: "whisper in a hushed style" },
      { id: "nasal", label: "Nasal", instruction: "give a nasal quality" },
    ],
  },
];

const OPENING_TAG_RE = /^\s*\[([^\]]+)\]\s*/;

const DELIVERY_HINT_RE =
  /\[(?:say |speak |very |whisper|sing |articulate|give a |overwhelmed|slow and)/i;

/** Normalize per Inworld best practices (English, lowercase, no trailing punctuation). */
export function normalizeDeliveryInstruction(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[.!?]+$/g, "")
    .replace(/\s+/g, " ");
}

export function formatDeliveryTag(instruction: string): string {
  const inner = normalizeDeliveryInstruction(instruction);
  return inner ? `[${inner}]` : "";
}

function isNonVerbalInner(inner: string): boolean {
  return NON_VERBAL_INNER.has(inner.trim().toLowerCase());
}

export function parseOpeningDelivery(text: string): { tag: string; body: string } | null {
  const match = text.match(OPENING_TAG_RE);
  if (!match) return null;
  const inner = match[1].trim();
  if (!inner || isNonVerbalInner(inner)) return null;
  return {
    tag: `[${inner}]`,
    body: text.slice(match[0].length),
  };
}

export function setOpeningDelivery(text: string, instruction: string): string {
  const tag = formatDeliveryTag(instruction);
  if (!tag) return text;
  const parsed = parseOpeningDelivery(text);
  const body = parsed?.body ?? text;
  const trimmedBody = body.trimStart();
  return trimmedBody ? `${tag} ${trimmedBody}` : `${tag} `;
}

export function clearOpeningDelivery(text: string): string {
  const parsed = parseOpeningDelivery(text);
  return parsed ? parsed.body.trimStart() : text;
}

/** Build a well-formed SSML break tag (max 10s). */
export function formatPauseTag(durationMs: number): string | null {
  const ms = Math.round(durationMs);
  if (!Number.isFinite(ms) || ms <= 0 || ms > MAX_PAUSE_DURATION_MS) return null;
  if (ms % 1000 === 0) return `<break time="${ms / 1000}s" />`;
  return `<break time="${ms}ms" />`;
}

export function countPauseTags(text: string): number {
  return (text.match(/<break\b/gi) ?? []).length;
}

export function insertAtSelection(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  insert: string
): { value: string; selectionStart: number; selectionEnd: number } {
  const snippet = insert.trim();
  if (!snippet) {
    return { value: text, selectionStart, selectionEnd };
  }

  const before = text.slice(0, selectionStart);
  const after = text.slice(selectionEnd);
  const needsSpaceBefore = before.length > 0 && !/\s$/.test(before);
  const needsSpaceAfter = after.length > 0 && !/^\s/.test(after);
  const piece = `${needsSpaceBefore ? " " : ""}${snippet}${needsSpaceAfter ? " " : ""}`;
  const next = before + piece + after;
  const caret = before.length + piece.length;

  return { value: next, selectionStart: caret, selectionEnd: caret };
}

export type SteeringWarning = {
  id: string;
  message: string;
};

export function getSteeringWarnings(text: string): SteeringWarning[] {
  const warnings: SteeringWarning[] = [];
  const parsed = parseOpeningDelivery(text);
  const body = parsed?.body ?? text;

  if (DELIVERY_HINT_RE.test(body)) {
    warnings.push({
      id: "multiple-delivery",
      message:
        "Use one delivery instruction at the start. Move extra [direction] tags into the opening line or remove them.",
    });
  }

  const opening = parseOpeningDelivery(text);
  if (opening && /[A-Z]{3,}/.test(opening.tag)) {
    warnings.push({
      id: "delivery-caps",
      message: "Opening delivery tags work best in lowercase without punctuation.",
    });
  }

  const pauseCount = countPauseTags(text);
  if (pauseCount > MAX_PAUSE_TAGS_PER_SCRIPT) {
    warnings.push({
      id: "pause-limit",
      message: `Only ${MAX_PAUSE_TAGS_PER_SCRIPT} pause tags are used per request. Remove ${pauseCount - MAX_PAUSE_TAGS_PER_SCRIPT} to avoid ignored breaks.`,
    });
  }

  return warnings;
}
