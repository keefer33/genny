import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Image,
  Loader,
  Modal,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { RiDeleteBinLine, RiErrorWarningLine } from "@remixicon/react";
import { useState } from "react";
import { useNavigate } from "react-router";
import useAppStore from "~/lib/stores/appStore";
import useCharactersStore, { type UserCharacter } from "~/lib/stores/charactersStore";
import {
  firstGeneration,
  firstGenerationThumbUrl,
  voicePreviewUrl,
} from "~/pages/characters/characterFileUtils";

export function CharacterCard({ character }: { character: UserCharacter }) {
  const navigate = useNavigate();
  const userId = useAppStore((s) => s.getUser()?.user?.id ?? "");
  const deleteCharacter = useCharactersStore((s) => s.deleteCharacter);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const url = voicePreviewUrl(character.files);
  const generation = firstGeneration(character.files);
  const generationStatus = (generation?.status ?? "").toLowerCase();
  const thumbUrl = firstGenerationThumbUrl(character.files);
  const showGenerationLoader = generationStatus === "pending" || generationStatus === "processing";
  const showGenerationError = generationStatus === "error";

  const handleConfirmDelete = async () => {
    if (!userId) return;
    setDeleteBusy(true);
    const ok = await deleteCharacter(userId, character.id);
    setDeleteBusy(false);
    if (ok) closeDelete();
  };

  const goToDetail = () => navigate(`/characters/${character.id}`);

  return (
    <Card withBorder radius="md" padding="md" shadow="sm">
      <Modal
        opened={deleteOpened}
        onClose={closeDelete}
        title="Delete character"
        centered
        size="sm"
      >
        <Stack gap="md">
          <Text size="sm">
            Permanently delete{" "}
            <Text span fw={500} inherit>
              {character.name ?? "this character"}
            </Text>{" "}
            and all generated files?
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
      <Stack gap="xs">
        <Group justify="space-between" wrap="nowrap" align="flex-start" gap="sm">
          <Stack
            gap="xs"
            style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
            onClick={goToDetail}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                goToDetail();
              }
            }}
            tabIndex={0}
            role="link"
            aria-label={`Open ${character.name ?? "character"}`}
          >
            <Text fw={600} lineClamp={2}>
              {character.name ?? "Unnamed character"}
            </Text>
            <Group gap="xs" wrap="nowrap">
              <Box>
                {showGenerationLoader ? (
                  <Group
                    w={90}
                    h={90}
                    justify="center"
                    style={{ borderRadius: 8, border: "1px solid var(--mantine-color-gray-3)" }}
                  >
                    <Loader size="sm" />
                  </Group>
                ) : showGenerationError ? (
                  <Group
                    w={90}
                    h={90}
                    justify="center"
                    style={{ borderRadius: 8, border: "1px solid var(--mantine-color-red-3)" }}
                  >
                    <ThemeIcon size="lg" color="red" variant="light" radius="xl">
                      <RiErrorWarningLine size={18} />
                    </ThemeIcon>
                  </Group>
                ) : thumbUrl ? (
                  <Image
                    src={thumbUrl}
                    alt={character.name ?? "Character generation"}
                    radius="sm"
                    fit="contain"
                    w={90}
                    h={90}
                  />
                ) : null}
              </Box>
              <Stack gap="xs">
                {character.description ? (
                  <Text size="xs" c="dimmed" lineClamp={3}>
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
              </Stack>
            </Group>
          </Stack>
          <Group gap={4} wrap="nowrap">
            <ActionIcon
              variant="subtle"
              color="red"
              aria-label="Delete character"
              onClick={() => openDelete()}
            >
              <RiDeleteBinLine size={18} />
            </ActionIcon>
            {character.featured ? (
              <Badge size="sm" variant="light">
                Featured
              </Badge>
            ) : null}
          </Group>
        </Group>

        {url ? (
          <Box mt="xs" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <audio controls src={url} style={{ width: "100%", maxHeight: 40 }} />
          </Box>
        ) : null}
      </Stack>
    </Card>
  );
}
