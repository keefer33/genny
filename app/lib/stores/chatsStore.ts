import { create } from "zustand";
import { notifications } from "@mantine/notifications";
import useAppStore from "~/lib/stores/appStore";
import { assertAuthFetchOk, authFetch, authFetchJson } from "~/lib/stores/authFetch";
import { endpoint, formatDate } from "~/lib/utils";

const LS_SELECTED_CHAT_ID = "genny:selectedChatId";

/** Catalog rows from GET /agents (models available for user agents / chats). */
export interface AgentModel {
  id: string;
  model_name: string;
  model_type?: string | null;
  order?: number | null;
  meta?: {
    tags?: string[];
    context_window?: number;
  } | null;
  brand_name?: { name: string | null; logo: string | null } | null;
  api_id?: {
    pricing?: { input?: string; output?: string };
    schema?: Record<string, unknown>;
    meta?: Record<string, unknown>;
  } | null;
}

/** Chat row from GET /chats (user_models_chats). */
export interface ChatRow {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  chat_name: string | null;
}

/** Message row from GET /chats/:id/messages (user_models_chats_messages). */
export interface ChatMessageRow {
  id: string;
  created_at: string;
  chat_id: string;
  /** Stored as json/jsonb in DB; API may return object or JSON string. */
  message:
    | string
    | {
        id?: string;
        role: "user" | "assistant";
        content: Array<{
          type: string;
          text?: string;
          image?: string;
          imageUrl?: string;
          videoUrl?: string;
          fileUrl?: string;
          fileName?: string;
          mediaType?: string;
          url?: string;
          name?: string;
          thumbnail_url?: string | null;
        }>;
      };
  /** Stored as json/jsonb in DB; API may return object or JSON string. */
  usage:
    | string
    | { inputTokens?: number; outputTokens?: number; totalTokens?: number; total_cost?: number }
    | null;
}

/** UI message shape for MessageBubble (same as agentsStore.UIMessage). */
export interface ChatUIMessage {
  id: string;
  role: "user" | "assistant";
  content: Array<{
    type: string;
    text?: string;
    /** AI SDK user image part URL */
    image?: string;
    imageUrl?: string;
    videoUrl?: string;
    fileUrl?: string;
    fileName?: string;
    mediaType?: string;
    url?: string;
    name?: string;
    thumbnail_url?: string | null;
  }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
    total_cost?: number;
  };
}

/** User agent row from user_agents table. */
export interface UserAgentRow {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  name: string;
  model_name: string;
  config: Record<string, unknown> | null;
}

/** Agent config.settings shape (tools = per-toolkit tool slugs + systemPrompt). */
export interface UserAgentSettings {
  /** Map toolkit slug -> enabled tool slugs e.g. { gmail: ["GMAIL_SEND_EMAIL"], github: ["GITHUB_CREATE_ISSUE"] } */
  tools?: Record<string, string[]>;
  systemPrompt?: string;
}

/** Type for agent.config when it has settings. */
export interface UserAgentConfigWithSettings {
  settings?: UserAgentSettings;
  [key: string]: unknown;
}

