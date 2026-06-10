import {
  ActionIcon,
  Button,
  Card,
  Group,
  Loader,
  Modal,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  RiCheckLine,
  RiDeleteBinLine,
  RiFileCopyLine,
  RiPencilLine,
  RiSoundModuleLine,
} from "@remixicon/react";
import { useEffect, useState } from "react";
import { showNotification } from "~/lib/notificationUtils";
import useVoicesStore, { type UserVoiceSpeech } from "~/lib/stores/voicesStore";
import { GennyAudioPlayer } from "~/shared/GennyAudioPlayer";
import { speechAudioUrl } from "~/pages/voices/voiceUtils";

function formatSpeechDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString();
}

type VoiceSpeechesHistoryProps = {
  emptyHint?: string;
};

export function VoiceSpeechesHistory({
  emptyHint = "No speeches yet. Generate one from the panel on the left.",
}: VoiceSpeechesHistoryProps) {
  const selectedVoice = useVoicesStore((s) => s.selectedVoice);
  const voiceSpeeches = useVoicesStore((s) => s.voiceSpeeches);
  const speechesLoading = useVoicesStore((s) => s.speechesLoading);
  const speechDeleteLoading = useVoicesStore((s) => s.speechDeleteLoading);
  const speechUpdateLoading = useVoicesStore((s) => s.speechUpdateLoading);
  const loadVoiceSpeeches = useVoicesStore((s) => s.loadVoiceSpeeches);
  const deleteVoiceSpeech = useVoicesStore((s) => s.deleteVoiceSpeech);
  const updateVoiceSpeech = useVoicesStore((s) => s.updateVoiceSpeech);
  const patchVoiceSpeech = useVoicesStore((s) => s.patchVoiceSpeech);
  const removeVoiceSpeech = useVoicesStore((s) => s.removeVoiceSpeech);

  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const [deletingSpeech, setDeletingSpeech] = useState<UserVoiceSpeech | null>(null);
  const [detailOpened, { open: openDetail, close: closeDetail }] = useDisclosure(false);
  const [detailSpeech, setDetailSpeech] = useState<UserVoiceSpeech | null>(null);
  const [titleInput, setTitleInput] = useState("");
  const [transcriptCopied, setTranscriptCopied] = useState(false);

  const voiceSelected = Boolean(selectedVoice?.id?.trim());

  useEffect(() => {
    void loadVoiceSpeeches();
  }, [selectedVoice?.id, loadVoiceSpeeches]);

  useEffect(() => {
    if (!detailOpened) return;
    setTitleInput(detailSpeech?.title?.trim() ?? "");
    setTranscriptCopied(false);
  }, [detailOpened, detailSpeech]);

  const openSpeechDetail = (speech: UserVoiceSpeech) => {
    setDetailSpeech(speech);
    openDetail();
  };

  const closeSpeechDetail = () => {
    if (speechUpdateLoading) return;
    closeDetail();
    setDetailSpeech(null);
  };

  const handleSaveSpeech = async () => {
    const speechId = detailSpeech?.id?.trim();
    const title = titleInput.trim();
    if (!speechId || !title) return;
    const updated = await updateVoiceSpeech(speechId, title);
    if (!updated) return;
    patchVoiceSpeech(updated);
    closeDetail();
    setDetailSpeech(null);
  };

  const handleCopyTranscript = async () => {
    const text = detailSpeech?.transcript?.trim() ?? "";
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setTranscriptCopied(true);
      setTimeout(() => setTranscriptCopied(false), 2000);
      showNotification({
        title: "Copied",
        message: "Transcript copied to clipboard.",
        type: "success",
      });
    } catch {
      showNotification({
        title: "Copy failed",
        message: "Could not copy the transcript.",
        type: "error",
      });
    }
  };

  const handleConfirmDelete = async () => {
    const speechId = deletingSpeech?.id?.trim();
    if (!speechId) return;
    const ok = await deleteVoiceSpeech(speechId);
    if (ok) {
      removeVoiceSpeech(speechId);
      closeDelete();
      setDeletingSpeech(null);
    }
  };

  const historyContent = !voiceSelected ? (
    <Text size="sm" c="dimmed">
      Select a voice to view speech history.
    </Text>
  ) : speechesLoading ? (
    <Group justify="center" py="xl">
      <Loader size="sm" />
    </Group>
  ) : voiceSpeeches.length === 0 ? (
    <Text size="sm" c="dimmed">
      {emptyHint}
    </Text>
  ) : (
    <Stack gap="sm" pb="md">
      {voiceSpeeches.map((speech) => {
        const audioUrl = speechAudioUrl(speech, selectedVoice);
        const created = formatSpeechDate(speech.created_at);
        const isDeleting = speechDeleteLoading && deletingSpeech?.id === speech.id;
        return (
          <Card key={speech.id} withBorder padding="md" radius="md">
            <Stack gap="sm">
              <Group justify="space-between" wrap="nowrap" align="flex-start">
                <Text fw={600} lineClamp={1} style={{ flex: 1, minWidth: 0 }}>
                  {speech.title?.trim() || "Untitled speech"}
                </Text>
                <Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
                  {created ? (
                    <Text size="xs" c="dimmed">
                      {created}
                    </Text>
                  ) : null}
                  <Tooltip label="View / edit">
                    <ActionIcon
                      variant="subtle"
                      aria-label="View or edit speech"
                      onClick={() => openSpeechDetail(speech)}
                    >
                      <RiPencilLine size={18} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Delete speech">
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      aria-label="Delete speech"
                      loading={isDeleting}
                      disabled={speechDeleteLoading && !isDeleting}
                      onClick={() => {
                        setDeletingSpeech(speech);
                        openDelete();
                      }}
                    >
                      <RiDeleteBinLine size={18} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Group>
              {audioUrl ? (
                <GennyAudioPlayer src={audioUrl} showWaveform waveformHeight={48} />
              ) : (
                <Text size="sm" c="dimmed">
                  Audio unavailable
                </Text>
              )}
            </Stack>
          </Card>
        );
      })}
    </Stack>
  );

  return (
    <Stack gap="sm" h="100%" style={{ minHeight: 0 }}>
      <Group gap="xs" wrap="nowrap">
        <RiSoundModuleLine size={20} />
        <Title order={3}>Speech history</Title>
      </Group>
      <ScrollArea style={{ flex: 1, minHeight: 0 }} type="auto" offsetScrollbars="y">
        {historyContent}
      </ScrollArea>

      <Modal
        opened={detailOpened}
        onClose={closeSpeechDetail}
        title="Speech details"
        centered
        size="md"
      >
        <Stack gap="md">
          <TextInput
            label="Name"
            value={titleInput}
            onChange={(event) => setTitleInput(event.currentTarget.value)}
            disabled={speechUpdateLoading}
            maxLength={200}
          />
          <Stack gap="xs">
            <Group justify="space-between" align="center" wrap="nowrap">
              <Text size="sm" fw={500}>
                Transcript
              </Text>
              <Tooltip label={transcriptCopied ? "Copied" : "Copy transcript"}>
                <ActionIcon
                  variant="subtle"
                  aria-label="Copy transcript"
                  disabled={!detailSpeech?.transcript?.trim()}
                  onClick={() => void handleCopyTranscript()}
                >
                  {transcriptCopied ? <RiCheckLine size={18} /> : <RiFileCopyLine size={18} />}
                </ActionIcon>
              </Tooltip>
            </Group>
            {detailSpeech?.transcript?.trim() ? (
              <ScrollArea.Autosize mah={240} type="auto" offsetScrollbars>
                <Text size="sm" c="dimmed" style={{ whiteSpace: "pre-wrap" }}>
                  {detailSpeech.transcript.trim()}
                </Text>
              </ScrollArea.Autosize>
            ) : (
              <Text size="sm" c="dimmed">
                No transcript for this speech.
              </Text>
            )}
          </Stack>
          <Group justify="flex-end" gap="xs">
            <Button variant="default" onClick={closeSpeechDetail} disabled={speechUpdateLoading}>
              Cancel
            </Button>
            <Button
              loading={speechUpdateLoading}
              disabled={!titleInput.trim()}
              onClick={() => void handleSaveSpeech()}
            >
              Save
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={deleteOpened}
        onClose={() => {
          if (speechDeleteLoading) return;
          closeDelete();
          setDeletingSpeech(null);
        }}
        title="Delete speech?"
        centered
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            {deletingSpeech?.title?.trim()
              ? `Remove "${deletingSpeech.title.trim()}"? The audio file will also be deleted. This cannot be undone.`
              : "Remove this speech? The audio file will also be deleted. This cannot be undone."}
          </Text>
          <Group justify="flex-end" gap="xs">
            <Button
              variant="default"
              onClick={() => {
                closeDelete();
                setDeletingSpeech(null);
              }}
              disabled={speechDeleteLoading}
            >
              Cancel
            </Button>
            <Button
              color="red"
              loading={speechDeleteLoading}
              onClick={() => void handleConfirmDelete()}
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
