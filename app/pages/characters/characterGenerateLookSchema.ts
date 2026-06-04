import type { FunctionSchema } from "~/types/generations";
import type { AudioPickerOption } from "~/pages/characters/components/CharacterAudioPicker";
import type { BaseLookPickerOption } from "~/pages/characters/components/CharacterBaseLookPicker";
import {
  buildInitialValues,
  parseFunctionSchema,
  sanitizePayload,
} from "~/pages/generate/components/ModelSchemaForm.utils";

/** Internal form field for `CharacterBaseLookPicker` (not sent to the API as-is). */
export const CHARACTER_GENERATE_LOOK_BASE_IMAGE_FIELD = "baseLookImage";

/** @deprecated Prefer override detection via `prepareCharacterGenerateLookSchema`. */
export const CHARACTER_GENERATE_LOOK_IMAGES_FIELD = "images";

export const CHARACTER_GENERATE_LOOK_IMAGE_FIELD = "image";
export const CHARACTER_GENERATE_LOOK_AUDIO_SCHEMA_FIELD = "audio";

/** Internal form field for `CharacterAudioPicker` (maps to schema `audio` in the API payload). */
export const CHARACTER_GENERATE_LOOK_CHARACTER_AUDIO_FIELD = "characterAudio";

export type AudioPayloadBinding = {
  field: typeof CHARACTER_GENERATE_LOOK_AUDIO_SCHEMA_FIELD;
  mode: "replaceString";
};

export type BaseLookPayloadBinding =
  | { field: typeof CHARACTER_GENERATE_LOOK_IMAGE_FIELD; mode: "replaceString" }
  | { field: typeof CHARACTER_GENERATE_LOOK_IMAGES_FIELD; mode: "prependToArray" };

/**
 * Maps a model schema property to custom UI + payload merge behavior.
 * Add new rules here as more fields need character-specific handling.
 */
export type CharacterGenerateLookSchemaOverrideRule = {
  schemaField: string;
  binding: BaseLookPayloadBinding;
  /** Adjust array max counts when reserving one slot for the base look. */
  reserveArraySlot?: boolean;
  /** Keep field in `SchemaNestedFields` (e.g. `images` MediaFilePicker with max − 1). */
  keepInForm?: boolean;
};

export const CHARACTER_GENERATE_LOOK_SCHEMA_OVERRIDE_RULES: CharacterGenerateLookSchemaOverrideRule[] =
  [
    {
      schemaField: CHARACTER_GENERATE_LOOK_IMAGE_FIELD,
      binding: { field: CHARACTER_GENERATE_LOOK_IMAGE_FIELD, mode: "replaceString" },
    },
    {
      schemaField: CHARACTER_GENERATE_LOOK_IMAGES_FIELD,
      binding: { field: CHARACTER_GENERATE_LOOK_IMAGES_FIELD, mode: "prependToArray" },
      reserveArraySlot: true,
      keepInForm: true,
    },
  ];

export type PreparedCharacterGenerateLookSchema = {
  /** Schema passed to `SchemaNestedFields` (overridden properties removed). */
  formSchema: FunctionSchema;
  /** How the base look URL is written into the API payload. */
  baseLookBindings: BaseLookPayloadBinding[];
  /** How speech audio URL is written into the API `audio` field. */
  audioBindings: AudioPayloadBinding[];
  /** Original schema keys replaced by custom UI (e.g. `image`, `images`, `audio`). */
  overriddenSchemaFields: string[];
};

export const EMPTY_PREPARED_CHARACTER_GENERATE_LOOK_SCHEMA: PreparedCharacterGenerateLookSchema = {
  formSchema: { properties: {} },
  baseLookBindings: [],
  audioBindings: [],
  overriddenSchemaFields: [],
};

function adjustMediaPickerArraySlot(
  arrayProp: NonNullable<FunctionSchema["properties"]>[string],
  adjustMax: (value: number) => number
): void {
  const xUi = arrayProp["x-ui-component"];
  if (!xUi || typeof xUi !== "object" || Array.isArray(xUi)) return;

  const settings = (xUi as Record<string, unknown>).settings;
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return;

  const s = settings as Record<string, unknown>;
  if (typeof s.max === "number" && Number.isFinite(s.max)) {
    s.max = adjustMax(s.max);
  }
  s.min = 0;
}

function reserveOneSlotInImagesArrayProperty(
  imagesProp: NonNullable<FunctionSchema["properties"]>[string]
): void {
  if (imagesProp.type !== "array") return;

  if (typeof imagesProp.maxItems === "number" && Number.isFinite(imagesProp.maxItems)) {
    imagesProp.maxItems = Math.max(0, imagesProp.maxItems - 1);
  }
  if (typeof imagesProp.minItems === "number" && Number.isFinite(imagesProp.minItems)) {
    imagesProp.minItems = Math.max(0, imagesProp.minItems - 1);
  } else {
    imagesProp.minItems = 0;
  }
  adjustMediaPickerArraySlot(imagesProp, (max) => Math.max(0, max - 1));
}

function detectApplicableOverrides(
  properties: FunctionSchema["properties"]
): CharacterGenerateLookSchemaOverrideRule[] {
  if (!properties) return [];
  return CHARACTER_GENERATE_LOOK_SCHEMA_OVERRIDE_RULES.filter(
    (rule) => properties[rule.schemaField] != null
  );
}

function detectAudioBinding(properties: FunctionSchema["properties"]): AudioPayloadBinding[] {
  if (!properties?.[CHARACTER_GENERATE_LOOK_AUDIO_SCHEMA_FIELD]) return [];
  return [{ field: CHARACTER_GENERATE_LOOK_AUDIO_SCHEMA_FIELD, mode: "replaceString" }];
}

