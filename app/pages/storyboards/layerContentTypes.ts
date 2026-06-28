import { DEFAULT_GOOGLE_FONT_IMPORT_NAME, getGoogleFontCatalogEntry } from "./googleFontsCatalog";
import type { SceneLayer } from "./storyboardUtils";

export type LayerContentType = "video" | "image" | "text" | "animatedText";

export type AnimatedTextSplit = "none" | "word" | "character" | "line";

export type LayerAnimatedTextTransition = {
  split: AnimatedTextSplit;
  duration: number;
  stagger: number;
  opacity: [number, number];
  y: [number, number];
};

export type LayerVideoContent = {
  type: "video";
  url: string;
};

export type LayerImageContent = {
  type: "image";
  url: string;
};

export type LayerTextContent = {
  type: "text";
  text: string;
  fontSize: number;
  color: string;
  fontFamily: string;
  fontImportName: string;
  bold: boolean;
};

export type LayerAnimatedTextContent = {
  type: "animatedText";
  text: string;
  fontSize: number;
  color: string;
  fontFamily: string;
  fontImportName: string;
  bold: boolean;
  transition: LayerAnimatedTextTransition;
};

export type LayerContent =
  | LayerVideoContent
  | LayerImageContent
  | LayerTextContent
  | LayerAnimatedTextContent;

function layerEndFrameFromLayer(layer: Pick<SceneLayer, "from" | "durationInFrames">): number {
  return layer.from + layer.durationInFrames - 1;
}

function layerTimingFromRange(
  from: number,
  to: number
): Pick<SceneLayer, "from" | "durationInFrames"> {
  const clampedFrom = Math.max(0, Math.round(from));
  const clampedTo = Math.max(clampedFrom, Math.round(to));
  return {
    from: clampedFrom,
    durationInFrames: Math.max(1, clampedTo - clampedFrom + 1),
  };
}

export type LayerEditFormValues = {
  title: string;
  from: number;
  to: number;
  color: string;
  contentType: LayerContentType;
  videoUrl: string;
  imageUrl: string;
  text: string;
  textFontSize: number;
  textColor: string;
  textFontFamily: string;
  textFontImportName: string;
  textBold: boolean;
  animatedTextSplit: AnimatedTextSplit;
  animatedTextDuration: number;
  animatedTextStagger: number;
  animatedTextOpacityFrom: number;
  animatedTextOpacityTo: number;
  animatedTextYFrom: number;
  animatedTextYTo: number;
};

export function defaultLayerAnimatedTextTransition(): LayerAnimatedTextTransition {
  return {
    split: "word",
    duration: 20,
    stagger: 3,
    opacity: [0, 1],
    y: [20, 0],
  };
}

export function defaultLayerAnimatedTextContent(): LayerAnimatedTextContent {
  const entry = getGoogleFontCatalogEntry(DEFAULT_GOOGLE_FONT_IMPORT_NAME);
  return {
    type: "animatedText",
    text: "Animated Text",
    fontSize: 48,
    color: "#ffffff",
    fontFamily: entry?.family ?? "Inter",
    fontImportName: DEFAULT_GOOGLE_FONT_IMPORT_NAME,
    bold: false,
    transition: defaultLayerAnimatedTextTransition(),
  };
}

export function defaultLayerTextContent(): LayerTextContent {
  const entry = getGoogleFontCatalogEntry(DEFAULT_GOOGLE_FONT_IMPORT_NAME);
  return {
    type: "text",
    text: "Text",
    fontSize: 48,
    color: "#ffffff",
    fontFamily: entry?.family ?? "Inter",
    fontImportName: DEFAULT_GOOGLE_FONT_IMPORT_NAME,
    bold: false,
  };
}

export function defaultLayerContent(type: LayerContentType = "text"): LayerContent {
  if (type === "video") return { type: "video", url: "" };
  if (type === "image") return { type: "image", url: "" };
  if (type === "animatedText") return defaultLayerAnimatedTextContent();
  return defaultLayerTextContent();
}

