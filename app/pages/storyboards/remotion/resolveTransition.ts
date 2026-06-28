import type { TransitionPresentation } from "@remotion/transitions";
import { linearTiming } from "@remotion/transitions";
import { clockWipe } from "@remotion/transitions/clock-wipe";
import { fade } from "@remotion/transitions/fade";
import { flip } from "@remotion/transitions/flip";
import { iris } from "@remotion/transitions/iris";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import type { SceneTransitionToNext } from "../sceneTransitionTypes";
import { hasActiveTransitionSound, toCardinalDirection } from "../sceneTransitionTypes";
import { resolveTransitionSoundUrl } from "../transitionSoundEffects";
import { DEFAULT_STORYBOARD_HEIGHT, DEFAULT_STORYBOARD_WIDTH } from "../storyboardUtils";
import { addTransitionSound } from "./addTransitionSound";

export type ResolveTransitionContext = {
  width?: number;
  height?: number;
};

const presentationCache = new Map<string, TransitionPresentation<Record<string, unknown>>>();
const timingCache = new Map<number, ReturnType<typeof linearTiming>>();

function presentationCacheKey(
  transition: SceneTransitionToNext,
  context: ResolveTransitionContext
): string {
  const sound = transition.sound;
  return JSON.stringify({
    presentation: transition.presentation,
    slideDirection: transition.slideDirection,
    width: context.width ?? DEFAULT_STORYBOARD_WIDTH,
    height: context.height ?? DEFAULT_STORYBOARD_HEIGHT,
    soundEnabled: sound?.enabled ?? false,
    soundEffect: sound?.effect ?? null,
    soundVolume: sound?.volume ?? 1,
  });
}

function buildTransitionPresentation(
  transition: SceneTransitionToNext,
  context: ResolveTransitionContext
) {
  const width = context.width ?? DEFAULT_STORYBOARD_WIDTH;
  const height = context.height ?? DEFAULT_STORYBOARD_HEIGHT;
  const direction = transition.slideDirection;
  const cardinalDirection = toCardinalDirection(direction);

  let presentation;
  switch (transition.presentation) {
    case "slide":
      presentation = slide({ direction: cardinalDirection });
      break;
    case "wipe":
      presentation = wipe({ direction });
      break;
    case "flip":
      presentation = flip({ direction: cardinalDirection });
      break;
    case "clockWipe":
      presentation = clockWipe({ width, height });
      break;
    case "iris":
      presentation = iris({ width, height });
      break;
    case "fade":
    default:
      presentation = fade();
      break;
  }

  if (hasActiveTransitionSound(transition)) {
    const sound = transition.sound!;
    const src = resolveTransitionSoundUrl(sound.effect);
    if (src) {
      return addTransitionSound(presentation, src, sound.volume);
    }
  }

  return presentation;
}

export function resolveTransitionPresentation(
  transition: SceneTransitionToNext,
  context: ResolveTransitionContext = {}
) {
  const key = presentationCacheKey(transition, context);
  const cached = presentationCache.get(key);
  if (cached) return cached;

  const presentation = buildTransitionPresentation(transition, context) as TransitionPresentation<
    Record<string, unknown>
  >;
  presentationCache.set(key, presentation);
  return presentation;
}

export function resolveTransitionTiming(transition: SceneTransitionToNext) {
  const durationInFrames = transition.durationInFrames;
  const cached = timingCache.get(durationInFrames);
  if (cached) return cached;

  const timing = linearTiming({ durationInFrames });
  timingCache.set(durationInFrames, timing);
  return timing;
}
