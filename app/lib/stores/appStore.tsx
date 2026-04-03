import { create } from "zustand";
import createUniversalSelectors from "./universalSelectors";
import { createClient } from "@supabase/supabase-js";
import { assertAuthFetchOk, authFetch, authFetchJson } from "./authFetch";
import { saveThemeSettings } from "../themeUtils";
import { endpoint } from "../utils";

// Types matching provided User/session payload
interface SupabaseIdentityData {
  avatar_url?: string;
  custom_claims?: Record<string, unknown>;
  email?: string;
  email_verified?: boolean;
  full_name?: string;
  iss?: string;
  name?: string;
  phone_verified?: boolean;
  picture?: string;
  provider_id?: string;
  sub?: string;
}

interface SupabaseIdentity {
  identity_id: string;
  id: string;
  user_id: string;
  identity_data: SupabaseIdentityData;
  provider: string;
  last_sign_in_at: string;
  created_at: string;
  updated_at: string;
  email: string;
}

interface AppMetadata {
  provider?: string;
  providers?: string[];
}

interface UserMetadata {
  avatar_url?: string;
  custom_claims?: Record<string, unknown>;
  email?: string;
  email_verified?: boolean;
  full_name?: string;
  iss?: string;
  name?: string;
  phone_verified?: boolean;
  picture?: string;
  provider_id?: string;
  sub?: string;
}

interface AuthUser {
  id: string;
  aud: string;
  role: string;
  email: string;
  email_confirmed_at?: string;
  phone?: string;
  confirmed_at?: string;
  recovery_sent_at?: string;
  last_sign_in_at?: string;
  app_metadata?: AppMetadata;
  user_metadata?: UserMetadata;
  identities?: SupabaseIdentity[];
  created_at?: string;
  updated_at?: string;
  is_anonymous?: boolean;
}

interface Profile {
  id: number;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
  email: string;
  username: string;
  phone: string;
  usage_balance?: number;
  api_key?: string | null;
  meta?: Record<string, any> | null;
}

interface Session {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
  refresh_token: string;
  user: AuthUser;
  profile?: Profile;
  created_at?: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  id?: string;
}

export interface ThemeSettings {
  colorScheme: "light" | "dark" | "auto";
  themeColor: string;
}

/** POST /user/api-key — uses Supabase access_token. Best-effort; logs on failure. */
async function persistApiKeyToProfile(
  sessionData: { access_token?: string },
  apiKey: string,
  logPrefix: string
) {
  try {
    const res = await authFetch(
      `${endpoint}/user/api-key`,
      { method: "POST", body: JSON.stringify({ api_key: apiKey }) },
      { accessToken: sessionData?.access_token ?? undefined }
    );
    await assertAuthFetchOk(res, "Failed to save api_key");
  } catch (e) {
    console.error(`${logPrefix} Failed to save api_key to user_profiles:`, e);
  }
}

interface AppStoreState {
  // Loading states
  loading: boolean;
  appLoading: boolean;
  pageLoading: boolean;
  themeSettings: ThemeSettings;
  api: any;
  user: Session | null;
  isMobile: boolean;
  page: string | undefined;
  userUsageBalance: number;
  authApiKey: string | null;
  setAuthApiKey: (authApiKey: string | null) => void;
  getAuthApiKey: () => string | null;
  setUserUsageBalance: (usageBalance: number) => void;
  setLoading: (loading: boolean) => void;
  setThemeSettings: (themeSettings: ThemeSettings) => void;
  getThemeSettings: () => ThemeSettings;
  changeThemeColor: (color: string) => void;
  updateThemeSettings: (settings: Partial<ThemeSettings>) => void;
  setApi: () => void;
  setAppLoading: (appLoading: boolean) => void;
  setIsMobile: (isMobile: boolean) => void;
  setPage: (page: string | undefined) => void;
  getPage: () => string | undefined;
  signOut: () => void;
  getApi: () => any;
  setUser: (user: Session | null) => void;
  getUser: () => Session | null;
  userProfile: (sessionData: any) => Promise<any>;
  userLogin: (sessionData: any) => void;
  generateRandomUsername: () => string;
  generateRandomPassword: () => string;
  registerZiplineUser: (username: string, password: string, inviteCode?: string) => Promise<any>;
  updateUserProfile: (values: {
    first_name: string;
    last_name: string;
    bio: string;
    username: string;
  }) => Promise<{ success: boolean; error?: string }>;
  createToken: (sessionData: any) => Promise<any>;
  getCurrentUserUsageBalance: () => number;
  checkApiHealth: () => Promise<boolean>;
  getCurrentSession: () => Promise<Session | null>;
  setAuthRealtimeChannel: (channel: any) => void;
  authRealtimeChannel: any;
}

