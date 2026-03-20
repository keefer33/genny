import { createClient } from "@supabase/supabase-js";
import type { Model } from "~/lib/stores/generateStore";

/** Server-side Supabase client for loaders (anon key, no session). */
export function getSupabaseAnonClientForLoader() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
  }
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function getApiEndpointForLoader() {
  const apiEndpoint =
    process.env.VITE_NODE_ENV === "development"
      ? process.env.VITE_LOCAL_API_URL
      : process.env.VITE_API_URL;
  if (!apiEndpoint) {
    throw new Error("Missing API endpoint environment variables");
  }
  return apiEndpoint;
}

/** Full generation catalog (models + api schema/pricing) — keep in layout loader, not root. */
export async function fetchGenerationModelsFromSupabase(supabaseClient: any): Promise<Model[]> {
  try {
    const { data, error } = await supabaseClient
      .from("models")
      .select(
        `
        *,
        brands (
          id,
          name,
          logo
        ),
        api(schema,pricing)
      `
      )
      .neq("status", false)
      .order("order", { ascending: true, nullsFirst: false });

    if (error) {
      console.error("Error fetching models:", error);
      return [];
    }

    const validModels = (data || []).filter(
      (model: any) => model && model.id && model.name && model.generation_type
    );

    const sortedModels = validModels.sort((a: any, b: any) => {
      const orderA = typeof a.order === "number" ? a.order : Number.MAX_SAFE_INTEGER;
      const orderB = typeof b.order === "number" ? b.order : Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) return orderA - orderB;
      return (a.name || "").localeCompare(b.name || "");
    });

    return sortedModels as Model[];
  } catch (error) {
    console.error("Error fetching models:", error);
    return [];
  }
}

/** GET /agents — public list of AI agent models for chats / agent picker. */
export async function fetchAgentModelsFromApi(apiEndpoint: string): Promise<unknown[]> {
  try {
    const res = await fetch(`${apiEndpoint}/agents`);
    if (!res.ok) {
      console.error("[fetchAgentModelsFromApi] Failed:", res.status);
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("[fetchAgentModelsFromApi] Error:", e);
    return [];
  }
}
