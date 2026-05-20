import { Button, Group, Input } from "@mantine/core";
import { useFormContext } from "~/lib/ContextForm";
import type { BoxPickerProps, BoxPickerValueType } from "~/types/generations";
import { getFormValueAtPath, schemaValuesEqual } from "../ModelSchemaForm.utils";

function resolveBoxPickerSelection(
  formValue: unknown,
  defaultValue: unknown,
  valueType: BoxPickerValueType
): string | number | null {
  if (valueType === "number" || valueType === "integer") {
    if (typeof formValue === "number" && Number.isFinite(formValue)) return formValue;
    if (typeof defaultValue === "number" && Number.isFinite(defaultValue)) return defaultValue;
    return null;
  }
  if (typeof formValue === "string" && formValue.trim()) return formValue.trim();
  if (typeof defaultValue === "string" && String(defaultValue).trim()) {
    return String(defaultValue).trim();
  }
  return null;
}

function boxPickerStoredValue(
  option: string | number,
  valueType: BoxPickerValueType
): string | number {
  if (valueType === "string") {
    return typeof option === "string" ? option : String(option);
  }
  const n = typeof option === "number" ? option : Number(option);
  if (!Number.isFinite(n)) return typeof option === "string" ? option : String(option);
  return valueType === "integer" ? Math.trunc(n) : n;
}

export function BoxPicker({
  fieldName,
  label,
  description,
  error,
  isRequired = false,
  valueType = "string",
  options,
  readOnly,
  defaultValue,
  withAsterisk,
}: BoxPickerProps) {
  const form = useFormContext();
  const formValue = getFormValueAtPath(form.values, fieldName);
  const selected = resolveBoxPickerSelection(formValue, defaultValue, valueType);

  return (
    <Input.Wrapper
      id={fieldName}
      label={label}
      description={description}
      error={error}
      required={isRequired}
      withAsterisk={withAsterisk}
    >
      <Group gap="xs" wrap="wrap">
        {options.map((option) => {
          const isSelected = selected !== null && schemaValuesEqual(selected, option);
          return (
            <Button
              key={`${fieldName}-${String(option)}`}
              bd={0}
              type="button"
              variant={isSelected ? "filled" : "default"}
              onClick={() => form.setFieldValue(fieldName, boxPickerStoredValue(option, valueType))}
              disabled={readOnly}
              size="xs"
            >
              {String(option)}
            </Button>
          );
        })}
      </Group>
    </Input.Wrapper>
  );
}
