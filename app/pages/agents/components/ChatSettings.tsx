import { ActionIcon, Button, Group, Modal, Stack, TextInput, Textarea } from "@mantine/core";
import { RiEqualizer2Line } from "@remixicon/react";
import { useEffect, useState } from "react";
import { useFormContext } from "~/lib/ContextForm";
import { useChatsStore } from "~/lib/stores/chatsStore";

export default function ChatSettings() {
  const form = useFormContext();
  const selectedModelName = useChatsStore((s) => s.selectedModelName);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (modalOpen) {
      // noop; keep effect so modal reopen can hook future settings if needed
    }
  }, [modalOpen]);

  const handleSave = async () => {
    setSaving(true);
    const values = form.getValues();
    form.setFieldValue(
      "systemPrompt",
      typeof values.systemPrompt === "string" ? values.systemPrompt : ""
    );
    setSaving(false);
    setModalOpen(false);
  };

  return (
    <>
      <ActionIcon
        variant="transparent"
        size="lg"
        radius="md"
        aria-label="Settings"
        onClick={() => setModalOpen(true)}
      >
        <RiEqualizer2Line size={24} />
      </ActionIcon>

      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Chat settings"
        size="md"
        radius="md"
      >
        <Stack gap="md">
          <TextInput label="Model name" value={String(selectedModelName ?? "")} disabled />
          <Textarea
            key={form.key("systemPrompt")}
            label="System prompt"
            placeholder="Optional instructions for how the model should behave (e.g. tone, format, constraints)."
            required={false}
            {...form.getInputProps("systemPrompt")}
            autosize
            minRows={2}
          />
          <Group justify="flex-end" gap="xs">
            <Button variant="default" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              Save
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
