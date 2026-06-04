import {
  Box,
  Button,
  Group,
  Loader,
  Modal,
  ScrollArea,
  Select,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useEffect, useMemo, useState } from "react";
import { FormProvider, useForm } from "~/lib/ContextForm";
import type { UserVoice, UserVoiceSpeech } from "~/lib/stores/voicesStore";
import useGenerationsStore from "~/lib/stores/generateStore";
import {
  getDefaultCharacterGenerateModelId,
  MAX_CHARACTER_NAME_LENGTH,
} from "~/pages/characters/characterUtils";
import {
  buildCharacterGenerateLookFormValues,
  buildCharacterGenerateLookPayload,
  CHARACTER_GENERATE_LOOK_BASE_IMAGE_FIELD,
  CHARACTER_GENERATE_LOOK_CHARACTER_AUDIO_FIELD,
  parseModelFunctionSchema,
  prepareCharacterGenerateLookSchema,
  EMPTY_PREPARED_CHARACTER_GENERATE_LOOK_SCHEMA,
  type PreparedCharacterGenerateLookSchema,
} from "~/pages/characters/characterGenerateLookSchema";
import {
  buildAudioPickerOptions,
  CharacterAudioPicker,
} from "~/pages/characters/components/CharacterAudioPicker";
import {
  CharacterBaseLookPicker,
  type BaseLookPickerOption,
} from "~/pages/characters/components/CharacterBaseLookPicker";
import { SchemaNestedFields } from "~/pages/generate/components/SchemaNestedFields";
import {
  collectDeepFormSchemaErrors,
  evaluateConditions,
  schemaValuesEqual,
} from "~/pages/generate/components/ModelSchemaForm.utils";
import type { GenModelsItem } from "~/types/generations";
import useAppStore from "~/lib/stores/appStore";

const CHARACTER_LOOK_MODEL_OPTIONS = [
  { value: "bf5a5370-d39c-4d28-9b63-c67f4685b567", label: "Google Nano Banana 2" },
  { value: "377a54f4-0c4f-4316-9f00-631f4f34abde", label: "OpenAI GPT Image 2" },
  { value: "6cac6e6a-e1cd-4192-97c6-9ca0b607f917", label: "Pruna AI P-Image" },
  { value: "0a71319e-0fc1-46b7-9c50-f3e64146ed19", label: "Grok Imagen" },
] as const;

export type GenerateLookSubmitValues = {
  modelId: string;
  payload: Record<string, unknown>;
  name: string;
};

type GenerateLookModalProps = {
  opened: boolean;
  onClose: () => void;
  submitting?: boolean;
  baseLookOptions?: BaseLookPickerOption[];
  voiceSpeeches?: UserVoiceSpeech[];
  characterVoice?: UserVoice | null;
  onSubmit: (values: GenerateLookSubmitValues) => void;
};

export function GenerateLookModal({
  opened,
  onClose,
  submitting = false,
  baseLookOptions = [],
  voiceSpeeches = [],
  characterVoice = null,
  onSubmit,
}: GenerateLookModalProps) {
  const defaultModelId = getDefaultCharacterGenerateModelId();
  const loadGenModels = useGenerationsStore((s) => s.loadGenModels);
  const [modelId, setModelId] = useState<string>(defaultModelId);
  const [lookName, setLookName] = useState("");
  const [lookNameError, setLookNameError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<GenModelsItem | null>(null);
  const [modelLoading, setModelLoading] = useState(false);
  const { isMobile } = useAppStore();

  const rawFunctionSchema = useMemo(
    () => parseModelFunctionSchema(selectedModel?.gen_models_apis?.function_schema),
    [selectedModel?.gen_models_apis?.function_schema]
  );

  const preparedSchema = useMemo((): PreparedCharacterGenerateLookSchema | null => {
    if (!rawFunctionSchema) return null;
    return prepareCharacterGenerateLookSchema(rawFunctionSchema);
  }, [rawFunctionSchema]);

  const functionSchema = preparedSchema?.formSchema ?? null;

  const showBaseLookPicker = Boolean(!preparedSchema || preparedSchema.baseLookBindings.length > 0);
  const showAudioPicker = Boolean(preparedSchema && preparedSchema.audioBindings.length > 0);

  const audioOptions = useMemo(
    () => buildAudioPickerOptions(voiceSpeeches, characterVoice),
    [voiceSpeeches, characterVoice]
  );

  const defaultBaseUrl = baseLookOptions[0]?.value ?? "";

  const resolvedInitialValues = useMemo(() => {
    if (!preparedSchema) {
      return { [CHARACTER_GENERATE_LOOK_BASE_IMAGE_FIELD]: defaultBaseUrl };
    }
    const initialBase = defaultBaseUrl;
    const initialAudio = audioOptions[0]?.value ?? "";
    return buildCharacterGenerateLookFormValues(preparedSchema, {
      baseLookImageUrl: initialBase,
      characterAudioUrl: initialAudio,
    });
  }, [preparedSchema, defaultBaseUrl, audioOptions]);

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
    if (!opened) return;
    setModelId(defaultModelId);
    setLookName("");
    setLookNameError(null);
  }, [opened, defaultModelId]);

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

  const handleSubmit = form.onSubmit((values) => {
    if (!modelId.trim()) return;

    const trimmedName = lookName.trim();
    if (!trimmedName) {
      setLookNameError("Look name is required");
      return;
    }
    setLookNameError(null);

    const payload = buildCharacterGenerateLookPayload(
      values as Record<string, unknown>,
      preparedSchema ?? EMPTY_PREPARED_CHARACTER_GENERATE_LOOK_SCHEMA,
      baseLookOptions,
      audioOptions
    );
    onSubmit({
      modelId: modelId.trim(),
      payload,
      name: trimmedName,
    });
  });

  const hasSchemaFields = Boolean(
    functionSchema?.properties && Object.keys(functionSchema.properties).length > 0
  );
  const hasFormContent = hasSchemaFields || showBaseLookPicker || showAudioPicker;
  const canSubmit = !submitting && !modelLoading && hasFormContent && lookName.trim().length > 0;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Generate look"
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
      padding="0"
    >
      <FormProvider form={form}>
        <form
          onSubmit={handleSubmit}
          style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
        >
          <Box p="md">
            <Stack gap="md">
              <TextInput
                label="Look name"
                placeholder="e.g. Red carpet outfit"
                value={lookName}
                onChange={(event) => {
                  setLookName(event.currentTarget.value);
                  if (lookNameError) setLookNameError(null);
                }}
                maxLength={MAX_CHARACTER_NAME_LENGTH}
                required
                disabled={submitting}
                error={lookNameError}
              />
              <Select
                label="Model"
                data={CHARACTER_LOOK_MODEL_OPTIONS.map((m) => ({
                  value: m.value,
                  label: m.label,
                }))}
                value={modelId}
                onChange={(value) => {
                  if (value) setModelId(value);
                }}
                allowDeselect={false}
                disabled={submitting}
              />
            </Stack>
          </Box>
          <Box style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            {modelLoading ? (
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
                <Stack gap="lg" p="md">
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
                </Stack>
              </ScrollArea>
            )}
          </Box>

          <Group justify="flex-end" gap="xs" p="md">
            <Button variant="default" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting} disabled={!canSubmit}>
              Generate look
            </Button>
          </Group>
        </form>
      </FormProvider>
    </Modal>
  );
}
