import { ActionIcon, Card, Group, Stack, Text } from "@mantine/core";
import { RiPaletteLine } from "@remixicon/react";
import { useTheme } from "~/lib/hooks/useTheme";
import ColorPicker from "~/shared/ColorPicker";
import ThemeToggle from "~/shared/ThemeToggle";

export default function ThemeSettings() {
  const { colorScheme, themeColor, toggleColorScheme, changeThemeColor } = useTheme();

  return (
    <Card shadow="sm" padding="lg" radius="md">
      <Stack gap="lg">
        <Text size="lg" fw={600}>
          Theme Settings
        </Text>

        {/* Color Scheme Toggle */}
        <Stack gap="xs">
          <Text size="sm" fw={500} c="dimmed">
            Color Scheme
          </Text>
          <ThemeToggle
            colorScheme={colorScheme}
            onToggle={toggleColorScheme}
            showLabel={true}
            variant="light"
          />
        </Stack>

        {/* Primary Color Selection */}
        <Stack gap="xs">
          <Text size="sm" fw={500} c="dimmed">
            Primary Color
          </Text>
          <ColorPicker
            selectedColor={themeColor}
            onColorChange={changeThemeColor}
            size="md"
            showLabels={true}
            trigger="inline"
            maxWidth="100%"
          />
        </Stack>

        {/* Current Theme Preview */}
        <Stack gap="xs">
          <Text size="sm" fw={500} c="dimmed">
            Preview
          </Text>
          <Card withBorder padding="sm" radius="sm">
            <Group gap="xs">
              <ActionIcon variant="filled" color={themeColor} size="sm">
                <RiPaletteLine size={14} />
              </ActionIcon>
              <Text size="sm">This is how your primary color will appear throughout the app</Text>
            </Group>
          </Card>
        </Stack>
      </Stack>
    </Card>
  );
}
