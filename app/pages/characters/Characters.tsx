import {
  Box,
  Button,
  Container,
  Group,
  Loader,
  Modal,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { RiTeamLine } from "@remixicon/react";
import { useEffect, useState } from "react";
import useAppStore from "~/lib/stores/appStore";
import useCharactersStore, { type UserCharacter } from "~/lib/stores/charactersStore";
import { CharacterCard } from "~/pages/characters/components/CharacterCard";
import { CreateCharacterFromLibraryModal } from "~/pages/characters/components/CreateCharacterFromLibraryModal";
import { CreateCharacterModal } from "~/pages/characters/components/CreateCharacterModal";

export function meta() {
  return [{ title: "Characters" }];
}

export default function Characters() {
  const isMobile = useAppStore((s) => s.isMobile);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const [deletingCharacter, setDeletingCharacter] = useState<UserCharacter | null>(null);

  const characters = useCharactersStore((s) => s.characters);
  const charactersLoading = useCharactersStore((s) => s.charactersLoading);
  const deleteLoading = useCharactersStore((s) => s.deleteLoading);
  const loadCharacters = useCharactersStore((s) => s.loadCharacters);
  const deleteCharacter = useCharactersStore((s) => s.deleteCharacter);

  useEffect(() => {
    void loadCharacters();
  }, [loadCharacters]);

  return (
    <Container size="lg" py="md" px={isMobile ? "sm" : "md"}>
      <Stack gap="xl">
        <Group justify="space-between" align="flex-end" wrap="wrap">
          <Stack gap={4}>
            <Title order={2}>Characters</Title>
            <Text c="dimmed" size="sm">
              Create and manage characters for your projects.
            </Text>
          </Stack>
          <Group gap="xs">
            <CreateCharacterModal />
            <CreateCharacterFromLibraryModal />
          </Group>
        </Group>

        <Modal
          opened={deleteOpened}
          onClose={() => {
            if (deleteLoading) return;
            closeDelete();
            setDeletingCharacter(null);
          }}
          title="Delete character?"
          centered
        >
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              {deletingCharacter?.name
                ? `Remove "${deletingCharacter.name}"? This cannot be undone.`
                : "Remove this character? This cannot be undone."}
            </Text>
            <Group justify="flex-end" gap="xs">
              <Button
                variant="default"
                onClick={() => {
                  closeDelete();
                  setDeletingCharacter(null);
                }}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button
                color="red"
                loading={deleteLoading}
                onClick={async () => {
                  if (!deletingCharacter?.id) return;
                  const ok = await deleteCharacter(deletingCharacter.id);
                  if (ok) {
                    closeDelete();
                    setDeletingCharacter(null);
                  }
                }}
              >
                Delete
              </Button>
            </Group>
          </Stack>
        </Modal>

        <Stack gap="md">
          <Group gap="xs">
            <RiTeamLine size={20} />
            <Title order={4}>Your characters</Title>
          </Group>
          {charactersLoading && characters.length === 0 ? (
            <Group justify="center" py="lg">
              <Loader size="sm" />
            </Group>
          ) : characters.length === 0 ? (
            <Box py="md">
              <Text c="dimmed" size="sm">
                You have not created any characters yet. Use New character or From library to add
                one.
              </Text>
            </Box>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
              {characters.map((character) => (
                <CharacterCard
                  key={character.id}
                  character={character}
                  onDelete={(c) => {
                    setDeletingCharacter(c);
                    openDelete();
                  }}
                />
              ))}
            </SimpleGrid>
          )}
        </Stack>
      </Stack>
    </Container>
  );
}
