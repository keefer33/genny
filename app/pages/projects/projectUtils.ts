export type UserProject = {
  id: string;
  user_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  project_name?: string | null;
  project_brief?: string | null;
  metadata?: unknown | null;
  chat_id: string;
};

export type ProjectFormValues = {
  project_name: string;
  project_brief: string;
};

export const EMPTY_PROJECT_FORM: ProjectFormValues = {
  project_name: "",
  project_brief: "",
};

export const BUILD_PROJECT_BRIEF_PROMPT = "Build Project Brief";

export function projectFormFromRow(project: UserProject): ProjectFormValues {
  return {
    project_name: project.project_name?.trim() || "",
    project_brief: project.project_brief?.trim() || "",
  };
}

export function displayProjectName(project: Pick<UserProject, "project_name"> | null | undefined): string {
  return project?.project_name?.trim() || "Untitled project";
}
