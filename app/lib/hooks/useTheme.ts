import { useMantineColorScheme } from "@mantine/core";
import useAppStore, { type ThemeSettings } from "~/lib/stores/appStore";
import { saveThemeSettings } from "../themeUtils";

export function useTheme() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const { themeSettings, setThemeSettings } = useAppStore();

  const toggleColorScheme = () => {
    const newColorScheme: ThemeSettings["colorScheme"] = colorScheme === "light" ? "dark" : "light";
    setColorScheme(newColorScheme);
    const next: ThemeSettings = { ...themeSettings, colorScheme: newColorScheme };
    setThemeSettings(next);
    saveThemeSettings({
      colorScheme: newColorScheme,
      themeColor: themeSettings.themeColor,
    });
  };

  const changeThemeColor = (color: string) => {
    const next: ThemeSettings = { ...themeSettings, themeColor: color };
    setThemeSettings(next);
    saveThemeSettings({ colorScheme, themeColor: color });
  };

  const updateThemeSettings = (settings: Partial<ThemeSettings>) => {
    if (settings.colorScheme !== undefined) {
      setColorScheme(settings.colorScheme);
    }
    const next: ThemeSettings = { ...themeSettings, ...settings };
    setThemeSettings(next);
    saveThemeSettings(settings);
  };

  return {
    colorScheme,
    themeSettings,
    toggleColorScheme,
    changeThemeColor,
    updateThemeSettings,
  };
}
