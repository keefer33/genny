import type { LayerContent } from "./layerContentTypes";
import { defaultLayerContent, normalizeLayerContent } from "./layerContentTypes";
import type { SceneTransitionToNext } from "./sceneTransitionTypes";
import {
  normalizeTransitionToNext,
  parseTransitionToNext,
  transitionOverlapFrames,
} from "./sceneTransitionTypes";
import {
  defaultVideoPlaybackFormValues,
  defaultVideoPlaybackOptions,
  normalizeVideoPlaybackOptions,
  videoPlaybackFormValuesFromOptions,
  videoPlaybackOptionsFromForm,
  type VideoPlaybackOptions,
} from "./videoPlaybackOptions";
export {
  defaultTransitionToNext,
  normalizeTransitionToNext,
  parseTransitionToNext,
  transitionOverlapFrames,
  transitionSummaryLabel,
  isActiveTransition,
  hasActiveTransitionSound,
} from "./sceneTransitionTypes";
export type { SceneTransitionToNext, TransitionSound } from "./sceneTransitionTypes";
export type { TransitionSoundEffectId } from "./transitionSoundEffects";
export { transitionSoundEffectLabel, TRANSITION_SOUND_EFFECTS } from "./transitionSoundEffects";

export const DEFAULT_STORYBOARD_WIDTH = 1920;
export const DEFAULT_STORYBOARD_HEIGHT = 1080;
export const DEFAULT_STORYBOARD_FPS = 24;

export type StoryboardSettings = {
  width?: number;
  height?: number;
  fps?: number;
};

export type UserStoryboard = {
  id: string;
  user_id?: string | null;
  created_at?: string | null;
  title?: string | null;
  settings?: StoryboardSettings | null;
};

export type UserStoryboardScene = {
  id: string;
  storyboard_id?: string | null;
  created_at?: string | null;
  title?: string | null;
  scene?: unknown | null;
  type?: StoryboardSceneRowType | string | null;
  sort?: number | null;
};

export type StoryboardSceneRowType = "scene" | "base";

export const BASE_SCENE_TYPE: StoryboardSceneRowType = "base";
export const REGULAR_SCENE_TYPE: StoryboardSceneRowType = "scene";
export const BASE_SCENE_TITLE = "Base";

export function normalizeStoryboardSceneType(
  row: Pick<UserStoryboardScene, "type">
): StoryboardSceneRowType {
  return row.type === BASE_SCENE_TYPE ? BASE_SCENE_TYPE : REGULAR_SCENE_TYPE;
}

export function isBaseStoryboardScene(row: Pick<UserStoryboardScene, "type">): boolean {
  return normalizeStoryboardSceneType(row) === BASE_SCENE_TYPE;
}

export function regularStoryboardScenes(scenes: UserStoryboardScene[]): UserStoryboardScene[] {
  return [...scenes.filter((row) => !isBaseStoryboardScene(row))].sort((a, b) => {
    const sortDiff = parseSceneSortValue(a, 0) - parseSceneSortValue(b, 0);
    if (sortDiff !== 0) return sortDiff;
    return (a.created_at ?? "").localeCompare(b.created_at ?? "");
  });
}

export function getBaseStoryboardScene(scenes: UserStoryboardScene[]): UserStoryboardScene | null {
  return scenes.find((row) => isBaseStoryboardScene(row)) ?? null;
}

function parseSceneSortValue(row: UserStoryboardScene, fallback: number): number {
  if (typeof row.sort === "number" && Number.isFinite(row.sort)) {
    return Math.round(row.sort);
  }
  return fallback;
}

export function nextSceneSort(scenes: UserStoryboardScene[]): number {
  const regular = regularStoryboardScenes(scenes);
  if (regular.length === 0) return 1;
  return Math.max(...regular.map((row, index) => parseSceneSortValue(row, index + 1))) + 1;
}

export function sortStoryboardScenes(scenes: UserStoryboardScene[]): UserStoryboardScene[] {
  const base = getBaseStoryboardScene(scenes);
  const regular = [...regularStoryboardScenes(scenes)].sort((a, b) => {
    const sortDiff = parseSceneSortValue(a, 0) - parseSceneSortValue(b, 0);
    if (sortDiff !== 0) return sortDiff;
    return (a.created_at ?? "").localeCompare(b.created_at ?? "");
  });
  return base ? [base, ...regular] : regular;
}

