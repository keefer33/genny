export type StoryboardRenderFile = {
  id: string;
  file_name?: string | null;
  file_path?: string | null;
  file_type?: string | null;
  file_size?: number | null;
  created_at?: string | null;
  thumbnail_url?: string | null;
  upload_type?: string | null;
  status?: string | null;
  generated_info?: unknown;
};

export type StoryboardRender = {
  id: string;
  created_at?: string | null;
  storyboard_id?: string | null;
  file_id?: string | null;
  status?: string | null;
  metadata?: unknown;
  file?: StoryboardRenderFile | null;
};

export function renderIsProcessing(render: StoryboardRender): boolean {
  return (render.status ?? "").trim().toLowerCase() === "processing";
}

export function renderHasFailed(render: StoryboardRender): boolean {
  return (render.status ?? "").trim().toLowerCase() === "error";
}

export function renderIsCompleted(render: StoryboardRender): boolean {
  return (render.status ?? "").trim().toLowerCase() === "completed";
}

export function shouldPollStoryboardRenders(renders: StoryboardRender[]): boolean {
  return renders.some(renderIsProcessing);
}

export function getStoryboardRenderError(render: StoryboardRender): string | null {
  const meta = render.metadata;
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return null;
  const message = (meta as { message?: unknown }).message;
  return typeof message === "string" && message.trim() ? message.trim() : null;
}

export function storyboardRenderThumbnailUrl(file: StoryboardRenderFile | null | undefined): string {
  if (!file) return "";
  return file.thumbnail_url?.trim() || file.file_path?.trim() || "";
}
