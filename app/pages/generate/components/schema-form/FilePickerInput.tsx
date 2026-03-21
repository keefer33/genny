import { Box, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useEffect } from "react";
import { useFormContext } from "~/lib/ContextForm";
import useAppStore from "~/lib/stores/appStore";
import { FilePickerPreview } from "./FilePickerPreview";

export function FilePickerInput({
  fieldName,
  fieldSchema,
  isRequired = false,
  fieldPrefix = "",
}: {
  fieldName: string;
  fieldSchema: any;
  isRequired?: boolean;
  fieldPrefix?: string;
}) {
  const form = useFormContext();
  const { themeColor } = useAppStore();
  const [_opened, { open }] = useDisclosure(false);
  const fullFieldName = fieldPrefix ? `${fieldPrefix}.${fieldName}` : fieldName;
  const pickerBorderColor = `var(--mantine-color-${themeColor}-6)`;

  const storeAsArray = fieldSchema.items?.type === "array";
  const rawValue = form.getInputProps(fullFieldName).value;
  const currentValue = storeAsArray
    ? Array.isArray(rawValue)
      ? rawValue[0]
      : typeof rawValue === "string"
        ? rawValue
        : ""
    : (rawValue ?? "");

  useEffect(() => {
    if (!storeAsArray) return;
    if (Array.isArray(rawValue)) return;
    form.setFieldValue(fullFieldName, rawValue ? [rawValue] : []);
  }, [storeAsArray, fullFieldName, form, rawValue]);

  const handleFileSelect = (fileUrl: string, _file?: any) => {
    form.setFieldValue(fullFieldName, storeAsArray ? (fileUrl ? [fileUrl] : []) : fileUrl);
  };

  const handleClear = () => {
    form.setFieldValue(fullFieldName, storeAsArray ? [] : "");
  };

  const allowedTypes =
    fieldSchema.types === "images" || fieldSchema.types === "videos" ? fieldSchema.types : "all";

  return (
    <>
      <Box
        key={form.key(fullFieldName)}
        p="sm"
        style={{
          border: `1px dotted ${pickerBorderColor}`,
          borderRadius: "var(--mantine-radius-md)",
        }}
      >
        <Stack gap="sm">
          <Text size="sm" fw={500}>
            {fieldSchema.title || fieldName}
            {isRequired && <span style={{ color: "red" }}> *</span>}
          </Text>

          <FilePickerPreview
            fileUrl={typeof currentValue === "string" ? currentValue : ""}
            placeholder={`Select ${fieldSchema.title || fieldName}`}
            onSelect={open}
            onClear={handleClear}
            onFileSelect={handleFileSelect}
            allowedTypes={allowedTypes}
            title={`Select ${fieldSchema.title || fieldName}`}
          />
        </Stack>
      </Box>
    </>
  );
}
