import { ActionIcon, Box, Group, Popover } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { RiPaletteLine } from "@remixicon/react";
import { colorOptions } from "~/lib/themeUtils";

interface ColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
  size?: "sm" | "md" | "lg";
  showLabels?: boolean;
  trigger?: "popover" | "inline";
  maxWidth?: string;
}

export default function ColorPicker({
  selectedColor,
  onColorChange,
  size = "md",
  showLabels = false,
  trigger = "popover",
  maxWidth = "280px",
}: ColorPickerProps) {
  const [opened, { open, close }] = useDisclosure(false);

  const handleColorChange = (color: string) => {
    onColorChange(color);
    if (trigger === "popover") {
      close();
    }
  };

  const colorGrid = (
    <Group gap="xs" style={{ flexWrap: "wrap", justifyContent: "center" }}>
      {colorOptions.map((color) => (
        <Box
          key={color.value}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            cursor: "pointer",
          }}
          onClick={() => handleColorChange(color.value)}
        >
          <ActionIcon
            variant={selectedColor === color.value ? "filled" : "light"}
            color={color.value}
            size={size}
            aria-label={`Set color to ${color.name}`}
            style={{
              border:
                selectedColor === color.value ? "2px solid var(--mantine-color-gray-6)" : undefined,
              minWidth: size === "sm" ? "28px" : size === "md" ? "32px" : "36px",
              minHeight: size === "sm" ? "28px" : size === "md" ? "32px" : "36px",
            }}
          />
          {showLabels && (
            <Box style={{ fontSize: "0.75rem", textAlign: "center", maxWidth: "60px" }}>
              {color.name}
            </Box>
          )}
        </Box>
      ))}
    </Group>
  );

  if (trigger === "inline") {
    return <Box style={{ maxWidth }}>{colorGrid}</Box>;
  }

  return (
    <Popover
      opened={opened}
      onChange={close}
      position="bottom-end"
      withArrow
      offset={8}
      closeOnClickOutside
      closeOnEscape
    >
      <Popover.Target>
        <ActionIcon onClick={open} variant="transparent" size="lg" aria-label="Change color scheme">
          <RiPaletteLine />
        </ActionIcon>
      </Popover.Target>
      <Popover.Dropdown>
        <Box p="xs" style={{ maxWidth }}>
          {colorGrid}
        </Box>
      </Popover.Dropdown>
    </Popover>
  );
}
