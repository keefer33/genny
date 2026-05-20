import { Button, Group, Modal, Stack, Text, TextInput, Textarea } from "@mantine/core";
import { useEffect, useState } from "react";

const MAX_NAME_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 2000;

type EditCharacterDetailsModalProps = {
  opened: boolean;
  onClose: () => void;
  initialName: string;
  initialDescription: string;
  submitting?: boolean;
  onSubmit: (values: { name: string; description: string }) => void;
};

export function EditCharacterDetailsModal({
  opened,
  onClose,
  initialName,
  initialDescription,
  submitting = false,
  onSubmit,
}: EditCharacterDetailsModalProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);

  useEffect(() => {
    if (!opened) return;
    setName(initialName);
    setDescription(initialDescription);
  }, [opened, initialName, initialDescription]);

  const trimmedName = name.trim();

  return (
    <Modal opened={opened} onClose={onClose} title="Edit character" centered size="md">
      <Stack gap="md">
        <TextInput
          label="Name"
          placeholder="Character name"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          maxLength={MAX_NAME_LENGTH}
          disabled={submitting}
          required
        />
        <Textarea
          label="Description"
          placeholder="Optional description"
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
          minRows={3}
          maxRows={8}
          autosize
          maxLength={MAX_DESCRIPTION_LENGTH}
          disabled={submitting}
        />
        <Text size="xs" c="dimmed">
          Description is optional. {description.length}/{MAX_DESCRIPTION_LENGTH}
        </Text>
        <Group justify="flex-end" gap="xs">
          <Button variant="default" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            disabled={!trimmedName || submitting}
            loading={submitting}
            onClick={() => onSubmit({ name: trimmedName, description: description.trim() })}
          >
            Save
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
