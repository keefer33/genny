import * as remotionSfx from "@remotion/sfx";

export const TRANSITION_SOUND_EFFECTS = [
  { id: "whoosh", label: "Whoosh" },
  { id: "whip", label: "Whip" },
  { id: "pageTurn", label: "Page turn" },
  { id: "uiSwitch", label: "Switch" },
  { id: "mouseClick", label: "Mouse click" },
  { id: "shutterModern", label: "Shutter (modern)" },
  { id: "shutterOld", label: "Shutter (old)" },
  { id: "ding", label: "Ding" },
  { id: "recordScratch", label: "Record scratch" },
  { id: "skedaddle", label: "Skedaddle" },
  { id: "snapchatNotification", label: "Notification" },
  { id: "loadingLag", label: "Loading lag" },
  { id: "macQuack", label: "Mac quack" },
  { id: "wilhelmScream", label: "Wilhelm scream" },
  { id: "boneCrack", label: "Bone crack" },
  { id: "animeWow", label: "Anime wow" },
  { id: "yippee", label: "Yippee" },
  { id: "bruh", label: "Bruh" },
  { id: "vineBoom", label: "Vine boom" },
  { id: "windowsXpError", label: "Windows XP error" },
  { id: "fah", label: "Fah" },
  { id: "spongebobFail", label: "SpongeBob fail" },
  { id: "omgHellNah", label: "OMG hell nah" },
  { id: "priceIsRightFail", label: "Price is Right fail" },
  { id: "romanceMeme", label: "Romance meme" },
  { id: "nellyAhh", label: "Nelly ahh" },
  { id: "sanctuaryGuardianWhat", label: "Sanctuary guardian what" },
  { id: "minecraftHurt", label: "Minecraft hurt" },
  { id: "ohMyGodVine", label: "Oh my god (vine)" },
  { id: "illuminatiConfirmed", label: "Illuminati confirmed" },
  { id: "dramaticBoomer", label: "Dramatic boomer" },
  { id: "triggered", label: "Triggered" },
] as const;

export type TransitionSoundEffectId = (typeof TRANSITION_SOUND_EFFECTS)[number]["id"];

export const DEFAULT_TRANSITION_SOUND_EFFECT: TransitionSoundEffectId = "whoosh";

const SFX_URL_BY_ID: Record<TransitionSoundEffectId, string> = {
  whoosh: remotionSfx.whoosh,
  whip: remotionSfx.whip,
  pageTurn: remotionSfx.pageTurn,
  uiSwitch: remotionSfx.uiSwitch,
  mouseClick: remotionSfx.mouseClick,
  shutterModern: remotionSfx.shutterModern,
  shutterOld: remotionSfx.shutterOld,
  ding: remotionSfx.ding,
  bruh: remotionSfx.bruh,
  vineBoom: remotionSfx.vineBoom,
  windowsXpError: remotionSfx.windowsXpError,
  fah: remotionSfx.fah,
  spongebobFail: remotionSfx.spongebobFail,
  omgHellNah: remotionSfx.omgHellNah,
  priceIsRightFail: remotionSfx.priceIsRightFail,
  romanceMeme: remotionSfx.romanceMeme,
  boneCrack: remotionSfx.boneCrack,
  animeWow: remotionSfx.animeWow,
  yippee: remotionSfx.yippee,
  loadingLag: remotionSfx.loadingLag,
  wilhelmScream: remotionSfx.wilhelmScream,
  macQuack: remotionSfx.macQuack,
  skedaddle: remotionSfx.skedaddle,
  snapchatNotification: remotionSfx.snapchatNotification,
  nellyAhh: remotionSfx.nellyAhh,
  sanctuaryGuardianWhat: remotionSfx.sanctuaryGuardianWhat,
  minecraftHurt: remotionSfx.minecraftHurt,
  ohMyGodVine: remotionSfx.ohMyGodVine,
  illuminatiConfirmed: remotionSfx.illuminatiConfirmed,
  dramaticBoomer: remotionSfx.dramaticBoomer,
  triggered: remotionSfx.triggered,
  recordScratch: remotionSfx.recordScratch,
};

const EFFECT_ID_SET = new Set<string>(TRANSITION_SOUND_EFFECTS.map((effect) => effect.id));

export function isTransitionSoundEffectId(value: string): value is TransitionSoundEffectId {
  return EFFECT_ID_SET.has(value);
}

export function resolveTransitionSoundUrl(
  effectId: TransitionSoundEffectId | string | null | undefined
): string | null {
  if (!effectId || !isTransitionSoundEffectId(effectId)) return null;
  return SFX_URL_BY_ID[effectId];
}

export function transitionSoundEffectLabel(
  effectId: TransitionSoundEffectId | string | null | undefined
): string {
  if (!effectId || !isTransitionSoundEffectId(effectId)) return "";
  return TRANSITION_SOUND_EFFECTS.find((effect) => effect.id === effectId)?.label ?? effectId;
}

export function effectIdFromLegacySoundSrc(src: string): TransitionSoundEffectId | null {
  const trimmed = src.trim();
  if (!trimmed) return null;
  for (const effect of TRANSITION_SOUND_EFFECTS) {
    if (SFX_URL_BY_ID[effect.id] === trimmed) return effect.id;
  }
  return null;
}
