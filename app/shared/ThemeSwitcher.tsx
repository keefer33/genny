import { Group } from "@mantine/core";
import useAppStore, { type ThemeSettings } from "~/lib/stores/appStore";
import ColorPicker from "./ColorPicker";
import ThemeToggle from "./ThemeToggle";
import { useMantineColorScheme } from "@mantine/core";
import { saveThemeSettings } from "~/lib/themeUtils";

export function ThemeSwitcher() {
  const { themeSettings, changeThemeColor, setThemeSettings } = useAppStore();
  const { colorScheme, setColorScheme } = useMantineColorScheme();

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

  return (
    <Group gap="xs" justify="center" p="xs">
      <ThemeToggle colorScheme={themeSettings.colorScheme} onToggle={toggleColorScheme} />
      <ColorPicker
        selectedColor={themeSettings.themeColor}
        onColorChange={changeThemeColor}
        size="sm"
      />
    </Group>
  );
}
