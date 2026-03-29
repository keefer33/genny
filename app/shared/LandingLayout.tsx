import { AppShell, Box, Button, Container, Group } from "@mantine/core";
import { RiLoginBoxLine, RiUserLine } from "@remixicon/react";
import { Link, Outlet } from "react-router";
import Logo from "./Logo";
import { ThemeSwitcher } from "~/shared/ThemeSwitcher";
import useAppStore from "~/lib/stores/appStore";

export default function LandingLayout() {
  const { getUser, themeSettings } = useAppStore();
  const isLoggedIn = !!getUser()?.user?.id;

  return (
    <Box
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <AppShell
        layout="alt"
        padding="0"
        withBorder={false}
        header={{ height: 80 }}
        style={{ flex: 1 }}
      >
        <AppShell.Header bg={themeSettings.colorScheme === "dark" ? "dark.6" : "gray.1"}>
          <Container size="lg" h="100%">
            <Group justify="space-between" align="center" h="100%" py="xs" wrap="nowrap">
              <Logo fontSizeSmall="20px" fontSize="40px" />
              {isLoggedIn ? (
                <Button
                  component={Link}
                  to="/account/profile"
                  variant="subtle"
                  size="sm"
                  leftSection={<RiUserLine size={18} />}
                >
                  Account
                </Button>
              ) : (
                <Button
                  component={Link}
                  to="/login"
                  variant="subtle"
                  size="sm"
                  leftSection={<RiLoginBoxLine size={18} />}
                  aria-label="Login / Register"
                >
                  Login
                </Button>
              )}
            </Group>
          </Container>
        </AppShell.Header>

        <AppShell.Main>
          <Outlet />
        </AppShell.Main>
      </AppShell>

      <Box bg={themeSettings.colorScheme === "dark" ? "dark.6" : "gray.1"}>
        <Container size="lg" py="lg">
          <Group
            justify="space-between"
            align="center"
            style={{
              gap: 18,
              flexWrap: "wrap",
            }}
          >
            <Logo />
            <Box c="dimmed">
              <Group gap={14} justify="center" wrap="wrap">
                <ThemeSwitcher />
                <Link to="/privacy" style={{ textDecoration: "none", color: "inherit" }}>
                  Privacy Policy
                </Link>
                <Link to="/terms" style={{ textDecoration: "none", color: "inherit" }}>
                  Terms
                </Link>
              </Group>
            </Box>
          </Group>
        </Container>
      </Box>
    </Box>
  );
}
