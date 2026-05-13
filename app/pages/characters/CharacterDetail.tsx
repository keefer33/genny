import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Group,
  Image,
  Loader,
  Modal,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { RiArrowLeftLine, RiDeleteBinLine, RiErrorWarningLine } from "@remixicon/react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useCharacterDetailRealtime } from "~/lib/hooks/useUserRealtimeChannels";
import useAppStore from "~/lib/stores/appStore";
import useCharactersStore, { type UserCharacter } from "~/lib/stores/charactersStore";
import {
  firstGeneration,
  firstGenerationThumbUrl,
  voicePreviewUrl,
} from "~/pages/characters/characterFileUtils";

export function meta() {
  return [{ title: "Character" }];
}

function GenerationPreview({ files, name }: { files: unknown; name: string | null }) {
  const generation = firstGeneration(files);
  const generationStatus = (generation?.status ?? "").toLowerCase();
  const thumbUrl = firstGenerationThumbUrl(files);
  const showLoader = generationStatus === "pending" || generationStatus === "processing";
  const showErr = generationStatus === "error";

  if (showLoader) {
    return (
      <Group
        w="100%"
        mih={200}
        justify="center"
        style={{ borderRadius: 8, border: "1px solid var(--mantine-color-gray-3)" }}
      >
        <Loader size="md" />
      </Group>
    );
  }
  if (showErr) {
    return (
      <Group
        w="100%"
        mih={200}
        justify="center"
        style={{ borderRadius: 8, border: "1px solid var(--mantine-color-red-3)" }}
      >
        <ThemeIcon size="xl" color="red" variant="light" radius="xl">
          <RiErrorWarningLine size={22} />
        </ThemeIcon>
      </Group>
    );
  }
  if (thumbUrl) {
    return (
      <Image
        src={thumbUrl}
        alt={name ?? "Character generation"}
        radius="md"
        mah={360}
        fit="contain"
      />
    );
  }
  return null;
}

export default function CharacterDetail() {
  const { characterId } = useParams<{ characterId: string }>();
  const navigate = useNavigate();
  const { getUser } = useAppStore();
  const userId = getUser()?.user?.id ?? "";
  const fetchCharacterById = useCharactersStore((s) => s.fetchCharacterById);
  const deleteCharacter = useCharactersStore((s) => s.deleteCharacter);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [character, setCharacter] = useState<UserCharacter | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const id = characterId?.trim();
    if (!userId || !id) return;
    setLoading(true);
    const row = await fetchCharacterById(userId, id);
    setLoading(false);
    if (!row) {
      navigate("/characters", { replace: true });
      return;
    }
    setCharacter(row);
  }, [userId, characterId, fetchCharacterById, navigate]);

  useEffect(() => {
    if (!characterId?.trim()) {
      navigate("/characters", { replace: true });
      return;
    }
    void refresh();
  }, [characterId, refresh, navigate]);

  useCharacterDetailRealtime(userId || undefined, characterId, () => {
    void refresh();
  });

  const url = character ? voicePreviewUrl(character.files) : null;

  const handleConfirmDelete = async () => {
    if (!userId || !characterId?.trim()) return;
    setDeleteBusy(true);
    const ok = await deleteCharacter(userId, characterId);
    setDeleteBusy(false);
    if (ok) {
      closeDelete();
      navigate("/characters", { replace: true });
    }
  };

  return (
    <Container size="md" py="md">
      <Modal
        opened={deleteOpened}
        onClose={closeDelete}
        title="Delete character"
        centered
        size="sm"
      >
        <Stack gap="md">
          <Text size="sm">
            Permanently delete &quot;{character?.name ?? "this character"}&quot; and all generated
            files?
          </Text>
          <Text size="sm">This cannot be undone.</Text>
          <Group justify="flex-end" gap="xs">
            <Button variant="default" onClick={closeDelete} disabled={deleteBusy}>
              Cancel
            </Button>
            <Button color="red" onClick={() => void handleConfirmDelete()} loading={deleteBusy}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
      <Stack gap="lg">
        <Group justify="space-between" wrap="nowrap" align="center">
          <Button
            component={Link}
            to="/characters"
            variant="subtle"
            leftSection={<RiArrowLeftLine size={18} />}
            pl={0}
          >
            All characters
          </Button>
          {character ? (
            <Button
              color="red"
              variant="light"
              leftSection={<RiDeleteBinLine size={18} />}
              onClick={openDelete}
            >
              Delete
            </Button>
          ) : null}
        </Group>

        {loading && !character ? (
          <Group justify="center" py="xl">
            <Loader />
          </Group>
        ) : character ? (
          <Card withBorder radius="md" padding="lg" shadow="sm">
            <Stack gap="md">
              <Group justify="space-between" wrap="nowrap" align="flex-start">
                <Title order={2}>{character.name ?? "Unnamed character"}</Title>
                {character.featured ? (
                  <Badge size="sm" variant="light">
                    Featured
                  </Badge>
                ) : null}
              </Group>

              <Box pos="relative">
                {loading ? (
                  <Group
                    justify="center"
                    py="sm"
                    style={{ position: "absolute", inset: 0, zIndex: 1 }}
                  >
                    <Loader size="sm" />
                  </Group>
                ) : null}
                <GenerationPreview files={character.files} name={character.name} />
              </Box>

              {character.description ? (
                <Text size="sm" c="dimmed">
                  {character.description}
                </Text>
              ) : null}

              <Group gap="xs">
                {character.gender ? (
                  <Badge variant="outline" size="sm">
                    {character.gender}
                  </Badge>
                ) : null}
                {character.language ? (
                  <Badge variant="outline" size="sm">
                    {character.language}
                  </Badge>
                ) : null}
                {character.accent ? (
                  <Badge variant="outline" size="sm">
                    {character.accent}
                  </Badge>
                ) : null}
              </Group>

              {url ? (
                <Box onClick={(e) => e.stopPropagation()}>
                  <audio controls src={url} style={{ width: "100%", maxHeight: 48 }} />
                </Box>
              ) : null}
            </Stack>
          </Card>
        ) : null}
      </Stack>
    </Container>
  );
}
