import useAppStore from "./appStore";
export type AuthFetchOptions = {
  /**
   * When set and non-empty, used as the Bearer token instead of the app JWT (`authApiKey`) from the store.
   * Use for Supabase `session.access_token` on endpoints that expect it before `api_key` exists.
   */
  accessToken?: string | null;
};

/** Options for {@link authFetchJson} — extends {@link AuthFetchOptions} with an error label for failed HTTP responses. */
export type AuthFetchJsonOptions = AuthFetchOptions & {
  /** Passed to {@link assertAuthFetchOk} when `!res.ok`. Defaults to `"Request failed"`. */
  errorMessage?: string;
};

/**
 * `fetch` with the app JWT (`authApiKey`) when present, unless {@link AuthFetchOptions.accessToken} is set.
 * Sets `Content-Type: application/json` unless the body is `FormData` or a header was already provided.
 *
 * Does **not** throw on `!res.ok` — use {@link assertAuthFetchOk} or {@link getApiErrorMessage} so streaming
 * and status-specific handling stay possible.
 */
export async function authFetch(
  url: string,
  init?: RequestInit,
  options?: AuthFetchOptions
): Promise<Response> {
  const fromSession = options?.accessToken;
  const authApiKey = useAppStore.getState().getAuthApiKey();
  const token = fromSession != null && fromSession !== "" ? fromSession : authApiKey;
  const headers = new Headers(init?.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const body = init?.body;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(url, { ...init, headers });
}

/** Best-effort message from typical gennyapi JSON error bodies. */
export function getApiErrorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object") {
    const o = body as Record<string, unknown>;
    if (typeof o.message === "string" && o.message.trim()) {
      return o.message;
    }
    const err = o.error;
    if (typeof err === "string" && err.trim()) return err;
    if (err && typeof err === "object") {
      const m = (err as { message?: unknown }).message;
      if (typeof m === "string" && m.trim()) return m;
      const nestedError = (err as { error?: unknown }).error;
      if (typeof nestedError === "string" && nestedError.trim()) return nestedError;
    }
  }
  return fallback;
}

/** If `!res.ok`, parse JSON (if any) and throw with {@link getApiErrorMessage}. Safe to call before `res.json()` on success. */
export async function assertAuthFetchOk(res: Response, fallback = "Request failed"): Promise<void> {
  if (res.ok) return;
  const body = await res.json().catch(() => ({}));
  throw new Error(getApiErrorMessage(body, fallback));
}

/**
 * Authenticated JSON request: {@link authFetch}, then {@link assertAuthFetchOk}, then `res.json()`.
 * For non-JSON responses, streaming, or custom status handling, use {@link authFetch} alone.
 */
export async function authFetchJson<T>(
  url: string,
  init?: RequestInit,
  options?: AuthFetchJsonOptions
): Promise<T> {
  const { errorMessage, ...authOpts } = options ?? {};
  const res = await authFetch(url, init, authOpts);
  await assertAuthFetchOk(res, errorMessage ?? "Request failed");
  const payload: unknown = await res.json().catch(() => ({}));

  // Standardized envelope: `{ success: true, data }` / `{ success: false, error: { message, ... } }`
  if (payload && typeof payload === "object") {
    const p = payload as { success?: unknown; data?: unknown; error?: unknown };
    if (p.success === true && "data" in p) {
      return p.data as T;
    }
    if (p.success === false) {
      throw new Error(getApiErrorMessage(payload, errorMessage ?? "Request failed"));
    }
  }

  return payload as T;
}
