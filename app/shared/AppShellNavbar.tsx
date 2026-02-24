import { Group, Box, ActionIcon, ScrollArea, AppShell } from "@mantine/core";
import { RiMenuFoldLine, RiMenuUnfoldLine, RiCloseLine } from "@remixicon/react";
import { Navbar } from "./Navbar";
import { ThemeSwitcher } from "./ThemeSwitcher";

interface AppShellNavbarProps {
  desktopCollapsed: boolean;
  toggleDesktop: () => void;
  toggleMobile: () => void;
}

export function AppShellNavbar({
  desktopCollapsed,
  toggleDesktop,
  toggleMobile,
}: AppShellNavbarProps) {
  return (
    <>
      <AppShell.Section>
        <Group justify="end" p="xs">
          <Box visibleFrom="md">
            <ActionIcon variant="default" onClick={toggleDesktop} size="lg" radius="xl">
              {desktopCollapsed ? <RiMenuUnfoldLine size={24} /> : <RiMenuFoldLine size={24} />}
            </ActionIcon>
          </Box>
          <Box hiddenFrom="md">
            <ActionIcon variant="default" onClick={toggleMobile} size="lg" radius="xl">
              <RiCloseLine size={28} />
            </ActionIcon>
          </Box>
        </Group>
      </AppShell.Section>
      <AppShell.Section grow component={ScrollArea}>
        <Navbar
          toggleMobile={toggleMobile}
          collapsed={desktopCollapsed}
          toggleCollapsed={toggleDesktop}
        />
      </AppShell.Section>
      <AppShell.Section>
        <Box p="xs">
          <ThemeSwitcher />
        </Box>
      </AppShell.Section>
    </>
  );
}
