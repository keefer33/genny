import { useEffect, useRef } from "react";
import useAppStore from "../stores/appStore";

export function useAuth() {
  const { setUser, setAppLoading, setApi, getApi, userProfile, setUserTokens } = useAppStore();

  // Keep channel ref to avoid duplicate subscriptions and for cleanup
  const channelRef = useRef<any>(null);

  // Helper to subscribe to the user's private profile topic
  const subscribeToBalance = async (userId: string) => {
    const supabase = getApi();
    const topic = `user:${userId}:profile`;

    // If already subscribed, skip
    if (channelRef.current?.state === "subscribed") return;

    // Ensure Realtime connection has the latest JWT
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;
    if (accessToken) {
      await supabase.realtime.setAuth(accessToken);
    }

    const channel = supabase.channel(topic, {
      config: { private: true },
    });
    channelRef.current = channel;

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

  // Helper to cleanup channel
  const cleanupChannel = () => {
    const supabase = getApi();
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  };

  useEffect(() => {
    setApi();

    // Auth state listener
    const {
      data: { subscription },
    } = getApi().auth.onAuthStateChange(async (event, session) => {
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

  // Utilities
  const signOut = async () => {
    try {
      const { error } = await getApi().auth.signOut({ scope: "global" });
      if (error) throw error;
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    } finally {
      cleanupChannel();
    }
  };

  const getCurrentSession = async () => {
    try {
      const {
        data: { session },
        error,
      } = await getApi().auth.getSession();
      if (error) {
        console.error("Error getting session:", error);
        return null;
      }
      return session;
    } catch (error) {
      console.error("Error getting session:", error);
      return null;
    }
  };

  return {
    signOut,
    getCurrentSession,
  };
}

export default useAuth;
