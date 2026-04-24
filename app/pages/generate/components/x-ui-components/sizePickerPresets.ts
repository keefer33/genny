import type { ComboboxData, ComboboxItem, ComboboxItemGroup } from "@mantine/core";

/** Preset tiers (short side / “K” class) → aspect ratio label → `"width*height"` */
export const SIZE_PICKER_PRESETS: Record<string, Record<string, string>> = {
  "0.5k": {
    "1:1": "512*512",
    "3:2": "512*341",
    "2:3": "341*512",
    "3:4": "384*512",
    "4:3": "512*384",
    "4:5": "410*512",
    "5:4": "512*410",
    "9:16": "288*512",
    "16:9": "512*288",
    "21:9": "512*219",
    "1:4": "128*512",
    "4:1": "512*128",
    "1:8": "64*512",
    "8:1": "512*64",
  },
  "1k": {
    "1:1": "1024*1024",
    "3:2": "1024*683",
    "2:3": "683*1024",
    "3:4": "768*1024",
    "4:3": "1024*768",
    "4:5": "819*1024",
    "5:4": "1024*819",
    "9:16": "576*1024",
    "16:9": "1024*576",
    "21:9": "1024*439",
    "1:4": "256*1024",
    "4:1": "1024*256",
    "1:8": "128*1024",
    "8:1": "1024*128",
  },
  "2k": {
    "1:1": "2048*2048",
    "3:2": "2048*1365",
    "2:3": "1365*2048",
    "3:4": "1536*2048",
    "4:3": "2048*1536",
    "4:5": "1638*2048",
    "5:4": "2048*1638",
    "9:16": "1152*2048",
    "16:9": "2048*1152",
    "21:9": "2048*878",
    "1:4": "512*2048",
    "4:1": "2048*512",
    "1:8": "256*2048",
    "8:1": "2048*256",
  },
  "4k": {
    "1:1": "4096*4096",
    "3:2": "4096*2731",
    "2:3": "2731*4096",
    "3:4": "3072*4096",
    "4:3": "4096*3072",
    "4:5": "3277*4096",
    "5:4": "4096*3277",
    "9:16": "2304*4096",
    "16:9": "4096*2304",
    "21:9": "4096*1755",
    "1:4": "1024*4096",
    "4:1": "4096*1024",
    "1:8": "512*4096",
    "8:1": "4096*512",
  },
  "8k": {
    "1:1": "8192*8192",
    "3:2": "8192*5461",
    "2:3": "5461*8192",
    "3:4": "6144*8192",
    "4:3": "8192*6144",
    "4:5": "6554*8192",
    "5:4": "8192*6554",
    "9:16": "4608*8192",
    "16:9": "8192*4608",
    "21:9": "8192*3511",
    "1:4": "2048*8192",
    "4:1": "8192*2048",
    "1:8": "1024*8192",
    "8:1": "8192*1024",
  },
};

function parsePresetWxH(wh: string): { w: number; h: number } | null {
  const cleaned = wh.replace(/\t/g, "").trim();
  const parts = cleaned.split("*").map((p) => p.trim());
  if (parts.length !== 2) return null;
  const w = Number(parts[0]);
  const h = Number(parts[1]);
  if (!Number.isFinite(w) || !Number.isFinite(h)) return null;
  return { w, h };
}

function fitsRange(w: number, h: number, min: number, hi: number) {
  return w >= min && w <= hi && h >= min && h <= hi;
}

/** Grouped `Select` data and the set of preset values that are in range (for controlled value matching). */
export function buildSizePresetSelectData(
  min: number,
  max: number
): { data: ComboboxData; validValues: Set<string> } {
  let hi = max;
  if (hi <= min) {
    hi = min + 1;
  }

  const validValues = new Set<string>();
  const groups: ComboboxItemGroup<ComboboxItem>[] = [];

  for (const [tierKey, ratios] of Object.entries(SIZE_PICKER_PRESETS)) {
    const items: ComboboxItem[] = [];
    for (const [ratioLabel, wh] of Object.entries(ratios)) {
      const parsed = parsePresetWxH(wh);
      if (!parsed) continue;
      const { w, h } = parsed;
      if (!fitsRange(w, h, min, hi)) continue;
      validValues.add(wh);
      items.push({
        value: wh,
        label: `${ratioLabel} (${w}×${h})`,
      });
    }
    if (items.length > 0) {
      groups.push({ group: tierKey, items });
    }
  }

  return { data: groups as ComboboxData, validValues };
}