export function assignSceneSortValues(scenes: UserStoryboardScene[]): UserStoryboardScene[] {
  const base = getBaseStoryboardScene(scenes);
  const regular = regularStoryboardScenes(scenes);
  const nextRegular = regular.map((row, index) => ({ ...row, sort: index + 1 }));
  if (!base) return nextRegular;
  return [{ ...base, sort: 0 }, ...nextRegular];
}

export function assignLayerSortValues(layers: SceneLayer[]): SceneLayer[] {
  return layers.map((layer, index) => ({ ...layer, sort: index }));
}

export function sortLayersBySort(layers: SceneLayer[]): SceneLayer[] {
  return [...layers]
    .map((layer, index) => ({ layer, index }))
    .sort((a, b) => {
      const aSort = typeof a.layer.sort === "number" ? a.layer.sort : a.index;
      const bSort = typeof b.layer.sort === "number" ? b.layer.sort : b.index;
      if (aSort !== bSort) return aSort - bSort;
      return a.index - b.index;
    })
    .map(({ layer }) => layer);
}

export type BaseScenePayload = {
  background: {
    layers: SceneLayer[];
  };
};

export function buildBaseScenePayload(layers: SceneLayer[]): BaseScenePayload {
  return {
    background: {
      layers: sanitizeLayersForSave(layers),
    },
  };
}

export function buildScenePayloadFromRow(
  row: UserStoryboardScene,
  layers: SceneLayer[]
): StoryboardScenePayload | BaseScenePayload {
  if (isBaseStoryboardScene(row)) {
    return buildBaseScenePayload(layers);
  }
  return buildScenePayloadFromExisting(row.scene, layers);
}

export type StoryboardFormValues = {
  title: string;
  width: number;
  height: number;
  fps: number;
};

export const EMPTY_STORYBOARD_FORM: StoryboardFormValues = {
  title: "",
  width: DEFAULT_STORYBOARD_WIDTH,
  height: DEFAULT_STORYBOARD_HEIGHT,
  fps: DEFAULT_STORYBOARD_FPS,
};

function parsePositiveInt(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : fallback;
}

export function parseStoryboardSettings(settings: unknown): StoryboardSettings {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
    return {
      width: DEFAULT_STORYBOARD_WIDTH,
      height: DEFAULT_STORYBOARD_HEIGHT,
      fps: DEFAULT_STORYBOARD_FPS,
    };
  }
  const raw = settings as Record<string, unknown>;
  return {
    width: parsePositiveInt(raw.width, DEFAULT_STORYBOARD_WIDTH),
    height: parsePositiveInt(raw.height, DEFAULT_STORYBOARD_HEIGHT),
    fps: parsePositiveInt(raw.fps, DEFAULT_STORYBOARD_FPS),
  };
}

export function storyboardFormFromRow(storyboard: UserStoryboard): StoryboardFormValues {
  const settings = parseStoryboardSettings(storyboard.settings);
  return {
    title: storyboard.title?.trim() ?? "",
    width: settings.width ?? DEFAULT_STORYBOARD_WIDTH,
    height: settings.height ?? DEFAULT_STORYBOARD_HEIGHT,
    fps: settings.fps ?? DEFAULT_STORYBOARD_FPS,
  };
}

export function storyboardSettingsFromForm(values: StoryboardFormValues): StoryboardSettings {
  return {
    width: parsePositiveInt(values.width, DEFAULT_STORYBOARD_WIDTH),
    height: parsePositiveInt(values.height, DEFAULT_STORYBOARD_HEIGHT),
    fps: parsePositiveInt(values.fps, DEFAULT_STORYBOARD_FPS),
  };
}

export function storyboardMetaLine(storyboard: UserStoryboard): string {
  const settings = parseStoryboardSettings(storyboard.settings);
  return `${settings.width}×${settings.height} · ${settings.fps} fps`;
}

export function nextSceneTitle(scenes: UserStoryboardScene[]): string {
  return `Scene ${regularStoryboardScenes(scenes).length + 1}`;
}

export type SceneBackgroundType = "video" | "image" | "color";

export type SceneBackgroundData = {
  type: SceneBackgroundType;
  value: string;
} & VideoPlaybackOptions;

