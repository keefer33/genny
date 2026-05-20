import { Button, Input, ScrollArea, Stack, Text, Loader, Box, Skeleton } from "@mantine/core";
import { useEffect, useMemo } from "react";
import { FormProvider, useForm } from "~/lib/ContextForm";
import { showNotification } from "~/lib/notificationUtils";
import useGenerationsStore from "~/lib/stores/generateStore";
import { CostBadge } from "~/shared/CostBadge";
import { GenerationsHistoryModal } from "~/shared/GenerationsHistoryModal";
import useAppStore from "~/lib/stores/appStore";
import { useDisclosure } from "@mantine/hooks";
import {
  buildInitialValues,
  collectDeepFormSchemaErrors,
  evaluateConditions,
  isCostIgnoredFieldKey,
  orderedPropertyKeys,
  parseFunctionSchema,
  sanitizePayload,
  schemaValuesEqual,
} from "./ModelSchemaForm.utils";
import { SchemaNestedFields } from "./SchemaNestedFields";

export type ModelSchemaFormProps = {
  /** Merged on top of schema defaults when the model loads (e.g. character edit prefill). */
  initialValuesOverride?: Record<string, unknown>;
  /** When set, runs are tagged `app: character` and linked to this character. */
  characterId?: string;
  /** Called after a run is successfully started (receives API run row). */
  onSubmitSuccess?: (run: unknown) => void;
};

