import { ActionIcon, Group, Popover, Text } from "@mantine/core";
import { RiInformationLine } from "@remixicon/react";
import type { FunctionSchema, JsonSchemaProperty } from "~/types/generations";

export function parseFunctionSchema(raw: unknown): FunctionSchema | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as FunctionSchema;
    } catch {
      return null;
    }
  }
  if (typeof raw === "object") {
    return raw as FunctionSchema;
  }
  return null;
}

export function orderedPropertyKeys(schema: FunctionSchema): string[] {
  const props = schema.properties ?? {};
  const order = schema["x-order-properties"] ?? [];
  const ordered = order.filter((k) => k in props);
  const rest = Object.keys(props).filter((k) => !ordered.includes(k));
  return [...ordered, ...rest];
}

function getInitialValue(prop: JsonSchemaProperty): unknown {
  if (prop.default !== undefined) return prop.default;
  if (prop.enum?.length === 1) return prop.enum[0];
  switch (prop.type) {
    case "boolean":
      return false;
    case "array":
      return [];
    case "number":
    case "integer":
      return null;
    default:
      return "";
  }
}

export function buildInitialValues(schema: FunctionSchema): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of orderedPropertyKeys(schema)) {
    const prop = schema.properties![key];
    if (!prop) continue;
    out[key] = getInitialValue(prop);
  }
  return out;
}

export function fieldLabel(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export const DESCRIPTION_HELPER_DISABLED_FIELDS = new Set([
  "aspect_ratio",
  "prompt",
  "image",
  "images",
  "video",
  "videos",
  "output_format",
  "duration",
  "resolution",
]);

export function buildLabelWithDescription(label: string, description?: string, required?: boolean) {
  return (
    <Group gap={6} wrap="wrap" align="center">
      <Text size="sm" fw={500} component="span">
        {label}
        {required ? <span style={{ color: "red" }}> *</span> : null}
      </Text>
      {description ? (
        <Popover width={280} position="bottom-start" withArrow shadow="md">
          <Popover.Target>
            <ActionIcon
              variant="subtle"
              size="sm"
              color="gray"
              aria-label={`${label} description`}
              style={{ pointerEvents: "auto" }}
            >
              <RiInformationLine size={14} />
            </ActionIcon>
          </Popover.Target>
          <Popover.Dropdown>
            <Text size="sm">{description}</Text>
          </Popover.Dropdown>
        </Popover>
      ) : null}
    </Group>
  );
}

export function parseEnumValue(raw: string | null, prop: JsonSchemaProperty): unknown {
  if (raw === null) return null;
  if (prop.type === "number" || prop.type === "integer") {
    const n = Number(raw);
    return Number.isNaN(n) ? raw : n;
  }
  if (prop.type === "boolean") {
    if (raw === "true") return true;
    if (raw === "false") return false;
  }
  return raw;
}

export function schemaValuesEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (
    (typeof left === "string" || typeof left === "number" || typeof left === "boolean") &&
    (typeof right === "string" || typeof right === "number" || typeof right === "boolean")
  ) {
    return String(left) === String(right);
  }
  return false;
}

export function evaluateConditions(
  schema: FunctionSchema | null,
  values: Record<string, unknown>
): { setValues: Record<string, unknown>; disabledFields: Set<string> } {
  const setValues: Record<string, unknown> = {};
  const disabledFields = new Set<string>();
  const conditions = schema?.["x-conditions"];
  if (!Array.isArray(conditions)) return { setValues, disabledFields };

  for (const condition of conditions) {
    const field = typeof condition?.if?.field === "string" ? condition.if.field : "";
    if (!field) continue;
    const currentValue = values[field];
    let matches = false;

    if ("equals" in (condition.if ?? {})) {
      matches = schemaValuesEqual(currentValue, condition.if?.equals);
    } else if ("notEquals" in (condition.if ?? {})) {
      matches = !schemaValuesEqual(currentValue, condition.if?.notEquals);
    } else if (Array.isArray(condition.if?.in)) {
      matches = condition.if.in.some((candidate) => schemaValuesEqual(currentValue, candidate));
    }

    if (!matches) continue;

    if (condition.then?.set && typeof condition.then.set === "object") {
      Object.assign(setValues, condition.then.set);
    }
    if (Array.isArray(condition.then?.disable)) {
      condition.then.disable
        .filter(
          (fieldName): fieldName is string =>
            typeof fieldName === "string" && fieldName.trim().length > 0
        )
        .forEach((fieldName) => disabledFields.add(fieldName));
    }
  }

  return { setValues, disabledFields };
}

export function sanitizePayload(values: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    if (value == null) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    if (Array.isArray(value) && value.length === 0) continue;
    out[key] = value;
  }
  return out;
}

export function normalizedFieldName(name: string): string {
  return name.trim().toLowerCase();
}

export type ValidXUiComponent =
  | "MediaFilePicker"
  | "NumberSlider"
  | "SizePicker"
  | "BoxPicker"
  | "AspectRatioPicker";

