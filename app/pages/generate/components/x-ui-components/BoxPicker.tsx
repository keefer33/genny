import { Button, Group, Input } from "@mantine/core";
import { useFormContext } from "~/lib/ContextForm";
import type { BoxPickerProps } from "~/types/generations";

export function BoxPicker({
  fieldName,
  label,
  description,
  error,
  isRequired = false,
  options,
  readOnly,
  defaultValue,
}: BoxPickerProps) {
  const form = useFormContext();
  const formValue = form.values[fieldName];
  const selected =
    typeof formValue === "string" && formValue.trim()
      ? formValue
      : typeof defaultValue === "string" && defaultValue.trim()
        ? defaultValue
        : "";

  return (
    <Input.Wrapper
      id={fieldName}
      label={label}
      description={description}
      error={error}
      required={isRequired}
    >
      <Group gap="xs" wrap="wrap">
        {options.map((option) => {
          const isSelected = selected === option;
          return (
            <Button
              key={`${fieldName}-${option}`}
              bd={0}
              type="button"
              variant={isSelected ? "filled" : "default"}
              onClick={() => form.setFieldValue(fieldName, option)}
              disabled={readOnly}
              size="xs"
            >
              {option}
            </Button>
          );
        })}
      </Group>
    </Input.Wrapper>
  );
}
