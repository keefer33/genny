import { Box, Group, Stack, Text, useMantineColorScheme, useMantineTheme } from "@mantine/core";
import { useEffect } from "react";
import { useFormContext } from "~/lib/ContextForm";
import { getEffectiveEnum } from "./schemaFormUtils";

export function SelectableIntegerBoxesRenderer({
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
  const { colorScheme } = useMantineColorScheme();
  const fullFieldName = fieldPrefix ? `${fieldPrefix}.${fieldName}` : fieldName;

  const enumData = getEffectiveEnum(fieldSchema, form.values, fieldPrefix);

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

  const currentValue = getNestedValue(form.values, fullFieldName);

  useEffect(() => {
    const effective = getEffectiveEnum(fieldSchema, form.values, fieldPrefix);
    if (effective.length === 0) return;
    const numericCurrent = typeof currentValue === "number" ? currentValue : Number(currentValue);
    const allowed = effective
      .map((o: any) => (typeof o === "object" ? o.value : o))
      .map((v: any) => (typeof v === "string" ? parseInt(v, 10) : v));
    if (!allowed.includes(numericCurrent)) {
      const first = typeof effective[0] === "object" ? effective[0].value : effective[0];
      const firstNum = typeof first === "string" ? parseInt(first, 10) : first;
      const updatedValues = JSON.parse(JSON.stringify(form.values));
      setNestedValue(updatedValues, fullFieldName, firstNum);
      form.setValues(updatedValues);
    }
  }, [form.values, fieldPrefix, fieldSchema, fullFieldName, fieldName, currentValue, form]);

  const handleBoxClick = (value: number) => {
    const setNestedValueLocal = (obj: any, path: string, value: any) => {
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
    setNestedValueLocal(updatedValues, fullFieldName, value);
    form.setValues(updatedValues);
  };

  return (
    <Stack key={form.key(fullFieldName)} gap="sm">
      <Text size="sm" fw={500}>
        {fieldSchema.title || fieldName}
        {isRequired && <span style={{ color: "red" }}> *</span>}
      </Text>

      <Group gap="sm">
        {enumData.map((option: any) => {
          const value = typeof option === "object" ? option.value : option;
          const label = typeof option === "object" ? option.label : option;
          const numericValue = typeof value === "string" ? parseInt(value, 10) : value;
          const isSelected = currentValue === numericValue;
          return (
            <Box
              key={numericValue}
              py="4"
              px="md"
              style={{
                cursor: "pointer",
                border: isSelected
                  ? `2px solid ${theme.colors[theme.primaryColor][6]}`
                  : `1px solid ${colorScheme === "dark" ? theme.colors.dark[4] : theme.colors.gray[3]}`,
                borderRadius: "8px",
                transition: "all 0.2s ease",
                minWidth: "40px",
                textAlign: "center",
              }}
              onClick={() => handleBoxClick(numericValue)}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor =
                    colorScheme === "dark" ? theme.colors.dark[5] : theme.colors.gray[1];
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
