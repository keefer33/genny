import { authFetchJson } from "~/lib/stores/authFetch";
import { endpoint } from "~/lib/utils";

type UploadMediaFileResult = {
  url: string;
  fileId: string;
  fileName: string;
};

type UploadUserFileResponse = {
  file?: { id?: string; file_path?: string; file_name?: string };
};

/** Upload a file and return its public URL (for clone / generation flows). */
export async function uploadMediaFile(file: File): Promise<UploadMediaFileResult | null> {
  const formData = new FormData();
  formData.append("file", file);

  const data = await authFetchJson<UploadUserFileResponse>(
    `${endpoint}/user/files/upload`,
    {
      method: "POST",
      body: formData,
    },
    { errorMessage: "Failed to upload file" }
  );

  const url = data.file?.file_path?.trim();
  const fileId = data.file?.id?.trim();
  if (!url || !fileId) return null;

  return {
    url,
    fileId,
    fileName: data.file?.file_name?.trim() || file.name,
  };
}
