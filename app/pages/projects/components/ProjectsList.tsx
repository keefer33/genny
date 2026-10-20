import {
  ActionIcon,
  Card,
  Group,
  Loader,
  Stack,
  Text,
  TextInput,
  useMantineTheme,
} from "@mantine/core";
import {
  RiAddLine,
  RiArrowRightLine,
  RiBriefcaseLine,
  RiCheckLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiPencilLine,
} from "@remixicon/react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import useAppStore from "~/lib/stores/appStore";
import useProjectsStore from "~/lib/stores/projectsStore";
import { displayProjectName, type UserProject } from "~/pages/projects/projectUtils";
import { formatDate } from "~/lib/utils";

export default function ProjectsList() {
  const theme = useMantineTheme();
  const themeColor = useAppStore((s) => s.themeSettings.themeColor);
  const navigate = useNavigate();
  const [listEditMode, setListEditMode] = useState(false);
  const {
    projects,
    projectsLoading,
    selectedProject,
    editingProjectId,
    editingTitle,
    setEditingTitle,
    startEditProject,
    cancelEditProject,
    saveEditedProjectTitle,
    selectProject,
    deleteProject,
    beginCreateProject,
  } = useProjectsStore();

  const exitListEditMode = () => {
    setListEditMode(false);
    cancelEditProject();
  };

  const toggleListEditMode = () => {
    setListEditMode((prev) => {
      if (prev) cancelEditProject();
      return !prev;
    });
  };

  const orderedProjects = useMemo(() => {
    if (!selectedProject) return projects;
    const current = projects.find((p) => p.id === selectedProject.id);
    if (!current) return projects;
    const rest = projects.filter((p) => p.id !== selectedProject.id);
    return [current, ...rest];
  }, [projects, selectedProject]);

  const openProject = async (project: UserProject) => {
    exitListEditMode();
    await selectProject(project);
    navigate(`/projects/${encodeURIComponent(project.id)}`);
  };

  const startNewProject = () => {
    exitListEditMode();
    beginCreateProject();
  };

  const showListActions = Boolean(selectedProject) && projects.length > 0;

  return (
    <>
      <Stack gap="xs" py="xs">
        <Group gap="xs" align="center" style={{ minWidth: 0 }} wrap="nowrap">
          <RiBriefcaseLine size={24} color={theme.colors[themeColor][7]} />
          <Text size="xl" fw={700}>
            Projects
          </Text>
        </Group>
        {showListActions ? (
          <Group justify="flex-end" gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
            <ActionIcon
              variant={listEditMode ? "filled" : "subtle"}
              color={themeColor}
              size="lg"
              radius="md"
              aria-label={listEditMode ? "Done editing project list" : "Edit project list"}
              aria-pressed={listEditMode}
              onClick={toggleListEditMode}
            >
              <RiPencilLine size={20} />
            </ActionIcon>
            <ActionIcon
              variant="light"
              color={themeColor}
              size="lg"
              radius="md"
              aria-label="New project"
              onClick={startNewProject}
            >
              <RiAddLine size={20} />
            </ActionIcon>
          </Group>
        ) : null}
      </Stack>

      {projectsLoading ? (
        <Group justify="center">
          <Loader size="sm" />
        </Group>
      ) : (
        <Stack gap="xl">
          {projects.length === 0 && (
            <Text size="sm" c="dimmed" ta="center" py="md">
              No projects yet. Create one in the panel to get started.
            </Text>
          )}
          {orderedProjects.map((project) => (
            <ProjectListRow
              key={project.id}
              project={project}
              listEditMode={listEditMode}
              isCurrent={project.id === selectedProject?.id}
              isEditing={editingProjectId === project.id}
              editingTitle={editingTitle}
              onOpen={() => void openProject(project)}
              setEditingTitle={setEditingTitle}
              startEditProject={startEditProject}
              cancelEditProject={cancelEditProject}
              saveEditedProjectTitle={saveEditedProjectTitle}
              deleteProject={async (id) => {
                const ok = await deleteProject(id);
                if (ok && selectedProject?.id === id) {
                  navigate("/projects");
                }
              }}
            />
          ))}
        </Stack>
      )}
    </>
  );
}

