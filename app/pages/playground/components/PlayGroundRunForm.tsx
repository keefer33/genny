import {
  ActionIcon,
  Button,
  Input,
  NumberInput,
  Popover,
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
} from "@mantine/core";
import { RiInformationLine } from "@remixicon/react";
import { useEffect, useMemo } from "react";
import { FormProvider, useForm } from "~/lib/ContextForm";
import { showNotification } from "~/lib/notificationUtils";
import usePlaygroundStore from "~/lib/stores/playgroundStore";
import { AgentPromptButton } from "../../../shared/AgentPromptButton";
import { PromptActionButtons } from "../../../shared/PromptActionButtons";
import { MediaFilePicker } from "./x-ui-components/MediaFilePicker/MediaFilePicker";
import { NumberSlider } from "./x-ui-components/NumberSlider";
import { SizePicker } from "./x-ui-components/SizePicker";
import { BoxPicker } from "./x-ui-components/BoxPicker";
import { AspectRatioPicker } from "./x-ui-components/AspectRatioPicker";
import { CostBadge } from "~/shared/CostBadge";
import type { FunctionSchema, JsonSchemaProperty } from "~/types/playground";

function parseFunctionSchema(raw: unknown): FunctionSchema | null {
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

function orderedPropertyKeys(schema: FunctionSchema): string[] {
  const props = schema.properties ?? {};
  const order = schema["x-order-properties"] ?? [];
  const ordered = order.filter((k) => k in props);
  const rest = Object.keys(props).filter((k) => !ordered.includes(k));
  return [...ordered, ...rest];
}

function getInitialValue(prop: JsonSchemaProperty): unknown {
  if (prop.default !== undefined) return prop.default;
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

function buildInitialValues(schema: FunctionSchema): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of orderedPropertyKeys(schema)) {
    const prop = schema.properties![key];
    if (!prop) continue;
    out[key] = getInitialValue(prop);
  }
  return out;
}

