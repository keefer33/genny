import { Button, Stack, Text } from "@mantine/core";
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
}: LoginCTAProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(redirectTo);
  };

  // Default variant
  return (
    <Stack gap="xs" align="center" pb="xs">
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
        variant="outline"
      >
        {buttonText}
      </Button>
    </Stack>
  );
}
