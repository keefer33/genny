import { Box, Button, Modal, Paper, ScrollArea, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { RiSoundModuleLine } from "@remixicon/react";
import { useCallback, useEffect, useState } from "react";
import { Outlet, useParams } from "react-router";
import useAppStore from "~/lib/stores/appStore";
import useVoicesStore, { type UserVoiceSpeech } from "~/lib/stores/voicesStore";
import VoicePicker from "~/pages/voices/components/VoicePicker";
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

export type VoiceLayoutOutletContext = {
  refreshVoiceSpeeches: () => Promise<void>;
  prependSpeech: (speech: UserVoiceSpeech) => void;
};

export default function VoiceLayout() {
  const { isMobile } = useAppStore();
  const { voiceId } = useParams<{ voiceId: string }>();
  const getVoiceSpeeches = useVoicesStore((s) => s.getVoiceSpeeches);
  const deleteVoiceSpeech = useVoicesStore((s) => s.deleteVoiceSpeech);
  const speechesLoading = useVoicesStore((s) => s.speechesLoading);
  const speechDeleteLoading = useVoicesStore((s) => s.speechDeleteLoading);

  const [speeches, setSpeeches] = useState<UserVoiceSpeech[]>([]);
  const [historyOpened, { open: openHistory, close: closeHistory }] = useDisclosure(false);

  const refreshVoiceSpeeches = useCallback(async () => {
    const id = voiceId?.trim();
    if (!id) {
      setSpeeches([]);
      return;
    }
    const rows = await getVoiceSpeeches(id);
    setSpeeches(rows);
  }, [voiceId, getVoiceSpeeches]);

  useEffect(() => {
    void refreshVoiceSpeeches();
  }, [refreshVoiceSpeeches]);

  const prependSpeech = useCallback((speech: UserVoiceSpeech) => {
    setSpeeches((prev) => [speech, ...prev]);
  }, []);

  const handleDeleteSpeech = useCallback(
    async (speechId: string) => {
      const ok = await deleteVoiceSpeech(speechId);
      if (ok) {
        setSpeeches((prev) => prev.filter((s) => s.id !== speechId));
      }
      return ok;
    },
    [deleteVoiceSpeech]
  );

  const handleSpeechUpdated = useCallback((updated: UserVoiceSpeech) => {
    const id = updated.id?.trim();
    if (!id) return;
    setSpeeches((prev) =>
      prev.map((speech) =>
        speech.id === id ? { ...speech, ...updated, file: updated.file ?? speech.file } : speech
      )
    );
  }, []);

  const outletContext: VoiceLayoutOutletContext = {
    refreshVoiceSpeeches,
    prependSpeech,
  };

  const historyPanel = (
    <VoiceSpeechesHistory
      speeches={speeches}
      loading={speechesLoading}
      voiceSelected={Boolean(voiceId?.trim())}
      speechDeleteLoading={speechDeleteLoading}
      onDeleteSpeech={handleDeleteSpeech}
      onSpeechUpdated={handleSpeechUpdated}
    />
  );

  return isMobile ? (
    <MobileScrollBox>
      <Stack
        gap="md"
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <VoicePicker selectedVoiceId={voiceId} />
        <ScrollArea style={{ flex: 1, minHeight: 0 }} type="auto" offsetScrollbars="y">
          <Outlet context={outletContext} />
        </ScrollArea>
        <Button variant="light" leftSection={<RiSoundModuleLine size={16} />} onClick={openHistory}>
          Speech history
        </Button>
      </Stack>
      <Modal
        opened={historyOpened}
        onClose={closeHistory}
        title="Speech history"
        fullScreen
        styles={historyModalStyles}
      >
        <Box style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>{historyPanel}</Box>
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
          <VoicePicker selectedVoiceId={voiceId} />
          <ScrollArea style={{ flex: 1, minHeight: 0 }} type="auto" offsetScrollbars="y">
            <Outlet context={outletContext} />
          </ScrollArea>
        </Stack>
      </Paper>
      <Box p="sm" style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        {historyPanel}
      </Box>
    </DesktopSplitLayout>
  );
}
