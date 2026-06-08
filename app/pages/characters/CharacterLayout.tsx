import { Box, Button, Group, Paper, Stack } from "@mantine/core";
import { RiArrowLeftLine } from "@remixicon/react";
import { Link, Outlet, useNavigate, useParams } from "react-router";
import useAppStore from "~/lib/stores/appStore";
import MobileScrollBox from "~/shared/MobileScrollBox";
import DesktopSplitLayout from "~/shared/DesktopSplitLayout";
import { CharacterCard } from "./components/CharacterCard";

export default function CharacterLayout() {
  const { isMobile } = useAppStore();
  const navigate = useNavigate();
  const { characterId } = useParams<{ characterId: string }>();

  return isMobile ? (
    <MobileScrollBox>
      <Stack gap="md" p="xs">
        {characterId ? (
          <CharacterCard
            characterId={characterId}
            onDeleted={() => navigate("/characters", { replace: true })}
          />
        ) : null}
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
          {characterId ? (
            <CharacterCard
              characterId={characterId}
              onDeleted={() => navigate("/characters", { replace: true })}
            />
          ) : null}
          <Group gap="xs">
            <Button
              size="compact-sm"
              component={Link}
              variant="light"
              leftSection={<RiArrowLeftLine size={16} />}
              to="/characters"
            >
              Characters
            </Button>
          </Group>
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
