// Theme utility functions for consistent theme management across the app

interface ThemeSettings {
  colorScheme: "light" | "dark" | "auto";
  themeColor: string;
}

const DEFAULT_THEME_COLOR = "cyan";
const DEFAULT_COLOR_SCHEME = "dark";

// Available color options with descriptions
export const colorOptions = [
  { name: "Blue", value: "blue", description: "Professional and trustworthy" },
  { name: "Green", value: "green", description: "Success and growth" },
  { name: "Orange", value: "orange", description: "Energy and creativity" },
  { name: "Red", value: "red", description: "Attention and urgency" },
  { name: "Grape", value: "grape", description: "Luxury and creativity" },
  { name: "Pink", value: "pink", description: "Playful and modern" },
  { name: "Cyan", value: "cyan", description: "Tech-focused and clean" },
  { name: "Teal", value: "teal", description: "Calm and sophisticated" },
  { name: "Lime", value: "lime", description: "Fresh and vibrant" },
  { name: "Yellow", value: "yellow", description: "Optimistic and cheerful" },
  { name: "Indigo", value: "indigo", description: "Deep and professional" },
  { name: "Violet", value: "violet", description: "Creative and artistic" },
  { name: "Gray", value: "gray", description: "Professional and trustworthy" },
  { name: "Dark", value: "dark", description: "Professional and trustworthy" },
];

// Local storage key for theme settings (must match Mantine default color-scheme manager key)
const THEME_SETTINGS_KEY = "themeSettings";
const MANTINE_COLOR_SCHEME_LS_KEY = "mantine-color-scheme-value";

function isValidStoredColorScheme(value: unknown): value is ThemeSettings["colorScheme"] {
  return value === "light" || value === "dark" || value === "auto";
}

/**
 * Inline script for <head>: sets `data-mantine-color-scheme` before first paint so the UI
 * does not flash light when the app default is dark. Reads `themeSettings` first, then
 * Mantine's localStorage key, then defaults to dark.
 */
export function getColorSchemeBootstrapScript(): string {
  const themeKey = JSON.stringify(THEME_SETTINGS_KEY);
  const mantineKey = JSON.stringify(MANTINE_COLOR_SCHEME_LS_KEY);
  const defaultScheme = JSON.stringify(DEFAULT_COLOR_SCHEME);
  return `(function(){
  function v(s){return s==="light"||s==="dark"||s==="auto";}
  var scheme=null;
  try{
    var tr=localStorage.getItem(${themeKey});
    if(tr){var t=JSON.parse(tr);if(t&&v(t.colorScheme))scheme=t.colorScheme;}
  }catch(e1){}
  if(scheme==null){
    try{
      var m=localStorage.getItem(${mantineKey});
      if(v(m))scheme=m;
    }catch(e2){}
  }
  if(scheme==null)scheme=${defaultScheme};
  var computed=scheme!=="auto"?scheme:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");
  document.documentElement.setAttribute("data-mantine-color-scheme",computed);
  try{localStorage.setItem(${mantineKey},scheme);}catch(e3){}
})();`;
}

/**
 * Load theme settings from localStorage
 */
export const loadThemeSettings = (): ThemeSettings => {
  if (typeof window === "undefined") {
    return {
      colorScheme: DEFAULT_COLOR_SCHEME,
      themeColor: DEFAULT_THEME_COLOR,
    };
  }
  try {
    const stored = window.localStorage.getItem(THEME_SETTINGS_KEY);
    if (stored) {
      const settings = JSON.parse(stored);
      return {
        colorScheme: settings.colorScheme || DEFAULT_COLOR_SCHEME,
        themeColor: settings.themeColor || DEFAULT_THEME_COLOR,
      };
    }
  } catch (error) {
    console.error("Error loading theme settings:", error);
  }

  return {
    colorScheme: DEFAULT_COLOR_SCHEME,
    themeColor: DEFAULT_THEME_COLOR,
  };
};

/**
 * Save theme settings to localStorage
 */
export const saveThemeSettings = (settings: Partial<ThemeSettings>): void => {
  if (typeof window === "undefined") return;
  try {
    const currentSettings = loadThemeSettings();
    const updatedSettings = { ...currentSettings, ...settings };
    window.localStorage.setItem(THEME_SETTINGS_KEY, JSON.stringify(updatedSettings));
    if (isValidStoredColorScheme(updatedSettings.colorScheme)) {
      window.localStorage.setItem(MANTINE_COLOR_SCHEME_LS_KEY, updatedSettings.colorScheme);
    }
  } catch (error) {
    console.error("Error saving theme settings:", error);
  }
};

/**
 * Get color option by value
 */
