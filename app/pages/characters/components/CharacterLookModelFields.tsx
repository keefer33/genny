import { NumberInput, Select, Stack, Switch, TextInput } from "@mantine/core";
import type {
  CharacterLookModelOption,
  CharacterLookModelUiField,
} from "~/lib/stores/charactersStore";

export type {
  CharacterLookModelOption,
  CharacterLookModelUiField,
} from "~/lib/stores/charactersStore";

export function getUiFieldDefaults(
  ui: Record<string, CharacterLookModelUiField>
): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};
  for (const [key, field] of Object.entries(ui)) {
    if (field.default !== undefined) defaults[key] = field.default;
  }
  return defaults;
}

export function mergeLookModelConfigPayload(
  option: Pick<CharacterLookModelOption, "fields">,
  userPayload: Record<string, unknown>
): Record<string, unknown> {
  const merged = { ...option.fields.default };
  for (const [key, field] of Object.entries(option.fields.ui)) {
    const userValue = userPayload[key];
    if (userValue !== undefined && userValue !== null && userValue !== "") {
      merged[key] = userValue;
    } else if (field.default !== undefined) {
      merged[key] = field.default;
    }
  }
  return merged;
}

function formatFieldLabel(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

type CharacterLookModelFieldsProps = {
  ui: Record<string, CharacterLookModelUiField>;
  values: Record<string, unknown>;
  disabled?: boolean;
  onChange: (key: string, value: unknown) => void;
};

export function CharacterLookModelFields({
  ui,
  values,
  disabled = false,
  onChange,
}: CharacterLookModelFieldsProps) {
  const entries = Object.entries(ui);
  if (entries.length === 0) return null;

  return (
    <Stack gap="sm">
      {entries.map(([key, field]) => {
        const label = formatFieldLabel(key);
        const description = field.description?.trim() || undefined;
        const value = values[key];

        if (field.enum && field.enum.length > 0) {
          return (
            <Select
              key={key}
              label={label}
              description={description}
              data={field.enum.map((option) => ({ value: option, label: option }))}
              value={
                typeof value === "string" ? value : String(field.default ?? field.enum[0] ?? "")
              }
              onChange={(next) => onChange(key, next ?? field.default ?? field.enum?.[0] ?? "")}
              disabled={disabled}
              allowDeselect={false}
            />
          );
        }

        if (field.type === "boolean") {
          return (
            <Switch
              key={key}
              label={label}
              description={description}
              checked={Boolean(value ?? field.default ?? false)}
              onChange={(event) => onChange(key, event.currentTarget.checked)}
              disabled={disabled}
            />
          );
        }

        if (field.type === "number") {
          return (
            <NumberInput
              key={key}
              label={label}
              description={description}
              value={
                typeof value === "number"
                  ? value
                  : typeof field.default === "number"
                    ? field.default
                    : undefined
              }
              onChange={(next) => onChange(key, next)}
              disabled={disabled}
            />
          );
        }

        return (
          <TextInput
            key={key}
            label={label}
            description={description}
            value={typeof value === "string" ? value : String(value ?? field.default ?? "")}
            onChange={(event) => onChange(key, event.currentTarget.value)}
            disabled={disabled}
          />
        );
      })}
    </Stack>
  );
}
