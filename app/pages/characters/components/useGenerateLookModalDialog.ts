import { useEffect, useMemo, useState } from "react";
import { useForm } from "~/lib/ContextForm";
import useCharactersStore, { type CharacterLookModelUiField } from "~/lib/stores/charactersStore";
import useGenerationsStore from "~/lib/stores/generateStore";
import {
  buildCharacterGenerateLookFormValues,
  buildCharacterGenerateLookPayload,
  CHARACTER_GENERATE_LOOK_BASE_IMAGE_FIELD,
  CHARACTER_GENERATE_LOOK_CHARACTER_AUDIO_FIELD,
  parseModelFunctionSchema,
  prepareCharacterGenerateLookSchema,
  restrictCharacterGenerateLookFormSchema,
  restrictCharacterGenerateSceneFormSchema,
  restrictCharacterGenerateVideoFormSchema,
  CHARACTER_GENERATE_SCENE_ASPECT_RATIO_FIELD,
  EMPTY_PREPARED_CHARACTER_GENERATE_LOOK_SCHEMA,
  type PreparedCharacterGenerateLookSchema,
} from "~/pages/characters/characterGenerateLookSchema";
import { buildAudioPickerOptions } from "~/pages/characters/components/CharacterAudioPicker";
import {
  getUiFieldDefaults,
  mergeLookModelConfigPayload,
} from "~/pages/characters/components/CharacterLookModelFields";
import {
  collectDeepFormSchemaErrors,
  evaluateConditions,
  schemaValuesEqual,
} from "~/pages/generate/components/ModelSchemaForm.utils";
import type { GenModelsItem } from "~/types/generations";
import type { GenerateLookModalDialogProps } from "~/pages/characters/components/generateLookModalTypes";

