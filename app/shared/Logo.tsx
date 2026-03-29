import { Group, Text, useMantineTheme, Image, Box } from "@mantine/core";
import { Link } from "react-router";
import useAppStore from "~/lib/stores/appStore";

export default function Logo({
  size = 54,
  fontSize = "28px",
  fontSizeSmall = "18px",
}: {
  size?: number;
  fontSize?: string;
  fontSizeSmall?: string;
}) {
  const theme = useMantineTheme();
  const { themeSettings } = useAppStore();
  const logoTextStyles = {
    fontFamily: "Lilita One, sans-serif",
    letterSpacing: "1.5px",
    fontSize: fontSize,
    fontWeight: 900,
    fontSizeSmall: fontSizeSmall,
    fontWeightSmall: 400,
    letterSpacingSmall: "0.5px",
  };

  return (
    <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
      <Group gap="0" align="center">
        <Box>
          <Image src="https://aifile.link/LI1miK.png" alt="Genny Bot" width={size} height={size} />
        </Box>
        <Group gap={0} align="baseline">
          <Text
            size={logoTextStyles.fontSize}
            fw={logoTextStyles.fontWeight}
            style={{
              fontFamily: logoTextStyles.fontFamily,
              color: theme.colors[themeSettings.themeColor][6],
              letterSpacing: logoTextStyles.letterSpacing,
            }}
          >
            GENNY
          </Text>
          <Text
            size={logoTextStyles.fontSizeSmall}
            fw={logoTextStyles.fontWeightSmall}
            c="dimmed"
            style={{
              fontFamily: logoTextStyles.fontFamily,
              letterSpacing: logoTextStyles.letterSpacingSmall,
            }}
          >
            .bot
          </Text>
        </Group>
      </Group>
    </Link>
  );
}
