import { ActionIcon, Group, Popover, Text } from "@mantine/core";
import { RiInformationLine } from "@remixicon/react";
import type {
  BoxPickerValueType,
  FunctionSchema,
  JsonSchemaProperty,
  SchemaConditionClause,
} from "~/types/generations";

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
  const isExt = (k: string) => /^x-/i.test(k);
  const ordered = order.filter((k) => k in props && !isExt(k));
  const rest = Object.keys(props).filter((k) => !ordered.includes(k) && !isExt(k));
  return [...ordered, ...rest];
}

/** Property order for a nested `type: "object"` schema fragment (e.g. array `items`). */
export function orderedObjectPropertyKeys(obj: {
  properties?: Record<string, JsonSchemaProperty>;
  "x-order-properties"?: string[];
}): string[] {
  const props = obj.properties ?? {};
  const order = obj["x-order-properties"] ?? [];
  const isExt = (k: string) => /^x-/i.test(k);
  const ordered = order.filter((k) => k in props && !isExt(k));
  const rest = Object.keys(props).filter((k) => !ordered.includes(k) && !isExt(k));
  return [...ordered, ...rest];
}

/** Dot-path for nested form fields (`""` + `a` → `"a"`, `"a"` + `b` → `"a.b"`). */
export function joinFieldPath(pathPrefix: string, key: string): string {
  return pathPrefix ? `${pathPrefix}.${key}` : key;
}

/** Read nested form values the same way Mantine `setFieldValue` / `getInputProps` resolve paths. */
export function getFormValueAtPath(values: unknown, path: string): unknown {
  if (!path) return values;
  const segments = path.split(".");
  if (segments.length === 0 || typeof values !== "object" || values === null) return undefined;
  let cur: unknown = (values as Record<string, unknown>)[segments[0]];
  for (let i = 1; i < segments.length; i += 1) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[segments[i]];
  }
  return cur;
}

function appendRequiredFieldError(
  errors: Record<string, string>,
  fieldPath: string,
  prop: JsonSchemaProperty,
  v: unknown
): void {
  if (v === undefined || v === null) {
    errors[fieldPath] = "Required";
    return;
  }
  if (prop.type === "string" && typeof v === "string" && v.trim() === "") {
    errors[fieldPath] = "Required";
    return;
  }
  if (prop.type === "array" && Array.isArray(v) && v.length === 0) {
    errors[fieldPath] = "Required";
    return;
  }
  if (prop.type === "number" || prop.type === "integer") {
    if (typeof v === "number" && Number.isNaN(v)) {
      errors[fieldPath] = "Required";
    }
  }
}

/** Recursively validate `type: "object"` subtrees and array-of-objects rows (any depth). */
export function collectDeepFormSchemaErrors(
  schema: FunctionSchema,
  values: Record<string, unknown>
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!schema.properties) return errors;
  walkObjectSchemaForErrors("", schema.properties, schema.required, values, errors);
  return errors;
}

function walkObjectSchemaForErrors(
  pathPrefix: string,
  properties: Record<string, JsonSchemaProperty>,
  requiredList: string[] | undefined,
  container: Record<string, unknown> | undefined,
  errors: Record<string, string>
): void {
  const required = new Set(requiredList ?? []);

  for (const key of required) {
    const prop = properties[key];
    if (!prop) continue;
    const fp = joinFieldPath(pathPrefix, key);
    const v = container?.[key];
    appendRequiredFieldError(errors, fp, prop, v);
  }

  if (!container) return;

  for (const key of Object.keys(properties)) {
    const prop = properties[key];
    if (!prop) continue;
    const v = container[key];
    const fp = joinFieldPath(pathPrefix, key);

    if (prop.type === "object" && prop.properties) {
      if (v === undefined || v === null) continue;
      const child =
        v && typeof v === "object" && !Array.isArray(v)
          ? (v as Record<string, unknown>)
          : undefined;
      walkObjectSchemaForErrors(fp, prop.properties, prop.required, child, errors);
    }
    if (prop.type === "array" && isObjectArrayItemsSchema(prop)) {
      Object.assign(errors, collectArrayOfObjectsFieldErrors(fp, prop, v));
    }
  }
}

/** Homogeneous `items: { type: "object", ... }` or Draft-04 tuple `items: [ {...}, ... ]`. */
export function isObjectArrayItemsSchema(prop: JsonSchemaProperty): boolean {
  if (prop.type !== "array" || prop.items == null) return false;
  if (Array.isArray(prop.items)) {
    return (
      prop.items.length > 0 &&
      prop.items.every(
        (it) =>
          it &&
          typeof it === "object" &&
          !Array.isArray(it) &&
          it.type === "object" &&
          !!it.properties
      )
    );
  }
  return prop.items.type === "object" && !!prop.items.properties;
}

function newRowKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `row-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Default field values for one `items` object inside an array-of-objects field. */
export function buildInitialObjectFromItemSchema(
  itemSchema: JsonSchemaProperty
): Record<string, unknown> {
  const props = itemSchema.properties ?? {};
  const out: Record<string, unknown> = {};
  for (const key of orderedObjectPropertyKeys(itemSchema)) {
    const p = props[key];
    if (!p) continue;
    out[key] = getInitialValueForProperty(p);
  }
  return out;
}

export function newArrayObjectRow(itemSchema: JsonSchemaProperty): Record<string, unknown> {
  return { ...buildInitialObjectFromItemSchema(itemSchema), __rowKey: newRowKey() };
}

function getInitialValueForProperty(prop: JsonSchemaProperty): unknown {
  if (prop.default !== undefined) return prop.default;
  if (prop.enum?.length === 1) return prop.enum[0];
  if (prop.type === "object" && prop.properties) {
    return buildInitialObjectFromItemSchema(prop);
  }
  if (prop.type === "array" && Array.isArray(prop.items)) {
    const tuple = prop.items as JsonSchemaProperty[];
    if (tuple.length > 0 && tuple.every((it) => it.type === "object" && it.properties)) {
      return tuple.map((itemSchema) => {
        const row = newArrayObjectRow(itemSchema) as Record<string, unknown>;
        if (itemSchema["x-object-add-delete-buttons"]) {
          row.__slotCollapsed = true;
        }
        return row;
      });
    }
    return [];
  }
  if (
    prop.type === "array" &&
    !Array.isArray(prop.items) &&
    prop.items?.type === "object" &&
    prop.items.properties
  ) {
    return [];
  }
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
    out[key] = getInitialValueForProperty(prop);
  }
  return out;
}

/** Optional tuple row collapsed in UI (`x-object-add-delete-buttons`); omit from API payload. */
function isCollapsedTupleSlot(item: unknown): boolean {
  if (!item || typeof item !== "object" || Array.isArray(item)) return false;
  return (item as Record<string, unknown>).__slotCollapsed === true;
}

function collectObjectArrayRowErrors(
  arrayKey: string,
  itemSchema: JsonSchemaProperty,
  rowIndex: number,
  row: unknown,
  errors: Record<string, string>
): void {
  const path = (field: string) => `${arrayKey}.${rowIndex}.${field}`;
  const required = itemSchema.required ?? [];
  const props = itemSchema.properties ?? {};

  if (!row || typeof row !== "object" || Array.isArray(row)) {
    const rk0 = required[0] ?? Object.keys(props)[0];
    if (rk0) errors[path(rk0)] = "Invalid entry";
    return;
  }
  const r = row as Record<string, unknown>;
  for (const rk of required) {
    const ip = props[rk];
    if (!ip) continue;
    const v = r[rk];
    if (v === undefined || v === null) {
      errors[path(rk)] = "Required";
      continue;
    }
    if (ip.type === "string" && typeof v === "string" && v.trim() === "") {
      errors[path(rk)] = "Required";
    }
    if (ip.type === "array" && Array.isArray(v) && v.length === 0) {
      errors[path(rk)] = "Required";
    }
    if (ip.type === "number" || ip.type === "integer") {
      if (v === undefined || v === null || (typeof v === "number" && Number.isNaN(v))) {
        errors[path(rk)] = "Required";
      }
    }
  }

  for (const nk of orderedObjectPropertyKeys(itemSchema)) {
    const nip = props[nk];
    if (!nip) continue;
    const nv = r[nk];
    const rowFieldPath = path(nk);
    if (nip.type === "object" && nip.properties) {
      if (nv === undefined || nv === null) continue;
      const childObj =
        nv && typeof nv === "object" && !Array.isArray(nv)
          ? (nv as Record<string, unknown>)
          : undefined;
      walkObjectSchemaForErrors(rowFieldPath, nip.properties, nip.required, childObj, errors);
    }
    if (nip.type === "array" && isObjectArrayItemsSchema(nip)) {
      Object.assign(errors, collectArrayOfObjectsFieldErrors(rowFieldPath, nip, nv));
    }
  }
}

export function collectArrayOfObjectsFieldErrors(
  arrayKey: string,
  prop: JsonSchemaProperty,
  value: unknown
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (prop.type !== "array" || !isObjectArrayItemsSchema(prop)) return errors;

  const minItems = typeof prop.minItems === "number" ? prop.minItems : 0;
  const maxItems = typeof prop.maxItems === "number" ? prop.maxItems : Infinity;

  if (!Array.isArray(value)) {
    if (minItems > 0) errors[arrayKey] = "Required";
    return errors;
  }

  if (value.length < minItems) {
    errors[arrayKey] = `At least ${minItems} item(s) required`;
  }
  if (value.length > maxItems) {
    errors[arrayKey] = `At most ${maxItems} item(s) allowed`;
  }

  if (Array.isArray(prop.items)) {
    const tuple = prop.items as JsonSchemaProperty[];
    for (let i = 0; i < tuple.length; i++) {
      if (isCollapsedTupleSlot(value[i])) continue;
      collectObjectArrayRowErrors(arrayKey, tuple[i]!, i, value[i], errors);
    }
    return errors;
  }

  const itemSchema = prop.items as JsonSchemaProperty;
  for (let i = 0; i < value.length; i++) {
    collectObjectArrayRowErrors(arrayKey, itemSchema, i, value[i], errors);
  }

  return errors;
}

export function fieldLabel(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Human-readable title for a dotted form path (e.g. `input.media` → `"Input Media"`). */
export function schemaPathDisplayLabel(path: string): string {
  return path
    .split(".")
    .filter(Boolean)
    .map((segment) => fieldLabel(segment))
    .join(" ");
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

export function boxPickerValueTypeForProp(prop: JsonSchemaProperty): BoxPickerValueType {
  if (prop.type === "integer") return "integer";
  if (prop.type === "number") return "number";
  return "string";
}

/** Enum values for `BoxPicker` (strings as-is; numbers from numeric or numeric-string enum entries). */
export function boxPickerEnumOptions(prop: JsonSchemaProperty): (string | number)[] {
  if (!prop.enum?.length) return [];
  if (prop.type === "string") {
    return prop.enum
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean);
  }
  if (prop.type === "number" || prop.type === "integer") {
    return prop.enum
      .map((value) => {
        if (typeof value === "number" && Number.isFinite(value)) return value;
        if (typeof value === "string" && value.trim()) {
          const n = Number(value);
          return Number.isFinite(n) ? n : NaN;
        }
        return NaN;
      })
      .filter((n): n is number => Number.isFinite(n));
  }
  return [];
}

export function parseEnumValue(raw: string | null, prop: JsonSchemaProperty): unknown {
  if (raw === null) return null;
  if (prop.type === "number" || prop.type === "integer") {
    const n = Number(raw);
    if (Number.isNaN(n)) return raw;
    return prop.type === "integer" ? Math.trunc(n) : n;
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

function matchesSingleFieldCondition(
  clause: { field?: string; equals?: unknown; notEquals?: unknown; in?: unknown[] },
  values: Record<string, unknown>
): boolean {
  const field = typeof clause.field === "string" ? clause.field : "";
  if (!field) return false;
  const currentValue = getFormValueAtPath(values, field);

  if ("equals" in clause) {
    return schemaValuesEqual(currentValue, clause.equals);
  }
  if ("notEquals" in clause) {
    return !schemaValuesEqual(currentValue, clause.notEquals);
  }
  if (Array.isArray(clause.in)) {
    return clause.in.some((candidate) => schemaValuesEqual(currentValue, candidate));
  }
  return false;
}

function matchesConditionClause(
  clause: SchemaConditionClause | undefined,
  values: Record<string, unknown>
): boolean {
  if (!clause) return false;
  if (Array.isArray(clause.all)) {
    return clause.all.every((part) => matchesSingleFieldCondition(part, values));
  }
  return matchesSingleFieldCondition(clause, values);
}

function isValueAllowedByEnumFilter(
  value: unknown,
  allowed: Array<string | number> | undefined
): boolean {
  if (!allowed?.length) return true;
  return allowed.some((candidate) => schemaValuesEqual(value, candidate));
}

export function evaluateConditions(
  schema: FunctionSchema | null,
  values: Record<string, unknown>
): {
  setValues: Record<string, unknown>;
  disabledFields: Set<string>;
  enumFilters: Record<string, Array<string | number>>;
} {
  const setValues: Record<string, unknown> = {};
  const disabledFields = new Set<string>();
  const enumFilters: Record<string, Array<string | number>> = {};
  const conditions = schema?.["x-conditions"];
  if (!Array.isArray(conditions)) return { setValues, disabledFields, enumFilters };

  for (const condition of conditions) {
    if (!matchesConditionClause(condition.if, values)) continue;

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
    if (condition.then?.enum && typeof condition.then.enum === "object") {
      for (const [fieldName, allowed] of Object.entries(condition.then.enum)) {
        if (!Array.isArray(allowed) || allowed.length === 0) continue;
        enumFilters[fieldName] = allowed;
      }
    }
  }

  for (const [fieldName, allowed] of Object.entries(enumFilters)) {
    const currentValue = getFormValueAtPath(values, fieldName);
    if (isValueAllowedByEnumFilter(currentValue, allowed)) continue;
    const propDefault = schema?.properties?.[fieldName]?.default;
    const fallback =
      propDefault !== undefined && isValueAllowedByEnumFilter(propDefault, allowed)
        ? propDefault
        : allowed[0];
    setValues[fieldName] = fallback;
  }

  return { setValues, disabledFields, enumFilters };
}

/** Strip UI-only keys (e.g. `__rowKey`) and empty values at every depth, including nested `SchemaObjectArrayField` rows. */
function sanitizePayloadEntry(value: unknown): unknown {
  if (value == null) return undefined;
  if (typeof value === "string") return value.trim() === "" ? undefined : value;
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    const items = value
      .filter((item) => !isCollapsedTupleSlot(item))
      .map(sanitizePayloadEntry)
      .filter((v) => v !== undefined) as unknown[];
    if (items.length === 0) return undefined;
    return items;
  }
  if (typeof value === "object") {
    const source = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(source)) {
      if (k.startsWith("__")) continue;
      const s = sanitizePayloadEntry(v);
      if (s === undefined) continue;
      if (typeof s === "string" && s.trim() === "") continue;
      if (Array.isArray(s) && s.length === 0) continue;
      out[k] = s;
    }
    if (Object.keys(out).length === 0) return undefined;
    return out;
  }
  return value;
}

export function sanitizePayload(values: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    const sanitized = sanitizePayloadEntry(value);
    if (sanitized === undefined) continue;
    out[key] = sanitized;
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
  boxes: "BoxPicker",
  aspectratiopicker: "AspectRatioPicker",
};

/** String `"select"` is valid: maps to Mantine `Select` (not `BoxPicker`). */
export function isBareStringSelectXUi(prop: JsonSchemaProperty): boolean {
  const x = prop["x-ui-component"];
  return typeof x === "string" && x.trim().toLowerCase() === "select";
}

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

export function hasUnsupportedXUiComponent(prop: JsonSchemaProperty): boolean {
  if (prop["x-ui-component"] === undefined) return false;
  if (resolveXUiComponent(prop)) return false;
  if (isBareStringSelectXUi(prop)) return false;
  const x = prop["x-ui-component"];
  if (typeof x === "string" && x.trim()) return true;
  if (x && typeof x === "object" && !Array.isArray(x)) {
    const t = (x as { type?: unknown }).type;
    if (typeof t === "string" && t.trim()) return true;
  }
  return false;
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
  | "reference_audios"
  | "image_urls" {
  const normalized = normalizedFieldName(name);
  return (
    normalized === "image" ||
    normalized === "images" ||
    normalized === "image_urls" ||
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
): {
  min: number;
  max: number;
  allowed_file_types: Array<"image" | "video" | "audio">;
  gen_model_id?: string;
} {
  const normalized = normalizedFieldName(key);
  const settings = getXUiSettings(prop);
  const genModelIdRaw = settings.gen_model_id ?? settings.genModelId;
  const gen_model_id =
    typeof genModelIdRaw === "string" && genModelIdRaw.trim() ? genModelIdRaw.trim() : undefined;
  const allowed_file_types: Array<"image" | "video" | "audio"> =
    resolveExplicitAllowedFileTypes(prop) ??
    (normalized === "image" ||
    normalized === "images" ||
    normalized === "last_image" ||
    normalized === "first_frame" ||
    normalized === "last_frame" ||
    normalized === "reference_images" ||
    normalized === "image_urls"
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
    minCandidate != null && Number.isFinite(minCandidate)
      ? Math.max(0, Math.floor(minCandidate as number))
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

  return { min, max, allowed_file_types, ...(gen_model_id ? { gen_model_id } : {}) };
}

/** Field schema for `MediaFilePicker`: keep structured `x-ui-component` or synthesize from `resolveMediaPickerSettings`. */
export function buildMediaFieldSchemaForPicker(
  fieldKey: string,
  prop: JsonSchemaProperty,
  readOnly: boolean,
  label: string
): JsonSchemaProperty {
  const xUi = prop["x-ui-component"];
  if (
    xUi &&
    typeof xUi === "object" &&
    !Array.isArray(xUi) &&
    String((xUi as { type?: unknown }).type)
      .trim()
      .toLowerCase() === "mediafilepicker"
  ) {
    return {
      ...prop,
      readOnly,
      title: prop.title || label,
    };
  }
  const mediaSettings = resolveMediaPickerSettings(fieldKey, prop);
  return {
    ...prop,
    readOnly,
    title: prop.title || label,
    "x-ui-component": {
      type: "MediaFilePicker",
      settings: mediaSettings,
    },
  };
}
