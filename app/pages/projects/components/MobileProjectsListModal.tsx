import { ActionIcon, Modal } from "@mantine/core";
import { RiBriefcaseLine } from "@remixicon/react";
import useAppStore from "~/lib/stores/appStore";
import useProjectsStore from "~/lib/stores/projectsStore";
import ProjectsList from "~/pages/projects/components/ProjectsList";

export function MobileProjectsListModalTrigger() {
  const { isMobile } = useAppStore();
  const { projects, setProjectsListModalOpen } = useProjectsStore();

  if (!isMobile || projects.length === 0) return null;

  return (
    <ActionIcon
      size="md"
      variant="subtle"
      aria-label="Manage projects"
      onClick={() => setProjectsListModalOpen(true)}
    >
      <RiBriefcaseLine size={24} />
    </ActionIcon>
  );
}

export function MobileProjectsListModal() {
  const { isMobile } = useAppStore();
  const { projects, projectsListModalOpen, setProjectsListModalOpen } = useProjectsStore();

  if (!isMobile || projects.length === 0) return null;

  return (
    <Modal
      opened={projectsListModalOpen}
      onClose={() => setProjectsListModalOpen(false)}
      title="Projects"
      fullScreen
    >
      <ProjectsList />
    </Modal>
  );
}
