import { create } from "zustand";
import { showNotification } from "../notificationUtils";
import useAppStore from "./appStore";
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
  file_size: number;
  file_type: string;
  created_at: string;
  status?: string;
  deleted_at?: string | null;
  upload_type?: string;
  user_file_tags?: UserFileTag[];
}

interface PaginationData {
  data: FileData[];
  total: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
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
  fileTypeFilter: "images" | "videos" | "all";

  // Actions
  setFiles: (files: FileData[]) => void;
  setPaginationData: (data: PaginationData) => void;
  setLoading: (loading: boolean) => void;
  setGridLoading: (gridLoading: boolean) => void;
  setUploading: (uploading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedTags: (tags: string[]) => void;
  setSelectedUploadType: (uploadType: string | null) => void;
  setFileTypeFilter: (filter: "images" | "videos" | "all") => void;
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
  getFileTypeFilter: () => "images" | "videos" | "all";
  getFilteredFiles: (files?: FileData[]) => FileData[];
  // File operations
  uploadFile: (file: File, userId: string) => Promise<boolean>;
  deleteFile: (fileName: string, fileId: string, userId: string) => Promise<boolean>;
  updateFileName: (
    fileId: string,
    newFileName: string,
    userId: string
  ) => Promise<{ success: boolean; updatedFile?: FileData }>;

  // Data loading
  loadUserFiles: (
    page?: number,
    limit?: number,
    userId?: string,
    selectedTags?: string[],
    uploadType?: string | null,
    fileTypeFilter?: "images" | "videos" | "all" | null,
    isPageChange?: boolean,
    generationModelId?: string | null,
    generationType?: string | null
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
  getFilteredFiles: (files) => {
    const filesToFilter = files || get().paginationData.data;
    const fileTypeFilter = get().fileTypeFilter;

    // If no filter or filter is "all", return all files
    if (!fileTypeFilter || fileTypeFilter === "all") {
      return filesToFilter;
    }

    // Filter files by type
    return filesToFilter.filter((file) => {
      // Handle missing or invalid file_type
      if (!file || !file.file_type || typeof file.file_type !== "string") {
        return false;
      }

      const normalizedFileType = file.file_type.toLowerCase().trim();

      if (fileTypeFilter === "images") {
        return normalizedFileType.startsWith("image/");
      }

      if (fileTypeFilter === "videos") {
        return normalizedFileType.startsWith("video/");
      }

      return true;
    });
  },

  // File operations
  uploadFile: async (file: File, userId: string) => {
    set({ uploading: true, error: null, gridLoading: false });
    const session = useAppStore.getState().getUser();
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

      // Upload to Zipline
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${endpoint}/zipline/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token || ""}`,
          // Don't set Content-Type header - browser will set it with boundary
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Upload error:", errorData);
        showNotification({
          title: "Upload failed",
          message: errorData?.error || "Failed to upload file",
          type: "error",
        });
        return false;
      }

      const uploadResponse = await response.json();

      // Get the file URL from the Zipline response
      const uploadedFile = uploadResponse?.data?.files[0];

      // Save file metadata to database
      const { error: dbError } = await useAppStore
        .getState()
        .getApi()
        .from("user_files")
        .insert({
          user_id: userId,
          file_name: uploadedFile.name, // Use original filename for display
          file_path: uploadedFile.url,
          file_size: file.size,
          file_type: uploadedFile.type,
          status: "active",
          upload_type: "upload",
        })
        .select()
        .single();

      if (dbError) {
        console.error("Database error:", dbError);
        showNotification({
          title: "Database error",
          message: dbError.message,
          type: "error",
        });
        return false;
      }

      showNotification({
        title: "Upload successful",
        message: `File "${file.name}" uploaded successfully`,
        type: "success",
      });

      // Refresh the files list
      await get().loadUserFiles(1, 12, userId, undefined, undefined, undefined);

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

  deleteFile: async (fileName: string, fileId: string, userId: string) => {
    set({ loading: true, error: null, gridLoading: false });
    const session = useAppStore.getState().getUser();
    try {
      await fetch(`${endpoint}/zipline/user/files/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({ idOrName: fileName }),
      });

      // Update file status to deleted in database instead of actually deleting
      const { error: dbError } = await useAppStore
        .getState()
        .getApi()
        .from("user_files")
        .delete()
        .eq("id", fileId)
        .eq("user_id", userId);

      if (dbError) {
        console.error("Database deletion error:", dbError);
        showNotification({
          title: "Error",
          message: dbError.message,
          type: "error",
        });
        return false;
      }

      showNotification({
        title: "Success",
        message: "File deleted successfully",
        type: "success",
      });

