import { create } from "zustand";
import { showNotification } from "../notificationUtils";
import useAppStore from "./appStore";
import { assertAuthFetchOk, authFetch, authFetchJson } from "./authFetch";
import createUniversalSelectors from "./universalSelectors";
import { endpoint } from "../utils";

interface UserTag {
  id: string;
  created_at: string;
  user_id: string;
  tag_name: string;
}

interface UserFileTag {
  file_id: string;
  tag_id: string;
  created_at: string;
  user_tags: UserTag;
}

interface FileData {
  id: string;
  file_name: string;
  file_path: string;
  thumbnail_url?: string | null;
  file_size: number;
  file_type: string;
  created_at: string;
  status?: string;
  deleted_at?: string | null;
  upload_type?: string;
  user_file_tags?: UserFileTag[];
}

export type FileTypeFilter =
  | "images"
  | "videos"
  | "audio"
  | "all"
  | "images_videos"
  | "images_audio"
  | "videos_audio";

interface PaginationData {
  data: FileData[];
  total: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

function fileTypePrefixes(
  filter: FileTypeFilter | null | undefined
): Array<"image" | "video" | "audio"> {
  if (!filter || filter === "all") return [];
  return [
    filter.includes("images") ? "image" : null,
    filter.includes("videos") ? "video" : null,
    filter.includes("audio") ? "audio" : null,
  ].filter((prefix): prefix is "image" | "video" | "audio" => Boolean(prefix));
}

interface FilesFoldersState {
  // State
  files: FileData[];
  paginationData: PaginationData;
  loading: boolean;
  gridLoading: boolean;
  uploading: boolean;
  error: string | null;
  selectedTags: string[];
  selectedUploadType: string | null;
  fileTypeFilter: FileTypeFilter;
  filesPageSize: number;

