import { Group, Input, NumberInput, Slider } from "@mantine/core";
import { useFormContext } from "~/lib/ContextForm";
import type { NumberSliderProps } from "~/types/generations";
import { getFormValueAtPath } from "../ModelSchemaForm.utils";
import { useMantineTheme } from "@mantine/core";

export function NumberSlider({
  fieldName,
  label,
  description,
  error,
  isRequired = false,
  min,
  max,
  step,
  readOnly,
  defaultValue,
  withAsterisk,
}: NumberSliderProps) {
  const form = useFormContext();
  let hi = max;
  if (hi <= min) {
    hi = min + (step > 0 ? step : 1);
  }
  const theme = useMantineTheme();
  const raw = getFormValueAtPath(form.values, fieldName);
  const fromForm = typeof raw === "number" && !Number.isNaN(raw) ? raw : null;
  const fallback =
    typeof defaultValue === "number" && !Number.isNaN(defaultValue) ? defaultValue : min;
  const sliderValue = Math.min(hi, Math.max(min, fromForm ?? fallback));

  return (
    <Input.Wrapper
      id={fieldName}
      label={label}
      description={description}
      error={error}
      required={isRequired}
      withAsterisk={withAsterisk}
    >
      <Group align="center" gap="sm" wrap="wrap">
        <Slider
          min={min}
          max={hi}
          step={step}
          value={sliderValue}
          onChange={(v) => form.setFieldValue(fieldName, v)}
          disabled={readOnly}
          style={{ flex: 1, minWidth: 180 }}
          styles={{
            bar: {
              backgroundColor: `var(--mantine-primary-color-light)`,
            },
          }}
        />
        <NumberInput
          value={sliderValue}
          min={min}
          max={hi}
          step={step}
          onChange={(value) => {
            const numericValue = typeof value === "number" ? value : Number(value);
            if (!Number.isFinite(numericValue)) return;
            const clamped = Math.min(hi, Math.max(min, numericValue));
            form.setFieldValue(fieldName, clamped);
          }}
          disabled={readOnly}
          w={72}
          hideControls
          decimalScale={0}
        />
      </Group>
    </Input.Wrapper>
  );
}
