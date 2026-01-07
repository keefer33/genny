import { useMounted } from "@mantine/hooks";
import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";
import useAppStore from "~/lib/stores/appStore";

export default function AuthWrapper() {
  const mounted = useMounted();
  const { getUser, appLoading } = useAppStore();

  const navigate = useNavigate();

  // Handle redirect for unauthenticated users
  useEffect(() => {
    if (mounted && !getUser()?.user?.id) {
      navigate("/login", { replace: true });
    }
  }, [mounted, appLoading, getUser, navigate]);

  // If we get here, user is authenticated
  return <Outlet />;
}