      // Refresh the files list
      await get().loadUserFiles(
        get().paginationData.currentPage,
        12,
        userId,
        undefined,
        undefined,
        undefined
      );

      return true;
    } catch (error: any) {
      console.error("Delete error:", error);
      showNotification({
        title: "Error",
        message: error.message || "An unexpected error occurred",
        type: "error",
      });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  updateFileName: async (fileId: string, newFileName: string, userId: string) => {
    set({ loading: true, error: null, gridLoading: false });

    try {
      // Get the current file to extract the file path
      const { data: currentFile, error: fetchError } = await useAppStore
        .getState()
        .getApi()
        .from("user_files")
        .select("file_path, file_name")
        .eq("id", fileId)
        .eq("user_id", userId)
        .eq("status", "active")
        .single();

      if (fetchError || !currentFile) {
        showNotification({
          title: "Error",
          message: "File not found",
          type: "error",
        });
        return { success: false };
      }

      // Extract the file extension from the original filename
      const fileExtension = currentFile.file_name.split(".").pop() || "";
      const newFileNameWithExtension = newFileName.includes(".")
        ? newFileName
        : `${newFileName}.${fileExtension}`;

      // Update the file name in the database
      const { data: updatedFile, error: updateError } = await useAppStore
        .getState()
        .getApi()
        .from("user_files")
        .update({ file_name: newFileNameWithExtension })
        .eq("id", fileId)
        .eq("user_id", userId)
        .select()
        .single();

      if (updateError) {
        console.error("Update error:", updateError);
        showNotification({
          title: "Error",
          message: updateError.message,
          type: "error",
        });
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
    limit = 12,
    userId?: string,
    selectedTags?: string[],
    uploadType?: string | null,
    fileTypeFilter?: "images" | "videos" | "all" | null,
    isPageChange?: boolean,
    generationModelId?: string | null,
    generationType?: string | null
  ) => {
    // Auto-get userId from appStore if not provided
    set({ paginationData: { ...get().paginationData, currentPage: page } });
    const finalUserId = userId || useAppStore.getState().getUser()?.user?.id;
    if (!finalUserId) {
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

    set({ gridLoading: true, error: null });

    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query;

      if (finalSelectedTags && finalSelectedTags.length > 0) {
        // When filtering by tags, we need to use a different approach
        // First, get all files with the selected tags
        const { data: taggedFiles, error: tagError } = await useAppStore
          .getState()
          .getApi()
          .from("user_file_tags")
          .select("file_id")
          .in("tag_id", finalSelectedTags);

        if (tagError) {
          console.error("Error fetching tagged files:", tagError);
          set({ error: tagError.message });
          return;
        }

        const fileIds = taggedFiles?.map((ft) => ft.file_id) || [];

        if (fileIds.length === 0) {
          // No files have the selected tags
          set({
            files: [],
            paginationData: {
              data: [],
              total: 0,
              totalPages: 0,
              currentPage: page,
              hasNextPage: false,
              hasPrevPage: false,
            },
          });
          return;
        }

        // Now get the files with pagination
        query = useAppStore
          .getState()
          .getApi()
          .from("user_files")
          .select(
            `
            *,
            user_file_tags(
              tag_id,
              created_at,
              user_tags(*)
            )
          `,
            { count: "exact" }
          )
          .eq("user_id", finalUserId)
          .eq("status", "active")
          .in("id", fileIds);
      } else {
        // No tag filtering, get all files
        query = useAppStore
          .getState()
          .getApi()
          .from("user_files")
          .select(
            `
            *,
            user_file_tags(
              tag_id,
              created_at,
              user_tags(*)
            )
          `,
            { count: "exact" }
          )
          .eq("user_id", finalUserId)
          .eq("status", "active");
      }

      // Apply upload_type filter if provided and not null
      // When finalUploadType is null, we want to load all files (both "upload" and "generation" types)
      if (finalUploadType !== null && finalUploadType !== undefined) {
        query = query.eq("upload_type", finalUploadType);
      }

      // Apply file_type filter if provided and not "all"
      // Use ilike for case-insensitive matching
      if (finalFileTypeFilter && finalFileTypeFilter !== "all") {
        if (finalFileTypeFilter === "images") {
          query = query.ilike("file_type", "image/%");
        } else if (finalFileTypeFilter === "videos") {
          query = query.ilike("file_type", "video/%");
        }
      }

      // Apply generation filters if provided
      // If filtering by generation model or type, we need to get file IDs from generations first
      if (generationModelId || generationType) {
        const supabase = useAppStore.getState().getApi();
        if (supabase) {
          // First, get generations matching the filters
          let generationQuery = supabase
            .from("user_generations")
            .select("id")
            .eq("user_id", finalUserId)
            .eq("status", "completed");

          if (generationModelId) {
            generationQuery = generationQuery.eq("model_id", generationModelId);
          }

          if (generationType) {
            generationQuery = generationQuery.eq("generation_type", generationType);
          }

          const { data: generations, error: genError } = await generationQuery;

          if (genError) {
            console.error("Error fetching generations for filter:", genError);
            set({ error: genError.message });
            return;
          }

          if (!generations || generations.length === 0) {
            // No generations match, so no files to show
            set({
              files: [],
              paginationData: {
                data: [],
                total: 0,
                totalPages: 0,
                currentPage: page,
                hasNextPage: false,
                hasPrevPage: false,
              },
            });
            return;
          }

          const generationIds = generations.map((g) => g.id);

          // Now get file IDs from user_generation_files
          const { data: generationFiles, error: genFileError } = await supabase
            .from("user_generation_files")
            .select("file_id")
            .in("generation_id", generationIds);

          if (genFileError) {
            console.error("Error fetching generation files:", genFileError);
            set({ error: genFileError.message });
            return;
          }

          if (!generationFiles || generationFiles.length === 0) {
            // No files from these generations
            set({
              files: [],
              paginationData: {
                data: [],
                total: 0,
                totalPages: 0,
                currentPage: page,
                hasNextPage: false,
                hasPrevPage: false,
              },
            });
            return;
          }

          const fileIds = [...new Set(generationFiles.map((gf) => gf.file_id))];

          // Filter the main query to only include these file IDs
          if (finalSelectedTags && finalSelectedTags.length > 0) {
            // If we also have tag filtering, intersect the file IDs
            const { data: taggedFiles } = await supabase
              .from("user_file_tags")
              .select("file_id")
              .in("tag_id", finalSelectedTags);

            const taggedFileIds = taggedFiles?.map((ft) => ft.file_id) || [];
            const intersection = fileIds.filter((id) => taggedFileIds.includes(id));

            if (intersection.length === 0) {
              set({
                files: [],
                paginationData: {
                  data: [],
                  total: 0,
                  totalPages: 0,
                  currentPage: page,
                  hasNextPage: false,
                  hasPrevPage: false,
                },
              });
              return;
            }

            query = query.in("id", intersection);
          } else {
            query = query.in("id", fileIds);
          }
        }
      }

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        console.error("Error fetching files:", error);
        set({ error: error.message });
        return;
      }

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      set({
        files: data || [],
        paginationData: {
          data: data || [],
          total,
          totalPages,
          currentPage: page,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      });
    } catch (err: any) {
      console.error("Error fetching files:", err);
      set({ error: "Failed to fetch files" });
    } finally {
      set({ gridLoading: false });
    }
  },

  handleFilesPageChange: async (page: number) => {
    set({ paginationData: { ...get().paginationData, currentPage: page } });
    // Get generation filters from generateStore to preserve them during page change
    try {
      const generateStoreModule = await import("./generateStore");
      const generateStore = generateStoreModule.default;
      const state = generateStore.getState?.();
      const selectedFilterModelId = state?.selectedFilterModelId;
      const selectedGenerationType = state?.selectedGenerationType;

      await get().loadUserFiles(
        page,
        12,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        selectedFilterModelId || undefined,
        selectedGenerationType || undefined
      );
    } catch (error) {
      console.error("Error fetching files:", error);
      // Fallback if generateStore is not available
      await get().loadUserFiles(
        page,
        12,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined
      );
    }
  },

  handleFileUpdate: async () => {
    // Get generation filters from generateStore
    // Use dynamic import to avoid circular dependency
    try {
      const generateStoreModule = await import("./generateStore");
      const generateStore = generateStoreModule.default;
      const state = generateStore.getState?.();
      const selectedFilterModelId = state?.selectedFilterModelId;
      const selectedGenerationType = state?.selectedGenerationType;

      await get().loadUserFiles(
        get().paginationData.currentPage,
        12,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        selectedFilterModelId || undefined,
        selectedGenerationType || undefined
      );
    } catch (error) {
      console.error("Error updating files:", error);
      // Fallback if generateStore is not available
      await get().loadUserFiles(
        get().paginationData.currentPage,
        12,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined
      );
    }
  },

  refreshData: async (userId?: string) => {
    const { paginationData } = get();
    await get().loadUserFiles(
      paginationData.currentPage,
      12,
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
    }),
}));

export default createUniversalSelectors(useFilesFoldersStoreBase);
export type { FileData, FilesFoldersState, PaginationData };