const X_UI_COMPONENT_ALIASES: Record<string, ValidXUiComponent> = {
  mediafilepicker: "MediaFilePicker",
  mediasfilepicker: "MediaFilePicker",
  numberslider: "NumberSlider",
  slider: "NumberSlider",
  sizepicker: "SizePicker",
  boxpicker: "BoxPicker",
  aspectratiopicker: "AspectRatioPicker",
};

export function resolveXUiComponent(prop: JsonSchemaProperty): ValidXUiComponent | null {
  const xUi = prop["x-ui-component"];
  const rawType =
    typeof xUi === "string"
      ? xUi
      : xUi && typeof xUi === "object" && !Array.isArray(xUi)
        ? (xUi as { type?: unknown }).type
        : undefined;
  if (typeof rawType !== "string") return null;
  return X_UI_COMPONENT_ALIASES[rawType.trim().toLowerCase()] ?? null;
}

function getXUiSettings(prop: JsonSchemaProperty): Record<string, unknown> {
  const xUi = prop["x-ui-component"];
  if (!xUi || typeof xUi !== "object" || Array.isArray(xUi)) return {};
  const settings = (xUi as Record<string, unknown>).settings;
  return settings && typeof settings === "object" && !Array.isArray(settings)
    ? (settings as Record<string, unknown>)
    : {};
}

function resolveExplicitAllowedFileTypes(
  prop: JsonSchemaProperty
): Array<"image" | "video" | "audio"> | null {
  const settings = getXUiSettings(prop);
  const raw = settings.allowed_file_types ?? settings.allowedTypes ?? settings.allowed_types;
  const values =
    typeof raw === "string" && raw.trim()
      ? [raw]
      : Array.isArray(raw) && raw.length > 0
        ? raw.map((value) => String(value))
        : [];
  const allowed = new Set<"image" | "video" | "audio">();
  for (const value of values) {
    const tokens = value
      .toLowerCase()
      .split(/\band\b|[\s,|/+]+/g)
      .map((token) => token.trim())
      .filter(Boolean);
    if (tokens.includes("all") || tokens.includes("*")) return ["image", "video", "audio"];
    if (tokens.some((token) => token === "image" || token === "images")) allowed.add("image");
    if (tokens.some((token) => token === "video" || token === "videos")) allowed.add("video");
    if (
      tokens.some(
        (token) =>
          token === "audio" || token === "audios" || token === "sound" || token === "sounds"
      )
    ) {
      allowed.add("audio");
    }
  }
  return allowed.size > 0 ? Array.from(allowed) : null;
}

/** Fields excluded from cost debounce so typing the prompt does not hit `/playground/cost`. */
export function isCostIgnoredFieldKey(name: string): boolean {
  const n = normalizedFieldName(name);
  return n === "prompt" || n === "negative_prompt";
}

export function isMediaFieldName(
  name: string
): name is
  | "image"
  | "images"
  | "video"
  | "videos"
  | "first_frame"
  | "last_frame"
  | "last_image"
  | "reference_images"
  | "reference_videos"
  | "audio"
  | "audio_url"
  | "driving_audio"
  | "reference_audios" {
  const normalized = normalizedFieldName(name);
  return (
    normalized === "image" ||
    normalized === "images" ||
    normalized === "video" ||
    normalized === "videos" ||
    normalized === "first_frame" ||
    normalized === "last_frame" ||
    normalized === "last_image" ||
    normalized === "reference_images" ||
    normalized === "reference_videos" ||
    normalized === "audio" ||
    normalized === "audio_url" ||
    normalized === "driving_audio" ||
    normalized === "reference_audios"
  );
}

export function resolveMediaPickerSettings(
  key: string,
  prop: JsonSchemaProperty
): { min: number; max: number; allowed_file_types: Array<"image" | "video" | "audio"> } {
  const normalized = normalizedFieldName(key);
  const settings = getXUiSettings(prop);
  const allowed_file_types: Array<"image" | "video" | "audio"> =
    resolveExplicitAllowedFileTypes(prop) ??
    (normalized === "image" ||
    normalized === "images" ||
    normalized === "last_image" ||
    normalized === "first_frame" ||
    normalized === "last_frame" ||
    normalized === "reference_images"
      ? ["image"]
      : normalized === "audio" ||
          normalized === "driving_audio" ||
          normalized === "audio_url" ||
          normalized === "reference_audios"
        ? ["audio"]
        : ["video"]);

  const minCandidate =
    typeof settings.min === "number"
      ? settings.min
      : typeof prop.minItems === "number"
        ? prop.minItems
        : typeof prop.minimum === "number"
          ? prop.minimum
          : null;
  const maxCandidate =
    typeof settings.max === "number"
      ? settings.max
      : typeof prop.maxItems === "number"
        ? prop.maxItems
        : typeof prop.maximum === "number"
          ? prop.maximum
          : null;

  const min =
    Number.isFinite(minCandidate) && (minCandidate as number) > 0
      ? Math.floor(minCandidate as number)
      : 1;
  let max =
    Number.isFinite(maxCandidate) && (maxCandidate as number) > 0
      ? Math.floor(maxCandidate as number)
      : 1;
  if (maxCandidate == null && minCandidate != null) {
    max = Math.max(min, max);
  }
  if (min > max) {
    max = min;
  }

  return { min, max, allowed_file_types };
}