export function useGenerateLookModalDialog({
  opened,
  kind = "look",
  retryDraft = null,
  baseLookOptions,
  voiceSpeeches,
  characterVoice,
  onSubmit,
}: GenerateLookModalDialogProps) {
  const isScene = kind === "scene";
  const isVideo = kind === "video";
  const usesMediaForm = isScene || isVideo;
  const usesVideoModels = isVideo;
  const nameLabel = kind === "video" ? "Video name" : kind === "scene" ? "Scene name" : "Look name";
  const namePlaceholder =
    kind === "video"
      ? "e.g. Talking head intro"
      : kind === "scene"
        ? "e.g. Coffee shop morning"
        : "e.g. Red carpet outfit";
  const costMultiplier = usesMediaForm ? 1 : 4;

  const loadGenModels = useGenerationsStore((s) => s.loadGenModels);
  const lookModelOptions = useCharactersStore((s) => s.lookModelOptions);
  const videoModelOptions = useCharactersStore((s) => s.videoModelOptions);
  const lookModelOptionsLoading = useCharactersStore((s) => s.lookModelOptionsLoading);
  const videoModelOptionsLoading = useCharactersStore((s) => s.videoModelOptionsLoading);
  const loadLookModelOptions = useCharactersStore((s) => s.loadLookModelOptions);
  const loadVideoModelOptions = useCharactersStore((s) => s.loadVideoModelOptions);
  const characterModelOptions = usesVideoModels ? videoModelOptions : lookModelOptions;
  const characterModelOptionsLoading = usesVideoModels
    ? videoModelOptionsLoading
    : lookModelOptionsLoading;
  const loadCharacterModelOptions = usesVideoModels ? loadVideoModelOptions : loadLookModelOptions;
  const calculateGenerateCost = useGenerationsStore((s) => s.calculateGenerateCost);

  const [modelId, setModelId] = useState("");
  const [lookModelPayload, setLookModelPayload] = useState<Record<string, unknown>>({});
  const [lookName, setLookName] = useState("");
  const [lookNameError, setLookNameError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<GenModelsItem | null>(null);
  const [modelLoading, setModelLoading] = useState(false);
  const [generateCost, setGenerateCost] = useState<number | null>(null);
  const [generateCostLoading, setGenerateCostLoading] = useState(false);

  const selectedLookModelOption = useMemo(
    () => characterModelOptions.find((option) => option.edit_model_id === modelId) ?? null,
    [characterModelOptions, modelId]
  );

  const lookModelSelectData = useMemo(
    () =>
      characterModelOptions.map((option) => ({
        value: option.edit_model_id,
        label: option.label,
      })),
    [characterModelOptions]
  );

  const rawFunctionSchema = useMemo(
    () => parseModelFunctionSchema(selectedModel?.gen_models_apis?.function_schema),
    [selectedModel?.gen_models_apis?.function_schema]
  );

  const preparedSchema = useMemo((): PreparedCharacterGenerateLookSchema | null => {
    if (!rawFunctionSchema) return null;
    return prepareCharacterGenerateLookSchema(rawFunctionSchema);
  }, [rawFunctionSchema]);

  const functionSchema = useMemo(() => {
    if (!preparedSchema) return null;
    if (isScene) return restrictCharacterGenerateSceneFormSchema(preparedSchema);
    if (isVideo) return restrictCharacterGenerateVideoFormSchema(preparedSchema);
    return restrictCharacterGenerateLookFormSchema(preparedSchema);
  }, [preparedSchema, isScene, isVideo]);

  const showAspectRatioInSchema = Boolean(
    isScene && functionSchema?.properties?.[CHARACTER_GENERATE_SCENE_ASPECT_RATIO_FIELD]
  );

  const sceneFallbackAspectRatioUi = useMemo((): Record<string, CharacterLookModelUiField> => {
    if (!isScene || showAspectRatioInSchema || !selectedLookModelOption) return {};

    const schemaProp = rawFunctionSchema?.properties?.[CHARACTER_GENERATE_SCENE_ASPECT_RATIO_FIELD];
    const enumValues = schemaProp?.enum?.filter(
      (value): value is string => typeof value === "string"
    );
    if (enumValues && enumValues.length > 0) {
      return {
        [CHARACTER_GENERATE_SCENE_ASPECT_RATIO_FIELD]: {
          enum: enumValues,
          type: "string",
          default:
            typeof schemaProp.default === "string"
              ? schemaProp.default
              : (selectedLookModelOption.fields.default[
                  CHARACTER_GENERATE_SCENE_ASPECT_RATIO_FIELD
                ] ?? enumValues[0]),
          description:
            typeof schemaProp.description === "string" ? schemaProp.description : undefined,
        },
      };
    }

    const defaultRatio =
      selectedLookModelOption.fields.default[CHARACTER_GENERATE_SCENE_ASPECT_RATIO_FIELD];
    return {
      [CHARACTER_GENERATE_SCENE_ASPECT_RATIO_FIELD]: {
        enum: ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"],
        type: "string",
        default: typeof defaultRatio === "string" ? defaultRatio : "9:16",
        description: "Aspect ratio of the output image.",
      },
    };
  }, [isScene, showAspectRatioInSchema, selectedLookModelOption, rawFunctionSchema]);

  const lookModelUiFields = useMemo(() => {
    if (!selectedLookModelOption) return {};
    return {
      ...selectedLookModelOption.fields.ui,
      ...sceneFallbackAspectRatioUi,
    };
  }, [selectedLookModelOption, sceneFallbackAspectRatioUi]);

  const showBaseLookPicker = Boolean(!preparedSchema || preparedSchema.baseLookBindings.length > 0);
  const showAudioPicker = Boolean(preparedSchema && preparedSchema.audioBindings.length > 0);
  const hasUiFields = Object.keys(lookModelUiFields).length > 0;

  const audioOptions = useMemo(
    () => buildAudioPickerOptions(voiceSpeeches, characterVoice),
    [voiceSpeeches, characterVoice]
  );

  const defaultBaseUrlRaw = retryDraft?.formSeed[CHARACTER_GENERATE_LOOK_BASE_IMAGE_FIELD];
  const defaultBaseUrl =
    (typeof defaultBaseUrlRaw === "string" && defaultBaseUrlRaw.trim()) ||
    baseLookOptions[0]?.value ||
    "";

  const resolvedInitialValues = useMemo(() => {
    if (!preparedSchema || !functionSchema) {
      return {
        [CHARACTER_GENERATE_LOOK_BASE_IMAGE_FIELD]: defaultBaseUrl,
        ...(retryDraft?.formSeed ?? {}),
      };
    }
    const schemaForValues = { ...preparedSchema, formSchema: functionSchema };
    const initialBaseRaw = retryDraft?.formSeed[CHARACTER_GENERATE_LOOK_BASE_IMAGE_FIELD];
    const initialBase =
      typeof initialBaseRaw === "string" && initialBaseRaw.trim()
        ? initialBaseRaw.trim()
        : defaultBaseUrl;
    const initialAudioRaw = retryDraft?.formSeed[CHARACTER_GENERATE_LOOK_CHARACTER_AUDIO_FIELD];
    const initialAudio =
      typeof initialAudioRaw === "string" && initialAudioRaw.trim()
        ? initialAudioRaw.trim()
        : (audioOptions[0]?.value ?? "");
    const base = buildCharacterGenerateLookFormValues(schemaForValues, {
      baseLookImageUrl: initialBase,
      characterAudioUrl: initialAudio,
    });
    return retryDraft?.formSeed ? { ...base, ...retryDraft.formSeed } : base;
  }, [preparedSchema, functionSchema, defaultBaseUrl, audioOptions, retryDraft]);

  const resolvedInitialValuesKey = useMemo(
    () => JSON.stringify(resolvedInitialValues),
    [resolvedInitialValues]
  );

  const form = useForm({
    initialValues: resolvedInitialValues,
    validate: (values) => {
      const errors: Record<string, string> = {};
      if (showAudioPicker && audioOptions.length > 0) {
        const audio = values[CHARACTER_GENERATE_LOOK_CHARACTER_AUDIO_FIELD];
        if (typeof audio !== "string" || !audio.trim()) {
          errors[CHARACTER_GENERATE_LOOK_CHARACTER_AUDIO_FIELD] = "Select a speech clip";
        }
      }
      if (functionSchema?.properties) {
        Object.assign(
          errors,
          collectDeepFormSchemaErrors(functionSchema, values as Record<string, unknown>)
        );
      }
      return errors;
    },
  });

  useEffect(() => {
    if (!opened) {
      setGenerateCost(null);
      setGenerateCostLoading(false);
      return;
    }

    if (retryDraft) {
      setLookName(retryDraft.lookName);
      setModelId(retryDraft.modelId);
      setLookModelPayload(retryDraft.lookModelPayload);
      setLookNameError(null);
      return;
    }

    setLookName("");
    setLookNameError(null);
    setModelId("");
    setLookModelPayload({});
    setGenerateCost(null);
    setGenerateCostLoading(false);
  }, [opened, retryDraft]);

  useEffect(() => {
    if (!opened || retryDraft) return;
    let cancelled = false;
    void loadCharacterModelOptions().then((options) => {
      if (cancelled) return;
      const first = options[0];
      if (first) {
        setModelId(first.edit_model_id);
        setLookModelPayload(getUiFieldDefaults(first.fields.ui));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [opened, retryDraft, loadCharacterModelOptions]);

  useEffect(() => {
    if (!opened || !modelId.trim()) {
      setSelectedModel(null);
      return;
    }
    let cancelled = false;
    setModelLoading(true);

    void (async () => {
      let catalog = useGenerationsStore.getState().allGenModels;
      if (!catalog.length) {
        await loadGenModels();
        catalog = useGenerationsStore.getState().allGenModels;
      }
      if (cancelled) return;
      setSelectedModel(catalog.find((item) => item.id === modelId.trim()) ?? null);
      setModelLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [opened, modelId, loadGenModels]);

  useEffect(() => {
    if (!opened || !selectedModel?.id) return;
    form.setInitialValues(resolvedInitialValues);
    form.reset();
    form.clearErrors();
  }, [
    opened,
    selectedModel?.id,
    selectedModel?.gen_models_apis?.function_schema,
    resolvedInitialValuesKey,
  ]);

  const conditionState = useMemo(
    () =>
      functionSchema
        ? evaluateConditions(functionSchema, form.values as Record<string, unknown>)
        : { disabledFields: new Set<string>(), setValues: {} as Record<string, unknown> },
    [functionSchema, form.values]
  );

  const conditionSetValuesKey = useMemo(
    () => JSON.stringify(conditionState.setValues),
    [conditionState.setValues]
  );

  useEffect(() => {
    for (const [field, value] of Object.entries(conditionState.setValues)) {
      if (!schemaValuesEqual((form.values as Record<string, unknown>)[field], value)) {
        form.setFieldValue(field, value);
      }
    }
  }, [conditionSetValuesKey, conditionState.setValues]);

  const handleLookModelChange = (editModelId: string | null) => {
    if (!editModelId) return;
    const option = characterModelOptions.find((item) => item.edit_model_id === editModelId);
    if (!option) return;
    setModelId(editModelId);
    setLookModelPayload(getUiFieldDefaults(option.fields.ui));
  };

  useEffect(() => {
    if (!opened || !isScene || !selectedLookModelOption || showAspectRatioInSchema) return;

    setLookModelPayload((current) => {
      if (
        current.aspect_ratio !== undefined &&
        current.aspect_ratio !== null &&
        current.aspect_ratio !== ""
      ) {
        return current;
      }
      const fallback =
        sceneFallbackAspectRatioUi[CHARACTER_GENERATE_SCENE_ASPECT_RATIO_FIELD]?.default;
      const fromDefault =
        selectedLookModelOption.fields.default[CHARACTER_GENERATE_SCENE_ASPECT_RATIO_FIELD];
      const aspectRatio =
        typeof fallback === "string"
          ? fallback
          : typeof fromDefault === "string"
            ? fromDefault
            : "9:16";
      return { ...current, [CHARACTER_GENERATE_SCENE_ASPECT_RATIO_FIELD]: aspectRatio };
    });
  }, [
    opened,
    isScene,
    selectedLookModelOption,
    showAspectRatioInSchema,
    sceneFallbackAspectRatioUi,
  ]);

  const handleLookModelFieldChange = (key: string, value: unknown) => {
    setLookModelPayload((current) => ({ ...current, [key]: value }));
  };

  const lookCostPayload = useMemo(() => {
    if (!selectedLookModelOption || !preparedSchema) return null;
    const schemaPayload = buildCharacterGenerateLookPayload(
      form.values as Record<string, unknown>,
      preparedSchema,
      baseLookOptions,
      audioOptions
    );
    const configPayload = mergeLookModelConfigPayload(selectedLookModelOption, lookModelPayload);
    if (isScene && showAspectRatioInSchema) {
      delete configPayload[CHARACTER_GENERATE_SCENE_ASPECT_RATIO_FIELD];
    }
    return { ...configPayload, ...schemaPayload };
  }, [
    isScene,
    showAspectRatioInSchema,
    selectedLookModelOption,
    preparedSchema,
    form.values,
    baseLookOptions,
    audioOptions,
    lookModelPayload,
  ]);

  const lookCostDriverSnapshot = useMemo(() => {
    if (!opened || !modelId.trim() || !lookCostPayload) return "";
    return JSON.stringify({
      modelId: modelId.trim(),
      payload: lookCostPayload,
    });
  }, [opened, modelId, lookCostPayload]);

  useEffect(() => {
    if (!opened || !lookCostDriverSnapshot || !modelId.trim() || !lookCostPayload) {
      setGenerateCost(null);
      setGenerateCostLoading(false);
      return;
    }

    let cancelled = false;
    const timeoutId = setTimeout(() => {
      setGenerateCostLoading(true);
      void calculateGenerateCost({
        modelId: modelId.trim(),
        payload: lookCostPayload,
      })
        .then((singleImageCost) => {
          if (!cancelled) setGenerateCost(singleImageCost * costMultiplier);
        })
        .catch(() => {
          if (!cancelled) setGenerateCost(null);
        })
        .finally(() => {
          if (!cancelled) setGenerateCostLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [
    opened,
    lookCostDriverSnapshot,
    modelId,
    lookCostPayload,
    calculateGenerateCost,
    costMultiplier,
  ]);

  const handleSubmit = form.onSubmit((values) => {
    if (!modelId.trim() || !selectedLookModelOption) return;

    const trimmedName = lookName.trim();
    if (!trimmedName) {
      setLookNameError(`${nameLabel} is required`);
      return;
    }
    setLookNameError(null);

    const schemaPayload = buildCharacterGenerateLookPayload(
      values as Record<string, unknown>,
      preparedSchema ?? EMPTY_PREPARED_CHARACTER_GENERATE_LOOK_SCHEMA,
      baseLookOptions,
      audioOptions
    );
    const configPayload = mergeLookModelConfigPayload(selectedLookModelOption, lookModelPayload);
    if (isScene && showAspectRatioInSchema) {
      delete configPayload[CHARACTER_GENERATE_SCENE_ASPECT_RATIO_FIELD];
    }
    onSubmit({
      modelId: modelId.trim(),
      payload: { ...configPayload, ...schemaPayload },
      name: trimmedName,
      lookId: retryDraft?.lookId,
    });
  });

  const hasSchemaFields = Boolean(
    functionSchema?.properties && Object.keys(functionSchema.properties).length > 0
  );
  const hasFormContent = hasSchemaFields || hasUiFields || showBaseLookPicker || showAudioPicker;

  return {
    form,
    nameLabel,
    namePlaceholder,
    modelId,
    lookName,
    lookNameError,
    setLookName,
    setLookNameError,
    lookModelPayload,
    lookModelSelectData,
    lookModelOptionsLoading: characterModelOptionsLoading,
    lookModelUiFields,
    selectedLookModelOption,
    selectedModel,
    modelLoading,
    functionSchema,
    showBaseLookPicker,
    showAudioPicker,
    audioOptions,
    conditionState,
    generateCost,
    generateCostLoading,
    hasFormContent,
    handleLookModelChange,
    handleLookModelFieldChange,
    handleSubmit,
  };
}
