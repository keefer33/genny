import { AppShell, useMantineColorScheme } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useEffect, useState } from "react";
import { AppShellHeader } from "./AppShellHeader";
import { AppShellNavbar } from "./AppShellNavbar";
import useAppStore from "~/lib/stores/appStore";
import { Outlet, useMatches } from "react-router";
import { mobileUI } from "~/lib/mobileUi";
import { usePaymentModal } from "./PaymentModal";

export default function GenerateLayout() {
  const matches = useMatches();
  const { setPage, getPage } = useAppStore();
  const { colorScheme } = useMantineColorScheme();
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const { isMobile } = useAppStore();
  const { PaymentModalComponent } = usePaymentModal();
  const toggleDesktop = () => {
    setDesktopCollapsed(!desktopCollapsed);
  };

  useEffect(() => {
    const currentMatch = matches[matches.length - 1];
    setPage(currentMatch.id);
  }, [matches]);

  return (
    <AppShell
      layout="alt"
      header={{ height: isMobile ? (mobileUI.pages[getPage() ?? ""]?.header?.height ?? 60) : 60 }}
      {...(isMobile && {
        footer: { height: mobileUI.pages[getPage() ?? ""]?.footer?.height ?? 0 },
      })}
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

      {isMobile && (
        <AppShell.Footer>{mobileUI.pages[getPage() ?? ""]?.footer?.component}</AppShell.Footer>
      )}

      {/* Global Payment Modal */}
      <PaymentModalComponent showPackageSelection={true} />
    </AppShell>
  );
}
