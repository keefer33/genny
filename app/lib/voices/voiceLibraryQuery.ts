export type SharedVoiceItem = {
  voice_id: string;
  name?: string | null;
  description?: string | null;
  language?: string | null;
  gender?: string | null;
  age?: string | null;
  accent?: string | null;
  category?: string | null;
  use_case?: string | null;
  preview_url?: string | null;
};

export type VoiceLibraryFilters = {
  gender?: string;
  language?: string;
  accent?: string;
  category?: string;
};

export type SharedLibraryPayload = {
  voices?: SharedVoiceItem[];
  has_more?: boolean;
  total_count?: number;
};

export const VOICE_LIBRARY_PAGE_SIZE_DEFAULT = 30;

export function trimFilters(f: VoiceLibraryFilters): VoiceLibraryFilters | undefined {
  const out: VoiceLibraryFilters = {};
  for (const [key, raw] of Object.entries(f)) {
    const v = typeof raw === "string" ? raw.trim() : "";
    if (v) (out as Record<string, string>)[key] = v;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export function buildNextFilters(
  prev: VoiceLibraryFilters,
  key: keyof VoiceLibraryFilters,
  value: string | null
): VoiceLibraryFilters {
  const next = { ...prev };
  if (value == null || value === "") delete next[key];
  else next[key] = value;
  return next;
}

function voiceLibraryHasAnyFilter(filters?: VoiceLibraryFilters): boolean {
  const f = filters;
  if (!f) return false;
  return Boolean(f.gender?.trim() || f.language?.trim() || f.accent?.trim() || f.category?.trim());
}

/** Query string for ElevenLabs shared-voices (`GET /voices/shared-library`). */
export function buildVoiceLibraryQueryString(args: {
  search: string;
  filters?: VoiceLibraryFilters;
  page: number;
  pageSize: number;
}): string {
  const q = new URLSearchParams();
  const trimmed = args.search.trim();
  if (trimmed) q.set("search", trimmed);

  const f = args.filters;
  if (f?.gender?.trim()) q.set("gender", f.gender.trim());
  if (f?.language?.trim()) q.set("language", f.language.trim());
  if (f?.accent?.trim()) q.set("accent", f.accent.trim());
  if (f?.category?.trim()) q.set("category", f.category.trim());

  const isDefaultFeaturedList = !trimmed && !voiceLibraryHasAnyFilter(args.filters);
  if (isDefaultFeaturedList) q.set("featured", "true");

  q.set("page", String(args.page));
  q.set("page_size", String(Math.min(100, Math.max(1, args.pageSize))));

  return q.toString();
}
