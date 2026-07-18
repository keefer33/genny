import { DEFAULT_GOOGLE_FONT_IMPORT_NAME, getGoogleFontCatalogEntry } from "./googleFontsCatalog";
import { defaultLayerBoxStyle, type SceneLayer } from "./storyboardUtils";
import {
  defaultVideoPlaybackFormValues,
  defaultVideoPlaybackOptions,
  normalizeVideoPlaybackOptions,
  videoPlaybackFormValuesFromOptions,
  videoPlaybackOptionsFromForm,
  type VideoPlaybackOptions,
} from "./videoPlaybackOptions";

export type LayerContentType = "video" | "image" | "audio" | "text" | "animatedText";

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
} & VideoPlaybackOptions;

export type LayerImageContent = {
  type: "image";
  url: string;
};

export type LayerAudioContent = {
  type: "audio";
  url: string;
} & VideoPlaybackOptions;

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
  | LayerAudioContent
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
  padding: number;
  border: boolean;
  borderWidth: number;
  borderColor: string;
  borderRadius: number;
  shadow: boolean;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowBlur: number;
  shadowSpread: number;
  shadowColor: string;
  contentType: LayerContentType;
  videoUrl: string;
  videoTrimBefore: number;
  videoTrimAfter: number | null;
  videoVolume: number;
  videoPlaybackRate: number;
  imageUrl: string;
  audioUrl: string;
  audioTrimBefore: number;
  audioTrimAfter: number | null;
  audioVolume: number;
  audioPlaybackRate: number;
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

export function defaultLayerVideoContent(): LayerVideoContent {
  return {
    type: "video",
    url: "",
    ...defaultVideoPlaybackOptions(),
  };
}

function normalizeLayerVideoContent(record: Record<string, unknown>): LayerVideoContent {
  return {
    type: "video",
    url: typeof record.url === "string" ? record.url : "",
    ...normalizeVideoPlaybackOptions(record),
  };
}

function normalizeLayerAudioContent(record: Record<string, unknown>): LayerAudioContent {
  return {
    type: "audio",
    url: typeof record.url === "string" ? record.url : "",
    ...normalizeVideoPlaybackOptions(record),
  };
}

function videoFormDefaults(): Pick<
  LayerEditFormValues,
  "videoTrimBefore" | "videoTrimAfter" | "videoVolume" | "videoPlaybackRate"
> {
  const defaults = defaultVideoPlaybackFormValues();
  return {
    videoTrimBefore: defaults.trimBefore,
    videoTrimAfter: defaults.trimAfter,
    videoVolume: defaults.volume,
    videoPlaybackRate: defaults.playbackRate,
  };
}

function audioFormDefaults(): Pick<
  LayerEditFormValues,
  "audioTrimBefore" | "audioTrimAfter" | "audioVolume" | "audioPlaybackRate"
> {
  const defaults = defaultVideoPlaybackFormValues();
  return {
    audioTrimBefore: defaults.trimBefore,
    audioTrimAfter: defaults.trimAfter,
    audioVolume: defaults.volume,
    audioPlaybackRate: defaults.playbackRate,
  };
}

