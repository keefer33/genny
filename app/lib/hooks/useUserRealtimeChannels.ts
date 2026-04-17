import type { RealtimeChannel } from "@supabase/supabase-js";
import useAppStore from "../stores/appStore";
import usePlaygroundStore from "../stores/playgroundStore";
import { usePrivateRealtimeChannel } from "./usePrivateRealtimeChannel";

/** `user:{id}:profile` — `usage_balance_changed` for CostBadge; registers channel for sign-out. */
export function useUserProfileUsageBalanceRealtime(userId: string | undefined) {
  usePrivateRealtimeChannel({
    userId,
    topic: userId ? `user:${userId}:profile` : undefined,
    onChannelRegistered: (channel: RealtimeChannel | null) => {
      useAppStore.getState().setAuthRealtimeChannel(channel);
    },
    configure: (channel) => {
      channel
        .on(
          "broadcast",
          { event: "usage_balance_changed" },
          (payload: { payload?: { usage_balance?: unknown } }) => {
            if (payload?.payload?.usage_balance != null) {
              useAppStore.getState().setUserUsageBalance(payload.payload.usage_balance as number);
            }
          }
        )
        .subscribe();
    },
  });
}

/** `user:{id}:user_gen_model_runs` — refetch run history on `update_run`. */
export function usePlaygroundRunsRealtime(userId: string | undefined) {
  usePrivateRealtimeChannel({
    userId,
    topic: userId ? `user:${userId}:user_gen_model_runs` : undefined,
    configure: (channel) => {
      channel
        .on("broadcast", { event: "update_run" }, () => {
          void usePlaygroundStore.getState().fetchPlaygroundRunHistory();
        })
        .subscribe();
    },
  });
}
