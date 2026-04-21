import { Button, Group, Input, Text } from "@mantine/core";
import { useFormContext } from "~/lib/ContextForm";
import type { AspectRatioPickerProps } from "~/types/playground";

type ParsedRatio = {
  label: string;
  width: number;
  height: number;
};

const PREVIEW_SIDE_PX = 22;

function parseAspectRatio(option: string): ParsedRatio | null {
  const raw = option.trim();
  if (!raw.includes(":")) return null;
  const [lhs, rhs] = raw.split(":");
  const w = Number(lhs);
  const h = Number(rhs);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;

  const ratio = w / h;
  const width = ratio >= 1 ? PREVIEW_SIDE_PX : Math.round(PREVIEW_SIDE_PX * ratio);
  const height = ratio >= 1 ? Math.round(PREVIEW_SIDE_PX / ratio) : PREVIEW_SIDE_PX;

  return { label: raw, width, height };
}

export function AspectRatioPicker({
  fieldName,
  label,
  description,
  error,
  isRequired = false,
  options,
  readOnly,
  defaultValue,
}: AspectRatioPickerProps) {
  const form = useFormContext();
  const formValue = form.values[fieldName];
  const selected =
    typeof formValue === "string" && formValue.trim()
      ? formValue.trim()
      : typeof defaultValue === "string" && defaultValue.trim()
        ? defaultValue.trim()
        : "";

  const parsed = options
    .map(parseAspectRatio)
    .filter((value): value is ParsedRatio => value !== null);

  return (
    <Input.Wrapper
      id={fieldName}
      label={label}
      description={description}
      error={error}
      required={isRequired}
    >
      <Group gap="xs" wrap="wrap">
        {parsed.map((ratio) => {
          const isSelected = selected === ratio.label;
          return (
            <Button
              key={`${fieldName}-${ratio.label}`}
              type="button"
              bd={0}
              variant={isSelected ? "filled" : "default"}
              onClick={() => form.setFieldValue(fieldName, ratio.label)}
              disabled={readOnly}
              p={3}
              size="xs"
            >
              <Group gap={6} wrap="nowrap">
                <div
                  style={{
                    width: PREVIEW_SIDE_PX,
                    height: PREVIEW_SIDE_PX,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      width: ratio.width,
                      height: ratio.height,
                      border: "2px solid currentColor",
                    }}
                  />
                </div>
                <Text size="xs" fw={600}>
                  {ratio.label}
                </Text>
              </Group>
            </Button>
          );
        })}
      </Group>
    </Input.Wrapper>
  );
}