function safeJsonParse(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function chatMessageRowToUIMessage(row: ChatMessageRow): ChatUIMessage {
  const parsedMessage = safeJsonParse(row.message) as
    | {
        id?: string;
        role?: "user" | "assistant";
        content?: Array<{
          type: string;
          text?: string;
          image?: string;
          imageUrl?: string;
          videoUrl?: string;
          fileUrl?: string;
          fileName?: string;
          mediaType?: string;
        }>;
      }
    | string
    | null
    | undefined;

  const messageObj =
    parsedMessage && typeof parsedMessage === "object" ? (parsedMessage as any) : null;

  const parsedUsage = safeJsonParse(row.usage) as
    | {
        inputTokens?: number;
        outputTokens?: number;
        totalTokens?: number;
        total_cost?: number;
      }
    | null
    | undefined;

  const totalCost =
    typeof parsedUsage?.total_cost === "number" && Number.isFinite(parsedUsage.total_cost)
      ? parsedUsage.total_cost
      : undefined;

  return {
    id: row.id,
    role: messageObj?.role === "user" ? "user" : "assistant",
    content: Array.isArray(messageObj?.content) ? messageObj.content : [],
    usage:
      parsedUsage?.totalTokens != null
        ? {
            input_tokens: parsedUsage.inputTokens ?? 0,
            output_tokens: parsedUsage.outputTokens ?? 0,
            total_tokens: parsedUsage.totalTokens ?? 0,
            ...(totalCost != null ? { total_cost: totalCost } : {}),
          }
        : totalCost != null
          ? { total_cost: totalCost }
          : undefined,
  };
}

interface ChatsState {
  /** Catalog from GET /agents (e.g. text models for picker / create agent). */
  agentModels: AgentModel[];
  setAgentModels: (models: AgentModel[]) => void;
  getAgentModels: () => AgentModel[];
  loadAgentModels: () => Promise<void>;

  chats: ChatRow[];
  getChats: () => ChatRow[];
  chatsLoading: boolean;
  messages: ChatUIMessage[];
  streamingContent: string;
  streamingReasoning: string;
  /** File URLs received during current stream (so streaming bubble can show images). Cleared when stream ends. */
  streamedFileUrls: string[];
  /** Current stream phase for UI: start, reasoning-start, tool-input-start, start-step, etc. */
  streamStatus: { status: string; tool_name?: string } | null;
  runChatLoading: boolean;

  selectedModelName: string | null;
  selectedChat: string | null;
  selectedAgent: UserAgentRow | null;
  agentPickerOpen: boolean;
  /** Mobile full-screen chats list modal (driven from SelectedChatBar). */
  chatsListModalOpen: boolean;
  setChatsListModalOpen: (open: boolean) => void;
  setSelectedModelName: (name: string | null) => void;
  setSelectedChat: (chat: string | null) => void;
  setSelectedAgent: (agent: UserAgentRow | null) => void;
  setAgentPickerOpen: (open: boolean) => void;
  editingChatId: string | null;
  editingTitle: string;
  deletingAllChats: boolean;
  setEditingChatId: (id: string | null) => void;
  setEditingTitle: (title: string) => void;
  startEditChat: (chat: ChatRow) => void;
  cancelEditChat: () => void;
  saveEditedChatTitle: () => Promise<void>;
  clearSelectedChat: () => void;
  selectChatByRow: (chat: ChatRow) => Promise<void>;
  deleteChatFromList: (chatId: string) => Promise<void>;
  deleteAllChatsFromList: () => Promise<void>;
  hydrateSelectedChatFromStorage: () => Promise<void>;

  setMessages: (messages: ChatUIMessage[]) => void;
  clearChats: () => void;
  loadMessagesForChat: (chatId: string) => Promise<void>;
  runChat: (
    chatId: string | null,
    modelName: string,
    settings: { systemPrompt?: string },
    prompt: string,
    attachments?: Array<{
      url: string;
      type?: string;
      name?: string;
      thumbnail_url?: string | null;
    }>
  ) => Promise<void>;

  listChats: () => Promise<ChatRow[]>;
  createChat: (chatName?: string) => Promise<ChatRow | null>;
  updateChat: (chatId: string, chatName: string) => Promise<boolean>;
  deleteChat: (chatId: string) => Promise<boolean>;
  createChatMessage: (
    chatId: string,
    message: {
      id: string;
      role: "user" | "assistant";
      content: Array<{ type: string; text?: string }>;
    },
    usage?: Record<string, unknown>
  ) => Promise<ChatMessageRow | null>;
}

const userChoseNewChatRef = { current: false };

export const useChatsStore = create<ChatsState>((set, get) => ({
  agentModels: [],
  setAgentModels: (agentModels) => set({ agentModels }),
  getAgentModels: () => get().agentModels,
  loadAgentModels: async () => {
    try {
      const data = await authFetchJson<AgentModel[]>(`${endpoint}/agents`, undefined, {
        errorMessage: "Failed to load agent models",
      });

      set({ agentModels: data });
    } catch (err) {
      console.error("[chatsStore] loadAgentModels:", err);
      set({ agentModels: [] });
    }
  },
  chats: [],
  getChats: () => get().chats,
  chatsLoading: false,
  agents: [],
  agentsLoading: false,
  messages: [],
  streamingContent: "",
  streamingReasoning: "",
  streamedFileUrls: [],
  streamStatus: null,
  runChatLoading: false,

  selectedModelName: null,
  selectedChat: null,
  selectedAgent: null,
  agentPickerOpen: false,
  chatsListModalOpen: false,
  setChatsListModalOpen: (open) => set({ chatsListModalOpen: open }),
  editingChatId: null,
  editingTitle: "",
  deletingAllChats: false,
  userChoseNewChatRef,
  setSelectedModelName: (name) => set({ selectedModelName: name }),
  setSelectedChat: (chat) => set({ selectedChat: chat }),
  setSelectedAgent: (agent) => set({ selectedAgent: agent }),
  setAgentPickerOpen: (open) => set({ agentPickerOpen: open }),
  setEditingChatId: (id) => set({ editingChatId: id }),
  setEditingTitle: (title) => set({ editingTitle: title }),
  startEditChat: (chat) =>
    set({
      editingChatId: chat.id,
      editingTitle: chat.chat_name ?? "",
    }),
  cancelEditChat: () => set({ editingChatId: null, editingTitle: "" }),
  saveEditedChatTitle: async () => {
    const { editingChatId, editingTitle, chats, updateChat } = get();
    if (!editingChatId) return;
    const chat = chats.find((c) => c.id === editingChatId);
    if (!chat) {
      set({ editingChatId: null });
      return;
    }
    const newTitle = editingTitle.trim();
    const fallbackTitle = formatDate(chat.updated_at);
    await updateChat(editingChatId, newTitle || fallbackTitle);
    set({ editingChatId: null });
  },
  clearSelectedChat: () => {
    set({ selectedChat: null, messages: [], chatsListModalOpen: false });
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(LS_SELECTED_CHAT_ID);
    }
  },
  selectChatByRow: async (chat) => {
    await get().loadMessagesForChat(chat.id);
    set({ selectedChat: chat.id, chatsListModalOpen: false });
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LS_SELECTED_CHAT_ID, chat.id);
    }
  },
  deleteAllChatsFromList: async () => {
    const { chats, deleteChat } = get();
    if (chats.length === 0) return;
    set({ deletingAllChats: true });
    try {
      for (const chat of chats) {
        await deleteChat(chat.id);
      }
      get().clearSelectedChat();
    } finally {
      set({ deletingAllChats: false });
    }
  },
  hydrateSelectedChatFromStorage: async () => {
    await get().listChats();
    if (typeof window === "undefined") return;
    const savedChatId = window.localStorage.getItem(LS_SELECTED_CHAT_ID);
    if (!savedChatId) return;
    await get().loadMessagesForChat(savedChatId);
    set({ selectedChat: savedChatId });
  },

  setMessages: (messages: ChatUIMessage[]) => set({ messages }),

  clearChats: () =>
    set({
      chats: [],
      selectedChat: null,
      messages: [],
      selectedModelName: null,
      streamingContent: "",
      streamingReasoning: "",
      streamedFileUrls: [],
      streamStatus: null,
      chatsListModalOpen: false,
    }),

  runChat: async (
    chatId: string | null,
    modelName: string,
    settings: { systemPrompt?: string },
    prompt: string,
    attachments?: Array<{
      url: string;
      type?: string;
      name?: string;
      thumbnail_url?: string | null;
    }>
  ) => {
    const apiKey = useAppStore.getState().getAuthApiKey();
    if (!apiKey) return;
    set({
      runChatLoading: true,
      streamingContent: "",
      streamingReasoning: "",
      streamedFileUrls: [],
      streamStatus: null,
    });
    const userMessage: ChatUIMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: [
        { type: "text", text: prompt },
        ...((attachments ?? []).map((a) => {
          const mediaType = (a.type ?? "").toLowerCase();
          const looksLikeImage =
            mediaType.startsWith("image/") || /\.(jpe?g|png|gif|webp|bmp|svg)(\?|$)/i.test(a.url);
          if (looksLikeImage) {
            return { type: "image", image: a.thumbnail_url || a.url };
          }
          if (mediaType.startsWith("video/")) {
            return { type: "video", videoUrl: a.url, mediaType, fileName: a.name };
          }
          return {
            type: "file",
            fileUrl: a.url,
            mediaType: mediaType || undefined,
            fileName: a.name,
          };
        }) as Array<{
          type: string;
          image?: string;
          imageUrl?: string;
          videoUrl?: string;
          fileUrl?: string;
          mediaType?: string;
          fileName?: string;
        }>),
      ],
    };
    set((s) => ({ messages: [...s.messages, userMessage] }));

    type StreamEvent = {
      type: string;
      content?: string;
      url?: string;
      error?: string;
      status?: string;
      tool_name?: string;
      input_tokens?: number;
      output_tokens?: number;
      total_tokens?: number;
      total_cost?: unknown;
    };
    const clearStreamingState = () =>
      set({
        runChatLoading: false,
        streamingContent: "",
        streamingReasoning: "",
        streamedFileUrls: [],
        streamStatus: null,
      });
    const getRunChatErrorMessage = (err: unknown) => {
      if (err instanceof Error) {
        if (/unauthorized|401/i.test(err.message)) {
          return "Your session expired. Please sign in again.";
        }
        return err.message;
      }
      return "Failed to run chat";
    };
    const parseSseLine = (line: string): StreamEvent | null => {
      if (!line.startsWith("data: ")) return null;
      try {
        return JSON.parse(line.slice(6)) as StreamEvent;
      } catch {
        return null;
      }
    };

    try {
      const res = await authFetch(`${endpoint}/agents/run`, {
        method: "POST",
        body: JSON.stringify({
          chat_id: chatId,
          model_name: modelName,
          settings,
          prompt,
          attachments: attachments ?? [],
        }),
      });

      await assertAuthFetchOk(res, "Failed to run agent");

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error("Agent stream is unavailable.");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";
      const streamedFileUrls: string[] = [];
      let lastUsage: {
        input_tokens?: number;
        output_tokens?: number;
        total_tokens?: number;
        total_cost?: number;
      } | null = null;

      const handleStreamEvent = (data: StreamEvent) => {
        if (data.type === "text" && data.content) {
          assistantText += data.content;
          set({ streamingContent: assistantText });
          return;
        }
        if (data.type === "reasoning" && data.content) {
          set((s) => ({ streamingReasoning: `${s.streamingReasoning}${data.content}` }));
          return;
        }
        if (data.type === "file" && data.url) {
          streamedFileUrls.push(data.url);
          set((s) => ({ streamedFileUrls: [...s.streamedFileUrls, data.url] }));
          return;
        }
        if (data.type === "stream_status" && data.status != null) {
          const shouldClearReasoning =
            data.status === "reasoning-end" || data.status === "reasoning_end";
          set({
            streamStatus: {
              status: data.status,
              ...(data.tool_name != null ? { tool_name: data.tool_name } : {}),
            },
            ...(shouldClearReasoning ? { streamingReasoning: "" } : {}),
          });
          return;
        }
        if (data.type === "usage") {
          const totalCostRaw = data.total_cost;
          const totalCost =
            typeof totalCostRaw === "number"
              ? totalCostRaw
              : typeof totalCostRaw === "string"
                ? Number(totalCostRaw)
                : undefined;
          lastUsage = {
            input_tokens: data.input_tokens,
            output_tokens: data.output_tokens,
            total_tokens: data.total_tokens,
            total_cost: Number.isFinite(totalCost) ? totalCost : undefined,
          };
          set({ streamStatus: null, streamingReasoning: "" });
          return;
        }
        if (data.type === "error") {
          set({ streamStatus: null, streamingReasoning: "" });
          throw new Error(data.error ?? "Stream error");
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const parsed = parseSseLine(line);
          if (!parsed) continue;
          handleStreamEvent(parsed);
        }
      }
      if (buffer.trim().length > 0) {
        const parsed = parseSseLine(buffer.trim());
        if (parsed) {
          handleStreamEvent(parsed);
        }
      }

      const usage = lastUsage;
      const content: ChatUIMessage["content"] = [
        { type: "text", text: assistantText },
        ...streamedFileUrls.map((url) => ({ type: "image" as const, imageUrl: url })),
      ];
      const assistantMessage: ChatUIMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content,
        usage:
          usage != null
            ? {
                input_tokens: usage.input_tokens ?? 0,
                output_tokens: usage.output_tokens ?? 0,
                total_tokens: usage.total_tokens ?? 0,
                ...(usage.total_cost != null ? { total_cost: usage.total_cost } : {}),
              }
            : undefined,
      };
      set((s) => ({
        messages: [...s.messages, assistantMessage],
        streamingContent: "",
        streamingReasoning: "",
        streamedFileUrls: [],
        streamStatus: null,
        runChatLoading: false,
      }));
    } catch (err) {
      clearStreamingState();
      notifications.show({
        title: "Error",
        message: getRunChatErrorMessage(err),
        color: "red",
      });
    }
  },

  listChats: async () => {
    set({ chatsLoading: true });
    try {
      const data = await authFetchJson<unknown>(`${endpoint}/chats`, undefined, {
        errorMessage: "Failed to list chats",
      });
      const list = (Array.isArray(data) ? data : []) as ChatRow[];
      set({ chats: list });
      return list;
    } catch (err) {
      console.error("[chatsStore] listChats:", err);
      set({ chats: [] });
      return [];
    } finally {
      set({ chatsLoading: false });
    }
  },

  createChat: async (chatName?: string) => {
    try {
      const chat = await authFetchJson<ChatRow>(
        `${endpoint}/chats`,
        {
          method: "POST",
          body: JSON.stringify({ chat_name: chatName ?? null }),
        },
        { errorMessage: "Failed to create chat" }
      );
      set((s) => ({ chats: [chat, ...s.chats] }));
      return chat;
    } catch (err) {
      console.error("[chatsStore] createChat:", err);
      notifications.show({ title: "Error", message: (err as Error).message, color: "red" });
      return null;
    }
  },

  updateChat: async (chatId: string, chatName: string) => {
    try {
      const updated = await authFetchJson<ChatRow>(
        `${endpoint}/chats/chat/${encodeURIComponent(chatId)}`,
        {
          method: "PATCH",
          body: JSON.stringify({ chat_name: chatName }),
        },
        { errorMessage: "Failed to update chat" }
      );
      set((s) => ({
        chats: s.chats.map((c) => (c.id === chatId ? updated : c)),
      }));
      return true;
    } catch {
      return false;
    }
  },
  deleteChatFromList: async (chatId) => {
    const ok = await get().deleteChat(chatId);
    if (!ok) return;
    const selectedChat = get().selectedChat;
    if (selectedChat === chatId) {
      get().clearSelectedChat();
      return;
    }
    if (typeof window !== "undefined") {
      const savedChatId = window.localStorage.getItem(LS_SELECTED_CHAT_ID);
      if (savedChatId === chatId) {
        window.localStorage.removeItem(LS_SELECTED_CHAT_ID);
      }
    }
  },
  deleteChat: async (chatId: string) => {
    try {
      const res = await authFetch(`${endpoint}/chats/chat/${encodeURIComponent(chatId)}`, {
        method: "DELETE",
      });
      await assertAuthFetchOk(res, "Failed to delete chat");
      set((s) => ({ chats: s.chats.filter((c) => c.id !== chatId) }));
      return true;
    } catch (err) {
      console.error("[chatsStore] deleteChat:", err);
      notifications.show({ title: "Error", message: (err as Error).message, color: "red" });
      return false;
    }
  },
  loadMessagesForChat: async (chatId: string) => {
    try {
      const rows = await authFetchJson<ChatMessageRow[]>(
        `${endpoint}/chats/chat/${encodeURIComponent(chatId)}/messages?order=asc`,
        undefined,
        { errorMessage: "Failed to load messages" }
      );
      set({
        messages: (Array.isArray(rows) ? rows : []).map(chatMessageRowToUIMessage),
      });
    } catch {
      set({ messages: [] });
    }
  },

  createChatMessage: async (
    chatId: string,
    message: {
      id: string;
      role: "user" | "assistant";
      content: Array<{ type: string; text?: string }>;
    },
    usage?: Record<string, unknown>
  ) => {
    try {
      return await authFetchJson<ChatMessageRow>(
        `${endpoint}/chats/chat/${encodeURIComponent(chatId)}/messages`,
        {
          method: "POST",
          body: JSON.stringify({ message, usage: usage ?? null }),
        },
        { errorMessage: "Failed to create message" }
      );
    } catch (err) {
      console.error("[chatsStore] createChatMessage:", err);
      return null;
    }
  },
}));
