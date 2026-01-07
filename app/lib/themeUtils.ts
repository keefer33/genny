// Theme utility functions for consistent theme management across the app

export interface ThemeSettings {
  colorScheme: "light" | "dark" | "auto";
  themeColor: string;
}

export const DEFAULT_THEME_COLOR = "cyan";
export const DEFAULT_COLOR_SCHEME = "light";

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

// Local storage key for theme settings
const THEME_SETTINGS_KEY = "themeSettings";

/**
 * Load theme settings from localStorage
 */
export const loadThemeSettings = (): ThemeSettings => {
  try {
    const stored = localStorage.getItem(THEME_SETTINGS_KEY);
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
  try {
    const currentSettings = loadThemeSettings();
    const updatedSettings = { ...currentSettings, ...settings };
    localStorage.setItem(THEME_SETTINGS_KEY, JSON.stringify(updatedSettings));
  } catch (error) {
    console.error("Error saving theme settings:", error);
  }
};

/**
 * Get color option by value
 */
export const getColorOption = (value: string) => {
  return colorOptions.find((color) => color.value === value) || colorOptions[0];
};

/**
 * Validate if a color value is valid
 */
export const isValidColor = (color: string): boolean => {
  return colorOptions.some((option) => option.value === color);
};
