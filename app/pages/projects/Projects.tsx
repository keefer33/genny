import { Box, Stack, Text, Card, ScrollArea, Container } from "@mantine/core";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import useAppStore from "~/lib/stores/appStore";
import { useChatsStore } from "~/lib/stores/chatsStore";
import useProjectsStore, { LS_SELECTED_PROJECT_ID } from "~/lib/stores/projectsStore";
import ProjectsSidebar from "~/pages/projects/components/ProjectsSidebar";
import ProjectsMessagesSection from "~/pages/projects/components/ProjectsMessagesSection";

const DESKTOP_FORM_WIDTH = 360;
const LS_SELECTED_MODEL = "genny:selectedModelName";

export function meta() {
  return [{ title: "Projects" }];
}

export default function Projects() {
  const { isMobile } = useAppStore();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId?: string }>();
  const { agentModels, loadAgentModels, selectedModelName, setSelectedModelName } = useChatsStore();
  const {
    selectProjectById,
    clearSelectedProject,
    hydrateSelectedProjectFromStorage,
    loadProjects,
  } = useProjectsStore();

  const applyModelSelection = (modelName: string | null) => {
    setSelectedModelName(modelName);
  };

  useEffect(() => {
    void loadAgentModels();
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
    void (async () => {
      await loadProjects();
      const id = projectId?.trim();
      if (id) {
        const project = await selectProjectById(id);
        if (!project) {
          navigate("/projects", { replace: true });
        }
        return;
      }

      const savedId =
        typeof window !== "undefined" ? window.localStorage.getItem(LS_SELECTED_PROJECT_ID) : null;
      if (savedId) {
        await hydrateSelectedProjectFromStorage();
        const hydrated = useProjectsStore.getState().selectedProject;
        if (hydrated?.id) {
          navigate(`/projects/${encodeURIComponent(hydrated.id)}`, { replace: true });
          return;
        }
      }
      clearSelectedProject();
    })();
  }, [projectId]);

  const mainHeight = "calc(100vh - 80px)";

  const mainPane = !selectedModelName ? (
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
      <Text c="dimmed">Select a model to start building.</Text>
    </Card>
  ) : (
    <ProjectsMessagesSection />
  );

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
          <Box
            px="xs"
            style={{
              flex: "0 0 auto",
              maxHeight: "40vh",
              overflow: "hidden",
            }}
          >
            <ProjectsSidebar />
          </Box>
          <Box
            style={{
              flex: 1,
              minHeight: 0,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {mainPane}
          </Box>
        </Box>
      ) : (
        <Container
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
                <ProjectsSidebar />
              </ScrollArea>
            </Card>
            <Box style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
              <Stack
                gap={0}
                h={mainHeight}
                style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}
              >
                {mainPane}
              </Stack>
            </Box>
          </Box>
        </Container>
      )}
    </Box>
  );
}
