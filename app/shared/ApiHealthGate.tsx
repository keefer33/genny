import { Box, Button, Card, Center, Loader, Stack, Text, Title } from "@mantine/core";
import { RiErrorWarningLine, RiRefreshLine } from "@remixicon/react";
import { useCallback, useEffect } from "react";
import useAppStore from "~/lib/stores/appStore";

const POLL_MS = 10_000;

export default function ApiHealthGate() {
  const apiHealthStatus = useAppStore((s) => s.apiHealthStatus);
  const checkApiHealth = useAppStore((s) => s.checkApiHealth);

  const refresh = useCallback(async () => {
    await checkApiHealth();
  }, [checkApiHealth]);

  useEffect(() => {
    void refresh();
    const interval = setInterval(() => void refresh(), POLL_MS);
    const onVisibility = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const onOnline = () => void refresh();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", onOnline);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onOnline);
    };
  }, [refresh]);

  if (apiHealthStatus === "healthy") {
    return null;
  }

  return (
    <Box
      pos="fixed"
      inset={0}
      style={{
        zIndex: 10000,
        backgroundColor: "rgba(0, 0, 0, 0.72)",
        backdropFilter: "blur(4px)",
      }}
    >
      <Center h="100%" p="md">
        {apiHealthStatus === "checking" ? (
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text c="dimmed" size="sm">
              Checking connection…
            </Text>
          </Stack>
        ) : (
          <Card
            shadow="md"
            padding="xl"
            radius="md"
            withBorder
            maw={480}
            w="100%"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="api-health-gate-title"
          >
            <Stack align="center" gap="lg">
              <RiErrorWarningLine size={64} color="var(--mantine-color-red-6)" />
              <Title order={2} ta="center" id="api-health-gate-title">
                Service unavailable
              </Title>
              <Text c="dimmed" ta="center" size="lg">
                Our API is not responding. You can stay on this page; we will keep checking in the
                background.
              </Text>
              <Text c="dimmed" ta="center" size="sm">
                This screen will clear automatically when the service is back.
              </Text>
              <Button
                leftSection={<RiRefreshLine size={16} />}
                onClick={() => void refresh()}
                variant="light"
                size="md"
              >
                Check again
              </Button>
            </Stack>
          </Card>
        )}
      </Center>
    </Box>
  );
}
