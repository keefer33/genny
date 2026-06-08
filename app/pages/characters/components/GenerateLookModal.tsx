import {
  Box,
  Button,
  Group,
  Input,
  Loader,
  Modal,
  ScrollArea,
  Select,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { RiImageAddLine } from "@remixicon/react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { FormProvider, useForm } from "~/lib/ContextForm";
import { authFetchJson } from "~/lib/stores/authFetch";
import useCharactersStore, { type CharacterLookModelUiField } from "~/lib/stores/charactersStore";
import useVoicesStore, { type UserVoice, type UserVoiceSpeech } from "~/lib/stores/voicesStore";
import useGenerationsStore from "~/lib/stores/generateStore";
import { endpoint } from "~/lib/utils";
import { MAX_CHARACTER_NAME_LENGTH } from "~/pages/characters/characterUtils";
import {
  buildCharacterGenerateLookFormValues,
  buildCharacterGenerateLookPayload,
  CHARACTER_GENERATE_LOOK_BASE_IMAGE_FIELD,
  CHARACTER_GENERATE_LOOK_CHARACTER_AUDIO_FIELD,
  parseModelFunctionSchema,
  prepareCharacterGenerateLookSchema,
  restrictCharacterGenerateLookFormSchema,
  restrictCharacterGenerateSceneFormSchema,
  CHARACTER_GENERATE_SCENE_ASPECT_RATIO_FIELD,
  EMPTY_PREPARED_CHARACTER_GENERATE_LOOK_SCHEMA,
  type PreparedCharacterGenerateLookSchema,
} from "~/pages/characters/characterGenerateLookSchema";
import {
  buildAudioPickerOptions,
  CharacterAudioPicker,
} from "~/pages/characters/components/CharacterAudioPicker";
import {
  CharacterBaseLookPicker,
  buildBaseLookPickerOptionsFromLooks,
  type BaseLookPickerOption,
} from "~/pages/characters/components/CharacterBaseLookPicker";
import type { CharacterLook } from "~/pages/characters/components/CharacterLooksPanel";
import {
  CharacterLookModelFields,
  getUiFieldDefaults,
  mergeLookModelConfigPayload,
} from "~/pages/characters/components/CharacterLookModelFields";
import { SchemaNestedFields } from "~/pages/generate/components/SchemaNestedFields";
import {
  collectDeepFormSchemaErrors,
  evaluateConditions,
  schemaValuesEqual,
} from "~/pages/generate/components/ModelSchemaForm.utils";
import { CostBadge } from "~/shared/CostBadge";
import type { GenModelsItem } from "~/types/generations";
import useAppStore from "~/lib/stores/appStore";
import type { GenerateLookRetryDraft } from "~/pages/characters/characterGenerateLookRetryUtils";

export type GenerateLookSubmitValues = {
  modelId: string;
  payload: Record<string, unknown>;
  name: string;
  lookId?: string;
};

type GenerateLookModalSharedProps = {
  kind?: "look" | "scene";
  title?: string;
  submitLabel?: string;
  retryDraft?: GenerateLookRetryDraft | null;
};

type GenerateLookModalControlledProps = GenerateLookModalSharedProps & {
  opened: boolean;
  onClose: () => void;
  submitting?: boolean;
  baseLookOptions?: BaseLookPickerOption[];
  voiceSpeeches?: UserVoiceSpeech[];
  characterVoice?: UserVoice | null;
  onSubmit: (values: GenerateLookSubmitValues) => void;
};

type GenerateLookModalCharacterProps = GenerateLookModalSharedProps & {
  characterId: string | null | undefined;
  onGenerated?: () => void | Promise<void>;
  renderTrigger?: (ctx: { open: () => void; opening: boolean; label: string }) => ReactNode;
};

export type GenerateLookModalProps =
  | GenerateLookModalControlledProps
  | GenerateLookModalCharacterProps;

function isCharacterMode(props: GenerateLookModalProps): props is GenerateLookModalCharacterProps {
  return "characterId" in props;
}

type CharacterLooksResponse = {
  looks: CharacterLook[];
};

type GenerateLookModalDialogProps = GenerateLookModalSharedProps & {
  opened: boolean;
  onClose: () => void;
  submitting: boolean;
  baseLookOptions: BaseLookPickerOption[];
  voiceSpeeches: UserVoiceSpeech[];
  characterVoice: UserVoice | null;
  onSubmit: (values: GenerateLookSubmitValues) => void;
};

function GenerateLookModalDialog({
  opened,
  onClose,
  submitting,
  kind = "look",
  title,
  submitLabel,
  retryDraft = null,
  baseLookOptions,
  voiceSpeeches,
  characterVoice,
  onSubmit,
}: GenerateLookModalDialogProps) {
  const resolvedTitle = title ?? (kind === "scene" ? "Generate scene" : "Generate look");
  const resolvedSubmitLabel = submitLabel ?? (kind === "scene" ? "Generate" : "Generate");
  const nameLabel = kind === "scene" ? "Scene name" : "Look name";
  const namePlaceholder = kind === "scene" ? "e.g. Coffee shop morning" : "e.g. Red carpet outfit";
  const costMultiplier = kind === "scene" ? 1 : 4;
  const descriptionText =
    kind === "scene"
      ? "Scenes place your character in a setting. You can add optional images or describe the scene in detail."
      : "Looks generate a front, back, right, and left view of the character. You can add optional images of outfits and accessories.";
  const loadGenModels = useGenerationsStore((s) => s.loadGenModels);
  const lookModelOptions = useCharactersStore((s) => s.lookModelOptions);
  const lookModelOptionsLoading = useCharactersStore((s) => s.lookModelOptionsLoading);
  const loadLookModelOptions = useCharactersStore((s) => s.loadLookModelOptions);
  const calculateGenerateCost = useGenerationsStore((s) => s.calculateGenerateCost);
  const [modelId, setModelId] = useState("");
  const [lookModelPayload, setLookModelPayload] = useState<Record<string, unknown>>({});
  const [lookName, setLookName] = useState("");
  const [lookNameError, setLookNameError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<GenModelsItem | null>(null);
  const [modelLoading, setModelLoading] = useState(false);
  const [generateCost, setGenerateCost] = useState<number | null>(null);
  const [generateCostLoading, setGenerateCostLoading] = useState(false);
  const { isMobile } = useAppStore();

  const selectedLookModelOption = useMemo(
    () => lookModelOptions.find((option) => option.edit_model_id === modelId) ?? null,
    [lookModelOptions, modelId]
  );

  const lookModelSelectData = useMemo(
    () =>
      lookModelOptions.map((option) => ({
        value: option.edit_model_id,
        label: option.label,
      })),
    [lookModelOptions]
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
    return kind === "scene"
      ? restrictCharacterGenerateSceneFormSchema(preparedSchema)
      : restrictCharacterGenerateLookFormSchema(preparedSchema);
  }, [preparedSchema, kind]);

  const showAspectRatioInSchema = Boolean(
    kind === "scene" && functionSchema?.properties?.[CHARACTER_GENERATE_SCENE_ASPECT_RATIO_FIELD]
  );

  const sceneFallbackAspectRatioUi = useMemo((): Record<string, CharacterLookModelUiField> => {
    if (kind !== "scene" || showAspectRatioInSchema || !selectedLookModelOption) return {};

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
  }, [kind, showAspectRatioInSchema, selectedLookModelOption, rawFunctionSchema]);

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
    void loadLookModelOptions().then((options) => {
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
  }, [opened, retryDraft, loadLookModelOptions]);

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
    const option = lookModelOptions.find((item) => item.edit_model_id === editModelId);
    if (!option) return;
    setModelId(editModelId);
    setLookModelPayload(getUiFieldDefaults(option.fields.ui));
  };

  useEffect(() => {
    if (!opened || kind !== "scene" || !selectedLookModelOption || showAspectRatioInSchema) return;

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
  }, [opened, kind, selectedLookModelOption, showAspectRatioInSchema, sceneFallbackAspectRatioUi]);

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
    if (kind === "scene" && showAspectRatioInSchema) {
      delete configPayload[CHARACTER_GENERATE_SCENE_ASPECT_RATIO_FIELD];
    }
    return { ...configPayload, ...schemaPayload };
  }, [
    kind,
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
    if (kind === "scene" && showAspectRatioInSchema) {
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
  const canSubmit =
    !submitting &&
    !modelLoading &&
    !lookModelOptionsLoading &&
    Boolean(modelId.trim() && selectedLookModelOption) &&
    hasFormContent &&
    lookName.trim().length > 0;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={resolvedTitle}
      centered
      size="md"
      fullScreen={isMobile}
      styles={{
        content: {
          display: "flex",
          flexDirection: "column",
          height: "100%",
        },
        body: {
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
        },
      }}
      padding={2}
    >
      <FormProvider form={form}>
        <form
          onSubmit={handleSubmit}
          style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
        >
          <Box p="xs">
            <Text size="sm" c="dimmed">
              {descriptionText}
            </Text>
          </Box>
          <Box style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            {lookModelOptionsLoading || modelLoading ? (
              <Group justify="center" p="md">
                <Loader size="sm" />
              </Group>
            ) : !selectedModel ? (
              <Text size="sm" c="dimmed" p="md">
                Could not load model settings.
              </Text>
            ) : !hasFormContent ? (
              <Text size="sm" c="dimmed" p="md">
                This model has no configurable inputs.
              </Text>
            ) : (
              <ScrollArea h="100%" type="auto">
                <Stack gap="lg" p="xs">
                  <Select
                    label="Model"
                    placeholder="Choose a model"
                    data={lookModelSelectData}
                    value={modelId || null}
                    onChange={(value) =>
                      handleLookModelChange(typeof value === "string" ? value : null)
                    }
                    allowDeselect={false}
                    disabled={
                      submitting || lookModelOptionsLoading || lookModelSelectData.length === 0
                    }
                  />
                  {showBaseLookPicker ? (
                    <CharacterBaseLookPicker options={baseLookOptions} disabled={submitting} />
                  ) : null}

                  {showAudioPicker ? (
                    <CharacterAudioPicker options={audioOptions} disabled={submitting} />
                  ) : null}

                  {functionSchema?.properties ? (
                    <SchemaNestedFields
                      key={selectedModel.id}
                      pathPrefix=""
                      objectSchema={
                        functionSchema as typeof functionSchema & {
                          properties: NonNullable<typeof functionSchema.properties>;
                        }
                      }
                      readOnly={false}
                      generationType="image"
                      conditionDisabledFields={conditionState.disabledFields}
                    />
                  ) : null}

                  {selectedLookModelOption ? (
                    <CharacterLookModelFields
                      ui={lookModelUiFields}
                      values={lookModelPayload}
                      disabled={submitting}
                      onChange={handleLookModelFieldChange}
                    />
                  ) : null}
                </Stack>
              </ScrollArea>
            )}
          </Box>

          <Group wrap="nowrap" gap="xs" p="xs" align="flex-start">
            <TextInput
              label={nameLabel}
              placeholder={namePlaceholder}
              value={lookName}
              onChange={(event) => {
                setLookName(event.currentTarget.value);
                if (lookNameError) setLookNameError(null);
              }}
              maxLength={MAX_CHARACTER_NAME_LENGTH}
              required
              disabled={submitting}
              error={lookNameError}
              style={{ flex: 1, minWidth: 0 }}
            />
            <Stack gap={4} style={{ flexShrink: 0 }}>
              <Input.Label style={{ visibility: "hidden" }} aria-hidden>
                {nameLabel}
              </Input.Label>
              <Button
                type="submit"
                loading={submitting}
                disabled={!canSubmit}
                rightSection={
                  generateCostLoading ? (
                    <Loader type="dots" color="gray.4" size="sm" />
                  ) : generateCost != null ? (
                    <CostBadge cost={generateCost} size="sm" clickable={false} />
                  ) : null
                }
              >
                {resolvedSubmitLabel}
              </Button>
            </Stack>
          </Group>
        </form>
      </FormProvider>
    </Modal>
  );
}

