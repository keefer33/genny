import { ActionIcon, Button, Group, Modal, Stack, TextInput, Textarea } from "@mantine/core";
import { RiEqualizer2Line } from "@remixicon/react";
import { useEffect, useState } from "react";
import useAppStore from "~/lib/stores/appStore";
import { useChatsStore } from "~/lib/stores/chatsStore";
import { useFormContext } from "~/lib/ContextForm";

export default function ChatSettings() {
  const form = useFormContext();
  const [modalOpen, setModalOpen] = useState(false);
  const [agentName, setAgentName] = useState("");
  const [saving, setSaving] = useState(false);
  const { getUser } = useAppStore();
  const { selectedAgent, updateUserAgent } = useChatsStore();
  const user = getUser();

  useEffect(() => {
    if (modalOpen && selectedAgent) {
      setAgentName(selectedAgent.name ?? "");
    }
  }, [modalOpen, selectedAgent]);

  const handleSave = async () => {
    if (!user?.user?.id || !selectedAgent) return;
    setSaving(true);
    const values = form.getValues();
    const settings =
      (
        selectedAgent.config as {
          settings?: { tools?: Record<string, string[]>; systemPrompt?: string };
        } | null
      )?.settings ?? {};
    const toolsConfig =
      values.tools && typeof values.tools === "object" && !Array.isArray(values.tools)
        ? values.tools
        : (settings.tools ?? {});
    const config = {
      ...selectedAgent.config,
      settings: {
        tools: toolsConfig,
        systemPrompt:
          typeof values.systemPrompt === "string"
            ? values.systemPrompt
            : (settings.systemPrompt ?? ""),
      },
    };
    const ok = await updateUserAgent(user.user.id, selectedAgent.id, {
      name: agentName.trim() || selectedAgent.name,
      config,
    });
    setSaving(false);
    if (ok) setModalOpen(false);
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
          <TextInput
            label="Agent name"
            placeholder="Name this agent"
            value={agentName}
            onChange={(e) => setAgentName(e.currentTarget.value)}
            disabled={!selectedAgent}
          />
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
            <Button onClick={handleSave} loading={saving} disabled={!selectedAgent}>
              Save
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
