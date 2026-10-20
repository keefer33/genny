import { Stack } from "@mantine/core";
import AgentPicker from "~/pages/agents/components/AgentPicker";
import ProjectsList from "~/pages/projects/components/ProjectsList";
import useAppStore from "~/lib/stores/appStore";

export default function ProjectsSidebar() {
  const { isMobile } = useAppStore();

  return (
    <Stack gap="md" p="0">
      <AgentPicker />
      {!isMobile && <ProjectsList />}
    </Stack>
  );
}
