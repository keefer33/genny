import { create } from "zustand";
import createUniversalSelectors from "./universalSelectors";
import { showNotification } from "../notificationUtils";
import useAppStore from "./appStore";

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

  // Load all tags for a user
  loadTags: async (userId) => {
    if (!userId) return;

    set({ loading: true, error: null });
    try {
      const { data, error } = await useAppStore
        .getState()
        .getApi()
        .from("user_tags")
        .select("*")
        .eq("user_id", userId)
        .order("tag_name", { ascending: true });

      if (error) {
        console.error("Error loading tags:", error);
        set({ error: error.message });
        return;
      }

      set({ tags: data || [] });
    } catch (err: any) {
      console.error("Error loading tags:", err);
      set({ error: "Failed to load tags" });
    } finally {
      set({ loading: false });
    }
  },

  // Create a new tag
  createTag: async (userId, tagName) => {
    if (!userId || !tagName.trim()) return null;

    try {
      const { data, error } = await useAppStore
        .getState()
        .getApi()
        .from("user_tags")
        .insert({
          user_id: userId,
          tag_name: tagName.trim(),
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating tag:", error);
        showNotification({
          title: "Error",
          message: error.message,
          type: "error",
        });
        return null;
      }

      // Add to local state
      const { tags } = get();
      set({ tags: [...tags, data] });

      showNotification({
        title: "Success",
        message: "Tag created successfully",
        type: "success",
      });

      return data;
    } catch (err: any) {
      console.error("Error creating tag:", err);
      showNotification({
        title: "Error",
        message: "Failed to create tag",
        type: "error",
      });
      return null;
    }
  },

  // Update a tag
  updateTag: async (tagId, newTagName) => {
    if (!newTagName.trim()) return null;

    try {
      const { data, error } = await useAppStore
        .getState()
        .getApi()
        .from("user_tags")
        .update({
          tag_name: newTagName.trim(),
        })
        .eq("id", tagId)
        .select()
        .single();

      if (error) {
        console.error("Error updating tag:", error);
        showNotification({
          title: "Error",
          message: error.message,
          type: "error",
        });
        return null;
      }

      // Update local state
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
    } catch (err: any) {
      console.error("Error updating tag:", err);
      showNotification({
        title: "Error",
        message: "Failed to update tag",
        type: "error",
      });
      return null;
    }
  },

  // Delete a tag
  deleteTag: async (tagId) => {
    try {
      const { error } = await useAppStore
        .getState()
        .getApi()
        .from("user_tags")
        .delete()
        .eq("id", tagId);

      if (error) {
        console.error("Error deleting tag:", error);
        showNotification({
          title: "Error",
          message: error.message,
          type: "error",
        });
        return false;
      }

      // Remove from local state
      const { tags } = get();
      set({ tags: tags.filter((tag) => tag.id !== tagId) });

      showNotification({
        title: "Success",
        message: "Tag deleted successfully",
        type: "success",
      });

      return true;
    } catch (err: any) {
      console.error("Error deleting tag:", err);
      showNotification({
        title: "Error",
        message: "Failed to delete tag",
        type: "error",
      });
      return false;
    }
  },

  // Add tag to file
  addTagToFile: async (fileId, tagId) => {
    try {
      const { error } = await useAppStore.getState().getApi().from("user_file_tags").insert({
        file_id: fileId,
        tag_id: tagId,
      });

      if (error) {
        console.error("Error adding tag to file:", error);
        showNotification({
          title: "Error",
          message: error.message,
          type: "error",
        });
        return false;
      }

      return true;
    } catch (err: any) {
      console.error("Error adding tag to file:", err);
      showNotification({
        title: "Error",
        message: "Failed to add tag to file",
        type: "error",
      });
      return false;
    }
  },

  // Remove tag from file
  removeTagFromFile: async (fileId, tagId) => {
    try {
      const { error } = await useAppStore
        .getState()
        .getApi()
        .from("user_file_tags")
        .delete()
        .eq("file_id", fileId)
        .eq("tag_id", tagId);

      if (error) {
        console.error("Error removing tag from file:", error);
        showNotification({
          title: "Error",
          message: error.message,
          type: "error",
        });
        return false;
      }

      return true;
    } catch (err: any) {
      console.error("Error removing tag from file:", err);
      showNotification({
        title: "Error",
        message: "Failed to remove tag from file",
        type: "error",
      });
      return false;
    }
  },

  // Get tags for a specific file
  getFileTags: async (fileId) => {
    try {
      const { data, error } = await useAppStore
        .getState()
        .getApi()
        .from("user_file_tags")
        .select(
          `
          tag_id,
          created_at,
          user_tags(*)
        `
        )
        .eq("file_id", fileId);

      if (error) {
        console.error("Error getting file tags:", error);
        return [];
      }

      return data || [];
    } catch (err: any) {
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
export type { UserTag, UserFileTag, TagState };
