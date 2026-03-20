import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Modal,
  Stack,
  Text,
  useMantineTheme,
  useMantineColorScheme,
} from "@mantine/core";
import { RiApps2AiLine, RiToolsLine } from "@remixicon/react";
import { Link } from "react-router";
import { useState, useEffect } from "react";
import { useFormContext } from "~/lib/ContextForm";
import useAppStore from "~/lib/stores/appStore";
import { useChatsStore, type UserAgentConfigWithSettings } from "~/lib/stores/chatsStore";
import { useToolsStore } from "~/lib/stores/toolsStore";
import ToolkitSelectorList, {
  buildToolkitsFromConnections,
} from "~/pages/chats/components/ToolkitSelectorList";

interface ToolsAttachButtonProps {
  /** When false, only form state is used (e.g. Chats); no agent persistence. Default true. */
  agentContext?: boolean;
}

export default function ToolsAttachButton({ agentContext = true }: ToolsAttachButtonProps) {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const form = useFormContext();
  const { getUser } = useAppStore();
  const user = getUser();
  const { selectedAgent, updateUserAgent } = useChatsStore();
  const {
    connectedAccounts,
    loadConnectedAccounts,
    toolkitsData,
    loadToolkits,
    toolsByToolkit,
    toolsByToolkitLoading,
    loadToolsForToolkits,
  } = useToolsStore();
  const [modalOpen, setModalOpen] = useState(false);

  const selectedToolsObj =
    form.values.tools && typeof form.values.tools === "object" && !Array.isArray(form.values.tools)
      ? form.values.tools
      : {};
  const agentSettings = (selectedAgent?.config as UserAgentConfigWithSettings | null)?.settings;
  const agentToolsObj =
    agentSettings?.tools &&
    typeof agentSettings.tools === "object" &&
    !Array.isArray(agentSettings.tools)
      ? agentSettings.tools
      : {};
  const displayCount =
    agentContext && !modalOpen
      ? Object.values(agentToolsObj).flat().length
      : Object.values(selectedToolsObj).flat().length;

  const toolkits = buildToolkitsFromConnections(connectedAccounts, toolkitsData?.items);

  useEffect(() => {
    if (modalOpen) {
      void loadConnectedAccounts();
      void loadToolkits({ limit: 100 });
    }
  }, [modalOpen, loadConnectedAccounts, loadToolkits]);

  const toolkitSlugsKey = toolkits
    .map((t) => t.slug)
    .sort()
    .join(",");
  useEffect(() => {
    if (modalOpen && toolkits.length > 0) {
      void loadToolsForToolkits(toolkits.map((t) => t.slug));
    }
  }, [modalOpen, toolkitSlugsKey, loadToolsForToolkits]);

  const handleToolsChange = (toolkitSlug: string, toolSlugs: string[]) => {
    form.setFieldValue("tools", { ...selectedToolsObj, [toolkitSlug]: toolSlugs });
  };

  const handleDone = async () => {
    const values = form.getValues();
    const toolsConfig =
      values.tools && typeof values.tools === "object" && !Array.isArray(values.tools)
        ? values.tools
        : {};
    if (agentContext && user?.user?.id && selectedAgent) {
      const existingSettings =
        (selectedAgent.config as UserAgentConfigWithSettings | null)?.settings ?? {};
      await updateUserAgent(user.user.id, selectedAgent.id, {
        config: {
          ...(selectedAgent.config ?? {}),
          settings: {
            tools: toolsConfig,
            systemPrompt:
              typeof values.systemPrompt === "string"
                ? values.systemPrompt
                : (existingSettings.systemPrompt ?? ""),
          },
        },
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
          aria-label="Attach tools"
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
              <RiToolsLine size={22} color="var(--mantine-color-blue-6)" />
            </Box>
            <div>
              <Text fw={600} size="lg">
                Attach tools
              </Text>
              <Text size="xs" c="dimmed">
                {agentContext
                  ? "Choose toolkits to use with this agent (saved to agent settings)"
                  : "Choose toolkits to use with this chat"}
              </Text>
            </div>
          </Group>
        }
        size="md"
        radius="md"
      >
        <Stack gap="md">
          <ToolkitSelectorList
            toolkits={toolkits}
            toolsByToolkit={Object.fromEntries(
              Object.entries(toolsByToolkit).map(([slug, items]) => [
                slug,
                items.map((t) => ({ slug: t.slug, name: t.name })),
              ])
            )}
            selectedTools={selectedToolsObj}
            onToolsChange={handleToolsChange}
            scrollMaxHeight={320}
            loading={toolsByToolkitLoading}
          />
          <Group justify="space-between" mt="sm">
            <Button
              component={Link}
              to="/tools"
              variant="subtle"
              size="sm"
              leftSection={<RiToolsLine size={14} />}
              onClick={() => setModalOpen(false)}
            >
              Tools
            </Button>
            <Button onClick={handleDone}>Done</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