export default function ModelSchemaForm({
  initialValuesOverride,
  characterId,
  onSubmitSuccess,
}: ModelSchemaFormProps = {}) {
  const {
    selectedModel,
    generateFromGenModel,
    runLoading,
    calculateGenerateCost,
    costLoading,
    latestCost,
  } = useGenerationsStore();

  const { isMobile } = useAppStore();
  const [runHistoryModalOpened, { open: openRunHistoryModal, close: closeRunHistoryModal }] =
    useDisclosure(false);

  const functionSchema = useMemo(
    () => parseFunctionSchema(selectedModel?.gen_models_apis?.function_schema),
    [selectedModel?.gen_models_apis?.function_schema]
  );

  const initialValuesOverrideKey = useMemo(
    () => (initialValuesOverride ? JSON.stringify(initialValuesOverride) : ""),
    [initialValuesOverride]
  );

  const resolvedInitialValues = useMemo(() => {
    const fs = parseFunctionSchema(selectedModel?.gen_models_apis?.function_schema);
    const baseValues = fs?.properties ? buildInitialValues(fs) : {};
    return initialValuesOverride ? { ...baseValues, ...initialValuesOverride } : baseValues;
  }, [
    selectedModel?.id,
    selectedModel?.gen_models_apis?.function_schema,
    initialValuesOverrideKey,
  ]);

  const form = useForm({
    initialValues: resolvedInitialValues as Record<string, unknown>,
    validate: (values) => {
      const fs = parseFunctionSchema(selectedModel?.gen_models_apis?.function_schema);
      if (!fs?.properties) return {};
      return collectDeepFormSchemaErrors(fs, values as Record<string, unknown>);
    },
  });

  const costDriverSnapshot = useMemo(() => {
    const fs = functionSchema;
    if (!fs?.properties) return "";
    const v = form.values as Record<string, unknown>;
    const partial: Record<string, unknown> = {};
    for (const key of orderedPropertyKeys(fs)) {
      if (isCostIgnoredFieldKey(key)) continue;
      partial[key] = v[key];
    }
    return JSON.stringify(sanitizePayload(partial));
  }, [form.values, functionSchema]);

  useEffect(() => {
    if (!selectedModel?.id) return;
    // Apply schema defaults + override whenever the model or prefill changes.
    form.setInitialValues(resolvedInitialValues);
    form.reset();
    form.clearErrors();
  }, [
    selectedModel?.id,
    selectedModel?.gen_models_apis?.function_schema,
    selectedModel?.model_variant,
    selectedModel?.model_product,
    selectedModel?.brand_name?.slug,
    initialValuesOverrideKey,
    resolvedInitialValues,
  ]);

  useEffect(() => {
    if (!selectedModel?.id) return;
    const timeoutId = setTimeout(() => {
      void calculateGenerateCost({
        modelId: selectedModel.id,
        payload: sanitizePayload(form.values as Record<string, unknown>),
      }).catch(() => undefined);
    }, 250);
    return () => clearTimeout(timeoutId);
  }, [costDriverSnapshot, selectedModel?.id, calculateGenerateCost]);

  const conditionState = useMemo(
    () => evaluateConditions(functionSchema, form.values as Record<string, unknown>),
    [functionSchema, form.values]
  );
  const conditionSetValuesKey = useMemo(
    () => JSON.stringify(conditionState.setValues),
    [conditionState.setValues]
  );

  useEffect(() => {
    for (const [field, value] of Object.entries(conditionState.setValues)) {
      if (!schemaValuesEqual((form.values as Record<string, unknown>)[field], value)) {
        form.setFieldValue(field, value);
      }
    }
  }, [conditionSetValuesKey, conditionState.setValues, form]);

  if (!selectedModel) {
    return <Skeleton height={100} />;
  }

  if (!functionSchema?.properties || Object.keys(functionSchema.properties).length === 0) {
    return (
      <Stack gap="xs" p="md">
        <Text fw={700}>{selectedModel.model_name ?? "Model"}</Text>
        <Text c="dimmed" size="sm">
          This model has no function schema inputs.
        </Text>
      </Stack>
    );
  }

  const normalizedMediaType =
    `${selectedModel.model_type ?? ""} ${selectedModel.generation_type ?? ""}`.toLowerCase().trim();
  let generationType: "image" | "video" | "audio" = "image";
  if (normalizedMediaType.includes("audio")) {
    generationType = "audio";
  } else if (normalizedMediaType.includes("video")) {
    generationType = "video";
  }
  const onSubmit = form.onSubmit(async (values) => {
    if (!selectedModel?.id) {
      showNotification({ message: "No model selected.", type: "error" });
      return;
    }
    try {
      const run = await generateFromGenModel({
        id: selectedModel.id,
        payload: sanitizePayload(values),
        ...(characterId ? { app: "character", character_id: characterId } : {}),
      });
      showNotification({
        title: "Success",
        message: "Generation started successfully",
        type: "success",
      });
      onSubmitSuccess?.(run);
      if (isMobile && !characterId) {
        openRunHistoryModal();
      }
    } catch (err) {
      showNotification({
        title: "Error",
        message: err instanceof Error ? err.message : "Failed to generate",
        type: "error",
      });
    }
  });

  return (
    <Box h="100%" style={{ minHeight: 0, display: "flex", flexDirection: "column" }}>
      <FormProvider form={form}>
        <form
          onSubmit={onSubmit}
          style={{ height: "100%", minHeight: 0, display: "flex", flexDirection: "column" }}
        >
          <ScrollArea h="100%" type="auto" offsetScrollbars="y">
            <Stack gap="xl" pb="xl">
              {functionSchema.properties ? (
                <SchemaNestedFields
                  pathPrefix=""
                  objectSchema={
                    functionSchema as typeof functionSchema & {
                      properties: NonNullable<typeof functionSchema.properties>;
                    }
                  }
                  readOnly={false}
                  generationType={generationType}
                  conditionDisabledFields={conditionState.disabledFields}
                />
              ) : null}

              {form.errors["root"] && <Input.Error mt="xs">{form.errors["root"]}</Input.Error>}
            </Stack>
          </ScrollArea>
          <Box px="xs" pt="xs">
            <Button
              type="submit"
              variant="filled"
              size="md"
              fullWidth
              justify="space-between"
              loading={runLoading}
              rightSection={
                costLoading ? (
                  <Loader type="dots" color="gray.4" size="sm" />
                ) : latestCost != null ? (
                  <CostBadge cost={latestCost} size="sm" clickable={false} />
                ) : null
              }
            >
              Generate
            </Button>
          </Box>
        </form>
      </FormProvider>
      {isMobile && (
        <GenerationsHistoryModal
          title={selectedModel.model_name || "Run history"}
          opened={runHistoryModalOpened}
          onClose={closeRunHistoryModal}
        />
      )}
    </Box>
  );
}
