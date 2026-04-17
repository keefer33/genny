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
} from "@mantine/core";
import { useEffect, useMemo } from "react";
import { FormProvider, useForm } from "~/lib/ContextForm";
import { showNotification } from "~/lib/notificationUtils";
import usePlaygroundStore from "~/lib/stores/playgroundStore";
import { AgentPromptButton } from "../../../shared/AgentPromptButton";
import { PromptActionButtons } from "../../../shared/PromptActionButtons";
import { MediaFilePicker } from "./x-ui-components/MediaFilePicker/MediaFilePicker";
import { NumberSlider } from "./x-ui-components/NumberSlider";
import { SizePicker } from "./x-ui-components/SizePicker";
import { CostBadge } from "~/shared/CostBadge";
import type {
  FunctionSchema,
  StructuredXUiComponent,
  JsonSchemaProperty,
} from "~/types/playground";

function getStructuredXUiComponent(raw: unknown): StructuredXUiComponent | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const t = o.type;
  if (typeof t !== "string" || !t.trim()) return null;
  const settings = o.settings;
  const s =
    settings && typeof settings === "object" && !Array.isArray(settings)
      ? (settings as Record<string, unknown>)
      : {};
  return { type: t.trim(), settings: s };
}

function isValidNumberSliderSettings(
  s: Record<string, unknown>
): s is { min: number; max: number; step: number } {
  const { min, max, step } = s;
  return (
    typeof min === "number" &&
    Number.isFinite(min) &&
    typeof max === "number" &&
    Number.isFinite(max) &&
    typeof step === "number" &&
    Number.isFinite(step) &&
    step > 0
  );
}

function isValidSizePickerSettings(s: Record<string, unknown>): s is {
  min: number;
  max: number;
} {
  const { min, max } = s;
  return (
    typeof min === "number" &&
    Number.isFinite(min) &&
    typeof max === "number" &&
    Number.isFinite(max) &&
    max >= min
  );
}

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
    () => parseFunctionSchema(selectedModel?.function_schema),
    [selectedModel?.function_schema]
  );

  const form = useForm({
    initialValues: {} as Record<string, unknown>,
    validate: (values) => {
      const errors: Record<string, string> = {};
      const fs = parseFunctionSchema(selectedModel?.function_schema);
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
    const fs = parseFunctionSchema(selectedModel?.function_schema);
    const nextValues = fs?.properties ? buildInitialValues(fs) : {};

    // `initialize` only applies once per form instance in Mantine.
    // We need a hard reset whenever model/schema changes.
    form.setInitialValues(nextValues);
    form.setValues(nextValues);
    form.clearErrors();

    if (!fs?.properties) {
      return;
    }
  }, [selectedModel?.id, selectedModel?.function_schema]);

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
  const generationType: "image" | "video" =
    selectedModel.model_type === "video" ? "video" : "image";
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
                const description = prop.description;
                const err = form.errors[key];
                const xUi = getStructuredXUiComponent(prop["x-ui-component"]);

                if (xUi) {
                  switch (xUi.type) {
                    case "MediaFilePicker": {
                      return (
                        <MediaFilePicker
                          key={key}
                          fieldName={key}
                          fieldSchema={{
                            ...prop,
                            title: prop.title || label,
                          }}
                          description={description}
                          error={err}
                          isRequired={isRequired}
                        />
                      );
                    }
                    case "NumberSlider": {
                      if (prop.type !== "number" && prop.type !== "integer") break;
                      if (!isValidNumberSliderSettings(xUi.settings)) break;
                      const { min, max, step } = xUi.settings;
                      return (
                        <NumberSlider
                          key={key}
                          fieldName={key}
                          label={label}
                          description={description}
                          error={err}
                          isRequired={isRequired}
                          min={min}
                          max={max}
                          step={step}
                          readOnly={prop.readOnly}
                          defaultValue={prop.default}
                        />
                      );
                    }
                    case "SizePicker": {
                      if (prop.type !== "string") break;
                      if (!isValidSizePickerSettings(xUi.settings)) break;
                      const { min, max } = xUi.settings;
                      return (
                        <SizePicker
                          key={key}
                          fieldName={key}
                          label={label}
                          description={description}
                          error={err}
                          isRequired={isRequired}
                          min={min}
                          max={max}
                          readOnly={prop.readOnly}
                          defaultValue={prop.default}
                        />
                      );
                    }
                    default:
                      break;
                  }
                }

                if (prop.type === "boolean") {
                  return (
                    <Switch
                      key={key}
                      label={label}
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
                      label={label}
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
                      label={label}
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

                const multiline =
                  key === "prompt" ||
                  (prop.description !== undefined && prop.description.length > 80);

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
                          <Text size="sm" fw={500}>
                            {prop.title || key}
                            {isRequired && <span style={{ color: "red" }}> *</span>}
                          </Text>

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
                        label={key !== "prompt" ? label : undefined}
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
                    label={label}
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
