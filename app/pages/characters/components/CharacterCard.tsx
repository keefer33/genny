import { ActionIcon, Card, Group, Image, Loader, Stack, Text, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { RiDeleteBinLine, RiPencilLine, RiTeamLine } from "@remixicon/react";
import { useEffect, useMemo, type MouseEvent } from "react";
import { useNavigate } from "react-router";
import useCharactersStore from "~/lib/stores/charactersStore";
import { characterMetaLine } from "~/pages/characters/characterUtils";
import { CharacterDeleteModal } from "~/pages/characters/components/CharacterDeleteModal";
import { EditCharacterModal } from "~/pages/characters/components/EditCharacterModal";

type CharacterCardProps = {
  characterId: string;
  listMode?: boolean;
  onDeleted?: () => void;
};

export function CharacterCard({ characterId, listMode = false, onDeleted }: CharacterCardProps) {
  const navigate = useNavigate();
  const characters = useCharactersStore((s) => s.characters);
  const selectedCharacter = useCharactersStore((s) => s.selectedCharacter);
  const selectedCharacterLoading = useCharactersStore((s) => s.selectedCharacterLoading);
  const fetchCharacterById = useCharactersStore((s) => s.fetchCharacterById);
  const updateCharacter = useCharactersStore((s) => s.updateCharacter);
  const deleteCharacter = useCharactersStore((s) => s.deleteCharacter);
  const updateLoading = useCharactersStore((s) => s.updateLoading);
  const deleteLoading = useCharactersStore((s) => s.deleteLoading);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);

  const character = useMemo(() => {
    if (selectedCharacter?.id === characterId) return selectedCharacter;
    return characters.find((row) => row.id === characterId) ?? null;
  }, [selectedCharacter, characters, characterId]);

  useEffect(() => {
    if (character) return;
    void fetchCharacterById(characterId, { silent: true });
  }, [character, characterId, fetchCharacterById]);

  const loading = !character && selectedCharacterLoading;

  if (loading) {
    return (
      <Card radius="md" padding="md" shadow="sm">
        <Group justify="center" py="lg">
          <Loader size="sm" />
        </Group>
      </Card>
    );
  }

  if (!character) {
    return (
      <Card radius="md" padding="md" shadow="sm">
        <Text size="sm" c="dimmed">
          Character not found.
        </Text>
      </Card>
    );
  }

  const meta = characterMetaLine(character);

  const goToLooks = () => navigate(`/characters/${encodeURIComponent(character.id)}/looks`);

  const openCharacterAction = (action: () => void) => (event: MouseEvent) => {
    event.stopPropagation();
    action();
  };

  return (
    <>
      <Card
        radius="md"
        padding="md"
        shadow="sm"
        role={listMode ? "button" : undefined}
        tabIndex={listMode ? 0 : undefined}
        onClick={listMode ? goToLooks : undefined}
        onKeyDown={
          listMode
            ? (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  goToLooks();
                }
              }
            : undefined
        }
        style={listMode ? { cursor: "pointer" } : undefined}
      >
        <Stack gap="md">
          <Group align="flex-start" wrap="nowrap" gap="md">
            <Card
              radius="md"
              p={0}
              style={{
                width: 100,
                height: 100,
                flexShrink: 0,
                overflow: "hidden",
                background: "var(--mantine-color-dark-6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {character.baseLookThumbnailUrl ? (
                <Image src={character.baseLookThumbnailUrl} alt="" w={100} h={100} fit="cover" />
              ) : (
                <RiTeamLine size={32} style={{ opacity: 0.35 }} />
              )}
            </Card>

            <Stack gap="sm" style={{ flex: 1, minWidth: 0 }}>
              <Group justify="space-between" wrap="nowrap" align="flex-start">
                <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                  <Text fw={600} lineClamp={1}>
                    {character.name || "Unnamed character"}
                  </Text>
                  {meta ? (
                    <Text size="xs" c="dimmed" lineClamp={1}>
                      {meta}
                    </Text>
                  ) : null}
                </Stack>
                <Group gap={4} wrap="nowrap">
                  <Tooltip label="Edit">
                    <ActionIcon
                      variant="subtle"
                      aria-label="Edit character"
                      onClick={openCharacterAction(openEdit)}
                    >
                      <RiPencilLine size={18} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Delete">
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      aria-label="Delete character"
                      onClick={openCharacterAction(openDelete)}
                    >
                      <RiDeleteBinLine size={18} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Group>
              <Text
                size="sm"
                c="dimmed"
                lineClamp={2}
                title={character.description?.trim() || undefined}
              >
                {character.description?.trim() || "No description"}
              </Text>
            </Stack>
          </Group>
        </Stack>
      </Card>

      <EditCharacterModal
        opened={editOpened}
        character={character}
        submitting={updateLoading}
        onClose={closeEdit}
        onSubmit={async (values) => {
          const ok = await updateCharacter(character.id, values);
          if (ok) closeEdit();
        }}
      />

      <CharacterDeleteModal
        opened={deleteOpened}
        characterName={character.name}
        loading={deleteLoading}
        onClose={closeDelete}
        onConfirm={async () => {
          const ok = await deleteCharacter(character.id);
          if (ok) {
            closeDelete();
            onDeleted?.();
          }
        }}
      />
    </>
  );
}
