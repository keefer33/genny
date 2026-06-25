import { DEFAULT_GOOGLE_FONT_IMPORT_NAME, getGoogleFontCatalogEntry } from "./googleFontsCatalog";
import type { SceneLayer } from "./storyboardUtils";

export type LayerContentType = "video" | "image" | "text";

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
};

export type LayerContent = LayerVideoContent | LayerImageContent | LayerTextContent;

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
};

export function defaultLayerTextContent(): LayerTextContent {
  const entry = getGoogleFontCatalogEntry(DEFAULT_GOOGLE_FONT_IMPORT_NAME);
  return {
    type: "text",
    text: "Text",
    fontSize: 48,
    color: "#ffffff",
    fontFamily: entry?.family ?? "Inter",
    fontImportName: DEFAULT_GOOGLE_FONT_IMPORT_NAME,
  };
}

export function defaultLayerContent(type: LayerContentType = "text"): LayerContent {
  if (type === "video") return { type: "video", url: "" };
  if (type === "image") return { type: "image", url: "" };
  return defaultLayerTextContent();
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
    };
  }
  return defaultLayerTextContent();
}

export function layerEditFormFromLayer(layer: SceneLayer): LayerEditFormValues {
  const content = normalizeLayerContent(layer.content);
  return {
    from: layer.from,
    to: layerEndFrameFromLayer(layer),
    color: layer.color,
    contentType: content.type,
    videoUrl: content.type === "video" ? content.url : "",
    imageUrl: content.type === "image" ? content.url : "",
    text: content.type === "text" ? content.text : defaultLayerTextContent().text,
    textFontSize: content.type === "text" ? content.fontSize : 48,
    textColor: content.type === "text" ? content.color : "#ffffff",
    textFontFamily: content.type === "text" ? content.fontFamily : "Inter",
    textFontImportName:
      content.type === "text" ? content.fontImportName : DEFAULT_GOOGLE_FONT_IMPORT_NAME,
  };
}

export function contentFromEditForm(values: LayerEditFormValues): LayerContent {
  if (values.contentType === "video") {
    return { type: "video", url: values.videoUrl.trim() };
  }
  if (values.contentType === "image") {
    return { type: "image", url: values.imageUrl.trim() };
  }
  return {
    type: "text",
    text: values.text,
    fontSize: Math.max(8, Math.round(values.textFontSize)),
    color: values.textColor,
    fontFamily: values.textFontFamily,
    fontImportName: values.textFontImportName,
  };
}

export function layerFromEditForm(layer: SceneLayer, values: LayerEditFormValues): SceneLayer {
  const timing = layerTimingFromRange(values.from, values.to);
  return {
    ...layer,
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
  };
}

export function layerContentLabel(content: LayerContent): string {
  if (content.type === "video") return content.url.trim() ? "Video" : "Video (empty)";
  if (content.type === "image") return content.url.trim() ? "Image" : "Image (empty)";
  return content.text.trim() ? `Text: ${content.text.trim()}` : "Text (empty)";
}
