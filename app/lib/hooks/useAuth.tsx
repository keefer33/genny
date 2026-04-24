import { useEffect } from "react";
import useAppStore from "../stores/appStore";
import { useChatsStore } from "../stores/chatsStore";
export function useAuth() {
  const { setUser, setAppLoading, setApi, getApi, userProfile } = useAppStore();

  const { loadAgentModels } = useChatsStore();

  useEffect(() => {
    setApi();

    const {
      data: { subscription },
    } = getApi().auth.onAuthStateChange(async (event, session) => {
      if (event === "TOKEN_REFRESHED" && session?.access_token) {
        await getApi().realtime.setAuth(session.access_token);
      }

      if (session?.user) {
        await userProfile(session);
        await loadAgentModels();
        setAppLoading(false);
      } else {
        setUser(null);
        setAppLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // After an outage, Supabase does not re-emit auth events; reload profile when health recovers.
  useEffect(() => {
    let previous = useAppStore.getState().apiHealthStatus;
    return useAppStore.subscribe((state) => {
      const next = state.apiHealthStatus;
      if (previous === "unhealthy" && next === "healthy") {
        void (async () => {
          try {
            const session = await useAppStore.getState().getCurrentSession();
            if (session?.user) {
              await useAppStore.getState().userProfile(session);
              await useChatsStore.getState().loadAgentModels();
              useAppStore.getState().setAppLoading(false);
            }
          } catch (e) {
            console.error("Resume after API recovery failed:", e);
          }
        })();
      }
      previous = next;
    });
  }, []);

  return {
    signOut: () => useAppStore.getState().signOut(),
    getCurrentSession: () => useAppStore.getState().getCurrentSession(),
  };
}
