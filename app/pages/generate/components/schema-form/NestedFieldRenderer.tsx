import {
  ActionIcon,
  Box,
  Button,
  Group,
  NumberInput,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import { useEffect } from "react";
import type React from "react";
import { useFormContext } from "~/lib/ContextForm";
import { AgentPromptButton } from "../AgentPromptButton";
import { FilePickerInput } from "./FilePickerInput";
import { PromptActionButtons } from "./PromptActionButtons";
import { SelectableBoxesRenderer } from "./SelectableBoxesRenderer";
import { SelectableIntegerBoxesRenderer } from "./SelectableIntegerBoxesRenderer";
import { StringArrayRenderer } from "./StringArrayRenderer";
import type { NestedFieldRendererProps, ObjectArrayRendererProps } from "./schemaFormTypes";
import { UserGenerationsPickerInput } from "./UserGenerationsPickerInput";

/** Object array UI; nested fields use {@link NestedFieldRenderer} (mutual recursion). */
function ObjectArrayRenderer({
  fieldName,
  fieldSchema,
  fieldPrefix = "",
  generationType = "image",
}: ObjectArrayRendererProps) {
  const form = useFormContext();
  const fullFieldName = fieldPrefix ? `${fieldPrefix}.${fieldName}` : fieldName;

  const getNestedValue = (obj: any, path: string) => {
    return path.split(".").reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  };

  const setNestedValue = (obj: any, path: string, value: any) => {
    const keys = path.split(".");
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]] || typeof current[keys[i]] !== "object") {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
  };

  const currentArray = getNestedValue(form.values, fullFieldName) || [];

  const addItem = () => {
    const newItem: Record<string, any> = {};
    if (fieldSchema.items && fieldSchema.items.properties) {
      Object.entries(fieldSchema.items.properties).forEach(
        ([propName, propSchema]: [string, any]) => {
          switch (propSchema.type) {
            case "string":
              newItem[propName] = "";
              break;
            case "number":
            case "integer":
              newItem[propName] = propSchema.minimum || 0;
              break;
            case "boolean":
              newItem[propName] = false;
              break;
            case "array":
              newItem[propName] = [];
              break;
            case "object":
              newItem[propName] = {};
              break;
            default:
              newItem[propName] = "";
          }
        }
      );
    }

    const newArray = [...currentArray, newItem];

    const updatedValues = JSON.parse(JSON.stringify(form.values));
    setNestedValue(updatedValues, fullFieldName, newArray);
    form.setValues(updatedValues);
  };

  const removeItem = (index: number) => {
    const newArray = currentArray.filter((_: any, i: number) => i !== index);

    const updatedValues = JSON.parse(JSON.stringify(form.values));
    setNestedValue(updatedValues, fullFieldName, newArray);
    form.setValues(updatedValues);
  };

  return (
    <Stack key={form.key(fullFieldName)} gap="sm">
      <Group justify="space-between" align="center">
        <Text size="sm" fw={500}>
          {fieldSchema.title || fieldName}
        </Text>
        <Button size="xs" variant="light" onClick={addItem}>
          + Add Item
        </Button>
      </Group>

      {currentArray.map((item: any, index: number) => (
        <Stack
          key={index}
          gap="sm"
          p="md"
          style={{ border: "1px solid #e9ecef", borderRadius: "4px" }}
        >
          <Group justify="space-between" align="center">
            <Text size="xs" fw={500} c="dimmed">
              Item {index + 1}
            </Text>
            <ActionIcon size="sm" variant="light" color="red" onClick={() => removeItem(index)}>
              ×
            </ActionIcon>
          </Group>

          {fieldSchema.items && fieldSchema.items.properties && (
            <NestedFieldRenderer
              properties={fieldSchema.items.properties}
              required={fieldSchema.items.required || []}
              fieldPrefix={`${fullFieldName}.${index}`}
            />
          )}
        </Stack>
      ))}

      {currentArray.length === 0 && (
        <Text size="xs" c="dimmed" ta="center" py="md">
          No items added yet. Click &quot;Add Item&quot; to start.
        </Text>
      )}
    </Stack>
  );
}

