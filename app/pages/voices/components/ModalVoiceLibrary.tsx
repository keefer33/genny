import { Box, Button, Container, Modal, Stack } from "@mantine/core";
import { RiBookOpenLine } from "@remixicon/react";
import { useMemo } from "react";
import useVoicesStore from "~/lib/stores/voicesStore";
import type { SharedVoiceItem } from "~/lib/voices/voiceLibraryQuery";
import { mapSharedVoiceLanguageToClone } from "~/lib/voices/sharedVoiceUtils";
import { buildSharedVoiceCloneMetadata } from "~/lib/voices/sharedVoiceUtils";
import { VoiceLibraryPicker } from "~/shared/VoiceLibraryPicker";

const modalStyles = {
  content: { display: "flex", flexDirection: "column" as const },
  body: {
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column" as const,
    overflow: "hidden",
  },
};

const bodyBoxStyle = {
  flex: 1,
  minHeight: 0,
  width: "100%",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column" as const,
};

export function ModalVoiceLibrary() {
  const {
    libraryVoiceOpened,
    openLibraryVoice,
    closeLibraryVoice,
    cloneLoading,
    loadUserVoices,
    cloneVoice,
    userVoices,
  } = useVoicesStore();

  const handleCloneFromLibrary = async (voice: SharedVoiceItem) => {
    const previewUrl = voice.preview_url?.trim();
    if (!previewUrl) return;

    const voiceName = (voice.name ?? "").trim() || voice.voice_id;
    const cloned = await cloneVoice({
      audio: previewUrl,
      name: voiceName,
      language: mapSharedVoiceLanguageToClone(voice.language),
      description: voice.description?.trim() || undefined,
      gender: voice.gender?.trim() || undefined,
      age: voice.age?.trim() || undefined,
      accent: voice.accent?.trim() || undefined,
      metadata: buildSharedVoiceCloneMetadata(voice),
    });
    if (cloned?.id) {
      closeLibraryVoice();
      await loadUserVoices({ page: 1, paginate: true });
    }
  };

  const existingLibraryVoiceIds = useMemo(() => {
    const ids = new Set<string>();
    for (const voice of userVoices) {
      const meta = voice.metadata;
      if (!meta || typeof meta !== "object" || Array.isArray(meta)) continue;
      const clone = (meta as { clone?: { voice_id?: unknown } }).clone;
      const sourceId = typeof clone?.voice_id === "string" ? clone.voice_id.trim() : "";
      if (sourceId) ids.add(sourceId);
    }
    return ids;
  }, [userVoices]);

  const handleClose = () => {
    if (cloneLoading) return;
    closeLibraryVoice();
  };

  return (
    <>
      <Button
        variant="filled"
        leftSection={<RiBookOpenLine size={18} />}
        size="compact-sm"
        onClick={openLibraryVoice}
      >
        Library
      </Button>
      <Modal
        opened={libraryVoiceOpened}
        onClose={handleClose}
        title="Clone from Voice library"
        centered
        fullScreen
        styles={modalStyles}
      >
        <Container size="md" p="0" style={bodyBoxStyle}>
          <Stack
            gap="md"
            style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
          >
            <Box
              style={{
                flex: 1,
                minHeight: 0,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <VoiceLibraryPicker
                active={libraryVoiceOpened}
                onPick={handleCloneFromLibrary}
                pickDisabled={cloneLoading}
                pickButtonLabel="Clone"
                existingVoiceIds={existingLibraryVoiceIds}
                fillContainer
              />
            </Box>
          </Stack>
        </Container>
      </Modal>
    </>
  );
}
