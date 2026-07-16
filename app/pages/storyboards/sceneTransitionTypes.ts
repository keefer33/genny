export const TRANSITION_PRESENTATIONS = [
  "fade",
  "slide",
  "wipe",
  "flip",
  "clockWipe",
  "iris",
] as const;

export type TransitionPresentationType = (typeof TRANSITION_PRESENTATIONS)[number];

export type CardinalDirection = "from-left" | "from-top" | "from-right" | "from-bottom";

export type WipeDirection =
  | CardinalDirection
  | "from-top-left"
  | "from-top-right"
  | "from-bottom-left"
  | "from-bottom-right";

export type TransitionDirection = WipeDirection;

import type { TransitionSoundEffectId } from "./transitionSoundEffects";
import {
  DEFAULT_TRANSITION_SOUND_EFFECT,
  effectIdFromLegacySoundSrc,
  isTransitionSoundEffectId,
  transitionSoundEffectLabel,
} from "./transitionSoundEffects";

export type TransitionSound = {
  enabled: boolean;
  effect: TransitionSoundEffectId;
  volume: number;
};

export type SceneTransitionToNext = {
  enabled: boolean;
  presentation: TransitionPresentationType;
  slideDirection: TransitionDirection;
  durationInFrames: number;
  sound?: TransitionSound;
};

export const TRANSITION_PRESENTATION_OPTIONS: {
  value: TransitionPresentationType;
  label: string;
}[] = [
  { value: "fade", label: "Fade" },
  { value: "slide", label: "Slide" },
  { value: "wipe", label: "Wipe" },
  { value: "flip", label: "Flip" },
  { value: "clockWipe", label: "Clock wipe" },
  { value: "iris", label: "Iris" },
];

export const CARDINAL_DIRECTION_OPTIONS: { value: CardinalDirection; label: string }[] = [
  { value: "from-left", label: "From left" },
  { value: "from-right", label: "From right" },
  { value: "from-top", label: "From top" },
  { value: "from-bottom", label: "From bottom" },
];

export const WIPE_DIRECTION_OPTIONS: { value: WipeDirection; label: string }[] = [
  { value: "from-left", label: "From left" },
  { value: "from-top-left", label: "From top left" },
  { value: "from-top", label: "From top" },
  { value: "from-top-right", label: "From top right" },
  { value: "from-right", label: "From right" },
  { value: "from-bottom-right", label: "From bottom right" },
  { value: "from-bottom", label: "From bottom" },
  { value: "from-bottom-left", label: "From bottom left" },
];

const CARDINAL_DIRECTION_SET = new Set<string>(CARDINAL_DIRECTION_OPTIONS.map((o) => o.value));

export function toCardinalDirection(direction: TransitionDirection): CardinalDirection {
  if (CARDINAL_DIRECTION_SET.has(direction)) {
    return direction as CardinalDirection;
  }
  return "from-left";
}

const WIPE_DIRECTIONS = new Set<string>(WIPE_DIRECTION_OPTIONS.map((o) => o.value));
const PRESENTATION_SET = new Set<string>(TRANSITION_PRESENTATIONS);

export const DEFAULT_TRANSITION_DURATION_FRAMES = 15;

export function defaultTransitionToNext(): SceneTransitionToNext {
  return {
    enabled: false,
    presentation: "fade",
    slideDirection: "from-left",
    durationInFrames: DEFAULT_TRANSITION_DURATION_FRAMES,
  };
}

export function presentationUsesDirection(
  presentation: TransitionPresentationType
): "cardinal" | "wipe" | false {
  if (presentation === "slide" || presentation === "flip") {
    return "cardinal";
  }
  if (presentation === "wipe") return "wipe";
  return false;
}

export function transitionPresentationLabel(presentation: TransitionPresentationType): string {
  return (
    TRANSITION_PRESENTATION_OPTIONS.find((option) => option.value === presentation)?.label ??
    "Transition"
  );
}

function normalizePresentation(value: unknown): TransitionPresentationType {
  if (typeof value === "string" && PRESENTATION_SET.has(value)) {
    return value as TransitionPresentationType;
  }
  return "fade";
}