function fieldLabel(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const DESCRIPTION_HELPER_DISABLED_FIELDS = new Set([
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

function buildLabelWithDescription(label: string, description?: string, required?: boolean) {
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

function parseEnumValue(raw: string | null, prop: JsonSchemaProperty): unknown {
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

function sanitizePayload(values: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    if (value == null) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    if (Array.isArray(value) && value.length === 0) continue;
    out[key] = value;
  }
  return out;
}

function normalizedFieldName(name: string): string {
  return name.trim().toLowerCase();
}

function isMediaFieldName(
  name: string
): name is
  | "image"
  | "images"
  | "video"
  | "videos"
  | "last_image"
  | "reference_images"
  | "reference_videos"
  | "audio"
  | "reference_audios" {
  const normalized = normalizedFieldName(name);
  return (
    normalized === "image" ||
    normalized === "images" ||
    normalized === "video" ||
    normalized === "videos" ||
    normalized === "last_image" ||
    normalized === "reference_images" ||
    normalized === "reference_videos" ||
    normalized === "audio" ||
    normalized === "reference_audios"
  );
}

function resolveMediaPickerSettings(
  key: string,
  prop: JsonSchemaProperty
): { min: number; max: number; allowed_file_types: Array<"image" | "video" | "audio"> } {
  const normalized = normalizedFieldName(key);
  const allowed_file_types: Array<"image" | "video" | "audio"> =
    normalized === "image" ||
    normalized === "images" ||
    normalized === "last_image" ||
    normalized === "reference_images"
      ? ["image"]
      : normalized === "audio" || normalized === "reference_audios"
        ? ["audio"]
        : ["video"];

  const minCandidate =
    typeof prop.minItems === "number"
      ? prop.minItems
      : typeof prop.minimum === "number"
        ? prop.minimum
        : null;
  const maxCandidate =
    typeof prop.maxItems === "number"
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

export default function PlayGroundRunForm() {
  const {
    selectedModel,
    runPlaygroundModel,
    runLoading,
    calculatePlaygroundRunCost,
    costLoading,
    latestCost,
  } = usePlaygroundStore();

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

  useEffect(() => {
    const fs = parseFunctionSchema(selectedModel?.gen_models_apis?.function_schema);
    const nextValues = fs?.properties ? buildInitialValues(fs) : {};

    // `initialize` only applies once per form instance in Mantine.
    // We need a hard reset whenever model/schema changes.
    form.setInitialValues(nextValues);
    form.setValues(nextValues);
    form.clearErrors();

    if (!fs?.properties) {
      return;
    }
  }, [selectedModel?.id, selectedModel?.gen_models_apis?.function_schema]);

  useEffect(() => {
    if (!selectedModel?.id) return;
    const timeoutId = setTimeout(() => {
      void calculatePlaygroundRunCost({
        modelId: selectedModel.id,
        payload: sanitizePayload(form.values as Record<string, unknown>),
      }).catch(() => undefined);
    }, 250);
    return () => clearTimeout(timeoutId);
  }, [selectedModel?.id, form.values, calculatePlaygroundRunCost]);

  if (!selectedModel) {
    return (
      <Stack gap="xs" p="md">
        <Text fw={700}>Playground Run</Text>
        <Text c="dimmed" size="sm">
          No model selected.
        </Text>
      </Stack>
    );
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
      await runPlaygroundModel({
        id: selectedModel.id,
        payload: sanitizePayload(values),
      });
      showNotification({
        title: "Success",
        message: "Generation started successfully",
        type: "success",
      });
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

                if (isMediaFieldName(key)) {
                  const mediaSettings = resolveMediaPickerSettings(key, prop);
                  return (
                    <MediaFilePicker
                      key={key}
                      fieldName={key}
                      fieldSchema={{
                        ...prop,
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

                if (normalizedFieldName(key) === "size") {
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
                      readOnly={prop.readOnly}
                      defaultValue={prop.default}
                    />
                  );
                }

                if (prop.type === "string" && prop.enum?.length) {
                  const options = prop.enum
                    .filter((value): value is string => typeof value === "string")
                    .map((value) => value.trim())
                    .filter(Boolean);
                  if (options.length > 0) {
                    if (normalizedFieldName(key) === "aspect_ratio") {
                      return (
                        <AspectRatioPicker
                          key={key}
                          fieldName={key}
                          label={labelWithHelp}
                          description={description}
                          error={err}
                          isRequired={isRequired}
                          options={options}
                          readOnly={prop.readOnly}
                          defaultValue={prop.default}
                        />
                      );
                    }
                    return (
                      <BoxPicker
                        key={key}
                        fieldName={key}
                        label={labelWithHelp}
                        description={description}
                        error={err}
                        isRequired={isRequired}
                        options={options}
                        readOnly={prop.readOnly}
                        defaultValue={prop.default}
                      />
                    );
                  }
                }

                if (
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
                      readOnly={prop.readOnly}
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
                  return (
                    <Select
                      key={key}
                      label={labelWithHelp}
                      description={description}
                      placeholder={prop["x-placeholder"] ?? "Select…"}
                      data={data}
                      searchable
                      clearable={!isRequired}
                      required={isRequired}
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
                      {key === "prompt" && !prop.readOnly && (
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
                        readOnly={prop.readOnly}
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
                          prop.readOnly
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
                      {typeof maxLength === "number" && !prop.readOnly && (
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
                  />
                );
              })}

              {form.errors["root"] && <Input.Error mt="xs">{form.errors["root"]}</Input.Error>}
            </Stack>
          </ScrollArea>
          <Box px="xs">
            <Button
              type="submit"
              fullWidth
              loading={runLoading}
              rightSection={
                costLoading ? (
                  <Loader type="dots" color="gray.4" size="sm" />
                ) : latestCost != null ? (
                  <CostBadge cost={latestCost} size="sm" clickable={false} />
                ) : null
              }
            >
              Run
            </Button>
          </Box>
        </form>
      </FormProvider>
    </Box>
  );
}
