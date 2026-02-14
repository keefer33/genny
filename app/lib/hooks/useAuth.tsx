import { useEffect, useRef } from "react";
import useAppStore from "../stores/appStore";

export function useAuth() {
  const {
    setUser,
    setAppLoading,
    setApi,
    getApi,
    userProfile,
    setUserTokens,
    setAuthRealtimeChannel,
    checkApiHealth,
  } = useAppStore();

  const channelRef = useRef<any>(null);

  const subscribeToBalance = async (userId: string) => {
    const supabase = getApi();
    const topic = `user:${userId}:profile`;

    if (channelRef.current?.state === "subscribed") return;

    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;
    if (accessToken) {
      await supabase.realtime.setAuth(accessToken);
    }

    const channel = supabase.channel(topic, {
      config: { private: true },
    });
    channelRef.current = channel;
    setAuthRealtimeChannel(channel);

    channel
      .on("broadcast", { event: "UPDATE" }, (payload: any) => {
        setUserTokens(payload.payload.record.token_balance);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          // console.log("Subscribed to", topic);
        }
      });
  };

  const cleanupChannel = () => {
    const supabase = getApi();
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      setAuthRealtimeChannel(null);
    }
  };

  useEffect(() => {
    setApi();

    // Auth state listener
    const {
      data: { subscription },
    } = getApi().auth.onAuthStateChange(async (event, session) => {
      // Check API health whenever auth state changes
      // Skip check if already on health error page
      if (window.location.pathname !== "/api-health-error") {
        const isHealthy = await checkApiHealth();
        if (!isHealthy) {
          // Redirect to API health error page if API is unhealthy
          window.location.href = "/api-health-error";
          return;
        }
      }

      if (session?.user) {
        userProfile(session); // your existing profile fetcher/populator

        // Subscribe to balance updates for this user
        subscribeToBalance(session.user.id);
      } else {
        // Logout flow
        cleanupChannel();
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
      cleanupChannel();
    };
  }, []);

  return {
    signOut: () => useAppStore.getState().signOut(),
    getCurrentSession: () => useAppStore.getState().getCurrentSession(),
  };
}

export default useAuth;