/**
 * Strips schema fields handled by custom UI and returns bindings for payload merge.
 */
export function prepareCharacterGenerateLookSchema(
  schema: FunctionSchema
): PreparedCharacterGenerateLookSchema {
  const formSchema = structuredClone(schema) as FunctionSchema;
  const applicable = detectApplicableOverrides(formSchema.properties);
  const audioBindings = detectAudioBinding(formSchema.properties);
  const baseLookBindings = applicable.map((rule) => rule.binding);
  const overriddenSchemaFields = [
    ...applicable.filter((rule) => !rule.keepInForm).map((rule) => rule.schemaField),
    ...audioBindings.map((binding) => binding.field),
  ];

  if (audioBindings.length > 0 && formSchema.properties) {
    delete formSchema.properties[CHARACTER_GENERATE_LOOK_AUDIO_SCHEMA_FIELD];
  }

  for (const rule of applicable) {
    const prop = formSchema.properties?.[rule.schemaField];
    if (!prop) continue;

    if (rule.reserveArraySlot) {
      reserveOneSlotInImagesArrayProperty(prop);
    }

    if (!rule.keepInForm && formSchema.properties) {
      delete formSchema.properties[rule.schemaField];
    }
  }

  if (formSchema.required?.length) {
    const hidden = new Set(overriddenSchemaFields);
    /** Base look is prepended into `images` — extra picks are optional. */
    const optionalBecauseBaseLookMerged = new Set(
      applicable.filter((rule) => rule.keepInForm).map((rule) => rule.schemaField)
    );
    formSchema.required = formSchema.required.filter(
      (key) => !hidden.has(key) && !optionalBecauseBaseLookMerged.has(key)
    );
  }

  return {
    formSchema,
    baseLookBindings,
    audioBindings,
    overriddenSchemaFields,
  };
}

export function parseModelFunctionSchema(raw: unknown): FunctionSchema | null {
  return parseFunctionSchema(raw);
}

function resolveBaseLookUrl(
  formValues: Record<string, unknown>,
  baseLookOptions: BaseLookPickerOption[]
): string {
  const baseRaw = formValues[CHARACTER_GENERATE_LOOK_BASE_IMAGE_FIELD];
  let base = typeof baseRaw === "string" ? baseRaw.trim() : "";

  if (base && baseLookOptions.length > 0) {
    const match = baseLookOptions.find(
      (option) => option.value === base || option.thumbnailUrl === base
    );
    if (match) base = match.value;
  }

  return base;
}

function resolveCharacterAudioUrl(
  formValues: Record<string, unknown>,
  audioOptions: AudioPickerOption[]
): string {
  const raw = formValues[CHARACTER_GENERATE_LOOK_CHARACTER_AUDIO_FIELD];
  let url = typeof raw === "string" ? raw.trim() : "";

  if (url && audioOptions.length > 0) {
    const match = audioOptions.find((option) => option.value === url);
    if (match) url = match.value;
  }

  return url;
}

export function buildCharacterGenerateLookFormValues(
  prepared: PreparedCharacterGenerateLookSchema,
  opts?: { baseLookImageUrl?: string | null; characterAudioUrl?: string | null }
): Record<string, unknown> {
  const values = prepared.formSchema.properties ? buildInitialValues(prepared.formSchema) : {};
  const baseUrl = opts?.baseLookImageUrl?.trim() || "";
  const audioUrl = opts?.characterAudioUrl?.trim() || "";
  return {
    ...values,
    [CHARACTER_GENERATE_LOOK_BASE_IMAGE_FIELD]: baseUrl,
    [CHARACTER_GENERATE_LOOK_CHARACTER_AUDIO_FIELD]: audioUrl,
  };
}

/** Merges base look + form values into the API payload per detected bindings. */
export function buildCharacterGenerateLookPayload(
  formValues: Record<string, unknown>,
  prepared: PreparedCharacterGenerateLookSchema,
  baseLookOptions: BaseLookPickerOption[] = [],
  audioOptions: AudioPickerOption[] = []
): Record<string, unknown> {
  const base = resolveBaseLookUrl(formValues, baseLookOptions);
  const audio = resolveCharacterAudioUrl(formValues, audioOptions);
  const hidden = new Set<string>([
    CHARACTER_GENERATE_LOOK_BASE_IMAGE_FIELD,
    CHARACTER_GENERATE_LOOK_CHARACTER_AUDIO_FIELD,
    ...prepared.overriddenSchemaFields,
  ]);

  const schemaValues: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(formValues)) {
    if (!hidden.has(key)) schemaValues[key] = value;
  }

  const payload = sanitizePayload(schemaValues);

  for (const binding of prepared.baseLookBindings) {
    if (binding.mode === "replaceString") {
      if (base) {
        payload[binding.field] = base;
      } else {
        delete payload[binding.field];
      }
      continue;
    }

    if (binding.mode === "prependToArray") {
      const extra = Array.isArray(payload[binding.field])
        ? (payload[binding.field] as unknown[])
            .filter((item): item is string => typeof item === "string")
            .map((item) => item.trim())
            .filter(Boolean)
        : [];

      const images: string[] = [];
      if (base) images.push(base);
      for (const url of extra) {
        if (!images.includes(url)) images.push(url);
      }

      if (images.length > 0) {
        payload[binding.field] = images;
      } else {
        delete payload[binding.field];
      }
    }
  }

  for (const binding of prepared.audioBindings) {
    if (binding.mode === "replaceString") {
      if (audio) {
        payload[binding.field] = audio;
      } else {
        delete payload[binding.field];
      }
    }
  }

  return payload;
}
