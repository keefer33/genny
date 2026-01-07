import { ActionIcon, Group, Text } from "@mantine/core";
import { RiMoonLine, RiSunLine } from "@remixicon/react";

interface ThemeToggleProps {
  colorScheme: "light" | "dark" | "auto";
  onToggle: () => void;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "transparent" | "light" | "filled";
}

export default function ThemeToggle({
  colorScheme,
  onToggle,
  showLabel = false,
  size = "lg",
  variant = "transparent",
}: ThemeToggleProps) {
  // Determine if we should show light or dark icon
  const isLight =
    colorScheme === "light" ||
    (colorScheme === "auto" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: light)").matches);

  return (
    <Group gap="xs">
      <ActionIcon
        variant={variant}
        size={size}
        onClick={onToggle}
        aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
      >
        {isLight ? <RiMoonLine /> : <RiSunLine />}
      </ActionIcon>
      {showLabel && (
        <Text size="sm" c="dimmed">
          {isLight ? "Light Mode" : "Dark Mode"}
        </Text>
      )}
    </Group>
  );
}
