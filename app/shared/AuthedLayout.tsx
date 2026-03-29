import { AppShell, Box } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useEffect, useState } from "react";
import { AppShellHeader } from "./AppShellHeader";
import { AppShellNavbar } from "./AppShellNavbar";
import PageLoader from "./PageLoader";
import useAppStore from "~/lib/stores/appStore";
import { Outlet, useNavigate } from "react-router";
import { usePaymentModal } from "./PaymentModal";
import { MOBILE_GLOBAL_NAV_HEIGHT, MobileFooterGlobalNav } from "./MobileFooterGlobalNav";

/**
 * Authenticated app shell: waits for session/profile + catalog bootstrap (`appLoading` from useAuth),
 * redirects guests to /login, and renders child routes in the main area.
 */
export default function AuthedLayout() {
  const navigate = useNavigate();
  const { getUser, appLoading, isMobile } = useAppStore();
  const userId = getUser()?.user?.id;

  const { themeSettings } = useAppStore();
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopCollapsed, setDesktopCollapsed] = useState(true);
  const { PaymentModalComponent } = usePaymentModal();
  const toggleDesktop = () => {
    setDesktopCollapsed(!desktopCollapsed);
  };

  /** Only redirect after auth bootstrap finished — avoids sending users to login while profile is still loading. */
  useEffect(() => {
    if (appLoading) return;
    if (!userId) {
      navigate("/login", { replace: true });
    }
  }, [appLoading, userId, navigate]);

  if (appLoading) {
    return <PageLoader />;
  }

  if (!userId) {
    return null;
  }

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
      <AppShell.Header bg={themeSettings.colorScheme === "dark" ? "dark.7" : "white"}>
        <AppShellHeader mobileOpened={mobileOpened} toggleMobile={toggleMobile} />
      </AppShell.Header>
      <AppShell.Navbar
        p="0"
        bg={themeSettings.colorScheme === "dark" ? "dark.7" : "white"}
        withBorder={true}
      >
        <AppShellNavbar
          desktopCollapsed={desktopCollapsed}
          toggleDesktop={toggleDesktop}
          toggleMobile={toggleMobile}
        />
      </AppShell.Navbar>
      <AppShell.Main>{userId ? <Outlet /> : null}</AppShell.Main>

      {isMobile && (
        <AppShell.Footer>
          <Box p="xs">
            <MobileFooterGlobalNav />
          </Box>
        </AppShell.Footer>
      )}

      <PaymentModalComponent showPackageSelection={true} />
    </AppShell>
  );
}
