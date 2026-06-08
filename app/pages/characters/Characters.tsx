import { Box, Container, Group, Loader, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { RiTeamLine } from "@remixicon/react";
import { useEffect } from "react";
import useAppStore from "~/lib/stores/appStore";
import useCharactersStore from "~/lib/stores/charactersStore";
import { CharacterCard } from "~/pages/characters/components/CharacterCard";
import { CreateCharacterFromLibraryModal } from "~/pages/characters/components/CreateCharacterFromLibraryModal";
import { CreateCharacterModal } from "~/pages/characters/components/CreateCharacterModal";

export function meta() {
  return [{ title: "Characters" }];
}

export default function Characters() {
  const isMobile = useAppStore((s) => s.isMobile);

  const characters = useCharactersStore((s) => s.characters);
  const charactersLoading = useCharactersStore((s) => s.charactersLoading);
  const loadCharacters = useCharactersStore((s) => s.loadCharacters);

  useEffect(() => {
    void loadCharacters();
  }, [loadCharacters]);

  return (
    <Container size="lg" py="md" px={isMobile ? "sm" : "md"}>
      <Stack gap="xl">
        <Group justify="space-between" align="flex-end" wrap="wrap">
          <Stack gap={4}>
            <Group gap={4}>
              <RiTeamLine size={24} />
              <Title order={2}>Characters</Title>
            </Group>
            <Text c="dimmed" size="sm">
              Create and manage characters for your projects.
            </Text>
          </Stack>
          <Group gap="xs">
            <CreateCharacterModal />
            <CreateCharacterFromLibraryModal />
          </Group>
        </Group>

        <Stack gap="md">
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
                <CharacterCard key={character.id} characterId={character.id} />
              ))}
            </SimpleGrid>
          )}
        </Stack>
      </Stack>
    </Container>
  );
}
