import { REALTIME_CHANNEL_STATES, type RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useRef } from "react";
import useAppStore from "../stores/appStore";

export type PrivateRealtimeChannelConfigure = (channel: RealtimeChannel) => void;

export type UsePrivateRealtimeChannelOptions = {
  /** When missing, any existing channel is removed and `onChannelRegistered(null)` runs. */
  userId: string | undefined;
  /** Full Realtime topic (e.g. `user:${id}:profile`). Omit when `userId` is missing. */
  topic: string | undefined;
  /** Attach listeners and call `channel.subscribe()` (typically chain after `.on()`). */
  configure: PrivateRealtimeChannelConfigure;
  /** e.g. register channel for `signOut` cleanup; receive `null` when channel is torn down. */
  onChannelRegistered?: (channel: RealtimeChannel | null) => void;
  /** If true, skip when the internal ref already points at a subscribed channel. */
  skipIfAlreadySubscribed?: boolean;
};

/**
 * Subscribes to a private Supabase Realtime channel: session → setAuth → channel → configure → cleanup.
 * Uses refs for `configure` / `onChannelRegistered` so effect deps stay `[userId, topic, …]`.
 */
export function usePrivateRealtimeChannel({
  userId,
  topic,
  configure,
  onChannelRegistered,
  skipIfAlreadySubscribed = true,
}: UsePrivateRealtimeChannelOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const configureRef = useRef(configure);
  configureRef.current = configure;
  const onRegisteredRef = useRef(onChannelRegistered);
  onRegisteredRef.current = onChannelRegistered;

  useEffect(() => {
    const { getApi } = useAppStore.getState();

    if (!userId || !topic) {
      const api = getApi();
      if (channelRef.current) {
        try {
          api.removeChannel(channelRef.current);
        } catch {
          /* ignore */
        }
        channelRef.current = null;
      }
      onRegisteredRef.current?.(null);
      return;
    }

    const supabase = getApi();

    if (skipIfAlreadySubscribed && channelRef.current?.state === REALTIME_CHANNEL_STATES.joined) {
      return;
    }

    let cancelled = false;

    void (async () => {
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (accessToken) {
        await supabase.realtime.setAuth(accessToken);
      }
      if (cancelled) return;

      const channel = supabase.channel(topic, {
        config: { private: true },
      });
      if (cancelled) return;
      channelRef.current = channel;
      onRegisteredRef.current?.(channel);

      configureRef.current(channel);
    })();

    return () => {
      cancelled = true;
      const api = useAppStore.getState().getApi();
      if (channelRef.current) {
        try {
          api.removeChannel(channelRef.current);
        } catch {
          /* ignore */
        }
        channelRef.current = null;
      }
      onRegisteredRef.current?.(null);
    };
  }, [userId, topic, skipIfAlreadySubscribed]);
}
