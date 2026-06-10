import { Box, Button, Group, Paper, Stack } from "@mantine/core";
import { RiArrowLeftLine } from "@remixicon/react";
import { Link, Outlet, useNavigate, useParams } from "react-router";
import useAppStore from "~/lib/stores/appStore";
import MobileScrollBox from "~/shared/MobileScrollBox";
import DesktopSplitLayout from "~/shared/DesktopSplitLayout";
import { CharacterCard } from "./components/CharacterCard";
import useCharactersStore from "~/lib/stores/charactersStore";
import { useEffect } from "react";
import PageLoader from "~/shared/PageLoader";

export default function CharacterLayout() {
  const { isMobile } = useAppStore();
  const navigate = useNavigate();
  const { characterId } = useParams<{ characterId: string }>();
  const { fetchCharacterById, setSelectedCharacter, selectedCharacter, selectedCharacterLoading } =
    useCharactersStore();

  useEffect(() => {
    if (characterId) {
      fetchCharacterById(characterId).then((character) => {
        setSelectedCharacter(character);
      });
    } else {
      setSelectedCharacter(null);
    }
  }, [characterId, fetchCharacterById, setSelectedCharacter]);

  const showPageLoader =
    Boolean(characterId) && selectedCharacterLoading && selectedCharacter?.id !== characterId;

  if (showPageLoader) {
    return <PageLoader />;
  }

  const backToCharacters = (
    <Group gap="xs">
      <Button
        size="compact-sm"
        component={Link}
        variant="filled"
        leftSection={<RiArrowLeftLine size={16} />}
        to="/characters"
      >
        Characters
      </Button>
    </Group>
  );

  const navLinks = (
    <Group gap="xs" grow>
      <Button
        component={Link}
        to={`/characters/${encodeURIComponent(characterId)}/looks`}
        variant="filled"
        size="compact-sm"
      >
        Looks
      </Button>
      <Button
        component={Link}
        to={`/characters/${encodeURIComponent(characterId)}/scenes`}
        variant="filled"
        size="compact-sm"
      >
        Scenes
      </Button>
      <Button
        component={Link}
        to={`/characters/${encodeURIComponent(characterId)}/videos`}
        variant="filled"
        size="compact-sm"
      >
        Videos
      </Button>
      <Button
        component={Link}
        to={`/characters/${encodeURIComponent(characterId)}/speeches`}
        variant="filled"
        size="compact-sm"
      >
        Speeches
      </Button>
    </Group>
  );

  return isMobile ? (
    <MobileScrollBox>
      <Stack gap="xs" p="xs">
        {backToCharacters}
        {characterId ? (
          <CharacterCard
            characterId={characterId}
            onDeleted={() => navigate("/characters", { replace: true })}
          />
        ) : null}
        {characterId ? navLinks : null}
      </Stack>

      <Outlet />
    </MobileScrollBox>
  ) : (
    <DesktopSplitLayout>
      <Paper
        w={420}
        p="sm"
        style={{
          flex: "0 0 auto",
          alignSelf: "stretch",
          minHeight: 0,
          maxHeight: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Stack gap="xs" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          {backToCharacters}
          {characterId ? (
            <CharacterCard
              characterId={characterId}
              onDeleted={() => navigate("/characters", { replace: true })}
            />
          ) : null}
          {characterId ? navLinks : null}
        </Stack>
      </Paper>
      <Box
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Outlet />
      </Box>
    </DesktopSplitLayout>
  );
}