export type StoryboardSceneFormValues = {
  title: string;
  durationInFrames: number;
  backgroundType: SceneBackgroundType;
  backgroundValue: string;
  backgroundVideoTrimBefore: number;
  backgroundVideoTrimAfter: number | null;
  backgroundVideoVolume: number;
  backgroundVideoPlaybackRate: number;
};

export const DEFAULT_SCENE_BACKGROUND_COLOR = "#000000";
export const DEFAULT_SCENE_DURATION_FRAMES = 90;

export function sceneBackgroundData(
  type: SceneBackgroundType,
  value: string,
  playback?: Partial<VideoPlaybackOptions>
): SceneBackgroundData {
  return {
    type,
    value,
    ...defaultVideoPlaybackOptions(),
    ...playback,
  };
}

export function emptySceneFormValues(sceneIndex: number): StoryboardSceneFormValues {
  const videoDefaults = defaultVideoPlaybackFormValues();
  return {
    title: `Scene ${sceneIndex + 1}`,
    durationInFrames: DEFAULT_SCENE_DURATION_FRAMES,
    backgroundType: "video",
    backgroundValue: "",
    backgroundVideoTrimBefore: videoDefaults.trimBefore,
    backgroundVideoTrimAfter: videoDefaults.trimAfter,
    backgroundVideoVolume: videoDefaults.volume,
    backgroundVideoPlaybackRate: videoDefaults.playbackRate,
  };
}

export type SceneLayer = {
  id: string;
  title: string;
  sort?: number;
  durationInFrames: number;
  from: number;
  left: number;
  top: number;
  width: number;
  height: number;
  color: string;
  /** Inner padding in px. */
  padding: number;
  /** When false, no border is drawn (width/color still stored). */
  border: boolean;
  borderWidth: number;
  borderColor: string;
  borderRadius: number;
  /** When false, no box-shadow is drawn. */
  shadow: boolean;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowBlur: number;
  shadowSpread: number;
  shadowColor: string;
  content?: LayerContent;
  isDragging?: boolean;
};

export const DEFAULT_LAYER_BORDER_COLOR = "#000000";
export const DEFAULT_LAYER_SHADOW_COLOR = "#00000066";

export function defaultLayerBoxStyle(): Pick<
  SceneLayer,
  | "padding"
  | "border"
  | "borderWidth"
  | "borderColor"
  | "borderRadius"
  | "shadow"
  | "shadowOffsetX"
  | "shadowOffsetY"
  | "shadowBlur"
  | "shadowSpread"
  | "shadowColor"
> {
  return {
    padding: 0,
    border: false,
    borderWidth: 1,
    borderColor: DEFAULT_LAYER_BORDER_COLOR,
    borderRadius: 0,
    shadow: false,
    shadowOffsetX: 0,
    shadowOffsetY: 4,
    shadowBlur: 12,
    shadowSpread: 0,
    shadowColor: DEFAULT_LAYER_SHADOW_COLOR,
  };
}

function normalizeNonNegativeInt(raw: unknown, fallback: number): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return fallback;
  return Math.max(0, Math.round(raw));
}

function normalizeInt(raw: unknown, fallback: number): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return fallback;
  return Math.round(raw);
}

function normalizeLayerBoxStyle(
  raw: Record<string, unknown>
): Pick<
  SceneLayer,
  | "padding"
  | "border"
  | "borderWidth"
  | "borderColor"
  | "borderRadius"
  | "shadow"
  | "shadowOffsetX"
  | "shadowOffsetY"
  | "shadowBlur"
  | "shadowSpread"
  | "shadowColor"
> {
  const defaults = defaultLayerBoxStyle();
  return {
    padding: normalizeNonNegativeInt(raw.padding, defaults.padding),
    border: raw.border === true,
    borderWidth: normalizeNonNegativeInt(raw.borderWidth, defaults.borderWidth),
    borderColor:
      typeof raw.borderColor === "string" && raw.borderColor.trim()
        ? raw.borderColor.trim()
        : defaults.borderColor,
    borderRadius: normalizeNonNegativeInt(raw.borderRadius, defaults.borderRadius),
    shadow: raw.shadow === true,
    shadowOffsetX: normalizeInt(raw.shadowOffsetX, defaults.shadowOffsetX),
    shadowOffsetY: normalizeInt(raw.shadowOffsetY, defaults.shadowOffsetY),
    shadowBlur: normalizeNonNegativeInt(raw.shadowBlur, defaults.shadowBlur),
    shadowSpread: normalizeInt(raw.shadowSpread, defaults.shadowSpread),
    shadowColor:
      typeof raw.shadowColor === "string" && raw.shadowColor.trim()
        ? raw.shadowColor.trim()
        : defaults.shadowColor,
  };
}

