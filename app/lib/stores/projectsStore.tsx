import { create } from "zustand";
import { showNotification } from "../notificationUtils";
import { authFetchJson } from "./authFetch";
import { endpoint } from "../utils";
import { useChatsStore } from "./chatsStore";
import {
  displayProjectName,
  EMPTY_PROJECT_FORM,
  type ProjectFormValues,
  type UserProject,
} from "~/pages/projects/projectUtils";

export const LS_SELECTED_PROJECT_ID = "genny:selectedProjectId";

type ProjectsState = {
  projects: UserProject[];
  projectsLoading: boolean;
  selectedProject: UserProject | null;
  selectedProjectLoading: boolean;
  createLoading: boolean;
  updateLoading: boolean;
  deleteLoading: boolean;
  editingProjectId: string | null;
  editingTitle: string;
  projectsListModalOpen: boolean;
  showCreateForm: boolean;
  error: string | null;
  setSelectedProject: (project: UserProject | null) => void;
  setProjectsListModalOpen: (open: boolean) => void;
  setShowCreateForm: (open: boolean) => void;
  beginCreateProject: () => void;
  setEditingTitle: (title: string) => void;
  startEditProject: (project: UserProject) => void;
  cancelEditProject: () => void;
  saveEditedProjectTitle: () => Promise<void>;
  loadProjects: () => Promise<void>;
  fetchProjectById: (projectId: string) => Promise<UserProject | null>;
  selectProject: (project: UserProject) => Promise<void>;
  selectProjectById: (projectId: string) => Promise<UserProject | null>;
  clearSelectedProject: () => void;
  hydrateSelectedProjectFromStorage: () => Promise<void>;
  createProject: (values?: ProjectFormValues) => Promise<UserProject | null>;
  updateProject: (projectId: string, values: ProjectFormValues) => Promise<boolean>;
  deleteProject: (projectId: string) => Promise<boolean>;
};

