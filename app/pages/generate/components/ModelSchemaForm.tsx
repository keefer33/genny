import {
  Button,
  Input,
  NumberInput,
  ScrollArea,
  Select,
  Stack,
  Switch,
  Text,
  Textarea,
  TextInput,
  Loader,
  Box,
  Group,
  Skeleton,
} from "@mantine/core";
import { useEffect, useMemo } from "react";
import { FormProvider, useForm } from "~/lib/ContextForm";
import { showNotification } from "~/lib/notificationUtils";
import useGenerationsStore from "~/lib/stores/generateStore";
import { AgentPromptButton } from "../../../shared/AgentPromptButton";
import { PromptActionButtons } from "../../../shared/PromptActionButtons";
import { MediaFilePicker } from "./x-ui-components/MediaFilePicker/MediaFilePicker";
import { NumberSlider } from "./x-ui-components/NumberSlider";
import { SizePicker } from "./x-ui-components/SizePicker";
import { BoxPicker } from "./x-ui-components/BoxPicker";
import { AspectRatioPicker } from "./x-ui-components/AspectRatioPicker";
import { CostBadge } from "~/shared/CostBadge";
import { GenerationsHistoryModal } from "~/shared/GenerationsHistoryModal";
import useAppStore from "~/lib/stores/appStore";
import { useDisclosure } from "@mantine/hooks";
import {
  buildInitialValues,
  buildLabelWithDescription,
  DESCRIPTION_HELPER_DISABLED_FIELDS,
  evaluateConditions,
  fieldLabel,
  isCostIgnoredFieldKey,
  isMediaFieldName,
  normalizedFieldName,
  orderedPropertyKeys,
  parseEnumValue,
  parseFunctionSchema,
  resolveMediaPickerSettings,
  resolveXUiComponent,
  sanitizePayload,
  schemaValuesEqual,
} from "./ModelSchemaForm.utils";

