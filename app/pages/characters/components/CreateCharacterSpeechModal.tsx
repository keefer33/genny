import { Button, Group, Modal, Stack, Text, Textarea } from "@mantine/core";
import { useEffect, useState } from "react";

/** ElevenLabs text-to-dialogue limit per request (single line here). */
const MAX_DIALOGUE_CHARS = 2000;

type CreateCharacterSpeechModalProps = {
  opened: boolean;
  onClose: () => void;
  submitting?: boolean;
  voiceId: string | null;
  onSubmit: (text: string) => void;
};

export function CreateCharacterSpeechModal({
  opened,
  onClose,
  submitting = false,
  voiceId,
  onSubmit,
}: CreateCharacterSpeechModalProps) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (!opened) setText("");
  }, [opened]);

  const trimmed = text.trim();
  const canSubmit = Boolean(voiceId && trimmed && !submitting);

  return (
    <Modal opened={opened} onClose={onClose} title="New dialogue audio" centered size="md">
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Enter a line for this character&apos;s voice. You can add delivery tags in the text, e.g.{" "}
          <Text span fs="italic">
            [giggling] Hello there!
          </Text>
          . The clip will be saved for video generation.
        </Text>
        {!voiceId ? (
          <Text size="sm" c="red">
            This character has no voice ID. Create the character from the voice library first.
          </Text>
        ) : null}
        <Textarea
          label="Dialogue"
          placeholder="[cheerfully] What should the character say?"
          minRows={4}
          maxRows={10}
          autosize
          value={text}
          onChange={(e) => setText(e.currentTarget.value)}
          maxLength={MAX_DIALOGUE_CHARS}
          disabled={submitting || !voiceId}
        />
        <Text size="xs" c="dimmed" ta="right">
          {text.length}/{MAX_DIALOGUE_CHARS}
        </Text>
        <Group justify="flex-end" gap="xs">
          <Button variant="default" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            disabled={!canSubmit}
            loading={submitting}
            onClick={() => {
              if (trimmed) onSubmit(trimmed);
            }}
          >
            Generate audio
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
