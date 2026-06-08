import {
  ActionIcon,
  Button,
  Card,
  Group,
  Image,
  Loader,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { RiDeleteBinLine, RiPencilLine, RiTeamLine } from "@remixicon/react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import useCharactersStore, { type UserCharacter } from "~/lib/stores/charactersStore";
import { characterMetaLine } from "~/pages/characters/characterUtils";
import { CharacterDeleteModal } from "~/pages/characters/components/CharacterDeleteModal";
import { EditCharacterModal } from "~/pages/characters/components/EditCharacterModal";

type CharacterCardProps = {
  characterId: string;
  onDeleted?: () => void;
};

export function CharacterCard({ characterId, onDeleted }: CharacterCardProps) {
  const characters = useCharactersStore((s) => s.characters);
  const fetchCharacterById = useCharactersStore((s) => s.fetchCharacterById);
  const updateCharacter = useCharactersStore((s) => s.updateCharacter);
  const deleteCharacter = useCharactersStore((s) => s.deleteCharacter);
  const updateLoading = useCharactersStore((s) => s.updateLoading);
  const deleteLoading = useCharactersStore((s) => s.deleteLoading);

  const [character, setCharacter] = useState<UserCharacter | null>(
    () => characters.find((row) => row.id === characterId) ?? null
  );
  const [loading, setLoading] = useState(!character);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);

  const loadCharacter = useCallback(async () => {
    const row = await fetchCharacterById(characterId);
    setCharacter(row);
    setLoading(false);
    return row;
  }, [characterId, fetchCharacterById]);

  useEffect(() => {
    const fromList = characters.find((row) => row.id === characterId);
    if (fromList) {
      setCharacter(fromList);
    }
  }, [characters, characterId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchCharacterById(characterId).then((row) => {
      if (cancelled) return;
      setCharacter(row);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [characterId, fetchCharacterById]);

  if (loading && !character) {
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

  return (
    <>
      <Card radius="md" padding="md" shadow="sm">
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
                    <ActionIcon variant="subtle" aria-label="Edit character" onClick={openEdit}>
                      <RiPencilLine size={18} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Delete">
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      aria-label="Delete character"
                      onClick={openDelete}
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

          <Group gap="xs" grow>
            <Button
              component={Link}
              to={`/characters/${encodeURIComponent(character.id)}/looks`}
              variant="filled"
              size="compact-sm"
            >
              Looks
            </Button>
            <Button
              component={Link}
              to={`/characters/${encodeURIComponent(character.id)}/scenes`}
              variant="filled"
              size="compact-sm"
            >
              Scenes
            </Button>
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
          if (ok) {
            closeEdit();
            await loadCharacter();
          }
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