function normalizeDirection(
  value: unknown,
  presentation: TransitionPresentationType,
  fallback: TransitionDirection
): TransitionDirection {
  const directionMode = presentationUsesDirection(presentation);
  if (!directionMode) return fallback;

  if (typeof value !== "string") return fallback;

  if (directionMode === "wipe" && WIPE_DIRECTIONS.has(value)) {
    return value as WipeDirection;
  }
  if (directionMode === "cardinal" && CARDINAL_DIRECTION_SET.has(value)) {
    return value as CardinalDirection;
  }

  return fallback;
}

function normalizeSound(raw: unknown): TransitionSound | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const record = raw as Record<string, unknown>;
  const volumeRaw = record.volume;
  const volume =
    typeof volumeRaw === "number" && Number.isFinite(volumeRaw)
      ? Math.min(1, Math.max(0, volumeRaw))
      : 1;

  let effect: TransitionSoundEffectId = DEFAULT_TRANSITION_SOUND_EFFECT;
  if (typeof record.effect === "string" && isTransitionSoundEffectId(record.effect)) {
    effect = record.effect;
  } else if (typeof record.src === "string") {
    const legacyEffect = effectIdFromLegacySoundSrc(record.src);
    if (legacyEffect) effect = legacyEffect;
  }

  return {
    enabled: record.enabled === true,
    effect,
    volume,
  };
}

export function hasActiveTransitionSound(transition: SceneTransitionToNext | undefined): boolean {
  return Boolean(transition?.sound?.enabled && transition.sound.effect);
}

export function parseTransitionToNext(scene: unknown): SceneTransitionToNext | undefined {
  if (!scene || typeof scene !== "object" || Array.isArray(scene)) return undefined;
  const raw = (scene as Record<string, unknown>).transitionToNext;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  return normalizeTransitionToNext(raw);
}

export function normalizeTransitionToNext(
  raw: unknown,
  sceneDuration = DEFAULT_TRANSITION_DURATION_FRAMES,
  nextSceneDuration = DEFAULT_TRANSITION_DURATION_FRAMES
): SceneTransitionToNext {
  const defaults = defaultTransitionToNext();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return defaults;
  }
  const record = raw as Record<string, unknown>;
  const presentation = normalizePresentation(record.presentation);
  const rawDirection = record.slideDirection ?? record.direction;
  const slideDirection = normalizeDirection(rawDirection, presentation, defaults.slideDirection);
  const durationRaw = record.durationInFrames;
  const maxDuration = Math.max(1, Math.min(sceneDuration, nextSceneDuration));
  const durationInFrames =
    typeof durationRaw === "number" && Number.isFinite(durationRaw)
      ? Math.min(maxDuration, Math.max(1, Math.round(durationRaw)))
      : Math.min(defaults.durationInFrames, maxDuration);

  const sound = normalizeSound(record.sound);
  const result: SceneTransitionToNext = {
    enabled: record.enabled === true,
    presentation,
    slideDirection,
    durationInFrames,
  };
  if (sound) {
    result.sound = sound;
  }
  return result;
}

export function isActiveTransition(
  transition: SceneTransitionToNext | undefined
): transition is SceneTransitionToNext {
  return Boolean(transition?.enabled && transition.durationInFrames > 0);
}

export function transitionOverlapFrames(
  transition: SceneTransitionToNext | undefined,
  sceneDuration: number,
  nextSceneDuration: number
): number {
  if (!isActiveTransition(transition)) return 0;
  return Math.min(transition.durationInFrames, sceneDuration, nextSceneDuration);
}

export function transitionSummaryLabel(transition: SceneTransitionToNext | undefined): string {
  if (!isActiveTransition(transition)) return "";
  const name = transitionPresentationLabel(transition.presentation);
  const soundSuffix = hasActiveTransitionSound(transition)
    ? ` ♪ ${transitionSoundEffectLabel(transition.sound?.effect)}`
    : "";
  return `→ ${name} ${transition.durationInFrames}f${soundSuffix}`;
}
