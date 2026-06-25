import type { LayerContent } from "./layerContentTypes";
import { defaultLayerContent, normalizeLayerContent } from "./layerContentTypes";

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
};

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
  return `Scene ${scenes.length + 1}`;
}

export type SceneBackgroundType = "video" | "image" | "color";

export type StoryboardSceneFormValues = {
  title: string;
  durationInFrames: number;
  backgroundType: SceneBackgroundType;
  backgroundValue: string;
};

export const DEFAULT_SCENE_BACKGROUND_COLOR = "#000000";
export const DEFAULT_SCENE_DURATION_FRAMES = 90;

export function emptySceneFormValues(sceneIndex: number): StoryboardSceneFormValues {
  return {
    title: `Scene ${sceneIndex + 1}`,
    durationInFrames: DEFAULT_SCENE_DURATION_FRAMES,
    backgroundType: "video",
    backgroundValue: "",
  };
}

export type SceneLayer = {
  id: string;
  durationInFrames: number;
  from: number;
  left: number;
  top: number;
  width: number;
  height: number;
  color: string;
  content?: LayerContent;
  isDragging?: boolean;
};

export type StoryboardSceneBackground = {
  type: SceneBackgroundType;
  value: string;
  layers: SceneLayer[];
};

export type StoryboardScenePayload = {
  durationInFrames: number;
  background: StoryboardSceneBackground;
};

export function parseSceneDurationInFrames(scene: unknown): number {
  if (!scene || typeof scene !== "object" || Array.isArray(scene)) {
    return DEFAULT_SCENE_DURATION_FRAMES;
  }
  const raw = scene as Record<string, unknown>;
  return parsePositiveInt(raw.durationInFrames, DEFAULT_SCENE_DURATION_FRAMES);
}

export function scenePayloadFromForm(
  values: StoryboardSceneFormValues,
  existingScene?: unknown | null
): StoryboardScenePayload {
  return {
    durationInFrames: parsePositiveInt(values.durationInFrames, DEFAULT_SCENE_DURATION_FRAMES),
    background: {
      type: values.backgroundType,
      value: values.backgroundValue.trim(),
      layers: parseExistingSceneLayers(existingScene),
    },
  };
}

export function parseSceneBackground(scene: unknown): {
  type: SceneBackgroundType;
  value: string;
} {
  if (!scene || typeof scene !== "object" || Array.isArray(scene)) {
    return { type: "video", value: "" };
  }
  const background = (scene as Record<string, unknown>).background;
  if (!background || typeof background !== "object" || Array.isArray(background)) {
    return { type: "video", value: "" };
  }
  const raw = background as Record<string, unknown>;
  const type = raw.type;
  const value = typeof raw.value === "string" ? raw.value : "";
  if (type === "video" || type === "image" || type === "color") {
    return { type, value };
  }
  return { type: "video", value };
}

function parseExistingSceneLayers(scene: unknown): SceneLayer[] {
  return parseSceneLayers(scene);
}

export function parseScenePayload(scene: unknown): StoryboardScenePayload {
  const background = parseSceneBackground(scene);
  return {
    durationInFrames: parseSceneDurationInFrames(scene),
    background: {
      ...background,
      layers: parseSceneLayers(scene),
    },
  };
}

export function buildScenePayloadFromExisting(
  existingScene: unknown,
  layers: SceneLayer[]
): StoryboardScenePayload {
  const background = parseSceneBackground(existingScene);
  return {
    durationInFrames: parseSceneDurationInFrames(existingScene),
    background: {
      type: background.type,
      value: background.value,
      layers: sanitizeLayersForSave(layers),
    },
  };
}

export function sanitizeLayersForSave(layers: SceneLayer[]): SceneLayer[] {
  return layers.map(({ isDragging: _isDragging, ...layer }) => layer);
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

function normalizeLayer(raw: SceneLayer & { content?: unknown }): SceneLayer {
  return {
    id: raw.id,
    durationInFrames: Math.max(1, Math.round(raw.durationInFrames)),
    from: Math.max(0, Math.round(raw.from)),
    left: Math.round(raw.left),
    top: Math.round(raw.top),
    width: Math.max(1, Math.round(raw.width)),
    height: Math.max(1, Math.round(raw.height)),
    color: typeof raw.color === "string" ? raw.color : "transparent",
    content: normalizeLayerContent(raw.content),
  };
}

export function parseSceneLayers(scene: unknown): SceneLayer[] {
  if (!scene || typeof scene !== "object" || Array.isArray(scene)) return [];
  const background = (scene as Record<string, unknown>).background;
  if (!background || typeof background !== "object" || Array.isArray(background)) return [];
  const layers = (background as Record<string, unknown>).layers;
  if (!Array.isArray(layers)) return [];
  return layers.filter(isValidLayer).map(normalizeLayer);
}

export function createDefaultSceneLayer(
  existingLayers: SceneLayer[],
  sceneDurationInFrames = DEFAULT_SCENE_DURATION_FRAMES
): SceneLayer {
  return {
    id: crypto.randomUUID(),
    durationInFrames: sceneDurationInFrames,
    from: 0,
    left: 120 + existingLayers.length * 24,
    top: 120 + existingLayers.length * 24,
    width: 360,
    height: 360,
    color: "transparent",
    content: defaultLayerContent("text"),
  };
}

export function sceneFormFromRow(scene: UserStoryboardScene): StoryboardSceneFormValues {
  const background = parseSceneBackground(scene.scene);
  return {
    title: scene.title?.trim() || "Untitled scene",
    durationInFrames: parseSceneDurationInFrames(scene.scene),
    backgroundType: background.type,
    backgroundValue:
      background.value || (background.type === "color" ? DEFAULT_SCENE_BACKGROUND_COLOR : ""),
  };
}
