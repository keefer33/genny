import { AppShell, Box, useMantineColorScheme } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useEffect, useState } from "react";
import { AppShellHeader } from "./AppShellHeader";
import { AppShellNavbar } from "./AppShellNavbar";
import useAppStore from "~/lib/stores/appStore";
import { Outlet, useLoaderData } from "react-router";
import { usePaymentModal } from "./PaymentModal";
import { MOBILE_GLOBAL_NAV_HEIGHT, MobileFooterGlobalNav } from "./MobileFooterGlobalNav";
import useGenerateStore from "~/lib/stores/generateStore";
import type { Model } from "~/lib/stores/generateStore";
import {
  fetchAgentModelsFromApi,
  fetchGenerationModelsFromSupabase,
  getApiEndpointForLoader,
  getSupabaseAnonClientForLoader,
} from "~/lib/fetchGenerationCatalog";

export type GenerateLayoutLoaderData = {
  loaderModels: Model[];
  loaderAiModelsData: unknown[];
};

/** Load heavy catalog only for authenticated app shell — not on landing/login. */
export async function loader(): Promise<GenerateLayoutLoaderData> {
  const supabase = getSupabaseAnonClientForLoader();
  const apiEndpoint = getApiEndpointForLoader();

  const [loaderModels, loaderAiModelsData] = await Promise.all([
    fetchGenerationModelsFromSupabase(supabase),
    fetchAgentModelsFromApi(apiEndpoint),
  ]);

  return { loaderModels, loaderAiModelsData };
}

export default function GenerateLayout() {
  const { loaderModels, loaderAiModelsData } = useLoaderData<GenerateLayoutLoaderData>();
  const { setModels } = useGenerateStore();
  const { isMobile, setAgentModels } = useAppStore();
  const { colorScheme } = useMantineColorScheme();
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopCollapsed, setDesktopCollapsed] = useState(true);
  const { PaymentModalComponent } = usePaymentModal();
  const toggleDesktop = () => {
    setDesktopCollapsed(!desktopCollapsed);
  };

  useEffect(() => {
    if (loaderModels?.length) {
      setModels(loaderModels);
    }
  }, [loaderModels, setModels]);

  useEffect(() => {
    setAgentModels(Array.isArray(loaderAiModelsData) ? (loaderAiModelsData as any[]) : []);
  }, [loaderAiModelsData, setAgentModels]);

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
          <Box pt="xs">
            <MobileFooterGlobalNav />{" "}
          </Box>
        </AppShell.Footer>
      )}

      {/* Global Payment Modal */}
      <PaymentModalComponent showPackageSelection={true} />
    </AppShell>
  );
}
