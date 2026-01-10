import { Button, Card, Group, Stack, Text } from "@mantine/core";
import { RiDownloadLine, RiCloseLine } from "@remixicon/react";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
    } else {
      console.log("User dismissed the install prompt");
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Store dismissal in localStorage to avoid showing again for a while
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  // Check if user previously dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        setShowPrompt(false);
      }
    }
  }, []);

  if (!showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <Card
      shadow="md"
      padding="md"
      radius="md"
      withBorder
      style={{
        position: "fixed",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        maxWidth: "90%",
        width: "400px",
        zIndex: 1000,
      }}
    >
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start">
          <Stack gap={4} style={{ flex: 1 }}>
            <Text fw={500} size="sm">
              Install Genny.bot
            </Text>
            <Text size="xs" c="dimmed">
              Install our app for a better experience with offline support and faster loading.
            </Text>
          </Stack>
          <Button
            variant="subtle"
            color="gray"
            size="xs"
            p={4}
            onClick={handleDismiss}
            style={{ minWidth: "auto" }}
          >
            <RiCloseLine size={16} />
          </Button>
        </Group>
        <Group gap="xs">
          <Button
            leftSection={<RiDownloadLine size={16} />}
            onClick={handleInstallClick}
            size="sm"
            style={{ flex: 1 }}
          >
            Install
          </Button>
          <Button variant="subtle" onClick={handleDismiss} size="sm">
            Not now
          </Button>
        </Group>
      </Stack>
    </Card>
  );
}
