import { ActionIcon, Group, Menu, Text, TextInput } from "@mantine/core";
import {
  RiAddLine,
  RiCheckLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiMoreLine,
  RiPencilLine,
} from "@remixicon/react";
import { useNavigate } from "react-router";
import useProjectsStore from "~/lib/stores/projectsStore";
import { displayProjectName } from "~/pages/projects/projectUtils";
import {
  MobileProjectsListModal,
  MobileProjectsListModalTrigger,
} from "~/pages/projects/components/MobileProjectsListModal";

export default function SelectedProjectBar() {
  const navigate = useNavigate();
  const {
    projects,
    selectedProject,
    editingProjectId,
    editingTitle,
    setEditingTitle,
    startEditProject,
    cancelEditProject,
    saveEditedProjectTitle,
    deleteProject,
    beginCreateProject,
    showCreateForm,
  } = useProjectsStore();

  if (projects.length === 0) return null;
  if (!selectedProject && !showCreateForm) return null;

  const displayTitle = selectedProject
    ? displayProjectName(selectedProject)
    : "New project";

  const showNewAction = Boolean(selectedProject) && !showCreateForm;

  return (
    <Group gap="xs" wrap="nowrap" align="center" style={{ minWidth: 0 }}>
      {editingProjectId === selectedProject?.id ? (
        <>
          <TextInput
            size="xs"
            value={editingTitle}
            onChange={(e) => setEditingTitle(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void saveEditedProjectTitle();
              } else if (e.key === "Escape") {
                cancelEditProject();
              }
            }}
            autoFocus
            styles={{ input: { minHeight: 28 } }}
            style={{ flex: 1, minWidth: 0 }}
          />
          <ActionIcon
            size="sm"
            variant="subtle"
            color="green"
            aria-label="Save project name"
            onClick={() => void saveEditedProjectTitle()}
          >
            <RiCheckLine size={14} />
          </ActionIcon>
          <ActionIcon
            size="sm"
            variant="subtle"
            color="gray"
            aria-label="Cancel edit"
            onClick={cancelEditProject}
          >
            <RiCloseLine size={14} />
          </ActionIcon>
        </>
      ) : (
        <>
          <Text size="sm" c="dimmed" truncate style={{ flex: 1, minWidth: 0 }}>
            {displayTitle}
          </Text>
          {selectedProject ? (
            <Menu shadow="md" width={200} position="bottom-end">
              <Menu.Target>
                <ActionIcon size="md" variant="transparent" aria-label="Project actions">
                  <RiMoreLine size={24} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<RiPencilLine size={16} />}
                  onClick={() => startEditProject(selectedProject)}
                >
                  Edit
                </Menu.Item>
                <Menu.Item
                  color="red"
                  leftSection={<RiDeleteBinLine size={16} />}
                  onClick={() => {
                    void deleteProject(selectedProject.id).then((ok) => {
                      if (ok) navigate("/projects");
                    });
                  }}
                >
                  Delete
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          ) : null}
          <MobileProjectsListModalTrigger />
          <MobileProjectsListModal />
          {showNewAction ? (
            <ActionIcon
              size="md"
              variant="transparent"
              aria-label="New project"
              onClick={() => beginCreateProject()}
            >
              <RiAddLine size={24} />
            </ActionIcon>
          ) : null}
        </>
      )}
    </Group>
  );
}