const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: [],
  projectsLoading: false,
  selectedProject: null,
  selectedProjectLoading: false,
  createLoading: false,
  updateLoading: false,
  deleteLoading: false,
  editingProjectId: null,
  editingTitle: "",
  projectsListModalOpen: false,
  showCreateForm: false,
  error: null,

  setSelectedProject: (project) => set({ selectedProject: project }),

  setProjectsListModalOpen: (open) => set({ projectsListModalOpen: open }),

  setShowCreateForm: (open) => set({ showCreateForm: open }),

  beginCreateProject: () => set({ showCreateForm: true }),

  setEditingTitle: (title) => set({ editingTitle: title }),

  startEditProject: (project) =>
    set({
      editingProjectId: project.id,
      editingTitle: displayProjectName(project),
    }),

  cancelEditProject: () => set({ editingProjectId: null, editingTitle: "" }),

  saveEditedProjectTitle: async () => {
    const { editingProjectId, editingTitle, projects, updateProject } = get();
    if (!editingProjectId) return;
    const project = projects.find((p) => p.id === editingProjectId);
    if (!project) {
      set({ editingProjectId: null });
      return;
    }
    const name = editingTitle.trim() || "Untitled project";
    await updateProject(editingProjectId, {
      project_name: name,
      project_brief: project.project_brief?.trim() || "",
    });
    set({ editingProjectId: null, editingTitle: "" });
  },

  loadProjects: async () => {
    set({ projectsLoading: true, error: null });
    try {
      const data = await authFetchJson<{ projects?: UserProject[] }>(
        `${endpoint}/projects`,
        undefined,
        { errorMessage: "Failed to load projects" }
      );
      set({
        projectsLoading: false,
        projects: Array.isArray(data.projects) ? data.projects : [],
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load projects";
      set({ projectsLoading: false, projects: [], error: message });
      showNotification({ title: "Projects", message, type: "error" });
    }
  },

  fetchProjectById: async (projectId) => {
    const id = projectId.trim();
    if (!id) {
      set({ selectedProject: null, selectedProjectLoading: false });
      return null;
    }
    set({ selectedProjectLoading: true, error: null });
    try {
      const data = await authFetchJson<{ project?: UserProject }>(
        `${endpoint}/projects/${encodeURIComponent(id)}`,
        undefined,
        { errorMessage: "Failed to load project" }
      );
      const project = data.project ?? null;
      set({ selectedProjectLoading: false, selectedProject: project });
      return project;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load project";
      set({ selectedProjectLoading: false, selectedProject: null, error: message });
      showNotification({ title: "Project", message, type: "error" });
      return null;
    }
  },

  selectProject: async (project) => {
    const chatId = String(project.chat_id ?? "").trim();
    set({
      selectedProject: project,
      projectsListModalOpen: false,
      showCreateForm: false,
    });
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LS_SELECTED_PROJECT_ID, project.id);
    }
    if (chatId) {
      await useChatsStore.getState().loadMessagesForChat(chatId);
      useChatsStore.getState().setSelectedChat(chatId);
    } else {
      useChatsStore.getState().clearSelectedChat();
    }
  },

  selectProjectById: async (projectId) => {
    const id = projectId.trim();
    if (!id) {
      get().clearSelectedProject();
      return null;
    }
    const cached = get().projects.find((p) => p.id === id);
    if (cached) {
      await get().selectProject(cached);
      return cached;
    }
    const project = await get().fetchProjectById(id);
    if (project) {
      await get().selectProject(project);
    }
    return project;
  },

  clearSelectedProject: () => {
    set({
      selectedProject: null,
      projectsListModalOpen: false,
      editingProjectId: null,
      editingTitle: "",
      showCreateForm: true,
    });
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(LS_SELECTED_PROJECT_ID);
    }
    useChatsStore.getState().clearSelectedChat();
  },

  hydrateSelectedProjectFromStorage: async () => {
    await get().loadProjects();
    if (typeof window === "undefined") return;
    const savedId = window.localStorage.getItem(LS_SELECTED_PROJECT_ID);
    if (!savedId) return;
    const project = get().projects.find((p) => p.id === savedId);
    if (project) {
      await get().selectProject(project);
      return;
    }
    await get().selectProjectById(savedId);
  },

  createProject: async (values = EMPTY_PROJECT_FORM) => {
    set({ createLoading: true, error: null });
    try {
      const name = values.project_name.trim();
      const brief = values.project_brief.trim();
      if (!name || !brief) {
        set({ createLoading: false });
        showNotification({
          title: "Create project",
          message: "Project name and project brief are required.",
          type: "error",
        });
        return null;
      }
      const data = await authFetchJson<{ project?: UserProject }>(
        `${endpoint}/projects`,
        {
          method: "POST",
          body: JSON.stringify({
            project_name: name,
            project_brief: brief,
          }),
        },
        { errorMessage: "Failed to create project" }
      );
      set({ createLoading: false });
      const project = data.project ?? null;
      if (project?.id) {
        set({ projects: [project, ...get().projects] });
        showNotification({
          title: "Project created",
          message: `"${displayProjectName(project)}" was saved.`,
          type: "success",
        });
      }
      return project;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create project";
      set({ createLoading: false, error: message });
      showNotification({ title: "Create project", message, type: "error" });
      return null;
    }
  },

  updateProject: async (projectId, values) => {
    set({ updateLoading: true, error: null });
    try {
      const data = await authFetchJson<{ project?: UserProject }>(
        `${endpoint}/projects/${encodeURIComponent(projectId)}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            project_name: values.project_name.trim(),
            project_brief: values.project_brief.trim(),
          }),
        },
        { errorMessage: "Failed to update project" }
      );
      set({ updateLoading: false });
      const updated = data.project ?? null;
      if (updated?.id) {
        set({
          projects: get().projects.map((row) => (row.id === updated.id ? updated : row)),
          selectedProject:
            get().selectedProject?.id === updated.id ? updated : get().selectedProject,
        });
        showNotification({
          title: "Project updated",
          message: "Your changes were saved.",
          type: "success",
        });
        return true;
      }
      return false;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update project";
      set({ updateLoading: false, error: message });
      showNotification({ title: "Update project", message, type: "error" });
      return false;
    }
  },

  deleteProject: async (projectId) => {
    set({ deleteLoading: true, error: null });
    try {
      await authFetchJson(
        `${endpoint}/projects/${encodeURIComponent(projectId)}`,
        { method: "DELETE" },
        { errorMessage: "Failed to delete project" }
      );
      const wasSelected = get().selectedProject?.id === projectId;
      set({
        deleteLoading: false,
        projects: get().projects.filter((row) => row.id !== projectId),
        selectedProject: wasSelected ? null : get().selectedProject,
      });
      if (wasSelected) {
        get().clearSelectedProject();
      }
      showNotification({
        title: "Project deleted",
        message: "The project was removed.",
        type: "success",
      });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete project";
      set({ deleteLoading: false, error: message });
      showNotification({ title: "Delete project", message, type: "error" });
      return false;
    }
  },
}));

export default useProjectsStore;
