import { Box, Stack, Text, Card, ScrollArea, Container } from "@mantine/core";
import { useEffect } from "react";
import useAppStore from "~/lib/stores/appStore";
import { useChatsStore } from "~/lib/stores/chatsStore";
import AgentsSidebar from "~/pages/agents/components/AgentsSidebar";
import AgentsMessagesSection from "~/pages/agents/components/AgentsMessagesSection";

const DESKTOP_FORM_WIDTH = 360;
const LS_SELECTED_MODEL = "genny:selectedModelName";

export default function Chats() {
  const { isMobile } = useAppStore();
  const { agentModels, selectedModelName, setSelectedModelName, hydrateSelectedChatFromStorage } =
    useChatsStore();

  const applyModelSelection = async (modelName: string | null) => {
    if (!modelName) {
      setSelectedModelName(null);
      return;
    }

    setSelectedModelName(modelName);
  };

  useEffect(() => {
    const savedModelName = window.localStorage.getItem(LS_SELECTED_MODEL);
    if (savedModelName) {
      applyModelSelection(savedModelName);
      return;
    }

    const textModels = agentModels.filter((m) => m?.model_type === "text");
    if (textModels.length) {
      applyModelSelection(textModels[0].model_name);
    }
  }, []);

  useEffect(() => {
    void hydrateSelectedChatFromStorage();
  }, [hydrateSelectedChatFromStorage]);

  const mainHeight = "calc(100vh - 80px)";

  return (
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
            px="xs"
            style={{
              flex: "0 0 auto",
              maxHeight: "40vh",
              overflow: "hidden",
            }}
          >
            <AgentsSidebar />
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
              <AgentsMessagesSection />
            )}
          </Box>
        </Box>
      ) : (
        <Container
          //pl={!isMobile && 0}
          fluid
          h="100%"
          style={{ minHeight: 0, display: "flex", flexDirection: "column" }}
        >
          <Box
            style={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "row",
              gap: "var(--mantine-spacing-md)",
            }}
          >
            <Card
              w={DESKTOP_FORM_WIDTH}
              style={{
                flex: "0 0 auto",
                height: "99%",
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <ScrollArea h={mainHeight} offsetScrollbars scrollbarSize={8}>
                <AgentsSidebar />
              </ScrollArea>
            </Card>
            <Box style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
              <Stack
                gap={0}
                h={mainHeight}
                style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}
              >
                {!selectedModelName ? (
                  <Card
                    padding="xs"
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
                  <AgentsMessagesSection />
                )}
              </Stack>
            </Box>
          </Box>
        </Container>
      )}
    </Box>
  );
}