const useAppStoreBase = create<AppStoreState>((set, get) => ({
  // Initial state
  loading: false,
  appLoading: true,
  pageLoading: false,
  themeSettings: {
    colorScheme: "dark",
    themeColor: "cyan",
  },
  api: null,
  user: null,
  isMobile: false,
  page: undefined,
  userUsageBalance: 0,
  authApiKey: null,
  authRealtimeChannel: null as any,
  setAuthApiKey: (authApiKey: string | null) => set({ authApiKey }),
  setAuthRealtimeChannel: (channel: any) => set({ authRealtimeChannel: channel }),
  getAuthApiKey: () => get().authApiKey,
  setUserUsageBalance: (usageBalance: number) => set({ userUsageBalance: usageBalance }),
  setThemeSettings: (themeSettings: ThemeSettings) => set({ themeSettings }),
  setApi: () =>
    set({
      api: createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY),
    }),
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setAppLoading: (appLoading) => set({ appLoading }),
  setIsMobile: (isMobile) => set({ isMobile }),
  setPage: (page) => set({ page }),
  getPage: () => get().page,
  getApi: () => get().api,
  getUser: () => get().user,
  getThemeSettings: () => get().themeSettings,
  getCurrentUserUsageBalance: () => get().userUsageBalance,

  changeThemeColor: (color: string) => {
    const { themeSettings } = get();
    const next: ThemeSettings = { ...themeSettings, themeColor: color };
    set({ themeSettings: next });
    saveThemeSettings({ colorScheme: themeSettings.colorScheme, themeColor: color });
  },

  updateThemeSettings: (settings: Partial<ThemeSettings>) => {
    const { themeSettings } = get();
    const next: ThemeSettings = { ...themeSettings, ...settings };
    set({ themeSettings: next });
    saveThemeSettings(settings);
  },

  generateRandomUsername: () => {
    const adjectives = [
      "Swift",
      "Bright",
      "Clever",
      "Bold",
      "Calm",
      "Cool",
      "Daring",
      "Eager",
      "Fierce",
      "Gentle",
      "Happy",
      "Kind",
      "Lively",
      "Mighty",
      "Noble",
      "Proud",
      "Quick",
      "Radiant",
      "Strong",
      "Wise",
      "Amazing",
      "Brilliant",
      "Creative",
      "Dynamic",
      "Energetic",
      "Fantastic",
      "Glorious",
      "Incredible",
      "Joyful",
      "Luminous",
      "Magnificent",
      "Outstanding",
      "Perfect",
      "Remarkable",
      "Spectacular",
      "Terrific",
    ];

    const nouns = [
      "Tiger",
      "Eagle",
      "Wolf",
      "Lion",
      "Fox",
      "Bear",
      "Hawk",
      "Falcon",
      "Panther",
      "Lynx",
      "Phoenix",
      "Dragon",
      "Griffin",
      "Unicorn",
      "Pegasus",
      "Sphinx",
      "Kraken",
      "Leviathan",
      "Star",
      "Moon",
      "Sun",
      "Comet",
      "Nebula",
      "Galaxy",
      "Cosmos",
      "Aurora",
      "Lightning",
      "Thunder",
      "Ocean",
      "Mountain",
      "Forest",
      "River",
      "Canyon",
      "Valley",
      "Meadow",
      "Garden",
      "Crystal",
      "Diamond",
    ];

    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNumber = Math.floor(Math.random() * 9999) + 1;

    return `${randomAdjective}${randomNoun}${randomNumber}`;
  },

  generateRandomPassword: () => {
    const lowercaseLetters = "abcdefghijklmnopqrstuvwxyz";
    const uppercaseLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const allChars = lowercaseLetters + uppercaseLetters + numbers;

    let password = "";
    const passwordLength = 12; // Default length

    // Ensure at least one character from each category
    password += lowercaseLetters[Math.floor(Math.random() * lowercaseLetters.length)];
    password += uppercaseLetters[Math.floor(Math.random() * uppercaseLetters.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];

    // Fill the rest with random characters
    for (let i = 3; i < passwordLength; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password to randomize the position of required characters
    return password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");
  },

  registerZiplineUser: async (username: string, password: string, inviteCode?: string) => {
    const session = get().getUser();
    const requestBody: any = {
      username,
      password,
    };

    // Add invite code if provided
    if (inviteCode) {
      requestBody.inviteCode = inviteCode;
    }

    const response = await authFetch(
      `${endpoint}/zipline/auth/register`,
      { method: "POST", body: JSON.stringify(requestBody) },
      { accessToken: session?.access_token ?? undefined }
    );
    return await response.json();
  },

  updateUserProfile: async (values: {
    first_name: string;
    last_name: string;
    bio: string;
    username: string;
  }) => {
    const session = get().getUser();
    if (!session?.user?.id || !get().getAuthApiKey()) {
      return { success: false, error: "Not authenticated" };
    }

    try {
      const res = await authFetch(`${endpoint}/user/profile`, {
        method: "PATCH",
        body: JSON.stringify({
          first_name: values.first_name,
          last_name: values.last_name,
          bio: values.bio,
          username: values.username,
        }),
      });

      if (res.status === 409) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        return { success: false, error: j.error || "Username is already taken" };
      }

      await assertAuthFetchOk(res, "Failed to update profile");
      const json = (await res.json()) as {
        success?: boolean;
        data?: { profile?: Record<string, unknown> };
      };
      const row = json.data?.profile;

      // Sync Zipline username if it changed (best-effort)
      try {
        if (values.username !== (session.profile?.username || "")) {
          await authFetchJson<unknown>(
            `${endpoint}/zipline/user/update`,
            {
              method: "PATCH",
              body: JSON.stringify({
                username: values.username,
              }),
            },
            { errorMessage: "Failed to sync username to Zipline" }
          );
        }
      } catch (error: any) {
        console.error("Error syncing username to Zipline:", error);
        return { success: false, error: "Failed to sync username to Zipline" };
      }

      const base = session.profile || ({} as Profile);
      const updated: Session = {
        ...(session as Session),
        profile: row
          ? ({
              ...base,
              id: (row.id as Profile["id"]) ?? base.id,
              user_id: (row.user_id as string) ?? session.user.id,
              first_name: (row.first_name as string | null) ?? null,
              last_name: (row.last_name as string | null) ?? null,
              bio: (row.bio as string | null) ?? null,
              username: (row.username as string) ?? values.username,
              email: (row.email as string) ?? base.email ?? session.user.email,
              created_at: (row.created_at as string) ?? base.created_at,
              updated_at: (row.updated_at as string) ?? base.updated_at,
              phone: (row.phone as string) ?? base.phone ?? "",
              usage_balance: row.usage_balance as number | undefined,
              api_key: (row.api_key as string | null | undefined) ?? base.api_key,
              meta: (row.meta as Profile["meta"]) ?? base.meta,
            } as Profile)
          : {
              ...base,
              first_name: values.first_name || null,
              last_name: values.last_name || null,
              bio: values.bio || null,
              username: values.username,
              email: base.email || session.user.email,
            },
      };
      set({ user: updated });
      return { success: true };
    } catch (error: any) {
      console.error("Error updating profile:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update profile information",
      };
    }
  },

  userProfile: async (sessionData: any) => {
    const accessToken = sessionData?.access_token;
    if (!accessToken) {
      set({ appLoading: false });
      return { success: false, error: "No session token" };
    }

    try {
      const res = await authFetch(`${endpoint}/user/profile`, {}, { accessToken: accessToken });

      const body = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        data?: Record<string, unknown>;
        error?: string;
        message?: string;
      };

      if (res.status !== 200 || !body?.success || !body?.data) {
        // set({ appLoading: false });
        return {
          success: false,
          error: body?.error || body?.message || "Profile does not exist",
        };
      }

      const data = body.data as Record<string, unknown>;
      set({ userUsageBalance: (data?.usage_balance as number) || 0 });
      get().setUser({ ...sessionData, profile: data });

      // Use stored api_key when present; only call createToken when missing (e.g. new or legacy profile)
      if (data?.api_key) {
        set({ authApiKey: data.api_key as string });
        return { success: true, profile: data };
      }

      const tokenResult = await get().createToken(sessionData);
      if (!tokenResult.success) {
        get().setUser(null);
        set({ authApiKey: null, appLoading: false });
        return { success: false, error: tokenResult.error || "Failed to sign in" };
      }
      set({ authApiKey: tokenResult.token });
      get().setUser({ ...sessionData, profile: { ...data, api_key: tokenResult.token } });
      // Persist this app key to user_profiles so we don't need create-token again on next login
      await persistApiKeyToProfile(sessionData, tokenResult.token, "[userProfile]");
      return { success: true, profile: { ...data, api_key: tokenResult.token } };
    } catch (err: unknown) {
      console.error("[userProfile]", err);
      set({ appLoading: false });
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to load profile",
      };
    }
  },

  userLogin: async (sessionData: any) => {
    const checkForUserProfile = await get().userProfile(sessionData);
    if (!checkForUserProfile.success) {
      const username = get().generateRandomUsername();
      const password = get().generateRandomPassword();
      //call registerZiplineUser
      const user = await get().registerZiplineUser(username, password);
      if (user.error) {
        return { success: false, error: "Falied to login." };
      } else {
        const requestBody = {
          user_id: sessionData.user.id,
          zipline: user.data,
          username: username,
          email: sessionData.user.email,
        };
        const data = await authFetchJson<{
          id?: string;
          user_id?: string;
          username?: string;
          email?: string;
          api_key?: string | null;
          [key: string]: unknown;
        }>(
          `${endpoint}/user/create-user`,
          { method: "POST", body: JSON.stringify(requestBody) },
          {
            accessToken: sessionData?.access_token ?? undefined,
            errorMessage: "Failed to create user",
          }
        );
        get().setUser({ ...sessionData, profile: data });
        // New profile has no api_key; create one and persist to user_profiles on the frontend
        const tokenResult = await get().createToken(sessionData);
        if (!tokenResult.success) {
          get().setUser(null);
          set({ authApiKey: null });
          return { success: false, error: tokenResult.error || "Failed to sign in" };
        }
        get().setUser({
          ...sessionData,
          profile: { ...data, api_key: tokenResult.token },
        });
        await persistApiKeyToProfile(sessionData, tokenResult.token, "[userLogin]");
        return { success: true, profile: { ...data, api_key: tokenResult.token } };
      }
    } else {
      return checkForUserProfile;
    }
  },

  createToken: async (sessionData: any) => {
    try {
      const res = await authFetch(
        `${endpoint}/user/create-token`,
        { method: "POST", body: JSON.stringify({}) },
        { accessToken: sessionData?.access_token ?? undefined }
      );
      const data = await res.json().catch(() => ({}));
      if (!data?.success || !data?.data?.token) {
        const message = data?.message || data?.error || "Failed to create token";
        set({ authApiKey: null });
        return { success: false, error: message };
      }
      set({ authApiKey: data.data.token });
      return { success: true, token: data.data.token };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create token";
      set({ authApiKey: null });
      return { success: false, error: message };
    }
  },

  getCurrentSession: async () => {
    try {
      const api = get().getApi();
      const {
        data: { session },
        error,
      } = await api.auth.getSession();
      if (error) {
        console.error("Error getting session:", error);
        return null;
      }
      return session as Session | null;
    } catch (error) {
      console.error("Error getting session:", error);
      return null;
    }
  },

  signOut: async () => {
    const api = get().getApi();
    const ch = get().authRealtimeChannel;
    if (ch) {
      try {
        api.removeChannel(ch);
      } catch (e) {
        console.error("Error removing auth Realtime channel:", e);
      }
    }
    set({ authRealtimeChannel: null, user: null, authApiKey: null });
    const { error } = await api.auth.signOut({ scope: "global" });
    if (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  },

  checkApiHealth: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${endpoint}/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const payload = (await response.json()) as {
          status?: string;
          success?: boolean;
          data?: { status?: string };
        };
        const status = payload?.status ?? payload?.data?.status;
        return status === "OK";
      }
      return false;
    } catch (error) {
      console.error("API health check failed:", error);
      return false;
    }
  },
}));

export default createUniversalSelectors(useAppStoreBase);
