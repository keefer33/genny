import { Box, Button, Group, Stack, Text } from "@mantine/core";
import { useState } from "react";
import { useFormContext } from "~/lib/ContextForm";
import useAppStore from "~/lib/stores/appStore";
import type { StringArrayRendererProps } from "./schemaFormTypes";
import { StringArrayItem } from "./StringArrayItem";

export function StringArrayRenderer({
  fieldName,
  fieldSchema,
  isRequired = false,
  fieldPrefix = "",
}: StringArrayRendererProps) {
  const form = useFormContext();
  const { themeSettings } = useAppStore();
  const themeColor = themeSettings.themeColor;
  const fullFieldName = fieldPrefix ? `${fieldPrefix}.${fieldName}` : fieldName;
  const pickerBorderColor = `var(--mantine-color-${themeColor}-6)`;

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

  const [autoOpenIndex, setAutoOpenIndex] = useState<number | null>(null);

  const maxItems =
    fieldSchema.maxItems ||
    fieldSchema.maximum ||
    fieldSchema.maxItems ||
    (fieldSchema.items && fieldSchema.items.maxItems) ||
    null;

  const isFilePicker =
    fieldSchema.items?.display === "filePicker" || fieldSchema.display === "filePicker";

  const addItem = () => {
    if (maxItems && currentArray.length >= maxItems) {
      return;
    }

    const newIndex = currentArray.length;
    const newArray = [...currentArray, ""];

    const updatedValues = JSON.parse(JSON.stringify(form.values));
    setNestedValue(updatedValues, fullFieldName, newArray);
    form.setValues(updatedValues);

    if (isFilePicker) {
      setAutoOpenIndex(newIndex);
      setTimeout(() => {
        setAutoOpenIndex(null);
      }, 200);
    }
  };

  const removeItem = (index: number) => {
    const newArray = currentArray.filter((_: any, i: number) => i !== index);

    const updatedValues = JSON.parse(JSON.stringify(form.values));
    setNestedValue(updatedValues, fullFieldName, newArray);
    form.setValues(updatedValues);
  };

  const updateItem = (index: number, value: string) => {
    const newArray = [...currentArray];
    newArray[index] = value;

    const updatedValues = JSON.parse(JSON.stringify(form.values));
    setNestedValue(updatedValues, fullFieldName, newArray);
    form.setValues(updatedValues);
  };

  const content = (
    <Stack key={form.key(fullFieldName)} gap="sm">
      <Group justify="space-between" align="center">
        <Text size="sm" fw={500}>
          {fieldSchema.title || fieldName}
          {isRequired && <span style={{ color: "red" }}> *</span>}
        </Text>
        <Button
          size="xs"
          variant="light"
          onClick={addItem}
          disabled={maxItems ? currentArray.length >= maxItems : false}
        >
          + Add Item
          {maxItems && currentArray.length >= maxItems && " (Max reached)"}
        </Button>
      </Group>

      {maxItems && (
        <Text size="xs" c="dimmed">
          {currentArray.length} / {maxItems} items
        </Text>
      )}

      <Group gap="sm">
        {currentArray.map((item: string, index: number) => (
          <StringArrayItem
            key={index}
            item={item}
            index={index}
            fieldName={fieldName}
            fieldSchema={fieldSchema}
            updateItem={updateItem}
            removeItem={removeItem}
            autoOpen={autoOpenIndex === index}
          />
        ))}
      </Group>

      {currentArray.length === 0 && (
        <Text size="xs" c="dimmed" ta="center" py="md">
          No items added yet. Click &quot;Add Item&quot; to start.
        </Text>
      )}
    </Stack>
  );

  if (isFilePicker) {
    return (
      <Box
        key={`file-picker-array-${form.key(fullFieldName)}`}
        p="sm"
        style={{
          border: `1px dotted ${pickerBorderColor}`,
          borderRadius: "var(--mantine-radius-md)",
        }}
      >
        {content}
      </Box>
    );
  }

  return content;
}
