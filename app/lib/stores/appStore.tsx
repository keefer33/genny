import { create } from "zustand";
import createUniversalSelectors from "./universalSelectors";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";
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
  tokens: number;
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

interface AppStoreState {
  // Loading states
  loading: boolean;
  appLoading: boolean;
  pageLoading: boolean;
  themeColor: string;
  api: any;
  user: Session | null;
  isMobile: boolean;
  page: string | undefined;
  userTokens: number;

  setUserTokens: (tokens: number) => void;
  setLoading: (loading: boolean) => void;
  setThemeColor: (color: string) => void;
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
  updateUserTokens: (tokens: number) => Promise<any>;
  getUserTokens: () => Promise<number>;
  getCurrentUserTokens: () => number;
  checkApiHealth: () => Promise<boolean>;
}

const useAppStoreBase = create<AppStoreState>((set, get) => ({
  // Initial state
  loading: false,
  appLoading: true,
  pageLoading: false,
  themeColor: "cyan",
  api: null,
  user: null,
  isMobile: false,
  page: undefined,
  userTokens: 0,
  setUserTokens: (tokens: number) => set({ userTokens: tokens }),
  setThemeColor: (themeColor) => set({ themeColor }),
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
  getCurrentUserTokens: () => get().userTokens,
  getUserTokens: async () => {
    const session = get().getUser();
    if (!session?.user?.id) {
      return 0;
    }
    const { data, error } = await get()
      .getApi()
      .from("user_profiles")
      .select("tokens")
      .eq("user_id", session.user.id)
      .single();
    if (error) {
      console.error("Error getting user tokens:", error);
      return 0;
    }
    set({ userTokens: data?.tokens || 0 });
    return data?.tokens || 0;
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

    const response = await axios.post(`${endpoint}/zipline/auth/register`, requestBody, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token || ""}`,
      },
    });
    return response.data;
  },

  updateUserProfile: async (values: {
    first_name: string;
    last_name: string;
    bio: string;
    username: string;
  }) => {
    const api = get().getApi();
    const session = get().getUser();
    if (!api || !session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    // Username uniqueness check
    if (values.username !== (session.profile?.username || "")) {
      const { count, error: countError } = await api
        .from("user_profiles")
        .select("id", { count: "exact", head: true })
        .eq("username", values.username)
        .neq("user_id", session.user.id);
      if (countError) return { success: false, error: "Failed to validate username" };
      if ((count || 0) > 0) return { success: false, error: "Username is already taken" };
    }

    // Update or create profile
    if (session.profile?.id) {
      const { error: profileError } = await api
        .from("user_profiles")
        .update({
          first_name: values.first_name,
          last_name: values.last_name,
          bio: values.bio,
          username: values.username,
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.profile.id);
      if (profileError) return { success: false, error: "Failed to update profile information" };
    } else {
      const { error: profileError } = await api.from("user_profiles").insert({
        user_id: session.user.id,
        first_name: values.first_name,
        last_name: values.last_name,
        bio: values.bio,
        username: values.username,
      });
      if (profileError) return { success: false, error: "Failed to create profile information" };
    }

    //update ziplineuser

    // Sync Zipline username if it changed (best-effort)
    try {
      if (values.username !== (session.profile?.username || "")) {
        const zipRes = await axios.patch(
          `${endpoint}/zipline/user/update`,
          {
            username: values.username,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session?.access_token || ""}`,
            },
          }
        );
        const zipData = zipRes.data;
        if (!zipData?.success) {
          return { success: false, error: zipData?.error || "Failed to sync username to Zipline" };
        }
      }
    } catch (_e) {
      return { success: false, error: "Failed to sync username to Zipline" };
    }

    // Update store
    const updated: Session = {
      ...(session as Session),
      profile: {
        ...(session.profile || ({} as any)),
        first_name: values.first_name || null,
        last_name: values.last_name || null,
        bio: values.bio || null,
        username: values.username,
        email: session.profile?.email || session.user.email,
      },
    };
    set({ user: updated });
    return { success: true };
  },

  userProfile: async (sessionData: any) => {
    const { data, error } = await get()
      .getApi()
      .from("user_profiles")
      .select(
        "id, user_id, first_name, last_name, bio, created_at, updated_at, email, username, token_balance"
      )
      .eq("user_id", sessionData.user.id)
      .single();
    if (error) {
      console.error("Error getting user:", error);
      return { success: false, error: "Profile does not exist" };
    }

    set({ userTokens: data?.token_balance || 0 });
    get().setUser({ ...sessionData, profile: data });
    get().setAppLoading(false);
    return { success: true, profile: data };
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
        const response = await axios.post(`${endpoint}/user/create-user`, requestBody, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionData?.access_token || ""}`,
          },
        });
        const data = response.data;
        if (!data?.success) {
          return { success: false, error: data.error || "Failed to create user" };
        }
        get().setUser({ ...sessionData, profile: data.data });

        return { success: true, profile: data.data };
      }
    } else {
      return checkForUserProfile;
    }
  },

  signOut: async () => {
    const { error } = await get().getApi().auth.signOut({ scope: "global" });
    if (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  },

  updateUserTokens: async (tokens: number) => {
    const api = get().getApi();
    const session = get().getUser();

    if (!api || !session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    try {
      const { error } = await api
        .from("user_profiles")
        .update({
          tokens: tokens,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", session.user.id);

      if (error) {
        console.error("Error updating user tokens:", error);
        return { success: false, error: "Failed to update tokens" };
      }

      // Update the user in the store
      const updatedUser = {
        ...session,
        profile: {
          ...session.profile,
          tokens: tokens,
        },
      };
      get().setUser(updatedUser);
      set({ userTokens: tokens });
      return { success: true };
    } catch (error) {
      console.error("Error updating user tokens:", error);
      return { success: false, error: "Failed to update tokens" };
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
        const data = await response.json();
        return data.status === "OK";
      }
      return false;
    } catch (error) {
      console.error("API health check failed:", error);
      return false;
    }
  },
}));

export default createUniversalSelectors(useAppStoreBase);
