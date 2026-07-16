import { Box } from "@mantine/core";
import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";
import useAppStore from "~/lib/stores/appStore";
import useGenerateStore from "~/lib/stores/generateStore";
import PageLoader from "~/shared/PageLoader";
import { GlobalPaymentModal } from "~/shared/PaymentModal";

/**
 * Authenticated shell for the storyboard editor — same session gate as AuthedLayout,
 * without the global app navbar so the editor can use its own AppShell.
 */
export default function StoryboardEditorLayout() {
  const navigate = useNavigate();
  const { getUser, appLoading } = useAppStore();
  const { loadGenModels } = useGenerateStore();
  const userId = getUser()?.user?.id;

  useEffect(() => {
    if (appLoading) return;
    if (!userId) {
      navigate("/login", { replace: true });
    }
  }, [appLoading, userId, navigate]);

  useEffect(() => {
    void loadGenModels();
  }, [loadGenModels]);

  if (appLoading) {
    return <PageLoader />;
  }

  if (!userId) {
    return null;
  }

  return (
    <>
      <Box h="100dvh" style={{ overflow: "hidden" }}>
        <Outlet />
      </Box>
      <GlobalPaymentModal showPackageSelection />
    </>
  );
}
