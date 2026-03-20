import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Modal,
  ScrollArea,
  Stack,
  Text,
  useMantineTheme,
  useMantineColorScheme,
  Checkbox,
} from "@mantine/core";
import { RiApps2AiLine, RiServerLine } from "@remixicon/react";
import { Link } from "react-router";
import { useState } from "react";
import { useFormContext } from "~/lib/ContextForm";
import useAppStore from "~/lib/stores/appStore";
import { useChatsStore } from "~/lib/stores/chatsStore";
import { useMcpServersStore } from "~/lib/stores/mcpserversStore";

interface McpAttachButtonProps {
  /** When false, only form state is used (e.g. Chats); no agent persistence. Default true. */
  agentContext?: boolean;
}

export default function McpAttachButton({ agentContext = true }: McpAttachButtonProps) {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const form = useFormContext();
  const { getUser } = useAppStore();
  const user = getUser();
  const { selectedAgent, updateUserAgent } = useChatsStore();
  const { connections } = useMcpServersStore();
  const [modalOpen, setModalOpen] = useState(false);

  const mcpServerIds: string[] = Array.isArray(form.values.mcpServerIds)
    ? form.values.mcpServerIds
    : [];
  const agentSettings = (selectedAgent?.config as { settings?: { mcpServerIds?: string[] } } | null)
    ?.settings;
  const displayCount =
    agentContext && !modalOpen ? (agentSettings?.mcpServerIds?.length ?? 0) : mcpServerIds.length;

  const handleToggle = (connectionId: string) => {
    const isSelected = mcpServerIds.includes(connectionId);
    const next = isSelected
      ? mcpServerIds.filter((id) => id !== connectionId)
      : [...mcpServerIds, connectionId];
    form.setFieldValue("mcpServerIds", next);
  };

  const handleDone = async () => {
    const values = form.getValues();
    const ids = Array.isArray(values.mcpServerIds) ? values.mcpServerIds : [];
    if (agentContext && user?.user?.id && selectedAgent) {
      const settings = {
        mcpServerIds: ids,
        systemPrompt: typeof values.systemPrompt === "string" ? values.systemPrompt : "",
      };
      await updateUserAgent(user.user.id, selectedAgent.id, {
        config: { ...(selectedAgent.config ?? {}), settings },
      });
    }
    setModalOpen(false);
  };

  return (
    <>
      <Box style={{ position: "relative" }}>
        <ActionIcon
          variant="transparent"
          size="lg"
          radius="md"
          aria-label="Attach MCP servers"
          onClick={() => setModalOpen(true)}
        >
          <RiApps2AiLine size={24} />
        </ActionIcon>
        {displayCount > 0 && (
          <Badge
            size="xs"
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              minWidth: 18,
              paddingLeft: 6,
              paddingRight: 6,
            }}
          >
            {displayCount}
          </Badge>
        )}
      </Box>

      <Modal
        opened={modalOpen}
        onClose={handleDone}
        title={
          <Group gap="sm">
            <Box
              style={{
                width: 36,
                height: 36,
                borderRadius: theme.radius.md,
                backgroundColor:
                  colorScheme === "dark" ? theme.colors.dark[5] : theme.colors.blue[0],
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <RiServerLine size={22} color="var(--mantine-color-blue-6)" />
            </Box>
            <div>
              <Text fw={600} size="lg">
                Attach MCP servers
              </Text>
              <Text size="xs" c="dimmed">
                {agentContext
                  ? "Choose connected servers to use with this run (saved to agent settings)"
                  : "Choose connected servers to use with this chat"}
              </Text>
            </div>
          </Group>
        }
        size="md"
        radius="md"
      >
        <Stack gap="md">
          {connections.length === 0 ? (
            <Card
              p="lg"
              radius="sm"
              withBorder
              style={{
                backgroundColor:
                  colorScheme === "dark" ? theme.colors.dark[6] : theme.colors.gray[0],
              }}
            >
              <Stack align="center" gap="sm">
                <RiServerLine size={40} color="var(--mantine-color-gray-5)" />
                <Text size="sm" c="dimmed" ta="center">
                  No MCP servers connected. Connect servers from the MCP Servers page to attach them
                  here.
                </Text>
                <Button
                  component={Link}
                  to="/agents/mcpservers"
                  variant="light"
                  size="xs"
                  leftSection={<RiServerLine size={14} />}
                  onClick={() => setModalOpen(false)}
                >
                  Go to MCP Servers
                </Button>
              </Stack>
            </Card>
          ) : (
            <ScrollArea.Autosize mah={320}>
              <Stack gap="xs">
                {connections.map((conn) => {
                  const isSelected = mcpServerIds.includes(conn.connectionId);
                  const iconUrl = conn.server_details?.iconUrl;
                  return (
                    <Card
                      key={conn.connectionId}
                      p="sm"
                      radius="sm"
                      withBorder
                      style={{
                        cursor: "pointer",
                        backgroundColor:
                          isSelected && colorScheme === "dark"
                            ? theme.colors.dark[5]
                            : isSelected && colorScheme === "light"
                              ? theme.colors.blue[0]
                              : undefined,
                      }}
                      onClick={() => handleToggle(conn.connectionId)}
                    >
                      <Group wrap="nowrap" gap="sm">
                        <Avatar radius="sm" size="md" src={iconUrl}>
                          <RiServerLine size={24} color="var(--mantine-color-blue-6)" />
                        </Avatar>
                        <Text size="sm" fw={500} style={{ flex: 1 }} lineClamp={1}>
                          {conn.name || conn.qualifiedName || conn.connectionId}
                        </Text>
                        <Checkbox
                          checked={isSelected}
                          onChange={() => {}}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Toggle ${conn.name}`}
                        />
                      </Group>
                      {conn.status?.state && (
                        <Group gap={4} mt={4} ml={2}>
                          <Box
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              backgroundColor:
                                conn.status.state === "connected"
                                  ? "var(--mantine-color-green-6)"
                                  : conn.status.state === "auth_required"
                                    ? "var(--mantine-color-yellow-6)"
                                    : "var(--mantine-color-red-6)",
                            }}
                          />
                          <Text size="xs" c="dimmed">
                            {conn.status.state === "connected"
                              ? "Connected"
                              : conn.status.state === "auth_required"
                                ? "Auth required"
                                : "Error"}
                          </Text>
                        </Group>
                      )}
                    </Card>
                  );
                })}
              </Stack>
            </ScrollArea.Autosize>
          )}
          <Group justify="space-between" mt="sm">
            <Button
              component={Link}
              to="/agents/mcpservers"
              variant="subtle"
              size="sm"
              leftSection={<RiServerLine size={14} />}
              onClick={() => setModalOpen(false)}
            >
              MCP Servers
            </Button>
            <Button onClick={handleDone}>Done</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
