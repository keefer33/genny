import {
  Box,
  Stack,
  Text,
  Card,
  Grid,
  ScrollArea,
  Paper,
  Textarea,
  Modal,
  ActionIcon,
  Container,
} from "@mantine/core";
import { RiSendPlane2Line } from "@remixicon/react";
import { useRef, useEffect, useState } from "react";
import useAppStore from "~/lib/stores/appStore";
import { useChatsStore, type UserAgentRow } from "~/lib/stores/chatsStore";
import MessageBubble from "~/pages/agents/components/MessageBubble";
import ChatsList from "~/pages/agents/components/ChatsList";
import CreateAgent from "~/pages/agents/components/CreateAgent";
import AgentPicker from "~/pages/agents/components/AgentPicker";
import { FormProvider, useForm } from "~/lib/ContextForm";

export default function Chats() {
  const { getUser, isMobile } = useAppStore();
  const user = getUser();
  const {
    getChats: _getChats,
    agents,
    agentsLoading: _agentsLoading,
    messages,
    streamingContent,
    streamedFileUrls,
    streamStatus,
    runChatLoading,
    selectedModelName,
    selectedAgent,
    selectedChat,
    setSelectedModelName,
    setSelectedChat,
    setSelectedAgent,
    setAgentPickerOpen,
    listChats,
    createChat,
    loadAgents,
    loadMessagesForChat,
    runChat,
    clearChats,
  } = useChatsStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [chatsListModalOpen, setChatsListModalOpen] = useState(false);

  const form = useForm({
    initialValues: {
      prompt: "",
      tools: {} as Record<string, string[]>,
      systemPrompt: "",
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const applyAgentSelection = async (agent: UserAgentRow | null) => {
    clearChats();
    setSelectedChat(null);
    form.setValues({ tools: {}, systemPrompt: "" });

    if (!agent || !user?.user?.id) {
      setSelectedAgent(null);
      setSelectedModelName(null);
      return;
    }

    setSelectedAgent(agent);
    setSelectedModelName(agent.model_name);

    const settings = (
      agent.config as {
        settings?: { tools?: Record<string, string[]>; systemPrompt?: string };
      } | null
    )?.settings;
    if (settings) {
      const toolsObj =
        settings.tools && typeof settings.tools === "object" && !Array.isArray(settings.tools)
          ? settings.tools
          : {};
      form.setValues({
        tools: toolsObj,
        systemPrompt: typeof settings.systemPrompt === "string" ? settings.systemPrompt : "",
      });
    }

    const chats = await listChats(user.user.id, agent.id);
    const mostRecentChat = chats[0];
    if (mostRecentChat) {
      await loadMessagesForChat(user.user.id, mostRecentChat.id);
      setSelectedChat(mostRecentChat);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const values = form.getValues();
    const input = (values.prompt ?? "").trim();
    if (!input || !user?.user?.id || !selectedAgent || !selectedModelName || runChatLoading) return;

    let chat = selectedChat;
    let justCreated = false;
    if (!chat) {
      const title = input.slice(0, 50).trim();
      const created = await createChat(user.user.id, selectedAgent!.id, { title });
      if (created) {
        justCreated = true;
        chat = created;
      }
    }

    if (chat) {
      form.setFieldValue("prompt", "");
      await runChat(user.user.id, chat.id, selectedAgent!.id, input);
      if (justCreated) {
        setSelectedChat(chat);
      }
    }
  };

  useEffect(() => {
    (async () => {
      if (user?.user?.id) {
        await loadAgents(user.user.id);
      }
    })();
  }, [loadAgents, user?.user?.id]);

  useEffect(() => {
    if (!selectedAgent && agents.length && user?.user?.id) {
      void applyAgentSelection(agents[0]);
    }
  }, [agents, selectedAgent, user?.user?.id]);

  // Keep form in sync when selectedAgent changes (e.g. after creating a new agent,
  // the store sets selectedAgent but applyAgentSelection is not called).
  useEffect(() => {
    if (!selectedAgent?.config?.settings) return;
    const settings = (
      selectedAgent.config as {
        settings?: { tools?: Record<string, string[]>; systemPrompt?: string };
      }
    )?.settings;
    if (!settings) return;
    const toolsObj =
      settings.tools && typeof settings.tools === "object" && !Array.isArray(settings.tools)
        ? settings.tools
        : {};
    form.setFieldValue("tools", toolsObj);
    form.setFieldValue(
      "systemPrompt",
      typeof settings.systemPrompt === "string" ? settings.systemPrompt : ""
    );
  }, [selectedAgent?.id, selectedAgent?.updated_at, selectedAgent?.config]);

  if (!user) return null;

  const mainHeight = "calc(100vh - 90px)";

  const sidebarContent = (
    <Stack gap="md" p="xs">
      {agents.length === 0 && <CreateAgent closeAgentPicker={setAgentPickerOpen} />}
      <AgentPicker
        onSelectAgent={(agent) => void applyAgentSelection(agent)}
        onOpenChatsList={isMobile ? () => setChatsListModalOpen(true) : undefined}
      />
      {selectedAgent && !isMobile && <ChatsList form={form} />}
      {selectedAgent && isMobile && (
        <Modal
          opened={chatsListModalOpen}
          onClose={() => setChatsListModalOpen(false)}
          title="Chats"
          fullScreen
        >
          <ChatsList form={form} onSelectChat={() => setChatsListModalOpen(false)} />
        </Modal>
      )}
    </Stack>
  );

  const messagesContent = (
    <>
      <ScrollArea style={{ flex: 1, minHeight: 0 }} type="auto" offsetScrollbars>
        <Stack gap="md" p="md" pb="xl">
          {messages.length === 0 && !runChatLoading && (
            <Text size="sm" c="dimmed">
              Send a message to start. You can attach MCP servers and set a system prompt below.
            </Text>
          )}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {runChatLoading && (
            <MessageBubble
              message={{
                id: "streaming",
                role: "assistant",
                content: [
                  { type: "text", text: streamingContent },
                  ...streamedFileUrls.map((url) => ({
                    type: "image" as const,
                    imageUrl: url,
                  })),
                ],
              }}
              streaming
              streamStatus={streamStatus}
            />
          )}
          <div ref={messagesEndRef} />
        </Stack>
      </ScrollArea>
      <Paper p="xs" component="form" onSubmit={handleSubmit} style={{ flexShrink: 0 }}>
        <Textarea
          placeholder="Type your message..."
          minRows={1}
          maxRows={4}
          autosize
          {...form.getInputProps("prompt")}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e as unknown as React.FormEvent);
            }
          }}
          disabled={!selectedModelName || runChatLoading}
          rightSection={
            <ActionIcon
              type="submit"
              variant="subtle"
              size="sm"
              loading={runChatLoading}
              disabled={!selectedModelName}
              aria-label="Send"
            >
              <RiSendPlane2Line size={18} />
            </ActionIcon>
          }
          rightSectionPointerEvents="auto"
          rightSectionWidth={36}
        />
      </Paper>
    </>
  );

  return (
    <FormProvider form={form}>
      <Box
        h="calc(100dvh - var(--app-shell-header-height, 0px) - var(--app-shell-footer-height, 0px))"
        style={{ minHeight: 0, overflow: "hidden" }}
      >
        {isMobile ? (
          <Box
            px="0"
            h="100%"
            style={{
              flex: 1,
              minHeight: 0,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Top: agent + ChatsList — no scroll */}
            <Box
              style={{
                flex: "0 0 auto",
                maxHeight: "40vh",
                overflow: "hidden",
              }}
            >
              {sidebarContent}
            </Box>
            {/* Middle + bottom: messages (scroll) + textarea (fixed) */}
            <Box
              style={{
                flex: 1,
                minHeight: 0,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {!selectedModelName ? (
                <Card
                  padding="lg"
                  radius="md"
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text c="dimmed">Select a model to start chatting.</Text>
                </Card>
              ) : (
                messagesContent
              )}
            </Box>
          </Box>
        ) : (
          <Box h="100%" style={{ minHeight: 0, display: "flex", flexDirection: "column" }}>
            <Grid gutter={0} style={{ flex: 1, minHeight: 0 }}>
              <Grid.Col span={4}>
                <ScrollArea h={mainHeight} offsetScrollbars scrollbarSize={8}>
                  {sidebarContent}
                </ScrollArea>
              </Grid.Col>
              <Grid.Col span={8}>
                <Container size="md">
                  <Stack
                    gap={0}
                    h={mainHeight}
                    style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}
                  >
                    {!selectedModelName ? (
                      <Card
                        padding="lg"
                        radius="md"
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text c="dimmed">Select a model to start chatting.</Text>
                      </Card>
                    ) : (
                      messagesContent
                    )}
                  </Stack>
                </Container>
              </Grid.Col>
            </Grid>
          </Box>
        )}
      </Box>
    </FormProvider>
  );
}
