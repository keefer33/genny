import { Box } from "@mantine/core";
import useAppStore from "~/lib/stores/appStore";
import { useChatsStore } from "~/lib/stores/chatsStore";
import useProjectsStore from "~/lib/stores/projectsStore";
import ChatComposer from "~/pages/agents/components/ChatComposer";
import MessagesContent from "~/pages/agents/components/MessagesContent";
import AgentsMessagesToolbar from "~/pages/agents/components/AgentsMessagesToolbar";
import CreateProjectForm from "~/pages/projects/components/CreateProjectForm";
import SelectedProjectBar from "~/pages/projects/components/SelectedProjectBar";

export default function ProjectsMessagesSection() {
  const { isMobile } = useAppStore();
  const { showFullChatHistory } = useChatsStore();
  const { selectedProject, showCreateForm } = useProjectsStore();

  const showForm = showCreateForm || !selectedProject;

  return (
    <>
      {isMobile && (
        <Box px="xs" style={{ flexShrink: 0 }}>
          <SelectedProjectBar />
        </Box>
      )}
      {showForm ? (
        <CreateProjectForm />
      ) : (
        <>
          <MessagesContent showAllMessages={showFullChatHistory} />
          <AgentsMessagesToolbar />
          <ChatComposer />
        </>
      )}
    </>
  );
}
