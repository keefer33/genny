/**
 * Resolves the effective enum for a field that may have conditional enum values.
 * Supports field-level `conditions`: either a single object or array of { fields: [{ field, value }], values: any[] }.
 * First matching condition (all dependency field values equal) wins; otherwise falls back to fieldSchema.enum.
 */
export function getEffectiveEnum(
  fieldSchema: any,
  formValues: any,
  fieldPrefix: string = ""
): any[] {
  const baseEnum = Array.isArray(fieldSchema.enum) ? fieldSchema.enum : [];
  const conditions = fieldSchema.conditions;
  if (!conditions) return baseEnum;

  const list = Array.isArray(conditions) ? conditions : [conditions];
  const getNested = (obj: any, path: string) =>
    path
      .split(".")
      .reduce((cur: any, key) => (cur && cur[key] !== undefined ? cur[key] : undefined), obj);

  for (const cond of list) {
    const fields = cond.fields as Array<{ field: string; value: any }> | undefined;
    const values = cond.values;
    if (!Array.isArray(fields) || !Array.isArray(values)) continue;
    const allMatch = fields.every(({ field, value: condValue }) => {
      const path = fieldPrefix ? `${fieldPrefix}.${field}` : field;
      const formVal = getNested(formValues, path);
      return formVal == condValue;
    });
    if (allMatch) return values;
  }
  return baseEnum;
}