function normalizeAnimatedTextTransition(raw: unknown): LayerAnimatedTextTransition {
  const defaults = defaultLayerAnimatedTextTransition();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return defaults;
  const record = raw as Record<string, unknown>;
  const split = record.split;
  const validSplit =
    split === "none" || split === "word" || split === "character" || split === "line"
      ? split
      : defaults.split;
  const duration =
    typeof record.duration === "number" && Number.isFinite(record.duration)
      ? Math.max(1, Math.round(record.duration))
      : defaults.duration;
  const stagger =
    typeof record.stagger === "number" && Number.isFinite(record.stagger)
      ? Math.max(0, Math.round(record.stagger))
      : defaults.stagger;
  const opacity = normalizeNumberPair(record.opacity, defaults.opacity);
  const y = normalizeNumberPair(record.y, defaults.y);
  return { split: validSplit, duration, stagger, opacity, y };
}

function normalizeNumberPair(raw: unknown, fallback: [number, number]): [number, number] {
  if (!Array.isArray(raw) || raw.length < 2) return fallback;
  const start = raw[0];
  const end = raw[1];
  if (typeof start !== "number" || typeof end !== "number") return fallback;
  if (!Number.isFinite(start) || !Number.isFinite(end)) return fallback;
  return [start, end];
}

function animatedTextFormDefaults(): Pick<
  LayerEditFormValues,
  | "animatedTextSplit"
  | "animatedTextDuration"
  | "animatedTextStagger"
  | "animatedTextOpacityFrom"
  | "animatedTextOpacityTo"
  | "animatedTextYFrom"
  | "animatedTextYTo"
> {
  const transition = defaultLayerAnimatedTextTransition();
  return {
    animatedTextSplit: transition.split,
    animatedTextDuration: transition.duration,
    animatedTextStagger: transition.stagger,
    animatedTextOpacityFrom: transition.opacity[0],
    animatedTextOpacityTo: transition.opacity[1],
    animatedTextYFrom: transition.y[0],
    animatedTextYTo: transition.y[1],
  };
}

export function normalizeLayerContent(raw: unknown): LayerContent {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return defaultLayerTextContent();
  }
  const record = raw as Record<string, unknown>;
  const type = record.type;
  if (type === "video" && typeof record.url === "string") {
    return { type: "video", url: record.url };
  }
  if (type === "image" && typeof record.url === "string") {
    return { type: "image", url: record.url };
  }
  if (type === "text") {
    const fontImportName =
      typeof record.fontImportName === "string" && record.fontImportName.trim()
        ? record.fontImportName.trim()
        : DEFAULT_GOOGLE_FONT_IMPORT_NAME;
    const catalogEntry = getGoogleFontCatalogEntry(fontImportName);
    const fontSizeRaw = record.fontSize;
    const fontSize =
      typeof fontSizeRaw === "number" && Number.isFinite(fontSizeRaw)
        ? Math.max(8, Math.round(fontSizeRaw))
        : 48;
    return {
      type: "text",
      text: typeof record.text === "string" ? record.text : "Text",
      fontSize,
      color: typeof record.color === "string" ? record.color : "#ffffff",
      fontFamily:
        typeof record.fontFamily === "string" && record.fontFamily.trim()
          ? record.fontFamily.trim()
          : (catalogEntry?.family ?? "Inter"),
      fontImportName,
      bold: record.bold === true,
    };
  }
  if (type === "animatedText") {
    const fontImportName =
      typeof record.fontImportName === "string" && record.fontImportName.trim()
        ? record.fontImportName.trim()
        : DEFAULT_GOOGLE_FONT_IMPORT_NAME;
    const catalogEntry = getGoogleFontCatalogEntry(fontImportName);
    const fontSizeRaw = record.fontSize;
    const fontSize =
      typeof fontSizeRaw === "number" && Number.isFinite(fontSizeRaw)
        ? Math.max(8, Math.round(fontSizeRaw))
        : 48;
    return {
      type: "animatedText",
      text: typeof record.text === "string" ? record.text : "Animated Text",
      fontSize,
      color: typeof record.color === "string" ? record.color : "#ffffff",
      fontFamily:
        typeof record.fontFamily === "string" && record.fontFamily.trim()
          ? record.fontFamily.trim()
          : (catalogEntry?.family ?? "Inter"),
      fontImportName,
      bold: record.bold === true,
      transition: normalizeAnimatedTextTransition(record.transition),
    };
  }
  return defaultLayerTextContent();
}

