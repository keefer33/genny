import {
  Box,
  Button,
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
import { useDisclosure } from "@mantine/hooks";
import { RiAddLine, RiUserVoiceLine } from "@remixicon/react";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useCharactersRealtime } from "~/lib/hooks/useUserRealtimeChannels";
import useAppStore from "~/lib/stores/appStore";
import useCharactersStore from "~/lib/stores/charactersStore";
import { CharacterCard } from "~/pages/characters/components/CharacterCard";
import {
  CreateCharacterModal,
  type CreateCharacterPayload,
} from "~/pages/characters/components/CreateCharacterModal";
import { AppPagination } from "~/shared/AppPagination";

export function meta() {
  return [{ title: "Characters" }];
}

export default function Characters() {
  const navigate = useNavigate();
  const { getUser, isMobile } = useAppStore();
  const user = getUser();
  const userId = user?.user?.id ?? "";
  useCharactersRealtime(userId || undefined);

  const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);

  const {
    characters,
    charactersLoading,
    charactersPage,
    charactersLimit,
    charactersTotal,
    createLoading,
    error,
    loadCharacters,
    createCharacter,
  } = useCharactersStore();

  useEffect(() => {
    if (!userId) return;
    void loadCharacters(userId);
  }, [userId, loadCharacters]);

  const hasPendingCharacter = characters.some((c) => (c.status ?? "").toLowerCase() === "pending");

  useEffect(() => {
    if (!userId || !hasPendingCharacter) return;
    const intervalId = setInterval(() => {
      void loadCharacters(userId, { page: charactersPage, limit: charactersLimit });
    }, 3000);
    return () => clearInterval(intervalId);
  }, [userId, hasPendingCharacter, charactersPage, charactersLimit, loadCharacters]);

  const totalPages = Math.max(1, Math.ceil(charactersTotal / Math.max(1, charactersLimit)));
  const showPagination = charactersTotal > 0 && totalPages > 1;

  const handleCreateSubmit = async (payload: CreateCharacterPayload) => {
    if (!userId) return;
    const character = await createCharacter(userId, payload);
    if (character?.id) {
      closeCreate();
      navigate(`/characters/${character.id}`);
    }
  };

  return (
    <Box
      h="calc(100dvh - var(--app-shell-header-height, 60px) - var(--app-shell-footer-height, 0px))"
      style={{ minHeight: 0, display: "flex", flexDirection: "column" }}
    >
      <CreateCharacterModal
        opened={createOpened}
        onClose={closeCreate}
        userId={userId}
        submitting={createLoading}
        onSubmit={(payload) => void handleCreateSubmit(payload)}
      />

      <Stack gap="md" style={{ flex: 1, minHeight: 0 }}>
        <Container size="xl">
          <Group justify="space-between" align="flex-start" wrap="wrap">
            <Group gap="sm">
              <RiUserVoiceLine size={28} />
              <Title order={2}>Characters</Title>
            </Group>
            <Button
              leftSection={<RiAddLine size={18} />}
              onClick={openCreate}
              loading={createLoading}
            >
              New character
            </Button>
          </Group>
        </Container>
        {error ? (
          <Container size="xl">
            <Text size="sm" c="red">
              {error}
            </Text>
          </Container>
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
                    <Stack gap="md" align="center">
                      <Text c="dimmed" ta="center">
                        No characters yet. Pick a voice from the library to create your first
                        character.
                      </Text>
                      <Button leftSection={<RiAddLine size={18} />} onClick={openCreate}>
                        Create your first character
                      </Button>
                    </Stack>
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
