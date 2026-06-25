import { Button, Group, Modal, Stack, Text } from "@mantine/core";

type StoryboardDeleteModalProps = {
  opened: boolean;
  storyboardTitle?: string | null;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
};

export function StoryboardDeleteModal({
  opened,
  storyboardTitle,
  loading = false,
  onClose,
  onConfirm,
}: StoryboardDeleteModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={() => {
        if (loading) return;
        onClose();
      }}
      title="Delete storyboard?"
      centered
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          {storyboardTitle?.trim()
            ? `Remove "${storyboardTitle.trim()}"? This cannot be undone.`
            : "Remove this storyboard? This cannot be undone."}
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
