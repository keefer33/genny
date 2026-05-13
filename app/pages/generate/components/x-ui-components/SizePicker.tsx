import {
  Box,
  Collapse,
  Group,
  Input,
  NumberInput,
  Select,
  Slider,
  Stack,
  Switch,
  Text,
} from "@mantine/core";
import { useMemo, useState } from "react";
import { useFormContext } from "~/lib/ContextForm";
import type { SizePickerProps } from "~/types/generations";
import { getFormValueAtPath } from "../ModelSchemaForm.utils";
import { buildSizePresetSelectData } from "./sizePickerPresets";

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function coerceDimension(v: string | number): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function parseWxH(value: unknown, separator: string): { w: number; h: number } | null {
  if (typeof value !== "string") return null;
  const splitSeparator = value.includes(separator) ? separator : value.includes("*") ? "*" : null;
  if (!splitSeparator) return null;
  const parts = value.split(splitSeparator).map((p) => p.trim());
  if (parts.length !== 2) return null;
  const w = Number(parts[0]);
  const h = Number(parts[1]);
  if (!Number.isFinite(w) || !Number.isFinite(h)) return null;
  return { w, h };
}

export function SizePicker({
  fieldName,
  label,
  description,
  error,
  isRequired = false,
  min,
  max,
  readOnly,
  defaultValue,
  separator = "*",
  step = 1,
  withAsterisk,
}: SizePickerProps) {
  const form = useFormContext();
  let hi = max;
  if (hi <= min) {
    hi = min + 1;
  }
  const dimensionStep = Number.isFinite(step) && step > 0 ? step : 1;

  const raw = getFormValueAtPath(form.values, fieldName);
  const fromForm = parseWxH(raw, separator);
  const fromDefault = parseWxH(defaultValue, separator);
  const w0 = fromForm?.w ?? fromDefault?.w ?? min;
  const h0 = fromForm?.h ?? fromDefault?.h ?? min;
  const width = clamp(Math.round(w0), min, hi);
  const height = clamp(Math.round(h0), min, hi);

  const setPair = (w: number, h: number) => {
    const cw = clamp(Math.round(w), min, hi);
    const ch = clamp(Math.round(h), min, hi);
    form.setFieldValue(fieldName, `${cw}${separator}${ch}`);
  };

  const { data: presetSelectData, validValues: presetValuesInRange } = useMemo(
    () => buildSizePresetSelectData(min, max, separator),
    [min, max, separator]
  );

  const presetSelectValue =
    typeof raw === "string" && presetValuesInRange.has(raw.trim()) ? raw.trim() : null;

  const hasPresets = presetSelectData.length > 0;

  const [customize, setCustomize] = useState(() => {
    if (!hasPresets) return true;
    if (typeof raw !== "string") return false;
    const trimmed = raw.trim();
    if (!trimmed) return false;
    return !presetValuesInRange.has(trimmed);
  });

  const showCustomControls = !hasPresets || customize;

  return (
    <Box
      pl="md"
      style={{
        borderLeft: "3px solid var(--mantine-color-default-border)",
      }}
    >
      <Input.Wrapper
        id={fieldName}
        label={label}
        description={description}
        error={error}
        required={isRequired}
        withAsterisk={withAsterisk}
      >
        <Stack gap="md">
          {hasPresets && (
            <Select
              label="Preset size"
              placeholder="Choose tier & aspect ratio…"
              data={presetSelectData}
              value={presetSelectValue}
              onChange={(value) => {
                if (value) form.setFieldValue(fieldName, value);
              }}
              disabled={readOnly}
              searchable
              clearable={false}
              allowDeselect={false}
              maxDropdownHeight={280}
            />
          )}
          {hasPresets && (
            <Switch
              label="Customize"
              description="Show sliders and manual width × height"
              checked={customize}
              onChange={(e) => setCustomize(e.currentTarget.checked)}
            />
          )}
          <Collapse expanded={showCustomControls}>
            <Stack gap="md" pt={hasPresets ? "xs" : 0}>
              <div>
                <Text size="sm" mb={4}>
                  Width ({width})
                </Text>
                <Slider
                  min={min}
                  max={hi}
                  step={dimensionStep}
                  value={width}
                  onChange={(v) => setPair(v, height)}
                  disabled={readOnly}
                  label={null}
                  showLabelOnHover={false}
                />
              </div>
              <div>
                <Text size="sm" mb={4}>
                  Height ({height})
                </Text>
                <Slider
                  min={min}
                  max={hi}
                  step={dimensionStep}
                  value={height}
                  onChange={(v) => setPair(width, v)}
                  disabled={readOnly}
                  label={null}
                  showLabelOnHover={false}
                />
              </div>
              <Group gap="xs" align="flex-end" wrap="nowrap">
                <NumberInput
                  aria-label="Width"
                  min={min}
                  max={hi}
                  step={dimensionStep}
                  clampBehavior="blur"
                  value={width}
                  onChange={(v) => {
                    const n = coerceDimension(v);
                    if (n !== null) setPair(n, height);
                  }}
                  disabled={readOnly}
                  style={{ flex: 1, minWidth: 0 }}
                />
                <Text size="sm" c="dimmed" fw={600} pb={6} style={{ flexShrink: 0 }}>
                  {separator}
                </Text>
                <NumberInput
                  aria-label="Height"
                  min={min}
                  max={hi}
                  step={dimensionStep}
                  clampBehavior="blur"
                  value={height}
                  onChange={(v) => {
                    const n = coerceDimension(v);
                    if (n !== null) setPair(width, n);
                  }}
                  disabled={readOnly}
                  style={{ flex: 1, minWidth: 0 }}
                />
              </Group>
            </Stack>
          </Collapse>
        </Stack>
      </Input.Wrapper>
    </Box>
  );
}
