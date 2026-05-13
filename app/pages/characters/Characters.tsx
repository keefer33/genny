import {
  Box,
  Card,
  Container,
  Group,
  Loader,
  ScrollArea,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { RiUserVoiceLine } from "@remixicon/react";
import { useEffect } from "react";
import { useCharactersRealtime } from "~/lib/hooks/useUserRealtimeChannels";
import useAppStore from "~/lib/stores/appStore";
import useCharactersStore from "~/lib/stores/charactersStore";
import { CharacterCard } from "~/pages/characters/components/CharacterCard";
import { CreateCharacterFromLibrary } from "~/pages/characters/components/CreateCharacterFromLibrary";
import { AppPagination } from "~/shared/AppPagination";

export function meta() {
  return [{ title: "Characters" }];
}

export default function Characters() {
  const { getUser, isMobile } = useAppStore();
  const user = getUser();
  const userId = user?.user?.id ?? "";
  useCharactersRealtime(userId || undefined);

  const {
    characters,
    charactersLoading,
    charactersPage,
    charactersLimit,
    charactersTotal,
    error,
    loadCharacters,
  } = useCharactersStore();

  useEffect(() => {
    if (!userId) return;
    void loadCharacters(userId);
  }, [userId, loadCharacters]);

  const totalPages = Math.max(1, Math.ceil(charactersTotal / Math.max(1, charactersLimit)));
  const showPagination = charactersTotal > 0 && totalPages > 1;

  return (
    <Box
      h="calc(100dvh - var(--app-shell-header-height, 60px) - var(--app-shell-footer-height, 0px))"
      style={{ minHeight: 0, display: "flex", flexDirection: "column" }}
    >
      <Stack gap="md" style={{ flex: 1, minHeight: 0 }}>
        <Container size="xl">
          <Group justify="space-between" align="flex-start" wrap="wrap">
            <Group gap="sm">
              <RiUserVoiceLine size={28} />
              <Title order={2}>Characters</Title>
            </Group>
            <CreateCharacterFromLibrary />
          </Group>
        </Container>
        {error ? (
          <Text size="sm" c="red">
            {error}
          </Text>
        ) : null}

        {charactersLoading && characters.length === 0 ? (
          <Group justify="center" py="xl" style={{ flex: 1 }}>
            <Loader />
          </Group>
        ) : (
          <Box style={{ flex: 1, minHeight: 0, minWidth: 0, position: "relative" }}>
            {charactersLoading ? (
              <Group
                justify="center"
                py="xs"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  zIndex: 1,
                  pointerEvents: "none",
                }}
              >
                <Loader size="sm" />
              </Group>
            ) : null}
            <ScrollArea h="100%" type="auto">
              <Container size="xl">
                {characters.length === 0 ? (
                  <Card withBorder radius="md" p="lg">
                    <Text c="dimmed" ta="center">
                      {"No characters yet. "}
                      Use &quot;New character&quot; to pick a voice from the library.
                    </Text>
                  </Card>
                ) : (
                  <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md" pb="sm">
                    {characters.map((c) => (
                      <CharacterCard key={c.id} character={c} />
                    ))}
                  </SimpleGrid>
                )}
              </Container>
            </ScrollArea>
          </Box>
        )}

        {showPagination ? (
          <Group justify="center" pb={isMobile ? 0 : "md"} style={{ flexShrink: 0 }}>
            <AppPagination
              mobileVisibleItems={isMobile ? 4 : 7}
              total={totalPages}
              value={charactersPage + 1}
              onChange={(mantinePage) => void loadCharacters(userId, { page: mantinePage - 1 })}
              size="md"
            />
          </Group>
        ) : null}
      </Stack>
    </Box>
  );
}