  // Actions
  setFiles: (files: FileData[]) => void;
  setPaginationData: (data: PaginationData) => void;
  setLoading: (loading: boolean) => void;
  setGridLoading: (gridLoading: boolean) => void;
  setUploading: (uploading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedTags: (tags: string[]) => void;
  setSelectedUploadType: (uploadType: string | null) => void;
  setFileTypeFilter: (filter: FileTypeFilter) => void;
  setFilesPageSize: (pageSize: number) => void;
  resetFilters: () => void;

  // Getters
  getFiles: () => FileData[];
  getPaginationData: () => PaginationData;
  getLoading: () => boolean;
  getGridLoading: () => boolean;
  getUploading: () => boolean;
  getError: () => string | null;
  getSelectedTags: () => string[];
  getSelectedUploadType: () => string | null;
  getFileTypeFilter: () => FileTypeFilter;
  getFilesPageSize: () => number;
  getFilteredFiles: (files?: FileData[]) => FileData[];
  // File operations
  uploadFile: (file: File, userId: string) => Promise<boolean>;
  deleteFile: (fileName: string, fileId: string, userId: string) => Promise<boolean>;
  /** DELETE `/user/files/:id` only — no files list refresh (for detail modal / other pages). */
  deleteUserFileRecord: (fileName: string, fileId: string) => Promise<boolean>;
  updateFileName: (
    fileId: string,
    newFileName: string,
    userId: string
  ) => Promise<{ success: boolean; updatedFile?: FileData }>;

  // Data loading
  loadUserFiles: (
    page?: number,
    userId?: string,
    selectedTags?: string[],
    uploadType?: string | null,
    fileTypeFilter?: FileTypeFilter | null,
    _isPageChange?: boolean
  ) => Promise<void>;
  handleFilesPageChange: (page: number) => void;
  handleFileUpdate: () => Promise<void>;
  refreshData: (userId?: string) => Promise<void>;

  // Utility functions
  reset: () => void;
}

const useFilesFoldersStoreBase = create<FilesFoldersState>((set, get) => ({
  // Initial state
  files: [],
  paginationData: {
    data: [],
    total: 0,
    totalPages: 0,
    currentPage: 1,
    hasNextPage: false,
    hasPrevPage: false,
  },
  loading: false,
  gridLoading: false,
  uploading: false,
  error: null,
  selectedTags: [],
  selectedUploadType: null,
  fileTypeFilter: "all",
  filesPageSize: 16,

  // Basic setters
  setFiles: (files) => set({ files }),
  setPaginationData: (data) => set({ paginationData: data }),
  setLoading: (loading) => set({ loading }),
  setGridLoading: (gridLoading) => set({ gridLoading }),
  setUploading: (uploading) => set({ uploading }),
  setError: (error) => set({ error }),
  setSelectedTags: (selectedTags) => set({ selectedTags }),
  setSelectedUploadType: (selectedUploadType) => set({ selectedUploadType }),
  setFileTypeFilter: (fileTypeFilter) => set({ fileTypeFilter }),
  setFilesPageSize: (filesPageSize) => set({ filesPageSize }),
  resetFilters: () =>
    set({
      selectedTags: [],
      selectedUploadType: null,
      fileTypeFilter: "all",
    }),
  // Getters
  getFiles: () => get().files,
  getPaginationData: () => get().paginationData,
  getLoading: () => get().loading,
  getGridLoading: () => get().gridLoading,
  getUploading: () => get().uploading,
  getError: () => get().error,
  getSelectedTags: () => get().selectedTags,
  getSelectedUploadType: () => get().selectedUploadType,
  getFileTypeFilter: () => get().fileTypeFilter,
  getFilesPageSize: () => get().filesPageSize,
  getFilteredFiles: (files) => {
    const filesToFilter = files || get().paginationData.data;
    const fileTypeFilter = get().fileTypeFilter;

    const prefixes = fileTypePrefixes(fileTypeFilter);

    // If no filter or filter is "all", return all files
    if (prefixes.length === 0) {
      return filesToFilter;
    }

    // Filter files by type
    return filesToFilter.filter((file) => {
      // Handle missing or invalid file_type
      if (!file || !file.file_type || typeof file.file_type !== "string") {
        return false;
      }

      const normalizedFileType = file.file_type.toLowerCase().trim();

      return prefixes.some((prefix) => normalizedFileType.startsWith(`${prefix}/`));
    });
  },

  // File operations
  uploadFile: async (file: File, userId: string) => {
    set({ uploading: true, error: null, gridLoading: false });
    try {
      // Get the file extension
      const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";
      const allowedExtensions = [
        "jpg",
        "jpeg",
        "png",
        "gif",
        "webp",
        "svg",
        "mp4",
        "webm",
        "mov",
        "avi",
        "mkv",
        "mp3",
        "wav",
        "ogg",
        "m4a",
        "flac",
        "aac",
        "opus",
        "aiff",
        "wma",
        "pdf",
        "txt",
        "doc",
        "docx",
        "xls",
        "xlsx",
        "ppt",
        "pptx",
        "zip",
        "rar",
        "7z",
      ];

      if (!allowedExtensions.includes(fileExtension)) {
        showNotification({
          title: "Invalid file type",
          message: `File type .${fileExtension} is not allowed`,
          type: "error",
        });
        return false;
      }

      // Check file size (50MB limit)
      const maxSize = 50 * 1024 * 1024; // 50MB in bytes
      if (file.size > maxSize) {
        showNotification({
          title: "File too large",
          message: "File size must be less than 50MB",
          type: "error",
        });
        return false;
      }

      const formData = new FormData();
      formData.append("file", file);

      const response = await authFetch(`${endpoint}/user/files/upload`, {
        method: "POST",
        body: formData,
      });

      await assertAuthFetchOk(response, "Failed to upload file");

      showNotification({
        title: "Upload successful",
        message: `File "${file.name}" uploaded successfully`,
        type: "success",
      });

      // Refresh the files list
      await get().loadUserFiles(1, userId, undefined, undefined, undefined);

      return true;
    } catch (error: any) {
      console.error("Upload error:", error);
      showNotification({
        title: "Upload failed",
        message: error.message || "An unexpected error occurred",
        type: "error",
      });
      return false;
    } finally {
      set({ uploading: false });
    }
  },

  deleteUserFileRecord: async (fileName: string, fileId: string) => {
    const name = fileName.trim();
    const id = fileId.trim();
    if (!name || !id) {
      showNotification({
        title: "Cannot delete file",
        message: "File id and name are required.",
        type: "error",
      });
      return false;
    }
    try {
      const deleteRes = await authFetch(`${endpoint}/user/files/${encodeURIComponent(id)}`, {
        method: "DELETE",
        body: JSON.stringify({ idOrName: name }),
      });
      await assertAuthFetchOk(deleteRes, "Failed to delete file");
      showNotification({
        title: "Success",
        message: "File deleted successfully",
        type: "success",
      });
      return true;
    } catch (error: unknown) {
      console.error("Delete error:", error);
      showNotification({
        title: "Error",
        message: error instanceof Error ? error.message : "An unexpected error occurred",
        type: "error",
      });
      return false;
    }
  },

  deleteFile: async (fileName: string, fileId: string, userId: string) => {
    set({ loading: true, error: null, gridLoading: false });
    try {
      const ok = await get().deleteUserFileRecord(fileName, fileId);
      if (!ok) return false;

      await get().loadUserFiles(
        get().paginationData.currentPage,
        userId,
        undefined,
        undefined,
        undefined
      );

      return true;
    } finally {
      set({ loading: false });
    }
  },

  updateFileName: async (fileId: string, newFileName: string, _userId: string) => {
    set({ loading: true, error: null, gridLoading: false });

    try {
      const updatedFile = await authFetchJson<FileData>(
        `${endpoint}/user/files/${encodeURIComponent(fileId)}`,
        {
          method: "PATCH",
          body: JSON.stringify({ file_name: newFileName }),
        },
        { errorMessage: "Failed to update file name" }
      );
      if (!updatedFile) {
        showNotification({ title: "Error", message: "File not found", type: "error" });
        return { success: false };
      }

      showNotification({
        title: "Success",
        message: "File name updated successfully",
        type: "success",
      });

      return { success: true, updatedFile };
    } catch (error: any) {
      console.error("Update error:", error);
      showNotification({
        title: "Error",
        message: error.message || "An unexpected error occurred",
        type: "error",
      });
      return { success: false };
    } finally {
      set({ loading: false });
    }
  },

  // Data loading
  loadUserFiles: async (
    page = 1,
    userId?: string,
    selectedTags?: string[],
    uploadType?: string | null,
    fileTypeFilter?: FileTypeFilter | null,
    _isPageChange?: boolean
  ) => {
    const finalLimit = get().filesPageSize;
    // Auto-get userId from appStore if not provided
    set({ paginationData: { ...get().paginationData, currentPage: page } });
    const finalUserId = userId || useAppStore.getState().getUser()?.user?.id;
    if (!finalUserId) {
      set({ loading: false, gridLoading: false, error: null });
      return;
    }

    if (!useAppStore.getState().getAuthApiKey()) {
      set({ loading: false, gridLoading: false, error: null });
      return;
    }

    // Use provided parameters or fall back to store state
    // For uploadType, if explicitly passed (even as null), use it; otherwise use store value
    const finalSelectedTags = selectedTags !== undefined ? selectedTags : get().selectedTags;
    // If uploadType parameter was provided (including null), use it; otherwise fall back to store
    const finalUploadType = uploadType !== undefined ? uploadType : get().selectedUploadType;
    // If fileTypeFilter parameter was provided, use it; otherwise fall back to store
    const finalFileTypeFilter =
      fileTypeFilter !== undefined ? fileTypeFilter : get().fileTypeFilter;

    if (uploadType !== undefined) {
      set({ selectedUploadType: uploadType });
    }

    set({ gridLoading: true, error: null });

    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(finalLimit));
      if (finalSelectedTags && finalSelectedTags.length > 0) {
        params.set("tags", finalSelectedTags.join(","));
      }
      if (finalUploadType !== null && finalUploadType !== undefined) {
        params.set("uploadType", finalUploadType);
      }
      if (finalFileTypeFilter && finalFileTypeFilter !== "all") {
        params.set("fileTypeFilter", finalFileTypeFilter);
      }
      const json = await authFetchJson<{
        files: FileData[];
        total: number;
        totalPages: number;
        currentPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
      }>(`${endpoint}/user/files?${params.toString()}`, undefined, {
        errorMessage: "Failed to fetch files",
      });

      const payload = json;
      if (!payload) {
        set({ error: "Failed to fetch files" });
        return;
      }

      const total = payload.total ?? 0;
      const totalPages = payload.totalPages ?? Math.ceil(total / finalLimit);

      set({
        files: payload.files ?? [],
        paginationData: {
          data: payload.files ?? [],
          total,
          totalPages,
          currentPage: payload.currentPage ?? page,
          hasNextPage: payload.hasNextPage ?? false,
          hasPrevPage: payload.hasPrevPage ?? false,
        },
      });
    } catch (err: unknown) {
      console.error("Error fetching files:", err);
      set({
        error: err instanceof Error ? err.message : "Failed to fetch files",
      });
    } finally {
      set({ gridLoading: false });
    }
  },

  handleFilesPageChange: async (page: number) => {
    set({ paginationData: { ...get().paginationData, currentPage: page } });
    await get().loadUserFiles(page);
  },

  handleFileUpdate: async () => {
    await get().loadUserFiles(get().paginationData.currentPage);
  },

  refreshData: async (userId?: string) => {
    const { paginationData } = get();
    await get().loadUserFiles(
      paginationData.currentPage,
      userId,
      undefined,
      undefined,
      undefined,
      true
    );
  },

  // Utility functions
  reset: () =>
    set({
      files: [],
      paginationData: {
        data: [],
        total: 0,
        totalPages: 0,
        currentPage: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
      loading: false,
      gridLoading: false,
      uploading: false,
      error: null,
      selectedTags: [],
      selectedUploadType: null,
      fileTypeFilter: "all",
      filesPageSize: 16,
    }),
}));

export default createUniversalSelectors(useFilesFoldersStoreBase);
export type { FileData };
