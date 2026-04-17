import { useEffect } from "react";
import useAppStore from "../stores/appStore";
import { useChatsStore } from "../stores/chatsStore";
export function useAuth() {
  const { setUser, setAppLoading, setApi, getApi, userProfile, checkApiHealth, getUser } =
    useAppStore();

  const { loadAgentModels } = useChatsStore();

  useEffect(() => {
    setApi();

    // Auth state listener
    const {
      data: { subscription },
    } = getApi().auth.onAuthStateChange(async (event, session) => {
      // Check API health whenever auth state changes
      // Skip check if already on health error page
      console.log("onAuthStateChange event", event);
      if (window.location.pathname !== "/api-health-error") {
        const isHealthy = await checkApiHealth();
        console.log("isHealthy", isHealthy);
        if (!isHealthy) {
          // Redirect to API health error page if API is unhealthy
          window.location.href = "/api-health-error";
          return;
        }
      }

      if (session?.user) {
        if (getUser()?.user?.id !== session.user.id) {
          await userProfile(session); // your existing profile fetcher/populator
        }
        await loadAgentModels();
        setAppLoading(false);
      } else {
        // Logout flow
        setUser(null);
        setAppLoading(false);
      }
    });

    // Also handle token refresh to keep Realtime authorized
    const { data: refreshSub } = getApi().auth.onAuthStateChange(async (event, session) => {
      if (event === "TOKEN_REFRESHED" && session?.access_token) {
        await getApi().realtime.setAuth(session.access_token);
      }
    });

    // Cleanup on unmount
    return () => {
      subscription.unsubscribe();
      refreshSub.subscription.unsubscribe();
    };
  }, []);

  return {
    signOut: () => useAppStore.getState().signOut(),
    getCurrentSession: () => useAppStore.getState().getCurrentSession(),
  };
}
