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
import useVoicesStore, { type UserVoice, type UserVoiceSpeech } from "~/lib/stores/voicesStore";
import { GennyAudioPlayer } from "~/shared/GennyAudioPlayer";
import { GenerateSpeechModal } from "~/shared/GenerateSpeechModal";
import { speechAudioUrl } from "~/pages/voices/voiceUtils";

function formatSpeechDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString();
}

type VoiceSpeechesHistoryProps = {
  speeches: UserVoiceSpeech[];
  /** Used to resolve audio when the speech list omits embedded `file`. */
  voice?: UserVoice | null;
  loading: boolean;
  voiceSelected: boolean;
  speechDeleteLoading?: boolean;
  onDeleteSpeech?: (speechId: string) => Promise<boolean>;
  /** Called after the speech title is saved so parents can refresh local list state. */
  onSpeechUpdated?: (speech: UserVoiceSpeech) => void;
  /** Inline in a parent scroll area (e.g. character detail) instead of a full-height panel */
  embedded?: boolean;
  description?: string;
  emptyMessage?: string;
  /** When set, shows a Generate speech button in the section header (right-aligned). */
  generateSpeech?: {
    voiceId: string;
    inworldVoiceId?: string | null;
    buttonLabel?: string;
    onGenerated?: (speech: UserVoiceSpeech) => void;
  };
};

export function VoiceSpeechesHistory({
  speeches,
  voice = null,
  loading,
  voiceSelected,
  speechDeleteLoading = false,
  onDeleteSpeech,
  onSpeechUpdated,
  embedded = false,
  description = "Past generations for the selected voice.",
  emptyMessage = "No speeches yet. Generate one from the panel on the left.",
  generateSpeech,
}: VoiceSpeechesHistoryProps) {
  const inworldVoiceId = generateSpeech?.inworldVoiceId?.trim() || null;
  const showInworldWarning = Boolean(generateSpeech && voiceSelected && !inworldVoiceId);
  const updateVoiceSpeech = useVoicesStore((s) => s.updateVoiceSpeech);
  const speechUpdateLoading = useVoicesStore((s) => s.speechUpdateLoading);

  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const [deletingSpeech, setDeletingSpeech] = useState<UserVoiceSpeech | null>(null);
  const [detailOpened, { open: openDetail, close: closeDetail }] = useDisclosure(false);
  const [detailSpeech, setDetailSpeech] = useState<UserVoiceSpeech | null>(null);
  const [titleInput, setTitleInput] = useState("");
  const [transcriptCopied, setTranscriptCopied] = useState(false);

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
    onSpeechUpdated?.(updated);
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
    if (!speechId || !onDeleteSpeech) return;
    const ok = await onDeleteSpeech(speechId);
    if (ok) {
      closeDelete();
      setDeletingSpeech(null);
    }
  };

  const historyContent = !voiceSelected ? (
    <Text size="sm" c="dimmed">
      Select a voice to view speech history.
    </Text>
  ) : loading ? (
    <Group justify="center" py="xl">
      <Loader size="sm" />
    </Group>
  ) : speeches.length === 0 ? (
    <Text size="sm" c="dimmed">
      {emptyMessage}
    </Text>
  ) : (
    <Stack gap="sm" pb={embedded ? 0 : "md"}>
      {speeches.map((speech) => {
        const audioUrl = speechAudioUrl(speech, voice);
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
                  {onDeleteSpeech ? (
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
                  ) : null}
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
    <Stack
      gap="sm"
      h={embedded ? undefined : "100%"}
      style={embedded ? undefined : { minHeight: 0 }}
    >
      <Group justify="space-between" align="center" wrap="wrap" gap="xs">
        <Group gap="xs" wrap="nowrap">
          <RiSoundModuleLine size={embedded ? 18 : 20} />
          <Title order={embedded ? 4 : 3}>Speech history</Title>
        </Group>
        {generateSpeech ? (
          <GenerateSpeechModal
            voiceId={generateSpeech.voiceId}
            inworldVoiceId={generateSpeech.inworldVoiceId}
            buttonLabel={generateSpeech.buttonLabel ?? "Generate"}
            disabled={!voiceSelected}
            onGenerated={generateSpeech.onGenerated}
          />
        ) : null}
      </Group>
      {showInworldWarning ? (
        <Text size="xs" c="dimmed">
          This voice is not linked to Inworld, so speech cannot be generated.
        </Text>
      ) : null}
      <Text size="sm" c="dimmed">
        {description}
      </Text>
      {embedded ? (
        historyContent
      ) : (
        <ScrollArea style={{ flex: 1, minHeight: 0 }} type="auto" offsetScrollbars="y">
          {historyContent}
        </ScrollArea>
      )}

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
