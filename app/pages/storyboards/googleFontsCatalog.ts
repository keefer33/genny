import type { GoogleFont } from "@remotion/google-fonts";

export type GoogleFontCatalogEntry = {
  family: string;
  importName: string;
  load: () => Promise<GoogleFont>;
};

/** Popular Google Fonts with lazy-loaded modules (see Remotion font picker docs). */
export const POPULAR_GOOGLE_FONTS: GoogleFontCatalogEntry[] = [
  {
    family: "Inter",
    importName: "Inter",
    load: () => import("@remotion/google-fonts/Inter") as Promise<GoogleFont>,
  },
  {
    family: "Roboto",
    importName: "Roboto",
    load: () => import("@remotion/google-fonts/Roboto") as Promise<GoogleFont>,
  },
  {
    family: "Open Sans",
    importName: "OpenSans",
    load: () => import("@remotion/google-fonts/OpenSans") as Promise<GoogleFont>,
  },
  {
    family: "Montserrat",
    importName: "Montserrat",
    load: () => import("@remotion/google-fonts/Montserrat") as Promise<GoogleFont>,
  },
  {
    family: "Lato",
    importName: "Lato",
    load: () => import("@remotion/google-fonts/Lato") as Promise<GoogleFont>,
  },
  {
    family: "Poppins",
    importName: "Poppins",
    load: () => import("@remotion/google-fonts/Poppins") as Promise<GoogleFont>,
  },
  {
    family: "Oswald",
    importName: "Oswald",
    load: () => import("@remotion/google-fonts/Oswald") as Promise<GoogleFont>,
  },
  {
    family: "Raleway",
    importName: "Raleway",
    load: () => import("@remotion/google-fonts/Raleway") as Promise<GoogleFont>,
  },
  {
    family: "Nunito",
    importName: "Nunito",
    load: () => import("@remotion/google-fonts/Nunito") as Promise<GoogleFont>,
  },
  {
    family: "Merriweather",
    importName: "Merriweather",
    load: () => import("@remotion/google-fonts/Merriweather") as Promise<GoogleFont>,
  },
  {
    family: "Ubuntu",
    importName: "Ubuntu",
    load: () => import("@remotion/google-fonts/Ubuntu") as Promise<GoogleFont>,
  },
  {
    family: "Rubik",
    importName: "Rubik",
    load: () => import("@remotion/google-fonts/Rubik") as Promise<GoogleFont>,
  },
  {
    family: "Work Sans",
    importName: "WorkSans",
    load: () => import("@remotion/google-fonts/WorkSans") as Promise<GoogleFont>,
  },
  {
    family: "Playfair Display",
    importName: "PlayfairDisplay",
    load: () => import("@remotion/google-fonts/PlayfairDisplay") as Promise<GoogleFont>,
  },
  {
    family: "Roboto Slab",
    importName: "RobotoSlab",
    load: () => import("@remotion/google-fonts/RobotoSlab") as Promise<GoogleFont>,
  },
  {
    family: "Roboto Condensed",
    importName: "RobotoCondensed",
    load: () => import("@remotion/google-fonts/RobotoCondensed") as Promise<GoogleFont>,
  },
  {
    family: "Roboto Mono",
    importName: "RobotoMono",
    load: () => import("@remotion/google-fonts/RobotoMono") as Promise<GoogleFont>,
  },
  {
    family: "Lora",
    importName: "Lora",
    load: () => import("@remotion/google-fonts/Lora") as Promise<GoogleFont>,
  },
  {
    family: "Kanit",
    importName: "Kanit",
    load: () => import("@remotion/google-fonts/Kanit") as Promise<GoogleFont>,
  },
  {
    family: "Noto Sans",
    importName: "NotoSans",
    load: () => import("@remotion/google-fonts/NotoSans") as Promise<GoogleFont>,
  },
  {
    family: "Nunito Sans",
    importName: "NunitoSans",
    load: () => import("@remotion/google-fonts/NunitoSans") as Promise<GoogleFont>,
  },
  {
    family: "PT Sans",
    importName: "PTSans",
    load: () => import("@remotion/google-fonts/PTSans") as Promise<GoogleFont>,
  },
  {
    family: "PT Serif",
    importName: "PTSerif",
    load: () => import("@remotion/google-fonts/PTSerif") as Promise<GoogleFont>,
  },
  {
    family: "Bebas Neue",
    importName: "BebasNeue",
    load: () => import("@remotion/google-fonts/BebasNeue") as Promise<GoogleFont>,
  },
  {
    family: "Dancing Script",
    importName: "DancingScript",
    load: () => import("@remotion/google-fonts/DancingScript") as Promise<GoogleFont>,
  },
];

export const DEFAULT_GOOGLE_FONT_IMPORT_NAME = "Inter";

export function getGoogleFontCatalogEntry(importName: string): GoogleFontCatalogEntry | undefined {
  return POPULAR_GOOGLE_FONTS.find((entry) => entry.importName === importName);
}

const loadedFontFamilies = new Map<string, string>();

export async function loadGoogleFontFamily(importName: string): Promise<string> {
  const cached = loadedFontFamilies.get(importName);
  if (cached) return cached;

  const entry = getGoogleFontCatalogEntry(importName);
  if (!entry) return "sans-serif";

  const mod = await entry.load();
  const { fontFamily } = mod.loadFont("normal", {
    weights: ["400"],
    subsets: ["latin"],
  });
  loadedFontFamilies.set(importName, fontFamily);
  return fontFamily;
}
