import { Button } from "@mantine/core";
import { RiAddLine } from "@remixicon/react";
import useCharactersStore, { type CharacterFormValues } from "~/lib/stores/charactersStore";
import { CharacterUpsertModal } from "~/pages/characters/components/CharacterUpsertModal";
import { useDisclosure } from "@mantine/hooks";
import { useNavigate } from "react-router";

export function CreateCharacterModal() {
  const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
  const createCharacter = useCharactersStore((s) => s.createCharacter);
  const createLoading = useCharactersStore((s) => s.createLoading);
  const navigate = useNavigate();
  const handleCreate = async (values: CharacterFormValues) => {
    const created = await createCharacter(values);
    if (!created?.id) return;
    closeCreate();
    navigate(`/characters/${encodeURIComponent(created.id)}`);
  };

  return (
    <>
      <Button size="xs" leftSection={<RiAddLine size={18} />} onClick={openCreate}>
        New
      </Button>
      <CharacterUpsertModal
        opened={createOpened}
        onClose={closeCreate}
        title="Create character"
        submitLabel="Create character"
        submitting={createLoading}
        showUseVoiceProfileButton
        onSubmit={handleCreate}
      />
    </>
  );
}
