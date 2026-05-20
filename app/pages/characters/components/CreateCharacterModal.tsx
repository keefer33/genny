import { Button, Group, Modal, Stack, Text } from "@mantine/core";
import type { SharedVoiceItem } from "~/lib/stores/charactersStore";
import { VoiceLibraryPicker } from "~/pages/characters/components/VoiceLibraryPicker";

export type CreateCharacterPayload = {
  voice_id: string;
};

type CreateCharacterModalProps = {
  opened: boolean;
  onClose: () => void;
  userId: string;
  submitting?: boolean;
  onSubmit: (payload: CreateCharacterPayload) => void | Promise<void>;
};

export function CreateCharacterModal({
  opened,
  onClose,
  userId,
  submitting = false,
  onSubmit,
}: CreateCharacterModalProps) {
  const handleUseVoice = async (voice: SharedVoiceItem) => {
    const voiceId = voice.voice_id?.trim();
    if (!voiceId || submitting) return;
    await onSubmit({ voice_id: voiceId });
  };

  return (
    <Modal opened={opened} onClose={onClose} title="New character" centered size="xl">
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Choose a voice from the ElevenLabs library. We will save the preview audio and create your
          character with that voice.
        </Text>
        <VoiceLibraryPicker
          userId={userId}
          active={opened}
          onPick={handleUseVoice}
          pickDisabled={submitting}
          scrollHeight={360}
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