export function layerEditFormFromLayer(layer: SceneLayer): LayerEditFormValues {
  const content = normalizeLayerContent(layer.content);
  const textDefaults = defaultLayerTextContent();
  const animatedDefaults = defaultLayerAnimatedTextContent();
  const isTextLike = content.type === "text" || content.type === "animatedText";
  const transition =
    content.type === "animatedText" ? content.transition : animatedDefaults.transition;

  return {
    title: layer.title,
    from: layer.from,
    to: layerEndFrameFromLayer(layer),
    color: layer.color,
    contentType: content.type,
    videoUrl: content.type === "video" ? content.url : "",
    imageUrl: content.type === "image" ? content.url : "",
    text: isTextLike ? content.text : textDefaults.text,
    textFontSize: isTextLike ? content.fontSize : textDefaults.fontSize,
    textColor: isTextLike ? content.color : textDefaults.color,
    textFontFamily: isTextLike ? content.fontFamily : textDefaults.fontFamily,
    textFontImportName: isTextLike ? content.fontImportName : textDefaults.fontImportName,
    textBold: isTextLike ? content.bold : false,
    animatedTextSplit: transition.split,
    animatedTextDuration: transition.duration,
    animatedTextStagger: transition.stagger,
    animatedTextOpacityFrom: transition.opacity[0],
    animatedTextOpacityTo: transition.opacity[1],
    animatedTextYFrom: transition.y[0],
    animatedTextYTo: transition.y[1],
  };
}

export function contentFromEditForm(values: LayerEditFormValues): LayerContent {
  if (values.contentType === "video") {
    return { type: "video", url: values.videoUrl.trim() };
  }
  if (values.contentType === "image") {
    return { type: "image", url: values.imageUrl.trim() };
  }
  if (values.contentType === "animatedText") {
    return {
      type: "animatedText",
      text: values.text,
      fontSize: Math.max(8, Math.round(values.textFontSize)),
      color: values.textColor,
      fontFamily: values.textFontFamily,
      fontImportName: values.textFontImportName,
      bold: values.textBold,
      transition: {
        split: values.animatedTextSplit,
        duration: Math.max(1, Math.round(values.animatedTextDuration)),
        stagger: Math.max(0, Math.round(values.animatedTextStagger)),
        opacity: [values.animatedTextOpacityFrom, values.animatedTextOpacityTo],
        y: [values.animatedTextYFrom, values.animatedTextYTo],
      },
    };
  }
  return {
    type: "text",
    text: values.text,
    fontSize: Math.max(8, Math.round(values.textFontSize)),
    color: values.textColor,
    fontFamily: values.textFontFamily,
    fontImportName: values.textFontImportName,
    bold: values.textBold,
  };
}

export function layerFromEditForm(layer: SceneLayer, values: LayerEditFormValues): SceneLayer {
  const timing = layerTimingFromRange(values.from, values.to);
  return {
    ...layer,
    title: values.title.trim() || layer.title,
    from: timing.from,
    durationInFrames: timing.durationInFrames,
    color: values.color,
    content: contentFromEditForm(values),
  };
}

export function emptyLayerEditForm(sceneDurationInFrames = 90): LayerEditFormValues {
  const textDefaults = defaultLayerTextContent();
  const maxFrame = Math.max(0, sceneDurationInFrames - 1);
  return {
    title: "Layer 1",
    from: 0,
    to: maxFrame,
    color: "transparent",
    contentType: "text",
    videoUrl: "",
    imageUrl: "",
    text: textDefaults.text,
    textFontSize: textDefaults.fontSize,
    textColor: textDefaults.color,
    textFontFamily: textDefaults.fontFamily,
    textFontImportName: textDefaults.fontImportName,
    textBold: false,
    ...animatedTextFormDefaults(),
  };
}

export function layerContentLabel(content: LayerContent): string {
  if (content.type === "video") return content.url.trim() ? "Video" : "Video (empty)";
  if (content.type === "image") return content.url.trim() ? "Image" : "Image (empty)";
  if (content.type === "animatedText") {
    return content.text.trim() ? `Animated: ${content.text.trim()}` : "Animated text (empty)";
  }
  return content.text.trim() ? `Text: ${content.text.trim()}` : "Text (empty)";
}
