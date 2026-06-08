import { Button, Group, Modal, Stack, Text } from "@mantine/core";

type CharacterDeleteModalProps = {
  opened: boolean;
  characterName?: string | null;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
};

export function CharacterDeleteModal({
  opened,
  characterName,
  loading = false,
  onClose,
  onConfirm,
}: CharacterDeleteModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={() => {
        if (loading) return;
        onClose();
      }}
      title="Delete character?"
      centered
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          {characterName?.trim()
            ? `Remove "${characterName.trim()}"? This cannot be undone.`
            : "Remove this character? This cannot be undone."}
        </Text>
        <Group justify="flex-end" gap="xs">
          <Button variant="default" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button color="red" loading={loading} onClick={() => void onConfirm()}>
            Delete
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