function ProjectListRow({
  project,
  listEditMode,
  isCurrent,
  isEditing,
  editingTitle,
  onOpen,
  setEditingTitle,
  startEditProject,
  cancelEditProject,
  saveEditedProjectTitle,
  deleteProject,
}: {
  project: UserProject;
  listEditMode: boolean;
  isCurrent: boolean;
  isEditing: boolean;
  editingTitle: string;
  onOpen: () => void;
  setEditingTitle: (t: string) => void;
  startEditProject: (p: UserProject) => void;
  cancelEditProject: () => void;
  saveEditedProjectTitle: () => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
}) {
  const theme = useMantineTheme();
  const colorSchemeSetting = useAppStore((s) => s.themeSettings.colorScheme);
  const showActionButtons = !isEditing && listEditMode;
  const isDarkUi =
    colorSchemeSetting === "dark" ||
    (colorSchemeSetting === "auto" &&
      (typeof window === "undefined" || window.matchMedia("(prefers-color-scheme: dark)").matches));
  const rowHighlight = isDarkUi ? theme.colors.dark[8] : theme.colors.gray[2];
  const backgroundColor = isCurrent ? rowHighlight : "transparent";
  const label = displayProjectName(project);

  return (
    <Card
      padding="0"
      radius="sm"
      style={{
        cursor: listEditMode ? "default" : "pointer",
        backgroundColor,
      }}
      onClick={() => {
        if (!listEditMode && !isEditing) onOpen();
      }}
    >
      <Group justify="space-between" wrap="nowrap" gap="xs">
        <Group wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
          {isEditing ? (
            <Group wrap="nowrap" gap={4} style={{ width: "100%" }}>
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
                onClick={(e) => e.stopPropagation()}
                autoFocus
                styles={{ input: { minHeight: 28 } }}
                style={{ flex: 1 }}
              />
              <ActionIcon
                size="sm"
                variant="subtle"
                color="green"
                aria-label="Save project name"
                onClick={(e) => {
                  e.stopPropagation();
                  void saveEditedProjectTitle();
                }}
              >
                <RiCheckLine size={14} />
              </ActionIcon>
              <ActionIcon
                size="sm"
                variant="subtle"
                color="gray"
                aria-label="Cancel edit"
                onClick={(e) => {
                  e.stopPropagation();
                  cancelEditProject();
                }}
              >
                <RiCloseLine size={14} />
              </ActionIcon>
            </Group>
          ) : (
            <Stack gap={0} style={{ minWidth: 0 }}>
              <Text size="sm" truncate>
                {label}
              </Text>
              {project.updated_at ? (
                <Text size="xs" c="dimmed">
                  {formatDate(project.updated_at)}
                </Text>
              ) : null}
            </Stack>
          )}
        </Group>
        {showActionButtons && (
          <Group gap={0}>
            <ActionIcon
              variant="subtle"
              size="md"
              onClick={(e) => {
                e.stopPropagation();
                startEditProject(project);
              }}
              aria-label="Edit project name"
            >
              <RiPencilLine size={20} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              color="red"
              size="md"
              onClick={(e) => {
                e.stopPropagation();
                void deleteProject(project.id);
              }}
              aria-label="Delete project"
            >
              <RiDeleteBinLine size={20} />
            </ActionIcon>
            {!isCurrent ? (
              <ActionIcon
                variant="subtle"
                size="md"
                color="blue"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpen();
                }}
                aria-label="Open project"
                title="Open project"
              >
                <RiArrowRightLine size={20} />
              </ActionIcon>
            ) : null}
          </Group>
        )}
      </Group>
    </Card>
  );
}
