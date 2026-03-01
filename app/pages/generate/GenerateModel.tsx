import { Stack, Loader, Alert, Center, Text, ScrollArea, Box } from "@mantine/core";
import { RiErrorWarningLine } from "@remixicon/react";
import { useEffect } from "react";
import { useLoaderData, useNavigate } from "react-router";
import { notifications } from "@mantine/notifications";
import useAppStore from "~/lib/stores/appStore";
import useGenerateStore from "~/lib/stores/generateStore";
import { SchemaFormGenerator } from "~/pages/generate/components/SchemaFormGenerator";
import { FormProvider, useForm } from "~/lib/ContextForm";
import { GenerateButton } from "~/pages/generate/components/GenerateButton";
import { LoginCTA } from "~/shared/LoginCTA";
import { ModelSwitcher } from "~/shared/ModelSwitcher";

/** Update the store when route params change so the rest of the app stays store-based. Re-runs on param change (React Router default). */
export async function clientLoader({
  params,
}: {
  params: { generation_type?: string; slug?: string };
}) {
  const slug = params.slug;
  if (slug) {
    useGenerateStore.getState().loadModel(slug);
  }
  return { slug: slug ?? null, generation_type: params.generation_type ?? null };
}

export default function GenerateModel() {
  const { slug } = useLoaderData<typeof clientLoader>();
  const navigate = useNavigate();
  const { getUser, isMobile, userTokens } = useAppStore();
  const { modelLoading, generateContent, setCurrentTaskId, calculateTokens, getSelectedModel } =
    useGenerateStore();
  const user = getUser();
  const currentTokens = userTokens || 0;

  // Define function before using it
  const getDefaultValuesFromSchema = (schema: any): Record<string, any> => {
    // Handle nested inputSchema structure (MCP format)
    const propertiesToProcess = schema.inputSchema?.properties || schema.properties;

    const processProperty = (property: any) => {
      // For read-only fields, ALWAYS include their default value in the payload
      if (property.readOnly === true) {
        return property.default;
      }

      // For editable fields, set defaults based on type
      if (property.default !== undefined) {
        return property.default;
      }

      if (property.type === "object" && property.properties) {
        // Recursively process nested object properties
        const nestedObject: Record<string, any> = {};
        Object.keys(property.properties).forEach((nestedKey) => {
          nestedObject[nestedKey] = processProperty(property.properties[nestedKey]);
        });
        return nestedObject;
      }

      if (property.type === "string") {
        return "";
      }

      if (property.type === "number" || property.type === "integer") {
        return 0;
      }

      if (property.type === "boolean") {
        return false;
      }

      if (property.type === "array") {
        return [];
      }

      return "";
    };

    const values: Record<string, any> = {};

    if (propertiesToProcess) {
      Object.keys(propertiesToProcess).forEach((key) => {
        values[key] = processProperty(propertiesToProcess[key]);
      });
    }
    return values;
  };

  // Keys that should NOT trigger token calculation (textarea/filePicker from schema)
  const getNoTriggerKeysFromSchema = (schema: any): Set<string> => {
    const keys = new Set<string>();
    if (!schema) return keys;
    const properties = schema?.inputSchema?.properties || schema?.properties || {};
    const collect = (props: Record<string, any>, prefix = "") => {
      Object.entries(props || {}).forEach(([key, fieldSchema]) => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const display = fieldSchema?.display;
        if (display === "textarea" || display === "filePicker") {
          keys.add(fullKey);
        }
        if (fieldSchema?.type === "object" && fieldSchema?.properties) {
          collect(fieldSchema.properties, fullKey);
        }
      });
    };
    collect(properties);
    return keys;
  };

  const parseSchemaObject = (schema: any) => {
    if (!schema) return null;
    if (typeof schema === "string") {
      try {
        return JSON.parse(schema);
      } catch {
        return null;
      }
    }
    return schema;
  };

  const getNestedValue = (obj: any, path: string) => {
    if (!path) return undefined;
    return path.split(".").reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  };

  const resolveRuleFieldPath = (ruleField: string, currentFieldPath: string) => {
    if (!ruleField) return "";
    if (ruleField.includes(".")) return ruleField;

    const pathParts = currentFieldPath.split(".");
    pathParts.pop();

    return pathParts.length > 0 ? `${pathParts.join(".")}.${ruleField}` : ruleField;
  };

  const shouldShowField = (rootValues: any, currentFieldPath: string, fieldSchema: any) => {
    const showRules = fieldSchema?.show;
    if (!Array.isArray(showRules) || showRules.length === 0) {
      return true;
    }

    return showRules.some((rule: any) => {
      const ruleField = typeof rule?.field === "string" ? rule.field.trim() : "";
      if (!ruleField) return false;

      const rulePath = resolveRuleFieldPath(ruleField, currentFieldPath);
      const ruleFieldValue = getNestedValue(rootValues, rulePath);

      if (Array.isArray(rule?.values) && rule.values.length > 0) {
        return rule.values.includes(ruleFieldValue);
      }

      if (Object.prototype.hasOwnProperty.call(rule || {}, "value")) {
        return ruleFieldValue === rule.value;
      }

      return Boolean(ruleFieldValue);
    });
  };

  const removeHiddenFieldsFromValues = (values: any, schema: any) => {
    const parsedSchema = parseSchemaObject(schema);
    const properties = parsedSchema?.inputSchema?.properties || parsedSchema?.properties;
    if (!properties || typeof values !== "object" || values === null) {
      return values;
    }

    const cleanedValues = JSON.parse(JSON.stringify(values));

    const pruneBySchema = (
      currentValues: any,
      currentProperties: Record<string, any>,
      rootValues: any,
      prefix = ""
    ): boolean => {
      if (!currentValues || typeof currentValues !== "object") return false;

      let changed = false;

      Object.entries(currentProperties || {}).forEach(([key, fieldSchema]) => {
        if (!(key in currentValues)) return;

        const fullFieldPath = prefix ? `${prefix}.${key}` : key;

        if (!shouldShowField(rootValues, fullFieldPath, fieldSchema)) {
          delete currentValues[key];
          changed = true;
          return;
        }

        if (
          fieldSchema?.type === "object" &&
          fieldSchema?.properties &&
          currentValues[key] &&
          typeof currentValues[key] === "object" &&
          !Array.isArray(currentValues[key])
        ) {
          if (
            pruneBySchema(currentValues[key], fieldSchema.properties, rootValues, fullFieldPath)
          ) {
            changed = true;
          }
          return;
        }

        if (
          fieldSchema?.type === "array" &&
          Array.isArray(currentValues[key]) &&
          fieldSchema?.items?.type === "object" &&
          fieldSchema?.items?.properties
        ) {
          currentValues[key].forEach((item: any, index: number) => {
            if (item && typeof item === "object" && !Array.isArray(item)) {
              if (
                pruneBySchema(
                  item,
                  fieldSchema.items.properties,
                  rootValues,
                  `${fullFieldPath}.${index}`
                )
              ) {
                changed = true;
              }
            }
          });
        }
      });

      return changed;
    };

    let iterations = 0;
    let hasChanges = false;
    do {
      hasChanges = pruneBySchema(cleanedValues, properties, cleanedValues);
      iterations += 1;
    } while (hasChanges && iterations < 10);

    return cleanedValues;
  };

  const form = useForm({
    onValuesChange(values, previous) {
      const changedKeys = Object.keys(values).filter(
        (k) => JSON.stringify(previous[k]) !== JSON.stringify(values[k])
      );
      const schema = getSelectedModel()?.api?.schema || getSelectedModel()?.schema;
      const noTriggerKeys = getNoTriggerKeysFromSchema(schema);
      const hasTriggerChange = changedKeys.some((k) => !noTriggerKeys.has(k));
      if (hasTriggerChange && user?.user?.id) {
        calculateTokens(values);
      }
    },
  });

  // clientLoader updates the store when params change; init form when the selected model is ready.
  useEffect(() => {
    const model = getSelectedModel();
    const schema = model?.api?.schema || model?.schema;
    if (!model || model.slug !== slug || !schema) return;
    const defaultValues = getDefaultValuesFromSchema(schema);
    form.setInitialValues(defaultValues);
    form.setValues(defaultValues);
  }, [slug, getSelectedModel()?.id]);

  const handleSubmit = async (values: any) => {
    if (!getSelectedModel()) return;
    // Check if user has enough tokens
    const cost = getSelectedModel().config?.cost_per_generation || 100;
    if (currentTokens < cost) {
      notifications.show({
        title: "Insufficient Tokens",
        message: `You need ${cost} tokens to generate content. You have ${currentTokens} tokens.`,
        color: "red",
      });
      return;
    }

    const schema = getSelectedModel().api?.schema || getSelectedModel().schema;
    const cleanedValues = removeHiddenFieldsFromValues(values, schema);
    const result = await generateContent(getSelectedModel().id, cleanedValues);

    if (result.success) {
      // On mobile, go directly to generations page after submission.
      if (isMobile) {
        navigate("/generations");
      }
      // Extract task ID from the result data
      const taskId = result.data?.task_id || result.data?.id;
      setCurrentTaskId(taskId);

      notifications.show({
        title: "Generation Started",
        message: `Your ${getSelectedModel()?.generation_type.toLowerCase()} is being generated. You'll be notified when it's ready.`,
        color: "green",
      });
    } else {
      notifications.show({
        title: "Generation Failed",
        message: result.error || "Failed to start generation",
        color: "red",
      });
    }
  };

  const LoadingComponent = () => {
    if (!modelLoading && !getSelectedModel()) {
      return (
        <Alert icon={<RiErrorWarningLine size={16} />} title="Model Not Found" color="red">
          The requested model could not be found.
        </Alert>
      );
    }
    if (modelLoading) {
      return (
        <Center h={400}>
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text>Loading model...</Text>
          </Stack>
        </Center>
      );
    }
    return null;
  };

  // Desktop form-only panel (results are rendered in GenerateModelLayout)
  return (
    <>
      <LoadingComponent />
      {getSelectedModel() && !modelLoading && (
        <FormProvider form={form}>
          <form
            onSubmit={form.onSubmit(handleSubmit)}
            style={{ height: "100%", minHeight: 0, display: "flex", flexDirection: "column" }}
          >
            <Stack gap="md" style={{ flex: 1, minHeight: 0 }}>
              <Box>
                <ModelSwitcher />
              </Box>

              <Box style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
                <ScrollArea h="100%">
                  <SchemaFormGenerator
                    schema={getSelectedModel().api?.schema}
                    generationType={getSelectedModel().generation_type as "image" | "video"}
                    showNoFieldsMessage={false}
                    renderSection="main"
                  />
                </ScrollArea>
              </Box>

              <Box>
                <SchemaFormGenerator
                  schema={getSelectedModel().api?.schema}
                  generationType={getSelectedModel().generation_type as "image" | "video"}
                  showNoFieldsMessage={false}
                  renderSection="output"
                />
                {user?.user?.id ? <GenerateButton /> : <LoginCTA />}
              </Box>
            </Stack>
          </form>
        </FormProvider>
      )}
    </>
  );
}
