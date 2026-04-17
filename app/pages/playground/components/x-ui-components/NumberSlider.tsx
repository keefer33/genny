import { Group, Input, NumberInput, Slider } from "@mantine/core";
import { useFormContext } from "~/lib/ContextForm";
import type { NumberSliderProps } from "~/types/playground";

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
}: NumberSliderProps) {
  const form = useFormContext();
  let hi = max;
  if (hi <= min) {
    hi = min + (step > 0 ? step : 1);
  }

  const raw = form.values[fieldName];
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
