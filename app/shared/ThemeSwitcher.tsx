import { Group } from "@mantine/core";
import { useTheme } from "~/lib/hooks/useTheme";
import ColorPicker from "./ColorPicker";
import ThemeToggle from "./ThemeToggle";

export function ThemeSwitcher() {
  const { colorScheme, themeColor, toggleColorScheme, changeThemeColor } = useTheme();

  return (
    <Group gap="xs" justify="center" p="xs">
      <ThemeToggle colorScheme={colorScheme} onToggle={toggleColorScheme} />
      <ColorPicker selectedColor={themeColor} onColorChange={changeThemeColor} size="sm" />
    </Group>
  );
}
