import type { GenerationsHistoryItem } from "~/types/generations";

export const GENERATIONS_HISTORY_THUMB_H = 140;

/** `gen_models.brand_name` is a string on catalog rows; run-history embeds `brands` as `{ name, logo }`. */
function brandLabelFromGenModel(m: { brand_name?: unknown }): string {
  const b = m.brand_name;
  if (typeof b === "string") return b.trim();
  if (b && typeof b === "object" && b !== null && "name" in b) {
    const n = (b as { name?: unknown }).name;
    return typeof n === "string" ? n.trim() : "";
  }
  return "";
}

/** Brand line only (for cards); catalog string or `{ name }` embed. */
export function brandTextFromGenModel(m: { brand_name?: unknown } | null | undefined): string {
  if (!m) return "—";
  return brandLabelFromGenModel(m) || "—";
}

export function brandLogoFromGenModel(
  m: { brand_name?: unknown } | null | undefined
): string | null {
  if (!m) return null;
  const b = m.brand_name;
  if (b && typeof b === "object" && b !== null && "logo" in b) {
    const logo = (b as { logo?: unknown }).logo;
    return typeof logo === "string" && logo.trim() ? logo.trim() : null;
  }
  return null;
}

/** Catalog row id or embedded `gen_model_id.id` for filters and maps. */
export function genModelCatalogIdFromRunRow(
  row: Pick<GenerationsHistoryItem, "gen_model_id">
): string {
  const g = row.gen_model_id;
  if (g == null) return "";
  if (typeof g === "string") return g.trim();
  if (typeof g === "object" && g !== null && "id" in g) {
    const id = (g as { id: unknown }).id;
    return typeof id === "string" ? id.trim() : "";
  }
  return "";
}

/** Prefer embedded `gen_model_id` object; fall back to legacy `gen_models`. */
export function genModelDisplayEmbedFromRunRow(
  row: Pick<GenerationsHistoryItem, "gen_model_id" | "gen_models">
): {
  brand_name?: unknown;
  model_product?: string | null;
  model_variant?: string | null;
  generation_type?: string | null;
} | null {
  const g = row.gen_model_id;
  if (g && typeof g === "object" && !Array.isArray(g) && "id" in g) {
    return g as {
      brand_name?: unknown;
      model_product?: string | null;
      model_variant?: string | null;
      generation_type?: string | null;
    };
  }
  const raw = row.gen_models;
  if (raw == null) return null;
  const m = Array.isArray(raw) ? raw[0] : raw;
  if (m && typeof m === "object") {
    return m as {
      brand_name?: unknown;
      model_product?: string | null;
      model_variant?: string | null;
      generation_type?: string | null;
    };
  }
  return null;
}

/** Display label for playground gen_models: brand, product, variant (matches routing identity). */
export function formatGenModelDisplayName(m: {
  brand_name?: string | null | { name?: string | null } | null;
  model_product?: string | null;
  model_variant?: string | null;
}): string {
  const parts = [brandLabelFromGenModel(m), m.model_product, m.model_variant]
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter(Boolean);
  return parts.join(" / ") || "—";
}

export function generationsHistoryBadgeLabelFromUrl(url: string): string {
  const pathOnly = (() => {
    try {
      return new URL(url).pathname.toLowerCase();
    } catch {
      return url.split("?")[0].toLowerCase();
    }
  })();
  if (/\.(mp4|webm|mov|m4v|mkv)(\?|$)/.test(pathOnly)) return "Video";
  if (/\.gif(\?|$)/.test(pathOnly)) return "GIF";
  if (/\.(jpe?g|png|webp|avif|bmp|svg|tiff?)(\?|$)/.test(pathOnly)) return "Image";
  if (/\.(mp3|wav|aac|flac|m4a|ogg|opus|aiff|aif|wma)(\?|$)/.test(pathOnly)) return "Audio";
  return "File";
}

export function normalizeGenerationsHistoryItem(
  item: GenerationsHistoryItem
): GenerationsHistoryItem {
  const userFiles = item.user_files ?? [];
  let urls = item.preview_urls ?? [];
  let types = item.preview_file_types ?? [];
  let files = item.preview_files ?? [];

  if (urls.length === 0 && userFiles.length > 0) {
    const paired = userFiles
      .map((u) => {
        const path = (u.file_path ?? "").trim();
        if (!path) return null;
        const mime = u.file_type?.trim().toLowerCase();
        let badge: string;
        if (mime?.startsWith("video/")) badge = "Video";
        else if (mime?.startsWith("audio/")) badge = "Audio";
        else if (mime?.startsWith("image/")) badge = "Image";
        else badge = generationsHistoryBadgeLabelFromUrl(path);
        const id = String(u.id ?? "").trim();
        if (!id) return null;
        return {
          url: path,
          badge,
          file: { id, file_name: (u.file_name ?? "").trim() || "file" },
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
    urls = paired.map((p) => p.url);
    types = paired.map((p) => p.badge);
    files = paired.map((p) => p.file);
  }

  const preview_file_types =
    types.length === urls.length
      ? types
      : urls.map((u, i) => types[i] ?? generationsHistoryBadgeLabelFromUrl(u));
  const preview_files: Array<{ id: string; file_name: string }> =
    files.length === urls.length
      ? files
      : urls
          .map((_, i) => files[i])
          .filter((f): f is { id: string; file_name: string } => Boolean(f?.id));

  const thumbFromUser = userFiles
    .find((u) => (u.thumbnail_url ?? "").trim())
    ?.thumbnail_url?.trim();
  const thumbnail_url = item.thumbnail_url?.trim() || thumbFromUser || null;

  return { ...item, thumbnail_url, preview_urls: urls, preview_file_types, preview_files };
}

export const PLAYGROUND_RUN_IN_FLIGHT_STATUSES = new Set(["pending", "processing"]);

export function isGenerationsHistoryInFlight(status: string | null | undefined): boolean {
  return PLAYGROUND_RUN_IN_FLIGHT_STATUSES.has((status ?? "").toLowerCase().trim());
}

export function generationsHistoryModelLabel(
  row: Pick<GenerationsHistoryItem, "gen_model_id" | "gen_models">
): string {
  const m = genModelDisplayEmbedFromRunRow(row);
  if (!m) return "—";
  return formatGenModelDisplayName(m);
}

export function truncateGenerationsHistoryTaskId(id: string | null): string {
  if (!id) return "—";
  if (id.length <= 14) return id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

const IMAGE_SUBTYPES = new Set([
  "image",
  "jpeg",
  "jpg",
  "png",
  "webp",
  "avif",
  "bmp",
  "svg",
  "tiff",
  "tif",
  "heic",
  "heif",
]);

const AUDIO_SUBTYPES = new Set(["audio", "mp3", "wav", "aac", "flac", "ogg", "m4a", "opus"]);

export function generationsHistoryBadgeColorForFileType(label: string): string {
  const n = label.trim().toLowerCase();
  if (n === "video") return "violet";
  if (n === "gif") return "pink";
  if (IMAGE_SUBTYPES.has(n)) return "orange";
  if (AUDIO_SUBTYPES.has(n)) return "cyan";
  if (n === "pdf") return "orange";
  if (n === "file" || n === "") return "gray";
  return "teal";
}