export function defaultLayerTitle(index: number): string {
  return `Layer ${index + 1}`;
}

export function layerDisplayTitle(layer: Pick<SceneLayer, "title">, index: number): string {
  return layer.title?.trim() || defaultLayerTitle(index);
}

export type StoryboardSceneBackground = SceneBackgroundData & {
  layers: SceneLayer[];
};

export type StoryboardScenePayload = {
  durationInFrames: number;
  background: StoryboardSceneBackground;
  transitionToNext?: SceneTransitionToNext;
};

export function parseSceneDurationInFrames(scene: unknown): number {
  if (!scene || typeof scene !== "object" || Array.isArray(scene)) {
    return DEFAULT_SCENE_DURATION_FRAMES;
  }
  const raw = scene as Record<string, unknown>;
  return parsePositiveInt(raw.durationInFrames, DEFAULT_SCENE_DURATION_FRAMES);
}

function sceneBackgroundVideoFieldsFromForm(
  values: StoryboardSceneFormValues
): Partial<VideoPlaybackOptions> {
  if (values.backgroundType !== "video") return {};
  return videoPlaybackOptionsFromForm({
    trimBefore: values.backgroundVideoTrimBefore,
    trimAfter: values.backgroundVideoTrimAfter,
    volume: values.backgroundVideoVolume,
    playbackRate: values.backgroundVideoPlaybackRate,
  });
}

export function scenePayloadFromForm(
  values: StoryboardSceneFormValues,
  existingScene?: unknown | null,
  options?: { nextSceneDuration?: number; layers?: SceneLayer[] }
): StoryboardScenePayload {
  const payload: StoryboardScenePayload = {
    durationInFrames: parsePositiveInt(values.durationInFrames, DEFAULT_SCENE_DURATION_FRAMES),
    background: {
      type: values.backgroundType,
      value: values.backgroundValue.trim(),
      ...defaultVideoPlaybackOptions(),
      ...sceneBackgroundVideoFieldsFromForm(values),
      layers:
        options?.layers ?? (existingScene != null ? parseExistingSceneLayers(existingScene) : []),
    },
  };
  const existingTransition =
    existingScene != null ? parseTransitionToNext(existingScene) : undefined;
  if (existingTransition) {
    const nextDuration = options?.nextSceneDuration ?? payload.durationInFrames;
    payload.transitionToNext = normalizeTransitionToNext(
      existingTransition,
      payload.durationInFrames,
      nextDuration
    );
  }
  return payload;
}

export function parseSceneBackground(scene: unknown): SceneBackgroundData {
  const defaults = defaultVideoPlaybackOptions();
  if (!scene || typeof scene !== "object" || Array.isArray(scene)) {
    return { type: "video", value: "", ...defaults };
  }
  const background = (scene as Record<string, unknown>).background;
  if (!background || typeof background !== "object" || Array.isArray(background)) {
    return { type: "video", value: "", ...defaults };
  }
  const raw = background as Record<string, unknown>;
  const type = raw.type;
  const value = typeof raw.value === "string" ? raw.value : "";
  const playback = type === "video" ? normalizeVideoPlaybackOptions(raw) : defaults;
  if (type === "video" || type === "image" || type === "color") {
    return { type, value, ...playback };
  }
  return { type: "video", value, ...defaults };
}

function parseExistingSceneLayers(scene: unknown): SceneLayer[] {
  return parseSceneLayers(scene);
}

export function parseScenePayload(scene: unknown): StoryboardScenePayload {
  const background = parseSceneBackground(scene);
  const payload: StoryboardScenePayload = {
    durationInFrames: parseSceneDurationInFrames(scene),
    background: {
      ...background,
      layers: parseSceneLayers(scene),
    },
  };
  const transition = parseTransitionToNext(scene);
  if (transition) {
    payload.transitionToNext = transition;
  }
  return payload;
}

