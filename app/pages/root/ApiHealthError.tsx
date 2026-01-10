import { Button, Card, Container, Stack, Text, Title } from "@mantine/core";
import { RiErrorWarningLine, RiRefreshLine } from "@remixicon/react";
import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import useAppStore from "~/lib/stores/appStore";

export default function ApiHealthError() {
  const navigate = useNavigate();
  const { checkApiHealth } = useAppStore();

  const checkHealth = useCallback(async () => {
    const isHealthy = await checkApiHealth();
    if (isHealthy) {
      // API is healthy, redirect to home
      navigate("/", { replace: true });
    }
  }, [checkApiHealth, navigate]);

  // Auto-check health every 5 seconds
  useEffect(() => {
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  return (
    <Container size="sm" py="xl">
      <Card shadow="md" padding="xl" radius="md" withBorder>
        <Stack align="center" gap="lg">
          <RiErrorWarningLine size={64} color="var(--mantine-color-red-6)" />
          <Title order={2} ta="center">
            Service Unavailable
          </Title>
          <Text c="dimmed" ta="center" size="lg">
            We're experiencing technical difficulties. Our API service is currently unavailable.
          </Text>
          <Text c="dimmed" ta="center" size="sm">
            Please try again in a few moments. We're working to resolve this issue as quickly as
            possible.
          </Text>
          <Button
            leftSection={<RiRefreshLine size={16} />}
            onClick={checkHealth}
            variant="light"
            size="md"
          >
            Check Again
          </Button>
        </Stack>
      </Card>
    </Container>
  );
}
