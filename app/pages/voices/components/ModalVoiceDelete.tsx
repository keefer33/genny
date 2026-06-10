import { Button, Group, Modal, Stack, Text } from "@mantine/core";
import { useLocation, useNavigate } from "react-router";
import useVoicesStore from "~/lib/stores/voicesStore";

export function ModalVoiceDelete() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    deleteVoiceOpened,
    closeDeleteVoice,
    deleteVoice,
    deleteLoading,
    loadUserVoices,
    selectedVoice,
  } = useVoicesStore();

  const handleClose = () => {
    if (deleteLoading) return;
    closeDeleteVoice();
  };

  const handleDelete = async () => {
    const voiceId = selectedVoice?.id?.trim();
    if (!voiceId) return;

    const ok = await deleteVoice(voiceId);
    if (!ok) return;

    const detailPath = `/voices/${encodeURIComponent(voiceId)}`;
    const onDetailPage =
      location.pathname === detailPath || location.pathname.startsWith(`${detailPath}/`);

    handleClose();
    await loadUserVoices();
    if (onDetailPage) navigate("/voices", { replace: true });
  };

  return (
    <Modal opened={deleteVoiceOpened} onClose={handleClose} title="Delete voice?" centered>
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          {selectedVoice?.name
            ? `Remove "${selectedVoice.name}" from your library? This also deletes the voice in Inworld when linked. This cannot be undone.`
            : "Remove this voice from your library? This cannot be undone."}
        </Text>
        <Group justify="flex-end" gap="xs">
          <Button variant="default" onClick={handleClose} disabled={deleteLoading}>
            Cancel
          </Button>
          <Button color="red" loading={deleteLoading} onClick={() => void handleDelete()}>
            Delete
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