export function buildScenePayloadFromExisting(
  existingScene: unknown,
  layers: SceneLayer[]
): StoryboardScenePayload {
  const background = parseSceneBackground(existingScene);
  const payload: StoryboardScenePayload = {
    durationInFrames: parseSceneDurationInFrames(existingScene),
    background: {
      type: background.type,
      value: background.value,
      trimBeforeFrames: background.trimBeforeFrames,
      trimAfterFrames: background.trimAfterFrames,
      volume: background.volume,
      playbackRate: background.playbackRate,
      layers: sanitizeLayersForSave(layers),
    },
  };
  const transition = parseTransitionToNext(existingScene);
  if (transition) {
    payload.transitionToNext = transition;
  }
  return payload;
}

export function buildScenePayloadWithTransition(
  existingScene: unknown,
  transitionToNext: SceneTransitionToNext,
  nextSceneDuration?: number
): StoryboardScenePayload {
  const base = parseScenePayload(existingScene);
  const sceneDuration = base.durationInFrames;
  const nextDuration = nextSceneDuration ?? sceneDuration;
  return {
    ...base,
    transitionToNext: normalizeTransitionToNext(transitionToNext, sceneDuration, nextDuration),
  };
}

export function sanitizeLayersForSave(layers: SceneLayer[]): SceneLayer[] {
  return assignLayerSortValues(layers.map(({ isDragging: _isDragging, ...layer }) => layer));
}

export function layerEndFrame(layer: Pick<SceneLayer, "from" | "durationInFrames">): number {
  return layer.from + layer.durationInFrames - 1;
}

function isValidLayer(value: unknown): value is SceneLayer {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const raw = value as Record<string, unknown>;
  return (
    typeof raw.id === "string" &&
    typeof raw.durationInFrames === "number" &&
    typeof raw.from === "number" &&
    typeof raw.left === "number" &&
    typeof raw.top === "number" &&
    typeof raw.width === "number" &&
    typeof raw.height === "number" &&
    typeof raw.color === "string"
  );
}

function normalizeLayer(
  raw: SceneLayer & { content?: unknown; title?: unknown },
  index: number
): SceneLayer {
  const title =
    typeof raw.title === "string" && raw.title.trim() ? raw.title.trim() : defaultLayerTitle(index);
  return {
    id: raw.id,
    title,
    sort: typeof raw.sort === "number" && Number.isFinite(raw.sort) ? Math.round(raw.sort) : index,
    durationInFrames: Math.max(1, Math.round(raw.durationInFrames)),
    from: Math.max(0, Math.round(raw.from)),
    left: Math.round(raw.left),
    top: Math.round(raw.top),
    width: Math.max(1, Math.round(raw.width)),
    height: Math.max(1, Math.round(raw.height)),
    color: typeof raw.color === "string" ? raw.color : "transparent",
    ...normalizeLayerBoxStyle(raw as unknown as Record<string, unknown>),
    content: normalizeLayerContent(raw.content),
  };
}

export function parseSceneLayers(scene: unknown): SceneLayer[] {
  if (!scene || typeof scene !== "object" || Array.isArray(scene)) return [];
  const background = (scene as Record<string, unknown>).background;
  if (!background || typeof background !== "object" || Array.isArray(background)) return [];
  const layers = (background as Record<string, unknown>).layers;
  if (!Array.isArray(layers)) return [];
  return sortLayersBySort(
    layers.filter(isValidLayer).map((layer, index) => normalizeLayer(layer, index))
  );
}

export function createDefaultSceneLayer(
  existingLayers: SceneLayer[],
  sceneDurationInFrames = DEFAULT_SCENE_DURATION_FRAMES
): SceneLayer {
  return {
    id: crypto.randomUUID(),
    title: defaultLayerTitle(existingLayers.length),
    sort: existingLayers.length,
    durationInFrames: sceneDurationInFrames,
    from: 0,
    left: 120 + existingLayers.length * 24,
    top: 120 + existingLayers.length * 24,
    width: 360,
    height: 360,
    color: "transparent",
    ...defaultLayerBoxStyle(),
    content: defaultLayerContent("text"),
  };
}

