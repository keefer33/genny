import { AppShell, Container, useMantineColorScheme } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { AppShellHeader } from "./AppShellHeader";
import { AppShellNavbar } from "./AppShellNavbar";
import useAppStore from "~/lib/stores/appStore";
import { Outlet } from "react-router";
import { usePaymentModal } from "./PaymentModal";
import { MOBILE_GLOBAL_NAV_HEIGHT, MobileFooterGlobalNav } from "./MobileFooterGlobalNav";

export default function GenerateLayout() {
  const { isMobile } = useAppStore();
  const { colorScheme } = useMantineColorScheme();
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopCollapsed, setDesktopCollapsed] = useState(true);
  const { PaymentModalComponent } = usePaymentModal();
  const toggleDesktop = () => {
    setDesktopCollapsed(!desktopCollapsed);
  };

  return (
    <AppShell
      layout="alt"
      header={{ height: 60 }}
      {...(isMobile && {
        footer: { height: MOBILE_GLOBAL_NAV_HEIGHT },
      })}
      navbar={{
        width: desktopCollapsed ? 60 : 160,
        breakpoint: "md",
        collapsed: { mobile: !mobileOpened, desktop: false },
      }}
      padding="0"
      withBorder={false}
    >
      <AppShell.Header bg={colorScheme === "dark" ? "dark.7" : "white"}>
        <AppShellHeader mobileOpened={mobileOpened} toggleMobile={toggleMobile} />
      </AppShell.Header>
      <AppShell.Navbar p="0" bg={colorScheme === "dark" ? "dark.7" : "white"} withBorder={true}>
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
        <AppShell.Footer>
          <Container fluid p="xs">
            <MobileFooterGlobalNav />
          </Container>
        </AppShell.Footer>
      )}

      {/* Global Payment Modal */}
      <PaymentModalComponent showPackageSelection={true} />
    </AppShell>
  );
}
