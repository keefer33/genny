import type { FileTypeFilter } from "~/lib/stores/filesFoldersStore";
import { AddMediaZone } from "~/pages/generate/components/x-ui-components/MediaFilePicker/AddMediaZone";
import { PickerMediaRow } from "~/pages/generate/components/x-ui-components/MediaFilePicker/PickerMediaRow";

type SceneBackgroundMediaFieldProps = {
  label: string;
  allowedTypes: FileTypeFilter;
  value: string;
  onChange: (url: string) => void;
};

export function SceneBackgroundMediaField({
  label,
  allowedTypes,
  value,
  onChange,
}: SceneBackgroundMediaFieldProps) {
  const trimmed = value.trim();
  if (trimmed) {
    return (
      <PickerMediaRow
        fileUrl={trimmed}
        allowedTypes={allowedTypes}
        modalTitle={`Select ${label}`}
        onReplace={(path) => onChange(path)}
        onRemove={() => onChange("")}
        allowChange
      />
    );
  }

  return (
    <AddMediaZone
      selectLabel={`Select ${label}`}
      modalTitle={`Select ${label}`}
      allowedTypes={allowedTypes}
      onPickPath={onChange}
      onAddUrl={onChange}
    />
  );
}