export function sceneFormFromRow(scene: UserStoryboardScene): StoryboardSceneFormValues {
  const background = parseSceneBackground(scene.scene);
  const videoForm = videoPlaybackFormValuesFromOptions(background);
  return {
    title: scene.title?.trim() || "Untitled scene",
    durationInFrames: parseSceneDurationInFrames(scene.scene),
    backgroundType: background.type,
    backgroundValue:
      background.value || (background.type === "color" ? DEFAULT_SCENE_BACKGROUND_COLOR : ""),
    backgroundVideoTrimBefore: videoForm.trimBefore,
    backgroundVideoTrimAfter: videoForm.trimAfter,
    backgroundVideoVolume: videoForm.volume,
    backgroundVideoPlaybackRate: videoForm.playbackRate,
  };
}

export type StoryboardPlayerScene = {
  id: string;
  durationInFrames: number;
  background: SceneBackgroundData;
  layers: SceneLayer[];
  transitionToNext?: SceneTransitionToNext;
};

export function totalStoryboardDurationInFrames(scenes: UserStoryboardScene[]): number {
  const regularScenes = regularStoryboardScenes(scenes);
  if (regularScenes.length === 0) return DEFAULT_SCENE_DURATION_FRAMES;

  let total = 0;
  for (let i = 0; i < regularScenes.length; i++) {
    const sceneDuration = parseSceneDurationInFrames(regularScenes[i]?.scene);
    total += sceneDuration;

    if (i < regularScenes.length - 1) {
      const nextSceneDuration = parseSceneDurationInFrames(regularScenes[i + 1]?.scene);
      const transition = parseTransitionToNext(regularScenes[i]?.scene);
      total -= transitionOverlapFrames(transition, sceneDuration, nextSceneDuration);
    }
  }

  return Math.max(1, total);
}

export function storyboardSceneStartFrames(scenes: UserStoryboardScene[]): number[] {
  const regularScenes = regularStoryboardScenes(scenes);
  const starts: number[] = [];
  let cursor = 0;

  for (let i = 0; i < regularScenes.length; i++) {
    starts.push(cursor);
    const sceneDuration = parseSceneDurationInFrames(regularScenes[i]?.scene);
    cursor += sceneDuration;

    if (i < regularScenes.length - 1) {
      const nextSceneDuration = parseSceneDurationInFrames(regularScenes[i + 1]?.scene);
      const transition = parseTransitionToNext(regularScenes[i]?.scene);
      cursor -= transitionOverlapFrames(transition, sceneDuration, nextSceneDuration);
    }
  }

  return starts;
}

export function storyboardIncomingTransitionOverlap(
  scenes: UserStoryboardScene[],
  sceneIndex: number
): number {
  const regularScenes = regularStoryboardScenes(scenes);
  if (sceneIndex <= 0) return 0;

  const prevScene = regularScenes[sceneIndex - 1];
  const scene = regularScenes[sceneIndex];
  if (!prevScene || !scene) return 0;

  const prevDuration = parseSceneDurationInFrames(prevScene.scene);
  const sceneDuration = parseSceneDurationInFrames(scene.scene);
  const transition = parseTransitionToNext(prevScene.scene);
  return transitionOverlapFrames(transition, prevDuration, sceneDuration);
}

export function storyboardSeekFrame(
  scenes: UserStoryboardScene[],
  sceneIndex: number,
  layerFrom?: number
): number {
  const regularScenes = regularStoryboardScenes(scenes);
  if (sceneIndex < 0) return 0;

  const sceneStart = storyboardSceneStartFrames(scenes)[sceneIndex] ?? 0;
  const incomingOverlap = storyboardIncomingTransitionOverlap(regularScenes, sceneIndex);
  const localFrame =
    layerFrom !== undefined && layerFrom >= 0
      ? Math.max(layerFrom, incomingOverlap)
      : incomingOverlap;

  return sceneStart + localFrame;
}

export function storyboardSeekFrameForSceneId(
  scenes: UserStoryboardScene[],
  sceneId: string,
  layerFrom?: number
): number {
  const baseScene = getBaseStoryboardScene(scenes);
  if (baseScene?.id === sceneId) {
    return layerFrom !== undefined && layerFrom >= 0 ? layerFrom : 0;
  }

  const regularScenes = regularStoryboardScenes(scenes);
  const sceneIndex = regularScenes.findIndex((row) => row.id === sceneId);
  return storyboardSeekFrame(scenes, sceneIndex, layerFrom);
}

