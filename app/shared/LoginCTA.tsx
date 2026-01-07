import {
  Button,
  Stack,
  Text,
  ThemeIcon,
  Box,
  useMantineTheme,
  useMantineColorScheme,
} from "@mantine/core";
import { RiSparklingLine, RiArrowRightLine } from "@remixicon/react";
import { useNavigate } from "react-router";

interface LoginCTAProps {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  redirectTo?: string;
  variant?: "default" | "compact" | "hero";
}

export function LoginCTA({
  title = "Login to Generate",
  subtitle = "Free to sign up. New users get 1000 free tokens to get started.",
  buttonText = "Get Started",
  redirectTo = "/login",
  variant = "default",
}: LoginCTAProps) {
  const navigate = useNavigate();
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

  const handleClick = () => {
    navigate(redirectTo);
  };

  if (variant === "compact") {
    return (
      <Stack gap="xs" align="center">
        <Button
          onClick={handleClick}
          size="md"
          leftSection={<RiSparklingLine size={16} />}
          rightSection={<RiArrowRightLine size={14} />}
          gradient={{ from: "blue", to: "purple", deg: 45 }}
          variant="gradient"
        >
          {buttonText}
        </Button>
        <Text size="xs" c="dimmed" ta="center">
          {subtitle}
        </Text>
      </Stack>
    );
  }

  if (variant === "hero") {
    return (
      <Box
        p="xl"
        style={{
          borderRadius: theme.radius.lg,
          background:
            colorScheme === "dark"
              ? `linear-gradient(135deg, ${theme.colors.dark[7]} 0%, ${theme.colors.dark[6]} 100%)`
              : `linear-gradient(135deg, ${theme.colors.gray[0]} 0%, ${theme.colors.gray[1]} 100%)`,
          border: `1px solid ${colorScheme === "dark" ? theme.colors.dark[4] : theme.colors.gray[3]}`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background decoration */}
        <Box
          pos="absolute"
          top={-20}
          right={-20}
          style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            background: `linear-gradient(45deg, ${theme.colors.blue[6]}, ${theme.colors.purple[6]})`,
            opacity: 0.1,
            filter: "blur(20px)",
          }}
        />

        <Stack gap="md" align="center" pos="relative" style={{ zIndex: 1 }}>
          <ThemeIcon
            size={60}
            radius="xl"
            gradient={{ from: "blue", to: "purple", deg: 45 }}
            variant="gradient"
          >
            <RiSparklingLine size={32} />
          </ThemeIcon>

          <Stack gap="xs" align="center">
            <Text size="xl" fw={700} ta="center">
              {title}
            </Text>
            <Text size="sm" c="dimmed" ta="center" maw={300}>
              {subtitle}
            </Text>
          </Stack>

          <Button
            onClick={handleClick}
            size="lg"
            leftSection={<RiSparklingLine size={18} />}
            rightSection={<RiArrowRightLine size={16} />}
            gradient={{ from: "blue", to: "purple", deg: 45 }}
            variant="gradient"
            style={{
              boxShadow: `0 8px 32px ${theme.colors.blue[6]}20`,
            }}
          >
            {buttonText}
          </Button>
        </Stack>
      </Box>
    );
  }

  // Default variant
  return (
    <Box
      p="lg"
      style={{
        borderRadius: theme.radius.md,
        backgroundColor: colorScheme === "dark" ? theme.colors.dark[6] : theme.colors.gray[0],
        border: `1px solid ${colorScheme === "dark" ? theme.colors.dark[4] : theme.colors.gray[2]}`,
      }}
    >
      <Stack gap="md" align="center">
        <ThemeIcon
          size={40}
          radius="lg"
          gradient={{ from: "blue", to: "purple", deg: 45 }}
          variant="gradient"
        >
          <RiSparklingLine size={20} />
        </ThemeIcon>

        <Stack gap="xs" align="center">
          <Text size="lg" fw={600} ta="center">
            {title}
          </Text>
          <Text size="sm" c="dimmed" ta="center">
            {subtitle}
          </Text>
        </Stack>

        <Button
          onClick={handleClick}
          size="md"
          leftSection={<RiSparklingLine size={16} />}
          rightSection={<RiArrowRightLine size={14} />}
          gradient={{ from: "blue", to: "purple", deg: 45 }}
          variant="gradient"
        >
          {buttonText}
        </Button>
      </Stack>
    </Box>
  );
}
