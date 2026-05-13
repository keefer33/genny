import {
  Group,
  NumberInput,
  Select,
  Stack,
  Switch,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import type { ChangeEvent, ReactNode } from "react";
import { useFormContext } from "~/lib/ContextForm";
import type { JsonSchemaProperty } from "~/types/generations";
import { AgentPromptButton } from "../../../shared/AgentPromptButton";
import { PromptActionButtons } from "../../../shared/PromptActionButtons";
import { MediaFilePicker } from "./x-ui-components/MediaFilePicker/MediaFilePicker";
import { NumberSlider } from "./x-ui-components/NumberSlider";
import { SizePicker } from "./x-ui-components/SizePicker";
import { BoxPicker } from "./x-ui-components/BoxPicker";
import { AspectRatioPicker } from "./x-ui-components/AspectRatioPicker";
import { SchemaObjectArrayField } from "./SchemaObjectArrayField";
import {
  buildLabelWithDescription,
  buildMediaFieldSchemaForPicker,
  DESCRIPTION_HELPER_DISABLED_FIELDS,
  fieldLabel,
  getFormValueAtPath,
  hasUnsupportedXUiComponent,
  isBareStringSelectXUi,
  isMediaFieldName,
  joinFieldPath,
  normalizedFieldName,
  orderedObjectPropertyKeys,
  parseEnumValue,
  resolveXUiComponent,
} from "./ModelSchemaForm.utils";

export type SchemaNestedFieldsProps = {
  pathPrefix: string;
  objectSchema: JsonSchemaProperty & { properties: Record<string, JsonSchemaProperty> };
  readOnly: boolean;
  generationType: "image" | "video" | "audio";
  conditionDisabledFields: Set<string>;
  /**
   * When false, required fields do not show a red * in labels (inputs still use `required`).
   * Array-of-object rows use false to match legacy row UX.
   */
  showRequiredStarInLabel?: boolean;
};

export function SchemaNestedFields({
  pathPrefix,
  objectSchema,
  readOnly: readOnlyFromParent,
  generationType,
  conditionDisabledFields,
  showRequiredStarInLabel = true,
}: SchemaNestedFieldsProps) {
  const form = useFormContext();
  const requiredSet = new Set(objectSchema.required ?? []);
  const keys = orderedObjectPropertyKeys(objectSchema);

  return (
    <>
      {keys.map((key) => {
        const prop = objectSchema.properties[key];
        if (!prop) return null;

        const fieldPath = joinFieldPath(pathPrefix, key);
        const isRequired = requiredSet.has(key);
        const label = fieldLabel(key);
        const showDescriptionHelper = !DESCRIPTION_HELPER_DISABLED_FIELDS.has(
          normalizedFieldName(key)
        );
        const labelWithHelp = buildLabelWithDescription(
          label,
          showDescriptionHelper ? prop.description : undefined,
          showRequiredStarInLabel ? isRequired : false
        );
        const description = undefined;
        const err = form.errors[fieldPath] as string | undefined;
        const hasSingleEnumValue = prop.enum?.length === 1;
        const isConditionDisabled =
          conditionDisabledFields.has(fieldPath) || conditionDisabledFields.has(key);
        const isFieldReadOnly = prop.readOnly || isConditionDisabled || readOnlyFromParent;
        const xUiComponent = resolveXUiComponent(prop);
        /** Mantine adds its own * when `required` is set; turn off only when our label already has one. */
        const inputWithAsterisk = showRequiredStarInLabel && isRequired ? false : undefined;

        if (
          !hasUnsupportedXUiComponent(prop) &&
          (xUiComponent === "MediaFilePicker" || (!xUiComponent && isMediaFieldName(key)))
        ) {
          return (
            <MediaFilePicker
              key={fieldPath}
              fieldName={fieldPath}
              fieldSchema={buildMediaFieldSchemaForPicker(key, prop, isFieldReadOnly, label)}
              description={description}
              error={err}
              isRequired={isRequired}
            />
          );
        }

        if (
          !hasUnsupportedXUiComponent(prop) &&
          !prop.enum &&
          (xUiComponent === "SizePicker" || (!xUiComponent && normalizedFieldName(key) === "size"))
        ) {
          return (
            <SizePicker
              key={fieldPath}
              fieldName={fieldPath}
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
              withAsterisk={inputWithAsterisk}
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
              !hasUnsupportedXUiComponent(prop) &&
              !isBareStringSelectXUi(prop) &&
              (xUiComponent === "AspectRatioPicker" ||
                (!xUiComponent && normalizedFieldName(key) === "aspect_ratio"))
            ) {
              return (
                <AspectRatioPicker
                  key={fieldPath}
                  fieldName={fieldPath}
                  label={labelWithHelp}
                  description={description}
                  error={err}
                  isRequired={isRequired}
                  options={options}
                  readOnly={isFieldReadOnly || options.length === 1}
                  defaultValue={prop.default}
                  withAsterisk={inputWithAsterisk}
                />
              );
            }
            if (
              !hasUnsupportedXUiComponent(prop) &&
              !isBareStringSelectXUi(prop) &&
              (!xUiComponent || xUiComponent === "BoxPicker")
            ) {
              return (
                <BoxPicker
                  key={fieldPath}
                  fieldName={fieldPath}
                  label={labelWithHelp}
                  description={description}
                  error={err}
                  isRequired={isRequired}
                  options={options}
                  readOnly={isFieldReadOnly || options.length === 1}
                  defaultValue={prop.default}
                  withAsterisk={inputWithAsterisk}
                />
              );
            }
          }
        }

        if (
          !hasUnsupportedXUiComponent(prop) &&
          (!xUiComponent || xUiComponent === "NumberSlider") &&
          (prop.type === "number" || prop.type === "integer") &&
          typeof prop.minimum === "number" &&
          typeof prop.maximum === "number"
        ) {
          return (
            <NumberSlider
              key={fieldPath}
              fieldName={fieldPath}
              label={labelWithHelp}
              description={description}
              error={err}
              isRequired={isRequired}
              min={prop.minimum}
              max={prop.maximum}
              step={typeof prop.step === "number" && prop.step > 0 ? prop.step : 1}
              readOnly={isFieldReadOnly || hasSingleEnumValue}
              defaultValue={prop.default}
              withAsterisk={inputWithAsterisk}
            />
          );
        }

        if (prop.type === "boolean") {
          return (
            <Switch
              key={fieldPath}
              label={labelWithHelp}
              description={description}
              checked={Boolean(getFormValueAtPath(form.values, fieldPath))}
              onChange={(e) => form.setFieldValue(fieldPath, e.currentTarget.checked)}
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
          const enumValue = getFormValueAtPath(form.values, fieldPath);
          const hasSingleOption = data.length === 1;
          return (
            <Select
              key={fieldPath}
              label={labelWithHelp}
              description={description}
              placeholder={prop["x-placeholder"] ?? "Select…"}
              data={data}
              searchable
              clearable={!isRequired && !hasSingleOption}
              required={isRequired}
              disabled={isFieldReadOnly || hasSingleOption}
              error={err}
              value={enumValue === undefined || enumValue === null ? null : String(enumValue)}
              onChange={(value) => form.setFieldValue(fieldPath, parseEnumValue(value, prop))}
              withAsterisk={inputWithAsterisk}
            />
          );
        }

        if (prop.type === "object" && prop.properties) {
          const sectionTitle = label;
          const sectionDescription = prop.description;
          const objectDepth = fieldPath.split(".").filter(Boolean).length;
          const showObjectChrome = objectDepth >= 2;

          return (
            <Stack
              key={fieldPath}
              gap="xs"
              // pl={showObjectChrome ? Math.min(objectDepth, 6) * 10 : 0}
            >
              {showObjectChrome ? (
                <Stack gap="xs">
                  <Text size="xl" fw={600}>
                    {sectionTitle}
                    {isRequired && showRequiredStarInLabel ? (
                      <Text component="span" c="red" size="sm">
                        {" "}
                        *
                      </Text>
                    ) : null}
                  </Text>
                  {sectionDescription ? (
                    <Text size="xs" c="dimmed">
                      {sectionDescription}
                    </Text>
                  ) : null}
                </Stack>
              ) : null}

              <Stack gap="xl">
                <SchemaNestedFields
                  pathPrefix={fieldPath}
                  objectSchema={
                    prop as JsonSchemaProperty & {
                      properties: Record<string, JsonSchemaProperty>;
                    }
                  }
                  readOnly={isFieldReadOnly}
                  generationType={generationType}
                  conditionDisabledFields={conditionDisabledFields}
                  showRequiredStarInLabel={showRequiredStarInLabel}
                />
              </Stack>
            </Stack>
          );
        }

        if (prop.type === "array" && prop.items?.type === "object" && prop.items.properties) {
          return (
            <SchemaObjectArrayField
              key={fieldPath}
              arrayKey={fieldPath}
              prop={prop}
              labelWithHelp={labelWithHelp as ReactNode}
              description={description}
              isRequired={isRequired}
              readOnly={isFieldReadOnly}
              generationType={generationType}
              conditionDisabledFields={conditionDisabledFields}
              showRequiredStarInLabel={showRequiredStarInLabel}
            />
          );
        }

        if (prop.type === "array" && prop.items?.type === "string") {
          if (
            !hasUnsupportedXUiComponent(prop) &&
            (resolveXUiComponent(prop) === "MediaFilePicker" || isMediaFieldName(key))
          ) {
            return (
              <MediaFilePicker
                key={fieldPath}
                fieldName={fieldPath}
                fieldSchema={buildMediaFieldSchemaForPicker(key, prop, isFieldReadOnly, label)}
                description={description}
                error={err}
                isRequired={isRequired}
              />
            );
          }
          const rawArr = getFormValueAtPath(form.values, fieldPath);
          const lines = Array.isArray(rawArr) ? (rawArr as string[]).join("\n") : "";
          return (
            <Textarea
              key={fieldPath}
              label={labelWithHelp}
              description={description}
              placeholder={prop["x-placeholder"] ?? undefined}
              value={lines}
              onChange={(e) => {
                const next = e.currentTarget.value
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean);
                form.setFieldValue(fieldPath, next);
              }}
              minRows={2}
              required={isRequired}
              disabled={isFieldReadOnly}
              error={err}
              withAsterisk={inputWithAsterisk}
            />
          );
        }

        if (prop.type === "number" || prop.type === "integer") {
          const numVal = getFormValueAtPath(form.values, fieldPath);
          return (
            <NumberInput
              key={fieldPath}
              label={labelWithHelp}
              description={description}
              placeholder={prop["x-placeholder"]}
              value={typeof numVal === "number" ? numVal : null}
              onChange={(v) => form.setFieldValue(fieldPath, v)}
              min={typeof prop.minimum === "number" ? prop.minimum : undefined}
              max={typeof prop.maximum === "number" ? prop.maximum : undefined}
              step={
                typeof prop.step === "number" ? prop.step : prop.type === "integer" ? 1 : undefined
              }
              required={isRequired}
              disabled={isFieldReadOnly}
              error={err}
              withAsterisk={inputWithAsterisk}
            />
          );
        }

        const multiline = key === "prompt";
        if (multiline) {
          const currentValue =
            typeof getFormValueAtPath(form.values, fieldPath) === "string"
              ? (getFormValueAtPath(form.values, fieldPath) as string)
              : "";
          const maxLength =
            typeof prop.maxLength === "number"
              ? prop.maxLength
              : typeof prop.max === "number"
                ? prop.max
                : undefined;
          const currentLength = currentValue.length;
          const isMaxReached = typeof maxLength === "number" && currentLength >= maxLength;

          const handlePromptLikeChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
            const newValue = event.currentTarget.value;
            if (typeof maxLength === "number" && newValue.length > maxLength) {
              form.setFieldValue(fieldPath, newValue.slice(0, maxLength));
              return;
            }
            form.setFieldValue(fieldPath, newValue);
          };

          const showPromptToolbar = key === "prompt" && !isFieldReadOnly;

          return (
            <Stack key={fieldPath} gap="sm">
              {showPromptToolbar ? (
                <Group align="center" justify="space-between">
                  {buildLabelWithDescription(
                    label,
                    showDescriptionHelper ? prop.description : undefined,
                    showRequiredStarInLabel ? isRequired : false
                  )}

                  <Group gap="xs">
                    <AgentPromptButton
                      generationType={generationType}
                      fieldName={fieldPath}
                      promptMaxLength={typeof prop.max === "number" ? prop.max : prop.maxLength}
                    />
                    <PromptActionButtons fieldName={fieldPath} fieldValue={currentValue} />
                  </Group>
                </Group>
              ) : null}

              <Textarea
                label={showPromptToolbar ? undefined : labelWithHelp}
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
                withAsterisk={showPromptToolbar ? false : inputWithAsterisk}
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
                <Text size="xs" c={isMaxReached ? "red" : "dimmed"} style={{ textAlign: "right" }}>
                  {currentLength}/{maxLength} characters
                  {isMaxReached && " (max reached)"}
                </Text>
              )}
            </Stack>
          );
        }

        const strVal =
          typeof getFormValueAtPath(form.values, fieldPath) === "string"
            ? (getFormValueAtPath(form.values, fieldPath) as string)
            : "";
        return (
          <TextInput
            key={fieldPath}
            label={labelWithHelp}
            description={description}
            placeholder={prop["x-placeholder"]}
            required={isRequired}
            error={err}
            value={strVal}
            onChange={(e) => form.setFieldValue(fieldPath, e.currentTarget.value)}
            disabled={isFieldReadOnly}
            withAsterisk={inputWithAsterisk}
          />
        );
      })}
    </>
  );
}
