import { ActionIcon, Button, Card, Group, Input, Stack, Text } from "@mantine/core";
import { RiAddLine, RiDeleteBinLine } from "@remixicon/react";
import type { ReactNode } from "react";
import { useFormContext } from "~/lib/ContextForm";
import type { JsonSchemaProperty } from "~/types/generations";
import {
  getFormValueAtPath,
  newArrayObjectRow,
  schemaPathDisplayLabel,
  isObjectArrayItemsSchema,
} from "./ModelSchemaForm.utils";
import { SchemaNestedFields } from "./SchemaNestedFields";

type SchemaObjectArrayFieldProps = {
  arrayKey: string;
  prop: JsonSchemaProperty;
  labelWithHelp: ReactNode;
  description?: ReactNode;
  isRequired: boolean;
  readOnly: boolean;
  generationType: "image" | "video" | "audio";
  conditionDisabledFields: Set<string>;
  showRequiredStarInLabel?: boolean;
};

export function SchemaObjectArrayField({
  arrayKey,
  prop,
  labelWithHelp,
  description,
  isRequired,
  readOnly,
  generationType,
  conditionDisabledFields,
  showRequiredStarInLabel = true,
}: SchemaObjectArrayFieldProps) {
  const form = useFormContext();
  const items = prop.items;
  if (!isObjectArrayItemsSchema(prop)) return null;

  const tupleItemSchemas = Array.isArray(items)
    ? (items as (JsonSchemaProperty & {
        type: "object";
        properties: Record<string, JsonSchemaProperty>;
      })[])
    : null;
  const homogeneousItemSchema =
    !tupleItemSchemas && items && typeof items === "object" && !Array.isArray(items)
      ? (items as JsonSchemaProperty & {
          type: "object";
          properties: Record<string, JsonSchemaProperty>;
        })
      : null;

  const minItems = typeof prop.minItems === "number" ? prop.minItems : 0;
  const maxItems = typeof prop.maxItems === "number" ? prop.maxItems : 99;
  const fixedLengthTuple =
    tupleItemSchemas != null &&
    minItems > 0 &&
    minItems === maxItems &&
    maxItems === tupleItemSchemas.length;

  const arrayDisplayName = schemaPathDisplayLabel(arrayKey);
  const raw = getFormValueAtPath(form.values, arrayKey);
  const rows: Record<string, unknown>[] = Array.isArray(raw)
    ? (raw as Record<string, unknown>[]).map((r) =>
        r && typeof r === "object" && !Array.isArray(r) ? r : {}
      )
    : [];

  const itemSchemaAtIndex = (index: number) => tupleItemSchemas?.[index] ?? homogeneousItemSchema!;

  const addRow = () => {
    if (fixedLengthTuple || rows.length >= maxItems) return;
    form.setFieldValue(arrayKey, [...rows, newArrayObjectRow(homogeneousItemSchema!)]);
  };

  const removeRow = (idx: number) => {
    if (fixedLengthTuple || rows.length <= minItems) return;
    form.setFieldValue(
      arrayKey,
      rows.filter((_, i) => i !== idx)
    );
  };

  return (
    <Input.Wrapper
      id={arrayKey}
      label={rows.length >= 0 ? labelWithHelp : undefined}
      description={rows.length > 0 ? description : undefined}
      error={form.errors[arrayKey] as string | undefined}
      required={isRequired}
      withAsterisk={showRequiredStarInLabel && isRequired ? false : undefined}
    >
      <Stack gap="md" mt={rows.length > 0 ? "xs" : 0}>
        {rows.length > 0 &&
          rows.map((row, index) => {
            const rowKey =
              row &&
              typeof row === "object" &&
              !Array.isArray(row) &&
              typeof (row as { __rowKey?: unknown }).__rowKey === "string"
                ? ((row as { __rowKey: string }).__rowKey as string)
                : `${arrayKey}-idx-${index}`;
            const rowPathPrefix = `${arrayKey}.${index}`;
            const slotSchema = itemSchemaAtIndex(index);
            const showSlotToggleButtons = Boolean(
              tupleItemSchemas?.[index]?.["x-object-add-delete-buttons"]
            );
            const rowObj =
              row && typeof row === "object" && !Array.isArray(row)
                ? (row as Record<string, unknown>)
                : undefined;
            /** Expanded only when explicitly false; default + true = collapsed (Add only). */
            const slotExpanded = showSlotToggleButtons && rowObj?.__slotCollapsed === false;
            const slotCollapsed = showSlotToggleButtons && !slotExpanded;

            const resetSlotRow = (collapsed: boolean) => {
              const next = newArrayObjectRow(slotSchema) as Record<string, unknown>;
              next.__slotCollapsed = collapsed;
              form.setFieldValue(rowPathPrefix, next);
            };

            return (
              <Card key={rowKey} p="xs" radius="md">
                <Group justify="space-between" align="center" wrap="nowrap">
                  <Text size="sm" fw={600}>
                    {tupleItemSchemas?.[index]?.title
                      ? String(tupleItemSchemas[index].title)
                      : `${arrayDisplayName} ${index + 1}`}
                  </Text>
                  {showSlotToggleButtons ? (
                    <Group gap="xs" wrap="nowrap">
                      {slotCollapsed ? (
                        <ActionIcon
                          variant="transparent"
                          size="sm"
                          aria-label={`Add ${tupleItemSchemas?.[index]?.title ?? arrayDisplayName}`}
                          title="Add"
                          disabled={readOnly}
                          onClick={() => resetSlotRow(false)}
                        >
                          <RiAddLine size={18} />
                        </ActionIcon>
                      ) : (
                        <ActionIcon
                          variant="transparent"
                          color="red"
                          size="sm"
                          aria-label={`Delete ${tupleItemSchemas?.[index]?.title ?? arrayDisplayName}`}
                          title="Delete"
                          disabled={readOnly}
                          onClick={() => resetSlotRow(true)}
                        >
                          <RiDeleteBinLine size={18} />
                        </ActionIcon>
                      )}
                    </Group>
                  ) : (
                    <ActionIcon
                      variant="light"
                      color="red"
                      aria-label={`Remove ${arrayDisplayName} ${index + 1}`}
                      disabled={readOnly || fixedLengthTuple || rows.length <= minItems}
                      onClick={() => removeRow(index)}
                    >
                      <RiDeleteBinLine size={18} />
                    </ActionIcon>
                  )}
                </Group>
                {!(showSlotToggleButtons && slotCollapsed) && (
                  <Stack gap="md">
                    <SchemaNestedFields
                      pathPrefix={rowPathPrefix}
                      objectSchema={slotSchema}
                      readOnly={readOnly}
                      generationType={generationType}
                      conditionDisabledFields={conditionDisabledFields}
                      showRequiredStarInLabel={false}
                    />
                  </Stack>
                )}
              </Card>
            );
          })}

        <Button
          type="button"
          variant="light"
          leftSection={<RiAddLine size={18} />}
          disabled={readOnly || fixedLengthTuple || rows.length >= maxItems}
          onClick={addRow}
          aria-label={`Add ${arrayDisplayName}`}
        >
          Add {arrayDisplayName}
        </Button>
        {rows.length > 0 ? (
          <Text size="xs" c="dimmed">
            {rows.length} / {maxItems} item{maxItems === 1 ? "" : "s"}
            {minItems > 0 ? ` (min ${minItems})` : ""}
          </Text>
        ) : null}
      </Stack>
    </Input.Wrapper>
  );
}
