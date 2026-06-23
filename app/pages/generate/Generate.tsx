import { Box, Button, Paper, ScrollArea, Stack } from "@mantine/core";
import DesktopSplitLayout from "~/shared/DesktopSplitLayout";
import GenModelsList from "~/shared/GenModelsList";
import MobileScrollBox from "~/shared/MobileScrollBox";
import useAppStore from "~/lib/stores/appStore";
import { RiSoundModuleLine } from "@remixicon/react";
import { useDisclosure } from "@mantine/hooks";
import { GenerationsHistoryModal } from "~/shared/GenerationsHistoryModal";
import GenerationsHistory from "../generations/components/GenerationsHistory";

export default function Generate() {
  const { isMobile } = useAppStore();
  const [historyOpened, { open: openHistory, close: closeHistory }] = useDisclosure(false);

  const genModels = <GenModelsList />;

  return isMobile ? (
    <MobileScrollBox>
      <Stack
        gap="xs"
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <ScrollArea style={{ flex: 1, minHeight: 0 }} type="auto" offsetScrollbars="y">
          {genModels}
        </ScrollArea>

        <Box p="xs">
          <Button
            variant="filled"
            leftSection={<RiSoundModuleLine size={16} />}
            onClick={openHistory}
            fullWidth
          >
            Generations history
          </Button>
        </Box>
      </Stack>
      <GenerationsHistoryModal
        title="Generations History"
        opened={historyOpened}
        onClose={closeHistory}
      />
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
        <Stack
          gap="xs"
          style={{
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <ScrollArea style={{ flex: 1, minHeight: 0 }} type="auto" offsetScrollbars="y">
            {genModels}
          </ScrollArea>
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
        pt="xs"
      >
        <GenerationsHistory />
      </Box>
    </DesktopSplitLayout>
  );
}