export function GenerateLookModal(props: GenerateLookModalProps) {
  const kind = props.kind ?? "look";
  const [opened, { open, close }] = useDisclosure(false);
  const [opening, setOpening] = useState(false);
  const [characterLooks, setCharacterLooks] = useState<CharacterLook[]>([]);
  const [characterVoice, setCharacterVoice] = useState<UserVoice | null>(null);
  const [voiceSpeeches, setVoiceSpeeches] = useState<UserVoiceSpeech[]>([]);

  const generateCharacterLook = useCharactersStore((s) => s.generateCharacterLook);
  const generateCharacterScene = useCharactersStore((s) => s.generateCharacterScene);
  const generateLookLoading = useCharactersStore((s) => s.generateLookLoading);
  const generateSceneLoading = useCharactersStore((s) => s.generateSceneLoading);
  const fetchCharacterById = useCharactersStore((s) => s.fetchCharacterById);
  const getVoiceById = useVoicesStore((s) => s.getVoiceById);
  const getVoiceSpeeches = useVoicesStore((s) => s.getVoiceSpeeches);
  const generateLoading = kind === "scene" ? generateSceneLoading : generateLookLoading;
  const generateButtonLabel = kind === "scene" ? "Generate scene" : "Generate look";

  const fetchLooks = useCallback(async (id: string) => {
    try {
      const data = await authFetchJson<CharacterLooksResponse>(
        `${endpoint}/characters/${encodeURIComponent(id)}/looks`,
        undefined,
        { errorMessage: "Failed to load character looks" }
      );
      setCharacterLooks(data.looks ?? []);
    } catch {
      setCharacterLooks([]);
    }
  }, []);

  const handleOpen = useCallback(async () => {
    if (!isCharacterMode(props)) return;
    const id = props.characterId?.trim();
    if (!id) return;

    setOpening(true);
    setCharacterVoice(null);
    setVoiceSpeeches([]);

    try {
      await fetchLooks(id);

      const character = await fetchCharacterById(id);
      const voiceId = character?.voice_id?.trim();
      if (voiceId) {
        const voice = await getVoiceById(voiceId);
        setCharacterVoice(voice);
        setVoiceSpeeches(await getVoiceSpeeches(voiceId));
      }

      open();
    } finally {
      setOpening(false);
    }
  }, [props, fetchLooks, fetchCharacterById, getVoiceById, getVoiceSpeeches, open]);

  const handleCharacterSubmit = useCallback(
    async (values: GenerateLookSubmitValues) => {
      if (!isCharacterMode(props)) return;
      const id = props.characterId?.trim();
      if (!id) return;

      const ok =
        kind === "scene"
          ? await generateCharacterScene(id, values)
          : await generateCharacterLook(id, values);
      if (ok) {
        close();
        await props.onGenerated?.();
      }
    },
    [props, kind, generateCharacterLook, generateCharacterScene, close]
  );

  if (isCharacterMode(props)) {
    const baseLookOptions = buildBaseLookPickerOptionsFromLooks(characterLooks);
    const trigger = props.renderTrigger?.({
      open: () => void handleOpen(),
      opening,
      label: generateButtonLabel,
    }) ?? (
      <Button
        size="xs"
        leftSection={<RiImageAddLine size={16} />}
        loading={opening}
        onClick={() => void handleOpen()}
      >
        {generateButtonLabel}
      </Button>
    );

    return (
      <>
        {trigger}
        <GenerateLookModalDialog
          opened={opened}
          onClose={close}
          submitting={generateLoading}
          kind={kind}
          title={props.title}
          submitLabel={props.submitLabel}
          retryDraft={props.retryDraft}
          baseLookOptions={baseLookOptions}
          voiceSpeeches={voiceSpeeches}
          characterVoice={characterVoice}
          onSubmit={(values) => void handleCharacterSubmit(values)}
        />
      </>
    );
  }

  return (
    <GenerateLookModalDialog
      opened={props.opened}
      onClose={props.onClose}
      submitting={props.submitting ?? false}
      kind={kind}
      title={props.title}
      submitLabel={props.submitLabel}
      retryDraft={props.retryDraft}
      baseLookOptions={props.baseLookOptions ?? []}
      voiceSpeeches={props.voiceSpeeches ?? []}
      characterVoice={props.characterVoice ?? null}
      onSubmit={props.onSubmit}
    />
  );
}
