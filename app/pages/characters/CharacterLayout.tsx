import { Box, Button, Modal, Paper, ScrollArea, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { RiGalleryView2 } from "@remixicon/react";
import { useCallback, useState } from "react";
import { Outlet, useParams } from "react-router";
import useAppStore from "~/lib/stores/appStore";
import CharacterPicker from "~/pages/characters/components/CharacterPicker";
import CharacterLooksPanel from "~/pages/characters/components/CharacterLooksPanel";
import MobileScrollBox from "~/shared/MobileScrollBox";
import DesktopSplitLayout from "~/shared/DesktopSplitLayout";

const historyModalStyles = {
  content: { display: "flex", flexDirection: "column" as const },
  body: {
    flex: 1,
    minHeight: 0,
    padding: 0,
    display: "flex",
    flexDirection: "column" as const,
    overflow: "hidden",
  },
};

export type CharacterLayoutOutletContext = {
  refreshLooks: () => Promise<void>;
};

export default function CharacterLayout() {
  const { isMobile } = useAppStore();
  const { characterId } = useParams<{ characterId: string }>();
  const [looksRefreshSignal, setLooksRefreshSignal] = useState(0);
  const [historyOpened, { open: openHistory, close: closeHistory }] = useDisclosure(false);

  const refreshLooks = useCallback(async () => {
    setLooksRefreshSignal((n) => n + 1);
  }, []);

  return isMobile ? (
    <MobileScrollBox>
      <Stack gap="md" style={{ flex: 1, minHeight: 0 }}>
        <CharacterPicker selectedCharacterId={characterId} />
        <Outlet context={{ refreshLooks }} />
        <Button variant="light" leftSection={<RiGalleryView2 size={16} />} onClick={openHistory}>
          Character looks
        </Button>
      </Stack>
      <Modal
        opened={historyOpened}
        onClose={closeHistory}
        title="Character looks"
        fullScreen
        styles={historyModalStyles}
      >
        <Box style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
          <CharacterLooksPanel characterId={characterId} refreshSignal={looksRefreshSignal} />
        </Box>
      </Modal>
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
          <CharacterPicker selectedCharacterId={characterId} />
          <ScrollArea style={{ flex: 1, minHeight: 0 }} type="auto" offsetScrollbars="y">
            <Outlet context={{ refreshLooks }} />
          </ScrollArea>
        </Stack>
      </Paper>
      <Box style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        <CharacterLooksPanel characterId={characterId} refreshSignal={looksRefreshSignal} />
      </Box>
    </DesktopSplitLayout>
  );
}