export function defaultLayerAudioContent(): LayerAudioContent {
  return {
    type: "audio",
    url: "",
    ...defaultVideoPlaybackOptions(),
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
  if (type === "video") return defaultLayerVideoContent();
  if (type === "image") return { type: "image", url: "" };
  if (type === "audio") return defaultLayerAudioContent();
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
    return normalizeLayerVideoContent(record);
  }
  if (type === "image" && typeof record.url === "string") {
    return { type: "image", url: record.url };
  }
  if (type === "audio" && typeof record.url === "string") {
    return normalizeLayerAudioContent(record);
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
  const videoDefaults = defaultLayerVideoContent();
  const audioDefaults = defaultLayerAudioContent();
  const animatedDefaults = defaultLayerAnimatedTextContent();
  const isTextLike = content.type === "text" || content.type === "animatedText";
  const transition =
    content.type === "animatedText" ? content.transition : animatedDefaults.transition;

  const box = defaultLayerBoxStyle();

  return {
    title: layer.title,
    from: layer.from,
    to: layerEndFrameFromLayer(layer),
    color: layer.color,
    padding: typeof layer.padding === "number" ? layer.padding : box.padding,
    border: layer.border === true,
    borderWidth: typeof layer.borderWidth === "number" ? layer.borderWidth : box.borderWidth,
    borderColor:
      typeof layer.borderColor === "string" && layer.borderColor.trim()
        ? layer.borderColor
        : box.borderColor,
    borderRadius: typeof layer.borderRadius === "number" ? layer.borderRadius : box.borderRadius,
    shadow: layer.shadow === true,
    shadowOffsetX:
      typeof layer.shadowOffsetX === "number" ? layer.shadowOffsetX : box.shadowOffsetX,
    shadowOffsetY:
      typeof layer.shadowOffsetY === "number" ? layer.shadowOffsetY : box.shadowOffsetY,
    shadowBlur: typeof layer.shadowBlur === "number" ? layer.shadowBlur : box.shadowBlur,
    shadowSpread: typeof layer.shadowSpread === "number" ? layer.shadowSpread : box.shadowSpread,
    shadowColor:
      typeof layer.shadowColor === "string" && layer.shadowColor.trim()
        ? layer.shadowColor
        : box.shadowColor,
    contentType: content.type,
    videoUrl: content.type === "video" ? content.url : "",
    videoTrimBefore:
      content.type === "video"
        ? videoPlaybackFormValuesFromOptions(content).trimBefore
        : videoDefaults.trimBeforeFrames,
    videoTrimAfter:
      content.type === "video"
        ? videoPlaybackFormValuesFromOptions(content).trimAfter
        : videoDefaults.trimAfterFrames,
    videoVolume: content.type === "video" ? content.volume : videoDefaults.volume,
    videoPlaybackRate: content.type === "video" ? content.playbackRate : videoDefaults.playbackRate,
    imageUrl: content.type === "image" ? content.url : "",
    audioUrl: content.type === "audio" ? content.url : "",
    audioTrimBefore:
      content.type === "audio"
        ? videoPlaybackFormValuesFromOptions(content).trimBefore
        : audioDefaults.trimBeforeFrames,
    audioTrimAfter:
      content.type === "audio"
        ? videoPlaybackFormValuesFromOptions(content).trimAfter
        : audioDefaults.trimAfterFrames,
    audioVolume: content.type === "audio" ? content.volume : audioDefaults.volume,
    audioPlaybackRate: content.type === "audio" ? content.playbackRate : audioDefaults.playbackRate,
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
    const playback = videoPlaybackOptionsFromForm({
      trimBefore: values.videoTrimBefore,
      trimAfter: values.videoTrimAfter,
      volume: values.videoVolume,
      playbackRate: values.videoPlaybackRate,
    });
    return {
      type: "video",
      url: values.videoUrl.trim(),
      ...playback,
    };
  }
  if (values.contentType === "image") {
    return { type: "image", url: values.imageUrl.trim() };
  }
  if (values.contentType === "audio") {
    const playback = videoPlaybackOptionsFromForm({
      trimBefore: values.audioTrimBefore,
      trimAfter: values.audioTrimAfter,
      volume: values.audioVolume,
      playbackRate: values.audioPlaybackRate,
    });
    return {
      type: "audio",
      url: values.audioUrl.trim(),
      ...playback,
    };
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
    padding: Math.max(0, Math.round(values.padding)),
    border: values.border,
    borderWidth: Math.max(0, Math.round(values.borderWidth)),
    borderColor: values.borderColor.trim() || defaultLayerBoxStyle().borderColor,
    borderRadius: Math.max(0, Math.round(values.borderRadius)),
    shadow: values.shadow,
    shadowOffsetX: Math.round(values.shadowOffsetX),
    shadowOffsetY: Math.round(values.shadowOffsetY),
    shadowBlur: Math.max(0, Math.round(values.shadowBlur)),
    shadowSpread: Math.round(values.shadowSpread),
    shadowColor: values.shadowColor.trim() || defaultLayerBoxStyle().shadowColor,
    content: contentFromEditForm(values),
  };
}

export function emptyLayerEditForm(sceneDurationInFrames = 90): LayerEditFormValues {
  const textDefaults = defaultLayerTextContent();
  const maxFrame = Math.max(0, sceneDurationInFrames - 1);
  const box = defaultLayerBoxStyle();
  return {
    title: "Layer 1",
    from: 0,
    to: maxFrame,
    color: "transparent",
    padding: box.padding,
    border: box.border,
    borderWidth: box.borderWidth,
    borderColor: box.borderColor,
    borderRadius: box.borderRadius,
    shadow: box.shadow,
    shadowOffsetX: box.shadowOffsetX,
    shadowOffsetY: box.shadowOffsetY,
    shadowBlur: box.shadowBlur,
    shadowSpread: box.shadowSpread,
    shadowColor: box.shadowColor,
    contentType: "text",
    videoUrl: "",
    ...videoFormDefaults(),
    imageUrl: "",
    audioUrl: "",
    ...audioFormDefaults(),
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
  if (content.type === "video") {
    if (!content.url.trim()) return "Video (empty)";
    const parts = ["Video"];
    if (content.playbackRate !== 1) parts.push(`${content.playbackRate}x`);
    if (content.volume !== 1) parts.push(`${Math.round(content.volume * 100)}% vol`);
    if (content.trimBeforeFrames > 0 || content.trimAfterFrames != null) parts.push("trimmed");
    return parts.join(" · ");
  }
  if (content.type === "image") return content.url.trim() ? "Image" : "Image (empty)";
  if (content.type === "audio") {
    if (!content.url.trim()) return "Audio (empty)";
    const parts = ["Audio"];
    if (content.playbackRate !== 1) parts.push(`${content.playbackRate}x`);
    if (content.volume !== 1) parts.push(`${Math.round(content.volume * 100)}% vol`);
    if (content.trimBeforeFrames > 0 || content.trimAfterFrames != null) parts.push("trimmed");
    return parts.join(" · ");
  }
  if (content.type === "animatedText") {
    return content.text.trim() ? `Animated: ${content.text.trim()}` : "Animated text (empty)";
  }
  return content.text.trim() ? `Text: ${content.text.trim()}` : "Text (empty)";
}
