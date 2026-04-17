import type { PlaygroundRunHistoryItem } from "~/types/playground";

/** Display label for playground gen_models: brand, product, variant (matches routing identity). */
export function formatPlaygroundGenModelDisplayName(m: {
  brand_name?: string | null;
  model_product?: string | null;
  model_variant?: string | null;
}): string {
  const parts = [m.brand_name, m.model_product, m.model_variant]
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter(Boolean);
  return parts.join(" / ") || "—";
}

export function playgroundRunBadgeLabelFromUrl(url: string): string {
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
  if (/\.(mp3|wav|aac|flac|m4a|ogg)(\?|$)/.test(pathOnly)) return "Audio";
  return "File";
}

export function normalizeRunHistoryItem(item: PlaygroundRunHistoryItem): PlaygroundRunHistoryItem {
  const urls = item.preview_urls ?? [];
  const types = item.preview_file_types ?? [];
  const files = item.preview_files ?? [];
  const preview_file_types =
    types.length === urls.length
      ? types
      : urls.map((u, i) => types[i] ?? playgroundRunBadgeLabelFromUrl(u));
  const preview_files: Array<{ id: string; file_name: string }> =
    files.length === urls.length
      ? files
      : urls
          .map((_, i) => files[i])
          .filter((f): f is { id: string; file_name: string } => Boolean(f?.id));
  return { ...item, preview_urls: urls, preview_file_types, preview_files };
}

function fileNameFromPreviewUrl(url: string): string {
  try {
    const seg = new URL(url).pathname.split("/").filter(Boolean).pop() ?? "";
    return seg || "file";
  } catch {
    const seg = url.split("?")[0].split("/").filter(Boolean).pop() ?? "";
    return seg || "file";
  }
}

/** URLs + `preview_files` from `polling_response` (saved `files.files` preferred over `webhook.outputs`). */
function previewsFromRunPollingRecord(record: Record<string, unknown>): {
  preview_urls: string[];
  preview_files: Array<{ id: string; file_name: string }>;
} {
  const polling = record.polling_response;
  if (!polling || typeof polling !== "object") {
    return { preview_urls: [], preview_files: [] };
  }
  const p = polling as Record<string, unknown>;
  const filesWrap = p.files;
  if (filesWrap && typeof filesWrap === "object") {
    const files = (filesWrap as Record<string, unknown>).files;
    if (Array.isArray(files) && files.length > 0) {
      const preview_urls: string[] = [];
      const preview_files: Array<{ id: string; file_name: string }> = [];
      for (const item of files) {
        if (!item || typeof item !== "object") continue;
        const rec = item as Record<string, unknown>;
        const u = typeof rec.file_url === "string" ? rec.file_url.trim() : "";
        const fid = rec.file_id;
        const idStr = typeof fid === "string" ? fid.trim() : fid != null ? String(fid).trim() : "";
        if (!u || !idStr) continue;
        const file_name =
          typeof rec.file_name === "string" && rec.file_name.trim()
            ? rec.file_name.trim()
            : fileNameFromPreviewUrl(u);
        preview_urls.push(u);
        preview_files.push({ id: idStr, file_name });
      }
      if (preview_urls.length > 0) {
        return { preview_urls, preview_files };
      }
    }
  }
  const webhook = p.webhook;
  if (webhook && typeof webhook === "object") {
    const outputs = (webhook as Record<string, unknown>).outputs;
    const preview_urls: string[] = [];
    const seen = new Set<string>();
    if (Array.isArray(outputs)) {
      for (const o of outputs) {
        if (typeof o !== "string") continue;
        const t = o.trim();
        if (!t || seen.has(t)) continue;
        seen.add(t);
        preview_urls.push(t);
      }
    }
    return { preview_urls, preview_files: [] };
  }
  return { preview_urls: [], preview_files: [] };
}

export const PLAYGROUND_RUN_IN_FLIGHT_STATUSES = new Set(["pending", "processing"]);

export function isPlaygroundRunHistoryInFlight(status: string | null | undefined): boolean {
  return PLAYGROUND_RUN_IN_FLIGHT_STATUSES.has((status ?? "").toLowerCase().trim());
}

export function runHistoryModelLabel(row: {
  gen_models: {
    brand_name: string | null;
    model_product: string | null;
    model_variant: string | null;
  } | null;
}): string {
  const raw = row.gen_models;
  const m = Array.isArray(raw) ? raw[0] : raw;
  if (!m) return "—";
  return formatPlaygroundGenModelDisplayName(m);
}

export function truncateRunHistoryTaskId(id: string | null): string {
  if (!id) return "—";
  if (id.length <= 14) return id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

export function runHistoryPreviewBadgeLabel(
  row: PlaygroundRunHistoryItem,
  slideIndex: number
): string {
  const label = row.preview_file_types?.[slideIndex]?.trim();
  if (label) return label;
  const url = row.preview_urls[slideIndex];
  if (!url) return "File";
  return playgroundRunBadgeLabelFromUrl(url);
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

export function runHistoryBadgeColorForFileType(label: string): string {
  const n = label.trim().toLowerCase();
  if (n === "video") return "violet";
  if (n === "gif") return "pink";
  if (IMAGE_SUBTYPES.has(n)) return "orange";
  if (AUDIO_SUBTYPES.has(n)) return "cyan";
  if (n === "pdf") return "orange";
  if (n === "file" || n === "") return "gray";
  return "teal";
}