export default function ModelSchemaForm() {
  const {
    selectedModel,
    generateFromGenModel,
    runLoading,
    calculateGenerateCost,
    costLoading,
    latestCost,
  } = useGenerationsStore();

  const { isMobile } = useAppStore();
  const [runHistoryModalOpened, { open: openRunHistoryModal, close: closeRunHistoryModal }] =
    useDisclosure(false);

  const functionSchema = useMemo(
    () => parseFunctionSchema(selectedModel?.gen_models_apis?.function_schema),
    [selectedModel?.gen_models_apis?.function_schema]
  );

  const form = useForm({
    initialValues: {} as Record<string, unknown>,
    validate: (values) => {
      const errors: Record<string, string> = {};
      const fs = parseFunctionSchema(selectedModel?.gen_models_apis?.function_schema);
      if (!fs?.properties) return errors;
      const required = fs.required ?? [];
      for (const key of required) {
        const prop = fs.properties[key];
        if (!prop) continue;
        const v = values[key];
        if (v === undefined || v === null) {
          errors[key] = "Required";
          continue;
        }
        if (prop.type === "string" && typeof v === "string" && v.trim() === "") {
          errors[key] = "Required";
        }
        if (prop.type === "array" && Array.isArray(v) && v.length === 0) {
          errors[key] = "Required";
        }
        if (prop.type === "number" || prop.type === "integer") {
          if (v === undefined || v === null || (typeof v === "number" && Number.isNaN(v))) {
            errors[key] = "Required";
          }
        }
      }
      return errors;
    },
  });

  const costDriverSnapshot = useMemo(() => {
    const fs = functionSchema;
    if (!fs?.properties) return "";
    const v = form.values as Record<string, unknown>;
    const partial: Record<string, unknown> = {};
    for (const key of orderedPropertyKeys(fs)) {
      if (isCostIgnoredFieldKey(key)) continue;
      partial[key] = v[key];
    }
    return JSON.stringify(sanitizePayload(partial));
  }, [form.values, functionSchema]);

  useEffect(() => {
    const fs = parseFunctionSchema(selectedModel?.gen_models_apis?.function_schema);
    const nextValues = fs?.properties ? buildInitialValues(fs) : {};

    // `setValues` merges keys; use reset after replacing initial values
    // so stale fields from the previous model are fully cleared.
    form.setInitialValues(nextValues);
    form.reset();
    form.clearErrors();

    if (!fs?.properties) {
      return;
    }
  }, [
    selectedModel?.id,
    selectedModel?.model_variant,
    selectedModel?.model_product,
    selectedModel?.brand_name?.slug,
    selectedModel?.gen_models_apis?.function_schema,
  ]);

  useEffect(() => {
    if (!selectedModel?.id) return;
    const timeoutId = setTimeout(() => {
      void calculateGenerateCost({
        modelId: selectedModel.id,
        payload: sanitizePayload(form.values as Record<string, unknown>),
      }).catch(() => undefined);
    }, 250);
    return () => clearTimeout(timeoutId);
  }, [costDriverSnapshot, selectedModel?.id, calculateGenerateCost]);

  const conditionState = useMemo(
    () => evaluateConditions(functionSchema, form.values as Record<string, unknown>),
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
  }, [conditionSetValuesKey, conditionState.setValues, form]);

  if (!selectedModel) {
    return <Skeleton height={100} />;
  }

  if (!functionSchema?.properties || Object.keys(functionSchema.properties).length === 0) {
    return (
      <Stack gap="xs" p="md">
        <Text fw={700}>{selectedModel.model_name ?? "Model"}</Text>
        <Text c="dimmed" size="sm">
          This model has no function schema inputs.
        </Text>
      </Stack>
    );
  }

  const requiredSet = new Set(functionSchema.required ?? []);
  const keys = orderedPropertyKeys(functionSchema);
  const normalizedMediaType =
    `${selectedModel.model_type ?? ""} ${selectedModel.generation_type ?? ""}`.toLowerCase().trim();
  let generationType: "image" | "video" | "audio" = "image";
  if (normalizedMediaType.includes("audio")) {
    generationType = "audio";
  } else if (normalizedMediaType.includes("video")) {
    generationType = "video";
  }
  const onSubmit = form.onSubmit(async (values) => {
    if (!selectedModel?.id) {
      showNotification({ message: "No model selected.", type: "error" });
      return;
    }
    try {
      await generateFromGenModel({
        id: selectedModel.id,
        payload: sanitizePayload(values),
      });
      showNotification({
        title: "Success",
        message: "Generation started successfully",
        type: "success",
      });
      if (isMobile) {
        openRunHistoryModal();
      }
    } catch (err) {
      showNotification({
        title: "Error",
        message: err instanceof Error ? err.message : "Failed to generate",
        type: "error",
      });
    }
  });

  return (
    <Box h="100%" style={{ minHeight: 0, display: "flex", flexDirection: "column" }}>
      <FormProvider form={form}>
        <form
          onSubmit={onSubmit}
          style={{ height: "100%", minHeight: 0, display: "flex", flexDirection: "column" }}
        >
          <ScrollArea h="100%" type="auto" offsetScrollbars="y">
            <Stack gap="xl" p="xs" pb="xl">
              {keys.map((key) => {
                const prop = functionSchema.properties![key];
                if (!prop) return null;

                const isRequired = requiredSet.has(key);
                const label = fieldLabel(key);
                const showDescriptionHelper = !DESCRIPTION_HELPER_DISABLED_FIELDS.has(
                  normalizedFieldName(key)
                );
                const labelWithHelp = buildLabelWithDescription(
                  label,
                  showDescriptionHelper ? prop.description : undefined,
                  isRequired
                );
                const description = undefined;
                const err = form.errors[key];
                const hasSingleEnumValue = prop.enum?.length === 1;
                const isConditionDisabled = conditionState.disabledFields.has(key);
                const isFieldReadOnly = prop.readOnly || isConditionDisabled;
                const xUiComponent = resolveXUiComponent(prop);
                const hasUnsupportedXUiComponent =
                  prop["x-ui-component"] !== undefined && !xUiComponent;

                if (
                  !hasUnsupportedXUiComponent &&
                  (xUiComponent === "MediaFilePicker" || (!xUiComponent && isMediaFieldName(key)))
                ) {
                  const mediaSettings = resolveMediaPickerSettings(key, prop);
                  return (
                    <MediaFilePicker
                      key={key}
                      fieldName={key}
                      fieldSchema={{
                        ...prop,
                        readOnly: isFieldReadOnly,
                        title: prop.title || label,
                        "x-ui-component": {
                          type: "MediaFilePicker",
                          settings: mediaSettings,
                        },
                      }}
                      description={description}
                      error={err}
                      isRequired={isRequired}
                    />
                  );
                }

                if (
                  !hasUnsupportedXUiComponent &&
                  !prop.enum &&
                  (xUiComponent === "SizePicker" ||
                    (!xUiComponent && normalizedFieldName(key) === "size"))
                ) {
                  return (
                    <SizePicker
                      key={key}
                      fieldName={key}
                      label={labelWithHelp}
                      description={description}
                      error={err}
                      isRequired={isRequired}
                      min={typeof prop.minimum === "number" ? prop.minimum : 1440}
                      max={typeof prop.maximum === "number" ? prop.maximum : 8192}
                      readOnly={isFieldReadOnly}
                      defaultValue={prop.default}
                      separator={(prop as unknown as { separator?: string }).separator as string}
                      step={typeof prop.step === "number" ? prop.step : undefined}
                    />
                  );
                }

                if (prop.type === "string" && prop.enum?.length) {
                  const options = prop.enum
                    .filter((value): value is string => typeof value === "string")
                    .map((value) => value.trim())
                    .filter(Boolean);
                  if (options.length > 0) {
                    if (
                      !hasUnsupportedXUiComponent &&
                      (xUiComponent === "AspectRatioPicker" ||
                        (!xUiComponent && normalizedFieldName(key) === "aspect_ratio"))
                    ) {
                      return (
                        <AspectRatioPicker
                          key={key}
                          fieldName={key}
                          label={labelWithHelp}
                          description={description}
                          error={err}
                          isRequired={isRequired}
                          options={options}
                          readOnly={isFieldReadOnly || options.length === 1}
                          defaultValue={prop.default}
                        />
                      );
                    }
                    if (
                      !hasUnsupportedXUiComponent &&
                      (!xUiComponent || xUiComponent === "BoxPicker")
                    ) {
                      return (
                        <BoxPicker
                          key={key}
                          fieldName={key}
                          label={labelWithHelp}
                          description={description}
                          error={err}
                          isRequired={isRequired}
                          options={options}
                          readOnly={isFieldReadOnly || options.length === 1}
                          defaultValue={prop.default}
                        />
                      );
                    }
                  }
                }

                if (
                  !hasUnsupportedXUiComponent &&
                  (!xUiComponent || xUiComponent === "NumberSlider") &&
                  (prop.type === "number" || prop.type === "integer") &&
                  typeof prop.minimum === "number" &&
                  typeof prop.maximum === "number"
                ) {
                  return (
                    <NumberSlider
                      key={key}
                      fieldName={key}
                      label={labelWithHelp}
                      description={description}
                      error={err}
                      isRequired={isRequired}
                      min={prop.minimum}
                      max={prop.maximum}
                      step={typeof prop.step === "number" && prop.step > 0 ? prop.step : 1}
                      readOnly={isFieldReadOnly || hasSingleEnumValue}
                      defaultValue={prop.default}
                    />
                  );
                }

                if (prop.type === "boolean") {
                  return (
                    <Switch
                      key={key}
                      label={labelWithHelp}
                      description={description}
                      checked={Boolean(form.values[key])}
                      onChange={(e) => form.setFieldValue(key, e.currentTarget.checked)}
                      disabled={isFieldReadOnly || hasSingleEnumValue}
                      error={err}
                      required={isRequired}
                    />
                  );
                }

                if (prop.enum?.length) {
                  const data = prop.enum.map((v) => {
                    const str = String(v);
                    return { value: str, label: str };
                  });
                  const enumValue = form.values[key];
                  const hasSingleOption = data.length === 1;
                  return (
                    <Select
                      key={key}
                      label={labelWithHelp}
                      description={description}
                      placeholder={prop["x-placeholder"] ?? "Select…"}
                      data={data}
                      searchable
                      clearable={!isRequired && !hasSingleOption}
                      required={isRequired}
                      disabled={isFieldReadOnly || hasSingleOption}
                      error={err}
                      value={
                        enumValue === undefined || enumValue === null ? null : String(enumValue)
                      }
                      onChange={(value) => form.setFieldValue(key, parseEnumValue(value, prop))}
                    />
                  );
                }

                if (prop.type === "array" && prop.items?.type === "string") {
                  const lines = Array.isArray(form.values[key])
                    ? (form.values[key] as string[]).join("\n")
                    : "";
                  return (
                    <Textarea
                      key={key}
                      label={labelWithHelp}
                      description={description}
                      placeholder={prop["x-placeholder"] ?? undefined}
                      value={lines}
                      onChange={(e) => {
                        const next = e.currentTarget.value
                          .split("\n")
                          .map((s) => s.trim())
                          .filter(Boolean);
                        form.setFieldValue(key, next);
                      }}
                      minRows={2}
                      required={isRequired}
                      disabled={isFieldReadOnly}
                      error={err}
                    />
                  );
                }

                if (prop.type === "number" || prop.type === "integer") {
                  return (
                    <NumberInput
                      key={key}
                      label={label}
                      description={description}
                      placeholder={prop["x-placeholder"]}
                      value={
                        typeof form.values[key] === "number" ? (form.values[key] as number) : null
                      }
                      onChange={(v) => form.setFieldValue(key, v)}
                      min={typeof prop.minimum === "number" ? prop.minimum : undefined}
                      max={typeof prop.maximum === "number" ? prop.maximum : undefined}
                      step={
                        typeof prop.step === "number"
                          ? prop.step
                          : prop.type === "integer"
                            ? 1
                            : undefined
                      }
                      required={isRequired}
                      disabled={isFieldReadOnly}
                      error={err}
                    />
                  );
                }

                const multiline = key === "prompt";

                if (multiline) {
                  const currentValue =
                    typeof form.values[key] === "string" ? (form.values[key] as string) : "";
                  const maxLength =
                    typeof prop.maxLength === "number"
                      ? prop.maxLength
                      : typeof prop.max === "number"
                        ? prop.max
                        : undefined;
                  const currentLength = currentValue.length;
                  const isMaxReached = typeof maxLength === "number" && currentLength >= maxLength;

                  const handlePromptLikeChange = (
                    event: React.ChangeEvent<HTMLTextAreaElement>
                  ) => {
                    const newValue = event.currentTarget.value;
                    if (typeof maxLength === "number" && newValue.length > maxLength) {
                      form.setFieldValue(key, newValue.slice(0, maxLength));
                      return;
                    }
                    form.setFieldValue(key, newValue);
                  };

                  return (
                    <Stack key={key} gap="sm">
                      {key === "prompt" && !isFieldReadOnly && (
                        <Group align="center" justify="space-between">
                          {buildLabelWithDescription(
                            label,
                            showDescriptionHelper ? prop.description : undefined,
                            isRequired
                          )}

                          <Group gap="xs">
                            <AgentPromptButton
                              generationType={generationType}
                              fieldName={key}
                              promptMaxLength={
                                typeof prop.max === "number" ? prop.max : prop.maxLength
                              }
                            />
                            <PromptActionButtons fieldName={key} fieldValue={currentValue} />
                          </Group>
                        </Group>
                      )}

                      <Textarea
                        label={key !== "prompt" ? labelWithHelp : undefined}
                        description={description}
                        placeholder={
                          key === "prompt" && !currentValue
                            ? "Generating your prompt..."
                            : (prop["x-placeholder"] ?? prop.placeholder)
                        }
                        minRows={key === "prompt" ? 4 : 2}
                        autosize
                        resize="vertical"
                        readOnly={isFieldReadOnly}
                        required={isRequired}
                        maxLength={maxLength}
                        error={
                          isMaxReached
                            ? `Maximum character limit of ${maxLength} reached`
                            : (err as string | undefined)
                        }
                        value={currentValue}
                        onChange={handlePromptLikeChange}
                        styles={
                          isFieldReadOnly
                            ? {
                                input: {
                                  backgroundColor: "#f8f9fa",
                                  color: "#6c757d",
                                  cursor: "not-allowed",
                                },
                              }
                            : undefined
                        }
                      />
                      {typeof maxLength === "number" && !isFieldReadOnly && (
                        <Text
                          size="xs"
                          c={isMaxReached ? "red" : "dimmed"}
                          style={{ textAlign: "right" }}
                        >
                          {currentLength}/{maxLength} characters
                          {isMaxReached && " (max reached)"}
                        </Text>
                      )}
                    </Stack>
                  );
                }

                return (
                  <TextInput
                    key={key}
                    label={labelWithHelp}
                    description={description}
                    placeholder={prop["x-placeholder"]}
                    required={isRequired}
                    error={err}
                    value={typeof form.values[key] === "string" ? (form.values[key] as string) : ""}
                    onChange={(e) => form.setFieldValue(key, e.currentTarget.value)}
                    disabled={isFieldReadOnly}
                  />
                );
              })}

              {form.errors["root"] && <Input.Error mt="xs">{form.errors["root"]}</Input.Error>}
            </Stack>
          </ScrollArea>
          <Box px="xs" pt="xs">
            <Button
              type="submit"
              variant="filled"
              size="md"
              fullWidth
              justify="space-between"
              loading={runLoading}
              rightSection={
                costLoading ? (
                  <Loader type="dots" color="gray.4" size="sm" />
                ) : latestCost != null ? (
                  <CostBadge cost={latestCost} size="sm" clickable={false} />
                ) : null
              }
            >
              Generate
            </Button>
          </Box>
        </form>
      </FormProvider>
      {isMobile && (
        <GenerationsHistoryModal
          title={selectedModel.model_name || "Run history"}
          opened={runHistoryModalOpened}
          onClose={closeRunHistoryModal}
        />
      )}
    </Box>
  );
}
