import useAppStore from "~/lib/stores/appStore";
import { assertAuthFetchOk, authFetch } from "~/lib/stores/authFetch";
import { endpoint, extensionMediaKind } from "~/lib/utils";

export async function fetchUserFileByPath(
  filePath: string
): Promise<Record<string, unknown> | null> {
  const app = useAppStore.getState();
  const session = app.getUser();
  if (!session?.user?.id || !app.getAuthApiKey()) {
    return null;
  }
  const qs = new URLSearchParams({ file_path: filePath });
  const res = await authFetch(`${endpoint}/user/files/by-path?${qs.toString()}`);
  if (res.status === 404) {
    return null;
  }
  await assertAuthFetchOk(res, "Failed to load file");
  const json = (await res.json()) as {
    success?: boolean;
    data?: { file?: Record<string, unknown> };
  };
  return json.data?.file ?? null;
}

export function buildMinimalUserFile(fileUrl: string) {
  const kind = extensionMediaKind(fileUrl);
  return {
    id: "",
    file_name: fileUrl.split("/").pop() || "File",
    file_path: fileUrl,
    file_type:
      kind === "image"
        ? "image/jpeg"
        : kind === "video"
          ? "video/mp4"
          : kind === "audio"
            ? "audio/mpeg"
            : "application/octet-stream",
  };
}

export function isAiFileLinkUrl(url: string | null | undefined): boolean {
  const value = url?.trim() ?? "";
  if (!value) return false;
  try {
    return new URL(value).hostname.includes("aifile.link");
  } catch {
    return value.includes("aifile.link");
  }
}
