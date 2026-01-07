import { AppShell, useMantineColorScheme } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { AppShellHeader } from "./AppShellHeader";
import { AppShellNavbar } from "./AppShellNavbar";
import useAppStore from "~/lib/stores/appStore";
import { Outlet } from "react-router";

export default function MainLayout() {
  const { colorScheme } = useMantineColorScheme();
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const { isMobile } = useAppStore();
  const toggleDesktop = () => {
    setDesktopCollapsed(!desktopCollapsed);
  };

  return (
    <AppShell
      layout="alt"
      header={{ height: 60 }}
      navbar={{
        width: desktopCollapsed ? 50 : 200,
        breakpoint: "md",
        collapsed: { mobile: !mobileOpened, desktop: false },
      }}
      padding="0"
      withBorder={false}
    >
      <AppShell.Header bg={colorScheme === "dark" ? "dark.7" : "gray.1"}>
        <AppShellHeader mobileOpened={mobileOpened} toggleMobile={toggleMobile} />
      </AppShell.Header>
      <AppShell.Navbar p="0" bg={colorScheme === "dark" ? "dark.7" : "gray.1"} withBorder={true}>
        <AppShellNavbar
          desktopCollapsed={desktopCollapsed}
          toggleDesktop={toggleDesktop}
          toggleMobile={toggleMobile}
        />
      </AppShell.Navbar>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
