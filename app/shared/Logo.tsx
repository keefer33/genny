import { Group, Text, useMantineTheme, Image, Box } from "@mantine/core";
import useAppStore from "~/lib/stores/appStore";

export default function Logo({
  size = 48,
  fontSize = "28px",
  fontSizeSmall = "16px",
}: {
  size?: number;
  fontSize?: string;
  fontSizeSmall?: string;
}) {
  const theme = useMantineTheme();
  const { themeColor } = useAppStore();
  const themeSettings = {
    fontFamily: "Lilita One, sans-serif",
    letterSpacing: "1.5px",
    fontSize: fontSize,
    fontWeight: 900,
    fontSizeSmall: fontSizeSmall,
    fontWeightSmall: 400,
    letterSpacingSmall: "0.5px",
  };

  return (
    <Group gap="0">
      <Box>
        <Image src="https://aifile.link/IESJ5E.png" alt="Genny Bot" width={size} height={size} />
      </Box>
      <Group gap={0} align="baseline">
        <Text
          size={themeSettings.fontSize}
          fw={themeSettings.fontWeight}
          style={{
            fontFamily: themeSettings.fontFamily,
            color: theme.colors[themeColor][6],
            letterSpacing: themeSettings.letterSpacing,
          }}
        >
          genny
        </Text>
        <Text
          size={themeSettings.fontSizeSmall}
          fw={themeSettings.fontWeightSmall}
          c="dimmed"
          style={{
            fontFamily: themeSettings.fontFamily,
            letterSpacing: themeSettings.letterSpacingSmall,
          }}
        >
          .bot
        </Text>
      </Group>
    </Group>
  );
}
