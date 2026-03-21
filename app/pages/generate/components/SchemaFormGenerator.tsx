import { ActionIcon, Card, Group, Popover, Stack, Text, ThemeIcon } from "@mantine/core";
import { useEffect, useRef, useState } from "react";
import { useFormContext } from "~/lib/ContextForm";
import { RiArrowRightSLine, RiCloseLine, RiSettings3Line } from "@remixicon/react";
import { NestedFieldRenderer } from "./schema-form/NestedFieldRenderer";

interface ToolSchema {
  description?: string;
  order?: string[];
  inputSchema?: {
    properties: Record<string, any>;
    required?: string[];
  };
  properties?: Record<string, any>;
  required?: string[];
}

interface SchemaFormGeneratorProps {
  schema: ToolSchema | string | null | undefined;
  showNoSchemaMessage?: boolean;
  showNoFieldsMessage?: boolean;
  fieldPrefix?: string;
  generationType?: "image" | "video";
  renderSection?: "all" | "main" | "output";
}

const OUTPUT_GROUP_FIELDS = [
  "aspect_ratio",
  "aspectRatio",
  "duration",
  "resolution",
  "fps",
  "generate_audio",
  "output_format",
  "n_frames",
  "mode",
] as const;

export function SchemaFormGenerator({
  schema,
  showNoSchemaMessage = true,
  showNoFieldsMessage = true,
  generationType = "image",
  renderSection = "all",
}: SchemaFormGeneratorProps) {
  const form = useFormContext();
  const defaultsSetRef = useRef(false);
  const [outputPopoverOpened, setOutputPopoverOpened] = useState(false);

  if (!schema) {
    return showNoSchemaMessage ? <Text c="dimmed">No schema available</Text> : null;
  }

  let parsedSchema = schema;
  if (typeof schema === "string") {
    try {
      parsedSchema = JSON.parse(schema);
    } catch (error) {
      console.error("Error parsing schema string:", error);
      return <Text c="red">Invalid JSON schema</Text>;
    }
  }

  if (typeof parsedSchema !== "object" || !parsedSchema) {
    return <Text c="dimmed">Invalid schema format</Text>;
  }

  let properties: Record<string, any> = {};
  let required: string[] = [];

  if (parsedSchema.inputSchema && parsedSchema.inputSchema.properties) {
    properties = parsedSchema.inputSchema.properties || {};
    required = parsedSchema.inputSchema.required || [];
  } else if (parsedSchema.properties) {
    properties = parsedSchema.properties || {};
    required = parsedSchema.required || [];
  }

  if (parsedSchema.order && Array.isArray(parsedSchema.order) && parsedSchema.order.length > 0) {
    const orderedProperties: Record<string, any> = {};
    parsedSchema.order.forEach((key: string) => {
      if (properties[key]) {
        orderedProperties[key] = properties[key];
      }
    });
    Object.keys(properties).forEach((key) => {
      if (!orderedProperties[key]) {
        orderedProperties[key] = properties[key];
      }
    });
    properties = orderedProperties;
  }

  useEffect(() => {
    if (defaultsSetRef.current) {
      return;
    }

    const defaultValues: Record<string, any> = {};

    const getNestedValue = (obj: any, path: string) => {
      return path.split(".").reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : undefined;
      }, obj);
    };

    const setDefaultsForField = (fieldName: string, fieldSchema: any, prefix = "") => {
      const fullFieldName = prefix ? `${prefix}.${fieldName}` : fieldName;
      const currentValue = getNestedValue(form.values, fullFieldName);

      const needsDefault =
        currentValue === undefined ||
        currentValue === null ||
        (fieldSchema.type === "boolean" &&
          fieldSchema.default !== undefined &&
          currentValue === false &&
          fieldSchema.default === true);

      if (needsDefault) {
        if (fieldSchema.default !== undefined) {
          setNestedValue(defaultValues, fullFieldName, fieldSchema.default);
        } else {
          switch (fieldSchema.type) {
            case "string":
              setNestedValue(defaultValues, fullFieldName, fieldSchema.default || "");
              break;
            case "number":
            case "integer":
              if (fieldSchema.enum && fieldSchema.enum.length > 0) {
                const firstEnumValue = fieldSchema.enum[0];
                const numericValue =
                  typeof firstEnumValue === "string"
                    ? parseInt(firstEnumValue, 10)
                    : firstEnumValue;
                setNestedValue(defaultValues, fullFieldName, numericValue);
              } else {
                setNestedValue(defaultValues, fullFieldName, fieldSchema.minimum || 0);
              }
              break;
            case "boolean":
              setNestedValue(defaultValues, fullFieldName, false);
              break;
            case "array":
              if (fieldSchema.items && fieldSchema.items.type === "object") {
                setNestedValue(defaultValues, fullFieldName, []);
              } else {
                setNestedValue(defaultValues, fullFieldName, []);
              }
              break;
            case "object":
              if (fieldSchema.properties) {
                setNestedValue(defaultValues, fullFieldName, {});
                Object.entries(fieldSchema.properties).forEach(
                  ([nestedFieldName, nestedFieldSchema]) => {
                    setDefaultsForField(nestedFieldName, nestedFieldSchema, fullFieldName);
                  }
                );
              }
              break;
            default:
              setNestedValue(defaultValues, fullFieldName, "");
          }
        }
      }
    };

    const setNestedValue = (obj: any, path: string, value: any) => {
      const keys = path.split(".");
      let current = obj;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
    };

    for (const [fieldName, fieldSchema] of Object.entries(properties)) {
      setDefaultsForField(fieldName, fieldSchema);
    }

    if (Object.keys(defaultValues).length > 0) {
      Object.entries(defaultValues).forEach(([key, value]) => {
        const currentValue = form.getValues()[key];

        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
          const isObjectEmpty = Object.keys(value).length === 0;
          const isCurrentValueEmpty =
            currentValue === undefined ||
            currentValue === null ||
            currentValue === "" ||
            (typeof currentValue === "object" && Object.keys(currentValue).length === 0);

          if (isCurrentValueEmpty && !isObjectEmpty) {
            form.setFieldValue(key, value);
          }
        } else if (
          currentValue === undefined ||
          currentValue === null ||
          currentValue === "" ||
          (typeof value === "boolean" && value === true && currentValue === false)
        ) {
          form.setFieldValue(key, value);
        }
      });
    }

    defaultsSetRef.current = true;
  }, [properties, form]);

  if (Object.keys(properties).length === 0) {
    return showNoFieldsMessage ? <Text c="dimmed">No form fields found in schema</Text> : null;
  }

  const groupedOutputProperties: Record<string, any> = {};
  OUTPUT_GROUP_FIELDS.forEach((fieldName) => {
    if (properties[fieldName]) {
      groupedOutputProperties[fieldName] = properties[fieldName];
    }
  });

  const remainingProperties = Object.fromEntries(
    Object.entries(properties).filter(
      ([fieldName]) => !OUTPUT_GROUP_FIELDS.includes(fieldName as any)
    )
  );
  const outputRequired = required.filter((fieldName) =>
    Object.prototype.hasOwnProperty.call(groupedOutputProperties, fieldName)
  );
  const remainingRequired = required.filter((fieldName) =>
    Object.prototype.hasOwnProperty.call(remainingProperties, fieldName)
  );
  const formatOutputSummaryValue = (fieldName: string, value: any): string => {
    if (value === undefined || value === null || value === "") return "-";
    if (fieldName === "duration") return `${value} s`;
    if (fieldName === "fps") return `${value} fps`;
    if (fieldName === "generate_audio") return value ? "audio: on" : "audio: off";
    return String(value);
  };

  const outputSummary = OUTPUT_GROUP_FIELDS.filter((fieldName) =>
    Object.prototype.hasOwnProperty.call(groupedOutputProperties, fieldName)
  )
    .map((fieldName) => formatOutputSummaryValue(fieldName, form.values?.[fieldName]))
    .join(" | ");

  const shouldRenderMain = renderSection === "all" || renderSection === "main";
  const shouldRenderOutput = renderSection === "all" || renderSection === "output";

  if (renderSection === "main" && Object.keys(remainingProperties).length === 0) {
    return showNoFieldsMessage ? <Text c="dimmed">No form fields found in schema</Text> : null;
  }

  if (renderSection === "output" && Object.keys(groupedOutputProperties).length === 0) {
    return null;
  }

  return (
    <Stack gap="xl">
      {shouldRenderMain && Object.keys(remainingProperties).length > 0 && (
        <NestedFieldRenderer
          properties={remainingProperties}
          required={remainingRequired}
          generationType={generationType}
        />
      )}

      {shouldRenderOutput && Object.keys(groupedOutputProperties).length > 0 && (
        <Popover
          width="target"
          position="top-start"
          withArrow
          withOverlay
          shadow="md"
          middlewares={{ flip: false, shift: true }}
          overlayProps={{ backgroundOpacity: 0.5 }}
          opened={outputPopoverOpened}
          onChange={setOutputPopoverOpened}
        >
          <Popover.Target>
            <Card
              withBorder
              radius="md"
              p="sm"
              style={{ cursor: "pointer" }}
              onClick={() => setOutputPopoverOpened((o) => !o)}
            >
              <Group gap="sm" justify="space-between" wrap="nowrap">
                <Group gap="sm" wrap="nowrap">
                  <ThemeIcon variant="light" size="sm" radius="xl">
                    <RiSettings3Line size={14} />
                  </ThemeIcon>
                  <Stack gap={2}>
                    <Text size="sm" fw={600}>
                      Output
                    </Text>
                    <Text size="xs" c="dimmed">
                      {outputSummary}
                    </Text>
                  </Stack>
                </Group>
                <ThemeIcon variant="subtle" size="sm" color="gray">
                  <RiArrowRightSLine size={16} />
                </ThemeIcon>
              </Group>
            </Card>
          </Popover.Target>
          <Popover.Dropdown>
            <Stack gap="lg">
              <Group justify="space-between" wrap="nowrap">
                <Text size="sm" fw={600}>
                  Output
                </Text>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="gray"
                  onClick={() => setOutputPopoverOpened(false)}
                  aria-label="Close"
                >
                  <RiCloseLine size={18} />
                </ActionIcon>
              </Group>
              <NestedFieldRenderer
                properties={groupedOutputProperties}
                required={outputRequired}
                generationType={generationType}
              />
            </Stack>
          </Popover.Dropdown>
        </Popover>
      )}
    </Stack>
  );
}