export type TimelineSceneBlock = {
  sceneId: string;
  title: string;
  startFrame: number;
  durationInFrames: number;
  index: number;
};

export type TimelineLayerBlock = {
  layerId: string;
  sceneId: string;
  title: string;
  startFrame: number;
  durationInFrames: number;
  color: string;
};

export type StoryboardTimelineTracks = {
  scenes: TimelineSceneBlock[];
  layers: TimelineLayerBlock[];
};

export function buildStoryboardTimelineTracks(
  scenes: UserStoryboardScene[],
  selectedSceneId: string | null,
  selectedSceneLayers: SceneLayer[]
): StoryboardTimelineTracks {
  const regularScenes = regularStoryboardScenes(scenes);
  const baseScene = getBaseStoryboardScene(scenes);
  const starts = storyboardSceneStartFrames(scenes);
  const totalDuration = totalStoryboardDurationInFrames(scenes);
  const sceneBlocks: TimelineSceneBlock[] = [];
  const layerBlocks: TimelineLayerBlock[] = [];

  if (baseScene) {
    sceneBlocks.push({
      sceneId: baseScene.id,
      title: baseScene.title?.trim() || BASE_SCENE_TITLE,
      startFrame: 0,
      durationInFrames: totalDuration,
      index: -1,
    });

    const baseLayers =
      baseScene.id === selectedSceneId ? selectedSceneLayers : parseSceneLayers(baseScene.scene);
    baseLayers.forEach((layer, layerIndex) => {
      layerBlocks.push({
        layerId: layer.id,
        sceneId: baseScene.id,
        title: layerDisplayTitle(layer, layerIndex),
        startFrame: layer.from,
        durationInFrames: layer.durationInFrames,
        color: layer.color,
      });
    });
  }

  regularScenes.forEach((row, index) => {
    const duration = parseSceneDurationInFrames(row.scene);
    sceneBlocks.push({
      sceneId: row.id,
      title: row.title?.trim() || `Scene ${index + 1}`,
      startFrame: starts[index] ?? 0,
      durationInFrames: duration,
      index,
    });

    const sceneLayers =
      row.id === selectedSceneId ? selectedSceneLayers : parseSceneLayers(row.scene);
    const sceneStart = starts[index] ?? 0;
    sceneLayers.forEach((layer, layerIndex) => {
      layerBlocks.push({
        layerId: layer.id,
        sceneId: row.id,
        title: layerDisplayTitle(layer, layerIndex),
        startFrame: sceneStart + layer.from,
        durationInFrames: layer.durationInFrames,
        color: layer.color,
      });
    });
  });

  return { scenes: sceneBlocks, layers: layerBlocks };
}

export function buildStoryboardPlayerScenes(
  scenes: UserStoryboardScene[],
  selectedSceneId: string | null,
  selectedSceneLayers: SceneLayer[]
): StoryboardPlayerScene[] {
  const regularScenes = regularStoryboardScenes(scenes);
  return regularScenes.map((row, index) => {
    const isSelected = row.id === selectedSceneId;
    const sceneDuration = parseSceneDurationInFrames(row.scene);
    const nextSceneDuration =
      index < regularScenes.length - 1
        ? parseSceneDurationInFrames(regularScenes[index + 1]?.scene)
        : sceneDuration;
    const rawTransition = parseTransitionToNext(row.scene);
    const playerScene: StoryboardPlayerScene = {
      id: row.id,
      durationInFrames: sceneDuration,
      background: parseSceneBackground(row.scene),
      layers: sanitizeLayersForSave(isSelected ? selectedSceneLayers : parseSceneLayers(row.scene)),
    };
    if (index < regularScenes.length - 1 && rawTransition) {
      playerScene.transitionToNext = normalizeTransitionToNext(
        rawTransition,
        sceneDuration,
        nextSceneDuration
      );
    }
    return playerScene;
  });
}

export function buildStoryboardBaseLayers(
  scenes: UserStoryboardScene[],
  selectedSceneId: string | null,
  selectedSceneLayers: SceneLayer[]
): SceneLayer[] {
  const baseScene = getBaseStoryboardScene(scenes);
  if (!baseScene) return [];
  if (baseScene.id === selectedSceneId) {
    return sanitizeLayersForSave(selectedSceneLayers);
  }
  return sanitizeLayersForSave(parseSceneLayers(baseScene.scene));
}
