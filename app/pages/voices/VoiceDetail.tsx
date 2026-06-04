import { Button, Card, Group, Loader, Modal, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router";
import useAppStore from "~/lib/stores/appStore";
import useVoicesStore, { type UserVoice } from "~/lib/stores/voicesStore";
import type { VoiceLayoutOutletContext } from "~/pages/voices/VoiceLayout";
import { EditVoiceModal } from "~/pages/voices/components/EditVoiceModal";
import { VoiceCard } from "~/pages/voices/components/VoiceCard";
import { inworldProviderVoiceId } from "~/pages/voices/voiceUtils";
import { GenerateSpeechForm } from "~/shared/GenerateSpeechForm";

export function meta() {
  return [{ title: "Voice" }];
}

export default function VoiceDetail() {
  const { voiceId } = useParams<{ voiceId: string }>();
  const navigate = useNavigate();
  const { prependSpeech } = useOutletContext<VoiceLayoutOutletContext>();

  const [voice, setVoice] = useState<UserVoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);

  const userId = useAppStore((s) => s.getUser()?.user?.id ?? "");
  const getVoiceById = useVoicesStore((s) => s.getVoiceById);
  const updateVoice = useVoicesStore((s) => s.updateVoice);
  const deleteVoice = useVoicesStore((s) => s.deleteVoice);
  const loadUserVoices = useVoicesStore((s) => s.loadUserVoices);
  const updateLoading = useVoicesStore((s) => s.updateLoading);
  const deleteLoading = useVoicesStore((s) => s.deleteLoading);

  const refresh = useCallback(async () => {
    const id = voiceId?.trim();
    if (!id) {
      setVoice(null);
      setLoading(false);
      setError("Voice id is missing.");
      return;
    }
    setLoading(true);
    setError(null);
    const result = await getVoiceById(id);
    setVoice(result);
    setLoading(false);
    if (!result) {
      setError("Voice not found.");
      navigate("/voices", { replace: true });
    }
  }, [voiceId, getVoiceById, navigate]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const inworldVoiceId = voice ? inworldProviderVoiceId(voice) : null;
  const hasInworldVoice = Boolean(inworldVoiceId?.trim());

  const refreshUserVoices = () => {
    if (!userId) return;
    void loadUserVoices(userId);
  };

  return (
    <Stack gap="md" pb="md">
      {loading && !voice ? (
        <Group justify="center" py="xl">
          <Loader size="sm" />
        </Group>
      ) : error ? (
        <Text c="dimmed" size="sm">
          {error}
        </Text>
      ) : voice ? (
        <>
          <VoiceCard voice={voice} onEdit={() => openEdit()} onDelete={() => openDelete()} />

          <EditVoiceModal
            opened={editOpened}
            voice={voice}
            submitting={updateLoading}
            onClose={closeEdit}
            onSubmit={async (values) => {
              if (!voice.id) return;
              const ok = await updateVoice(voice.id, values);
              if (ok) {
                closeEdit();
                await refresh();
                refreshUserVoices();
              }
            }}
          />

          <Modal
            opened={deleteOpened}
            onClose={() => {
              if (deleteLoading) return;
              closeDelete();
            }}
            title="Delete voice?"
            centered
          >
            <Stack gap="md">
              <Text size="sm" c="dimmed">
                {voice.name
                  ? `Remove "${voice.name}" from your library? This also deletes the voice in Inworld when linked. This cannot be undone.`
                  : "Remove this voice from your library? This cannot be undone."}
              </Text>
              <Group justify="flex-end" gap="xs">
                <Button variant="default" onClick={closeDelete} disabled={deleteLoading}>
                  Cancel
                </Button>
                <Button
                  color="red"
                  loading={deleteLoading}
                  onClick={async () => {
                    if (!voice.id) return;
                    const ok = await deleteVoice(voice.id);
                    if (ok) {
                      closeDelete();
                      refreshUserVoices();
                      navigate("/voices", { replace: true });
                    }
                  }}
                >
                  Delete
                </Button>
              </Group>
            </Stack>
          </Modal>

          {!hasInworldVoice ? (
            <Text size="sm" c="dimmed">
              This voice is not linked to Inworld (missing metadata.provider.voice_id), so speech
              cannot be generated.
            </Text>
          ) : null}
          <Card withBorder padding="md" radius="md">
            <GenerateSpeechForm
              voiceId={voice.id}
              inworldVoiceId={inworldVoiceId}
              description=""
              onGenerated={prependSpeech}
            />
          </Card>
        </>
      ) : null}
    </Stack>
  );
}
