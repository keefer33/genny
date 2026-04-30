import type { GenerationsHistoryItem } from "~/types/generations";

export const GENERATIONS_HISTORY_THUMB_H = 400;

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

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${String(remainingSeconds).padStart(2, "0")}s`;
}