export function NestedFieldRenderer({
  properties,
  required,
  fieldPrefix = "",
  generationType = "image",
}: NestedFieldRendererProps) {
  const form = useFormContext();

  const getNestedValue = (obj: any, path: string) => {
    if (!path) return undefined;
    return path.split(".").reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  };

  const resolveRuleFieldPath = (ruleField: string, currentFieldPath: string) => {
    if (!ruleField) return "";
    if (ruleField.includes(".")) return ruleField;

    const pathParts = currentFieldPath.split(".");
    pathParts.pop();

    return pathParts.length > 0 ? `${pathParts.join(".")}.${ruleField}` : ruleField;
  };

  const shouldShowField = (currentFieldPath: string, fieldSchema: any) => {
    const showRules = fieldSchema?.show;
    if (!Array.isArray(showRules) || showRules.length === 0) {
      return true;
    }

    return showRules.some((rule: any) => {
      const ruleField = typeof rule?.field === "string" ? rule.field.trim() : "";
      if (!ruleField) return false;

      const rulePath = resolveRuleFieldPath(ruleField, currentFieldPath);
      const ruleFieldValue = getNestedValue(form.values, rulePath);

      if (Array.isArray(rule?.values) && rule.values.length > 0) {
        return rule.values.includes(ruleFieldValue);
      }

      if (Object.prototype.hasOwnProperty.call(rule || {}, "value")) {
        return ruleFieldValue === rule.value;
      }

      return Boolean(ruleFieldValue);
    });
  };

  const normalizeEnumData = (enumData: any[]) => {
    if (!Array.isArray(enumData)) return [];

    const normalizedData = enumData.map((item) => {
      if (typeof item === "object" && item !== null && "value" in item) {
        return item;
      }
      return {
        value: String(item),
        label: String(item),
      };
    });

    const uniqueData = normalizedData.filter(
      (item, index, self) => self.findIndex((other) => other.value === item.value) === index
    );

    return uniqueData;
  };

  const ensureParentObjects = (fieldName: string) => {
    const keys = fieldName.split(".");
    if (keys.length <= 1) return;

    const currentValues = { ...form.values };
    let current = currentValues;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]] || typeof current[keys[i]] !== "object") {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    if (JSON.stringify(currentValues) !== JSON.stringify(form.values)) {
      form.setValues(currentValues);
    }
  };

  useEffect(() => {
    Object.entries(properties).forEach(([fieldName, _fieldSchema]) => {
      const fullFieldName = fieldPrefix ? `${fieldPrefix}.${fieldName}` : fieldName;
      ensureParentObjects(fullFieldName);
    });
  }, [properties, fieldPrefix, form]);

  const renderField = (fieldName: string, fieldSchema: any, isRequired: boolean) => {
    const fullFieldName = fieldPrefix ? `${fieldPrefix}.${fieldName}` : fieldName;

    if (!shouldShowField(fullFieldName, fieldSchema)) {
      return null;
    }

    if (fieldSchema.readOnly === true) {
      return null;
    }

    switch (fieldSchema.type) {
      case "object":
        return (
          <Stack key={form.key(fullFieldName)} gap="xl">
            {fieldSchema.properties && (
              <NestedFieldRenderer
                properties={fieldSchema.properties}
                required={fieldSchema.required || []}
                fieldPrefix={fullFieldName}
                generationType={generationType}
              />
            )}
          </Stack>
        );

      case "array":
        if (fieldSchema.items && fieldSchema.items.type === "object") {
          return (
            <ObjectArrayRenderer
              fieldName={fieldName}
              fieldSchema={fieldSchema}
              fieldPrefix={fieldPrefix}
              generationType={generationType}
            />
          );
        } else if (fieldSchema.items && fieldSchema.items.enum) {
          const selectData = Array.isArray(fieldSchema.items.enum) ? fieldSchema.items.enum : [];
          const finalData = normalizeEnumData(selectData);

          return (
            <Select
              key={form.key(fullFieldName)}
              label={fieldSchema.title || fieldName}
              placeholder={fieldSchema.placeholder}
              required={isRequired}
              {...form.getInputProps(fullFieldName)}
              data={finalData}
              multiple
            />
          );
        } else {
          return (
            <StringArrayRenderer
              fieldName={fieldName}
              fieldSchema={fieldSchema}
              isRequired={isRequired}
              fieldPrefix={fieldPrefix}
            />
          );
        }

      case "string":
        if (fieldSchema.display === "user_generations") {
          return (
            <UserGenerationsPickerInput
              fieldName={fieldName}
              fieldSchema={fieldSchema}
              isRequired={isRequired}
              fieldPrefix={fieldPrefix}
            />
          );
        }

        if (fieldSchema.display === "filePicker") {
          return (
            <FilePickerInput
              fieldName={fieldName}
              fieldSchema={fieldSchema}
              isRequired={isRequired}
              fieldPrefix={fieldPrefix}
            />
          );
        }

        if (fieldSchema.enum) {
          if (fieldSchema.display === "boxes") {
            return (
              <SelectableBoxesRenderer
                fieldName={fieldName}
                fieldSchema={fieldSchema}
                isRequired={isRequired}
                fieldPrefix={fieldPrefix}
              />
            );
          }

          const selectData = Array.isArray(fieldSchema.enum) ? fieldSchema.enum : [];
          const finalData = normalizeEnumData(selectData);

          return (
            <Select
              key={form.key(fullFieldName)}
              label={fieldSchema.title || fieldName}
              placeholder={fieldSchema.placeholder || `Select ${fieldName}`}
              required={isRequired}
              {...form.getInputProps(fullFieldName)}
              data={finalData}
              disabled={fieldSchema.readOnly}
            />
          );
        } else {
          const inputProps = form.getInputProps(fullFieldName);
          const currentValue = inputProps.value || "";
          const maxLength = fieldSchema.maxLength || fieldSchema.max;
          const currentLength = currentValue.length;
          const isMaxReached = maxLength && currentLength >= maxLength;

          const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
            const newValue = event.currentTarget.value;
            if (maxLength && newValue.length > maxLength) {
              const truncatedValue = newValue.slice(0, maxLength);
              form.setFieldValue(fullFieldName, truncatedValue);
            } else {
              inputProps.onChange?.(event);
            }
          };

          return (
            <Stack key={form.key(fullFieldName)} gap="sm">
              {fieldName === "prompt" && !fieldSchema.readOnly && (
                <Group align="center" justify="space-between">
                  <Box>
                    <Text size="sm" fw={500}>
                      {fieldSchema.title || fieldName}
                      {isRequired && <span style={{ color: "red" }}> *</span>}
                    </Text>
                  </Box>

                  <Group gap="xs">
                    <AgentPromptButton
                      generationType={generationType}
                      fieldName={fullFieldName}
                      promptMaxLength={
                        typeof fieldSchema.max === "number" ? fieldSchema.max : undefined
                      }
                    />

                    <PromptActionButtons fieldName={fullFieldName} fieldValue={currentValue} />
                  </Group>
                </Group>
              )}
              <Textarea
                label={fieldName !== "prompt" ? fieldSchema.title || fieldName : undefined}
                placeholder={
                  fieldName === "prompt" && !currentValue
                    ? "Generating your prompt..."
                    : fieldSchema.placeholder
                }
                required={isRequired}
                value={currentValue}
                onChange={handleChange}
                minRows={fieldName === "prompt" ? 4 : 1}
                autosize
                resize="vertical"
                readOnly={fieldSchema.readOnly}
                maxLength={maxLength}
                error={isMaxReached ? `Maximum character limit of ${maxLength} reached` : undefined}
                styles={
                  fieldSchema.readOnly
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
              {maxLength && !fieldSchema.readOnly && (
                <Text size="xs" c={isMaxReached ? "red" : "dimmed"} style={{ textAlign: "right" }}>
                  {currentLength}/{maxLength} characters
                  {isMaxReached && " (max reached)"}
                </Text>
              )}
            </Stack>
          );
        }

      case "number":
      case "integer":
        if (
          fieldSchema.display === "boxes" &&
          (fieldSchema.enum?.length || fieldSchema.conditions)
        ) {
          return (
            <SelectableIntegerBoxesRenderer
              fieldName={fieldName}
              fieldSchema={fieldSchema}
              isRequired={isRequired}
              fieldPrefix={fieldPrefix}
            />
          );
        }

        return (
          <NumberInput
            key={form.key(fullFieldName)}
            label={fieldSchema.title || fieldName}
            placeholder={fieldSchema.placeholder}
            required={isRequired}
            {...form.getInputProps(fullFieldName)}
            min={fieldSchema.minimum}
            max={fieldSchema.maximum}
            step={fieldSchema.step || fieldSchema.multipleOf || 1}
          />
        );

      case "boolean": {
        const inputProps = form.getInputProps(fullFieldName);
        return (
          <Switch
            key={form.key(fullFieldName)}
            label={fieldSchema.title || fieldName}
            checked={inputProps.value || false}
            onChange={inputProps.onChange}
            error={inputProps.error}
          />
        );
      }

      default:
        return (
          <TextInput
            key={form.key(fullFieldName)}
            label={fieldSchema.title || fieldName}
            placeholder={fieldSchema.placeholder}
            required={isRequired}
            {...form.getInputProps(fullFieldName)}
          />
        );
    }
  };

  return (
    <>
      {Object.entries(properties).map(([fieldName, fieldSchema]) => {
        const field = fieldSchema as any;
        const isRequired = required.includes(fieldName);
        const renderedField = renderField(fieldName, field, isRequired);
        if (!renderedField) return null;
        return <div key={fieldName}>{renderedField}</div>;
      })}
    </>
  );
}
