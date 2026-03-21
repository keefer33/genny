import { ActionIcon, Group, TextInput } from "@mantine/core";
import { FilePickerPreview } from "./FilePickerPreview";

export function StringArrayItem({
  item,
  index,
  fieldName,
  fieldSchema,
  updateItem,
  removeItem,
  autoOpen = false,
}: {
  item: string;
  index: number;
  fieldName: string;
  fieldSchema: any;
  updateItem: (index: number, value: string) => void;
  removeItem: (index: number) => void;
  autoOpen?: boolean;
}) {
  if (fieldSchema.display === "filePicker") {
    const allowedTypes =
      fieldSchema.types === "images" || fieldSchema.types === "videos" ? fieldSchema.types : "all";

    const handleFileSelect = (fileUrl: string, _file?: any) => {
      updateItem(index, fileUrl);
    };

    const handleClear = () => {
      removeItem(index);
    };

    return (
      <FilePickerPreview
        fileUrl={item || ""}
        placeholder={`Select ${fieldSchema.title || fieldName} ${index + 1}`}
        onSelect={() => {}}
        onClear={handleClear}
        onFileSelect={handleFileSelect}
        allowedTypes={allowedTypes}
        title={`Select ${fieldSchema.title || fieldName} ${index + 1}`}
        autoOpen={autoOpen}
      />
    );
  }

  return (
    <Group gap="sm" align="flex-end">
      <TextInput
        placeholder={fieldSchema.placeholder || `Enter ${fieldName} ${index + 1}`}
        value={item}
        onChange={(event) => updateItem(index, event.currentTarget.value)}
        style={{ flex: 1 }}
      />
      <ActionIcon size="sm" variant="light" color="red" onClick={() => removeItem(index)}>
        ×
      </ActionIcon>
    </Group>
  );
}
