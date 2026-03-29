import { Box, Group, Stack, Text, useMantineTheme } from "@mantine/core";
import { useFormContext } from "~/lib/ContextForm";
import { getEffectiveEnum } from "./schemaFormUtils";
import useAppStore from "~/lib/stores/appStore";

export function SelectableBoxesRenderer({
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
  const theme = useMantineTheme();
  const { themeSettings } = useAppStore();
  const fullFieldName = fieldPrefix ? `${fieldPrefix}.${fieldName}` : fieldName;

  const enumData = getEffectiveEnum(fieldSchema, form.values, fieldPrefix);

  const getNestedValue = (obj: any, path: string) => {
    return path.split(".").reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  };

  const currentValue = getNestedValue(form.values, fullFieldName) || "";

  const handleBoxClick = (value: string) => {
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

    const updatedValues = JSON.parse(JSON.stringify(form.values));
    setNestedValue(updatedValues, fullFieldName, value);
    form.setValues(updatedValues);
  };

  return (
    <Stack key={form.key(fullFieldName)} gap="xs">
      <Text size="sm" fw={500}>
        {fieldSchema.title || fieldName}
        {isRequired && <span style={{ color: "red" }}> *</span>}
      </Text>

      <Group gap="sm">
        {enumData.map((option: any) => {
          const value = typeof option === "object" ? option.value : option;
          const label = typeof option === "object" ? option.label : option;
          const isSelected = currentValue === value;
          return (
            <Box
              key={value}
              py="4"
              px="md"
              style={{
                cursor: "pointer",
                border: isSelected
                  ? `2px solid ${theme.colors[theme.primaryColor][6]}`
                  : `1px solid ${themeSettings.colorScheme === "dark" ? theme.colors.dark[4] : theme.colors.gray[3]}`,
                borderRadius: "8px",
                transition: "all 0.2s ease",
                minWidth: "40px",
                textAlign: "center",
              }}
              onClick={() => handleBoxClick(value)}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor =
                    themeSettings.colorScheme === "dark"
                      ? theme.colors.dark[5]
                      : theme.colors.gray[1];
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              <Text size="sm" fw={isSelected ? 600 : 400}>
                {label}
              </Text>
            </Box>
          );
        })}
      </Group>
    </Stack>
  );
}
