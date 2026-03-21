import { create } from "zustand";
import createUniversalSelectors from "./universalSelectors";
import { showNotification } from "../notificationUtils";
import useAppStore from "./appStore";
import { assertAuthFetchOk, authFetch } from "./authFetch";
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

interface TagState {
  // State
  tags: UserTag[];
  loading: boolean;
  error: string | null;

  // Actions
  setTags: (tags: UserTag[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Data loading
  loadTags: (userId: string) => Promise<void>;
  createTag: (userId: string, tagName: string) => Promise<UserTag | null>;
  updateTag: (tagId: string, newTagName: string) => Promise<UserTag | null>;
  deleteTag: (tagId: string) => Promise<boolean>;

  // File tagging
  addTagToFile: (fileId: string, tagId: string) => Promise<boolean>;
  removeTagFromFile: (fileId: string, tagId: string) => Promise<boolean>;
  getFileTags: (fileId: string) => Promise<UserFileTag[]>;

  // Utility functions
  reset: () => void;
}

const useTagStoreBase = create<TagState>((set, get) => ({
  // Initial state
  tags: [],
  loading: false,
  error: null,

  // Basic setters
  setTags: (tags) => set({ tags }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // Load all tags for a user (JWT identifies user; userId must match session)
  loadTags: async (userId) => {
    if (!userId) return;

    const appStore = useAppStore.getState();
    const session = appStore.getUser();
    if (!session?.user?.id || session.user.id !== userId || !appStore.getAuthApiKey()) {
      return;
    }

    set({ loading: true, error: null });
    try {
      const res = await authFetch(`${endpoint}/user/tags`);
      await assertAuthFetchOk(res, "Failed to load tags");
      const json = (await res.json()) as {
        success?: boolean;
        data?: { tags: UserTag[] };
      };
      set({ tags: json.data?.tags ?? [] });
    } catch (err: unknown) {
      console.error("Error loading tags:", err);
      set({ error: err instanceof Error ? err.message : "Failed to load tags" });
    } finally {
      set({ loading: false });
    }
  },

  // Create a new tag
  createTag: async (userId, tagName) => {
    if (!userId || !tagName.trim()) return null;

    const appStore = useAppStore.getState();
    const session = appStore.getUser();
    if (!session?.user?.id || session.user.id !== userId || !appStore.getAuthApiKey()) {
      return null;
    }

    try {
      const res = await authFetch(`${endpoint}/user/tags`, {
        method: "POST",
        body: JSON.stringify({ tag_name: tagName.trim() }),
      });
      await assertAuthFetchOk(res, "Failed to create tag");
      const json = (await res.json()) as {
        success?: boolean;
        data?: { tag: UserTag };
      };
      const data = json.data?.tag;
      if (!data) {
        showNotification({
          title: "Error",
          message: "Invalid response from server",
          type: "error",
        });
        return null;
      }

      const { tags } = get();
      set({ tags: [...tags, data] });

      showNotification({
        title: "Success",
        message: "Tag created successfully",
        type: "success",
      });

      return data;
    } catch (err: unknown) {
      console.error("Error creating tag:", err);
      showNotification({
        title: "Error",
        message: err instanceof Error ? err.message : "Failed to create tag",
        type: "error",
      });
      return null;
    }
  },

  // Update a tag
  updateTag: async (tagId, newTagName) => {
    if (!newTagName.trim()) return null;

    const appStore = useAppStore.getState();
    const session = appStore.getUser();
    if (!session?.user?.id || !appStore.getAuthApiKey()) {
      return null;
    }

    try {
      const res = await authFetch(`${endpoint}/user/tags/${encodeURIComponent(tagId)}`, {
        method: "PATCH",
        body: JSON.stringify({ tag_name: newTagName.trim() }),
      });
      await assertAuthFetchOk(res, "Failed to update tag");
      const json = (await res.json()) as {
        success?: boolean;
        data?: { tag: UserTag };
      };
      const data = json.data?.tag;
      if (!data) {
        showNotification({
          title: "Error",
          message: "Invalid response from server",
          type: "error",
        });
        return null;
      }

      const { tags } = get();
      set({
        tags: tags.map((tag) => (tag.id === tagId ? data : tag)),
      });

      showNotification({
        title: "Success",
        message: "Tag updated successfully",
        type: "success",
      });

      return data;
    } catch (err: unknown) {
      console.error("Error updating tag:", err);
      showNotification({
        title: "Error",
        message: err instanceof Error ? err.message : "Failed to update tag",
        type: "error",
      });
      return null;
    }
  },

  // Delete a tag
  deleteTag: async (tagId) => {
    const appStore = useAppStore.getState();
    const session = appStore.getUser();
    if (!session?.user?.id || !appStore.getAuthApiKey()) {
      return false;
    }

    try {
      const res = await authFetch(`${endpoint}/user/tags/${encodeURIComponent(tagId)}`, {
        method: "DELETE",
      });
      await assertAuthFetchOk(res, "Failed to delete tag");

      const { tags } = get();
      set({ tags: tags.filter((tag) => tag.id !== tagId) });

      showNotification({
        title: "Success",
        message: "Tag deleted successfully",
        type: "success",
      });

      return true;
    } catch (err: unknown) {
      console.error("Error deleting tag:", err);
      showNotification({
        title: "Error",
        message: err instanceof Error ? err.message : "Failed to delete tag",
        type: "error",
      });
      return false;
    }
  },

  // Add tag to file
  addTagToFile: async (fileId, tagId) => {
    const appStore = useAppStore.getState();
    const session = appStore.getUser();
    if (!session?.user?.id || !appStore.getAuthApiKey()) {
      return false;
    }

    try {
      const res = await authFetch(`${endpoint}/user/tags/file-links`, {
        method: "POST",
        body: JSON.stringify({ file_id: fileId, tag_id: tagId }),
      });
      await assertAuthFetchOk(res, "Failed to add tag to file");

      return true;
    } catch (err: unknown) {
      console.error("Error adding tag to file:", err);
      showNotification({
        title: "Error",
        message: err instanceof Error ? err.message : "Failed to add tag to file",
        type: "error",
      });
      return false;
    }
  },

  // Remove tag from file
  removeTagFromFile: async (fileId, tagId) => {
    const appStore = useAppStore.getState();
    const session = appStore.getUser();
    if (!session?.user?.id || !appStore.getAuthApiKey()) {
      return false;
    }

    try {
      const res = await authFetch(`${endpoint}/user/tags/file-links`, {
        method: "DELETE",
        body: JSON.stringify({ file_id: fileId, tag_id: tagId }),
      });
      await assertAuthFetchOk(res, "Failed to remove tag from file");

      return true;
    } catch (err: unknown) {
      console.error("Error removing tag from file:", err);
      showNotification({
        title: "Error",
        message: err instanceof Error ? err.message : "Failed to remove tag from file",
        type: "error",
      });
      return false;
    }
  },

  // Get tags for a specific file
  getFileTags: async (fileId) => {
    const appStore = useAppStore.getState();
    const session = appStore.getUser();
    if (!session?.user?.id || !appStore.getAuthApiKey()) {
      return [];
    }

    try {
      const res = await authFetch(`${endpoint}/user/tags/files/${encodeURIComponent(fileId)}`);
      await assertAuthFetchOk(res, "Failed to load file tags");
      const json = (await res.json()) as {
        success?: boolean;
        data?: { tags: UserFileTag[] };
      };
      return json.data?.tags ?? [];
    } catch (err: unknown) {
      console.error("Error getting file tags:", err);
      return [];
    }
  },

  // Utility functions
  reset: () =>
    set({
      tags: [],
      loading: false,
      error: null,
    }),
}));

export default createUniversalSelectors(useTagStoreBase);
