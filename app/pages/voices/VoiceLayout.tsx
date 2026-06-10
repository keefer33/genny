import { Box, Button, Group, Modal, Paper, ScrollArea, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { RiArrowLeftLine, RiSoundModuleLine } from "@remixicon/react";
import { useEffect } from "react";
import { Link, Outlet, useNavigate, useParams } from "react-router";
import useAppStore from "~/lib/stores/appStore";
import useVoicesStore from "~/lib/stores/voicesStore";
import { VoiceSpeechesHistory } from "~/pages/voices/components/VoiceSpeechesHistory";
import DesktopSplitLayout from "~/shared/DesktopSplitLayout";
import MobileScrollBox from "~/shared/MobileScrollBox";

const historyModalStyles = {
  content: { display: "flex", flexDirection: "column" as const },
  body: {
    flex: 1,
    minHeight: 0,
    padding: "var(--mantine-spacing-md)",
    display: "flex",
    flexDirection: "column" as const,
    overflow: "hidden",
  },
};

export default function VoiceLayout() {
  const { isMobile } = useAppStore();
  const navigate = useNavigate();
  const { voiceId } = useParams<{ voiceId: string }>();
  const userVoices = useVoicesStore((s) => s.userVoices);
  const setSelectedVoice = useVoicesStore((s) => s.setSelectedVoice);
  const getVoiceById = useVoicesStore((s) => s.getVoiceById);
  const [historyOpened, { open: openHistory, close: closeHistory }] = useDisclosure(false);

  useEffect(() => {
    const id = voiceId?.trim();
    if (!id) {
      setSelectedVoice(null);
      return;
    }

    const fromList = userVoices.find((voice) => voice.id === id);
    if (fromList) {
      setSelectedVoice(fromList);
      return;
    }

    let cancelled = false;
    void getVoiceById(id).then((voice) => {
      if (cancelled) return;
      if (voice?.id === id) {
        setSelectedVoice(voice);
        return;
      }
      setSelectedVoice(null);
      navigate("/voices", { replace: true });
    });
    return () => {
      cancelled = true;
    };
  }, [voiceId, userVoices, getVoiceById, setSelectedVoice, navigate]);

  const historyPanel = (
    <Box
      p={isMobile ? undefined : "sm"}
      style={{
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <VoiceSpeechesHistory />
    </Box>
  );

  const backButton = (
    <Group gap="xs" px="xs">
      <Button
        component={Link}
        to="/voices"
        size="compact-xs"
        variant="filled"
        leftSection={<RiArrowLeftLine size={16} />}
      >
        Voices
      </Button>
    </Group>
  );

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
        {backButton}
        <ScrollArea style={{ flex: 1, minHeight: 0 }} type="auto" offsetScrollbars="y">
          <Outlet />
        </ScrollArea>
        <Box p="xs">
          <Button
            variant="light"
            leftSection={<RiSoundModuleLine size={16} />}
            onClick={openHistory}
            fullWidth
          >
            Speech history
          </Button>
        </Box>
      </Stack>
      <Modal
        opened={historyOpened}
        onClose={closeHistory}
        title="Speech history"
        fullScreen
        styles={historyModalStyles}
      >
        {historyPanel}
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
          {backButton}
          <ScrollArea style={{ flex: 1, minHeight: 0 }} type="auto" offsetScrollbars="y">
            <Outlet />
          </ScrollArea>
        </Stack>
      </Paper>
      {historyPanel}
    </DesktopSplitLayout>
  );
}
