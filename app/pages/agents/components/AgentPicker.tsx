import {
  Button,
  Card,
  Group,
  Modal,
  ScrollArea,
  Stack,
  Text,
  Avatar,
  ActionIcon,
  useMantineTheme,
} from "@mantine/core";
import { RiArrowDownSLine, RiChatSmile2Line, RiDeleteBinLine } from "@remixicon/react";
import { useState } from "react";
import { useChatsStore, type AgentModel, type UserAgentRow } from "~/lib/stores/chatsStore";
import useAppStore from "~/lib/stores/appStore";
import CreateAgent from "~/pages/agents/components/CreateAgent";
import ToolsAttachButton from "~/pages/agents/components/ToolsAttachButton";
import ChatSettings from "~/pages/agents/components/ChatSettings";
import { useTheme } from "~/lib/hooks/useTheme";

function getModelForAgent(agent: UserAgentRow | null, models: AgentModel[]): AgentModel | null {
  return agent ? (models.find((m) => m.model_name === agent.model_name) ?? null) : null;
}

interface AgentPickerProps {
  /** Called when user selects an agent (e.g. apply selection and close picker) */
  onSelectAgent: (agent: UserAgentRow) => void;
  /** Optional: on mobile, open the Chats list modal */
  onOpenChatsList?: () => void;
}

export default function AgentPicker({ onSelectAgent, onOpenChatsList }: AgentPickerProps) {
  const { isMobile, getUser } = useAppStore();
  const user = getUser();
  const agentModels = useChatsStore((s) => s.agentModels);
  const textModels = agentModels.filter((m) => m?.model_type === "text");
  const { agents, selectedAgent, agentPickerOpen, setAgentPickerOpen, deleteUserAgent } =
    useChatsStore();
  const theme = useMantineTheme();
  const { themeColor, colorScheme } = useTheme();
  const [createAgentModalOpen, setCreateAgentModalOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<UserAgentRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const selectedModel = selectedAgent ? getModelForAgent(selectedAgent, textModels) : null;
  const selectedBrandObj = selectedModel?.brand_name ?? null;
  const selectedBrand = selectedBrandObj?.name ?? null;
  const selectedLogo = selectedBrandObj?.logo ?? null;

  const handlePickAgent = (agent: UserAgentRow) => {
    onSelectAgent(agent);
    setAgentPickerOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!agentToDelete || !user?.user?.id) return;
    setDeleting(true);
    const ok = await deleteUserAgent(user.user.id, agentToDelete.id);
    setDeleting(false);
    if (ok) {
      setAgentToDelete(null);
    }
  };

  if (!selectedAgent) return null;

  return (
    <>
      <Card padding="0" radius="md">
        <Group justify="space-between" align="center" wrap="nowrap">
          <Group
            wrap="nowrap"
            gap="sm"
            justify="space-between"
            style={{ minWidth: 0, flex: 1, cursor: "pointer" }}
            onClick={() => setAgentPickerOpen(true)}
            bg={colorScheme === "dark" ? theme.colors[themeColor][9] : theme.colors[themeColor][0]}
            p="xs"
          >
            <Stack gap={0}>
              <Group gap="xs">
                <Avatar
                  src={selectedLogo}
                  radius="md"
                  size="sm"
                  color="blue"
                  style={{ flexShrink: 0 }}
                >
                  {!selectedLogo
                    ? (selectedBrand || selectedAgent.name || "?")[0].toUpperCase()
                    : null}
                </Avatar>

                <Text size="sm" fw={600} truncate>
                  {selectedAgent.name.length > 20
                    ? `${selectedAgent.name.slice(0, 20)}…`
                    : selectedAgent.name}
                </Text>
              </Group>
              <Text size="xs" truncate>
                {selectedModel?.model_name ??
                  (selectedModel?.meta as { name?: string })?.name ??
                  selectedAgent.model_name}
              </Text>
            </Stack>
            <RiArrowDownSLine size={20} />
          </Group>
          <Group gap="xs" style={{ flexShrink: 0 }}>
            {isMobile && onOpenChatsList && (
              <ActionIcon
                variant="subtle"
                size="sm"
                aria-label="Chats list"
                onClick={onOpenChatsList}
              >
                <RiChatSmile2Line size={18} />
              </ActionIcon>
            )}
            <ToolsAttachButton agentContext={true} />
            <ChatSettings />
          </Group>
        </Group>
      </Card>

      {agents.length > 0 && (
        <Modal
          opened={agentPickerOpen}
          onClose={() => setAgentPickerOpen(false)}
          title="Select agent"
          size="sm"
          radius="md"
          scrollAreaComponent={ScrollArea.Autosize}
        >
          <Stack gap="md">
            <Button
              size="md"
              onClick={() => {
                setAgentPickerOpen(false);
                setCreateAgentModalOpen(true);
              }}
            >
              Create Agent
            </Button>
            {agents.map((agent) => {
              const model = getModelForAgent(agent, textModels);
              const brandObj = model?.brand_name ?? null;
              const brand = brandObj?.name ?? model?.model_name ?? "";
              const logoUrl = brandObj?.logo ?? null;
              const initial = (brand || agent.name || "?")[0].toUpperCase();
              const isSelected = selectedAgent?.id === agent.id;
              return (
                <Card
                  key={agent.id}
                  padding="sm"
                  radius="sm"
                  withBorder
                  style={{
                    cursor: "pointer",
                    backgroundColor: isSelected ? "var(--mantine-color-blue-light)" : undefined,
                  }}
                  onClick={() => handlePickAgent(agent)}
                >
                  <Group wrap="nowrap" gap="sm" justify="space-between">
                    <Group wrap="nowrap" gap="sm" style={{ minWidth: 0, flex: 1 }}>
                      <Avatar src={logoUrl} radius="sm" size="md" color="blue">
                        {!logoUrl ? initial : null}
                      </Avatar>
                      <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                        <Text size="sm" fw={500} truncate>
                          {agent.name}
                        </Text>
                        <Text size="xs" c="dimmed" truncate>
                          {model?.model_name ?? agent.model_name}
                          {brand ? ` · ${brand}` : ""}
                        </Text>
                      </Stack>
                    </Group>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="sm"
                      aria-label="Delete agent"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAgentToDelete(agent);
                      }}
                    >
                      <RiDeleteBinLine size={16} />
                    </ActionIcon>
                  </Group>
                </Card>
              );
            })}
          </Stack>
        </Modal>
      )}

      <Modal
        opened={!!agentToDelete}
        onClose={() => !deleting && setAgentToDelete(null)}
        title="Delete agent?"
      >
        <Text size="sm" c="dimmed" mb="md">
          {agentToDelete ? `Delete "${agentToDelete.name}"? This cannot be undone.` : ""}
        </Text>
        <Group justify="flex-end" gap="xs">
          <Button variant="subtle" onClick={() => setAgentToDelete(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button color="red" loading={deleting} onClick={handleConfirmDelete}>
            Delete
          </Button>
        </Group>
      </Modal>

      <CreateAgent
        opened={createAgentModalOpen}
        onClose={() => setCreateAgentModalOpen(false)}
        renderTriggerOnly
      />
    </>
  );
}
