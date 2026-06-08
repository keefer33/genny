import type { CharacterFormValues, UserCharacter } from "~/lib/stores/charactersStore";
import { CharacterUpsertModal } from "~/pages/characters/components/CharacterUpsertModal";
import { characterFormValuesFromRow } from "~/pages/characters/characterUtils";

type EditCharacterModalProps = {
  opened: boolean;
  character: UserCharacter | null;
  onClose: () => void;
  submitting?: boolean;
  onSubmit: (values: CharacterFormValues) => void;
};

export function EditCharacterModal({
  opened,
  character,
  onClose,
  submitting = false,
  onSubmit,
}: EditCharacterModalProps) {
  const initialValues = character ? characterFormValuesFromRow(character) : undefined;
  return (
    <CharacterUpsertModal
      opened={opened}
      onClose={onClose}
      title="Edit character"
      submitLabel="Save"
      submitting={submitting}
      initialValues={initialValues}
      onSubmit={onSubmit}
    />
  );
}
