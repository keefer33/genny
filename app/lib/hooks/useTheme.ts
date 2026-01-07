import { useMantineColorScheme } from "@mantine/core";
import useAppStore from "~/lib/stores/appStore";
import { saveThemeSettings } from "../themeUtils";

// Local type definition as fallback
type ThemeSettings = {
  colorScheme: "light" | "dark" | "auto";
  themeColor: string;
};

export function useTheme() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const { themeColor, setThemeColor } = useAppStore();

  const toggleColorScheme = () => {
    const newColorScheme = colorScheme === "light" ? "dark" : "light";
    setColorScheme(newColorScheme);
    saveThemeSettings({ colorScheme: newColorScheme, themeColor });
  };

  const changeThemeColor = (color: string) => {
    setThemeColor(color);
    saveThemeSettings({ colorScheme, themeColor: color });
  };

  const updateThemeSettings = (settings: Partial<ThemeSettings>) => {
    if (settings.colorScheme !== undefined) {
      setColorScheme(settings.colorScheme);
    }
    if (settings.themeColor !== undefined) {
      setThemeColor(settings.themeColor);
    }
    saveThemeSettings(settings);
  };

  return {
    colorScheme,
    themeColor,
    toggleColorScheme,
    changeThemeColor,
    updateThemeSettings,
  };
}
