import type { RealtimeChannel } from "@supabase/supabase-js";
import { useRef } from "react";
import useAppStore from "../stores/appStore";
import useCharactersStore from "../stores/charactersStore";
import useGenerationsStore from "../stores/generateStore";
import { usePrivateRealtimeChannel } from "./usePrivateRealtimeChannel";

function updateRunBroadcastField(
  envelope: unknown,
  field: "app" | "character_id"
): string | undefined {
  if (!envelope || typeof envelope !== "object") return undefined;
  const outer = envelope as Record<string, unknown>;
  const direct = outer[field];
  if (typeof direct === "string" && direct.trim()) return direct.trim();
  const inner = outer.payload;
  if (!inner || typeof inner !== "object") return undefined;
  const nested = (inner as Record<string, unknown>)[field];
  return typeof nested === "string" && nested.trim() ? nested.trim() : undefined;
}

/** Parse `update_run` broadcast body — supports `payload.app` or nested `payload.payload.app`. */
function updateRunBroadcastApp(envelope: unknown): string | undefined {
  return updateRunBroadcastField(envelope, "app");
}

function updateRunBroadcastCharacterId(envelope: unknown): string | undefined {
  return updateRunBroadcastField(envelope, "character_id");
}

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
export function useGenerationsRunsRealtime(userId: string | undefined) {
  usePrivateRealtimeChannel({
    userId,
    topic: userId ? `user:${userId}:user_gen_model_runs` : undefined,
    configure: (channel) => {
      channel
        .on("broadcast", { event: "update_run" }, () => {
          void useGenerationsStore.getState().fetchGenerationsHistory();
        })
        .subscribe();
    },
  });
}

/** Same topic as generations — refreshes `/characters` when `update_run` carries `app: "character"`. */
export function useCharactersRealtime(userId: string | undefined) {
  usePrivateRealtimeChannel({
    userId,
    topic: userId ? `user:${userId}:user_gen_model_runs` : undefined,
    configure: (channel) => {
      channel
        .on("broadcast", { event: "update_run" }, (envelope) => {
          const app = updateRunBroadcastApp(envelope);
          if (!app || app.toLowerCase() !== "character") return;
          if (!userId) return;
          const store = useCharactersStore.getState();
          void store.loadCharacters(userId, {
            page: store.charactersPage,
            limit: store.charactersLimit,
          });
        })
        .subscribe();
    },
  });
}

/** Refetch detail view when any generation run updates (webhook/poll progress). */
export function useCharacterDetailRealtime(
  userId: string | undefined,
  characterId: string | undefined,
  onCharacterRunUpdate: () => void
) {
  const cbRef = useRef(onCharacterRunUpdate);
  cbRef.current = onCharacterRunUpdate;

  usePrivateRealtimeChannel({
    userId,
    topic: userId && characterId ? `user:${userId}:user_gen_model_runs` : undefined,
    configure: (channel) => {
      channel
        .on("broadcast", { event: "update_run" }, (envelope) => {
          const app = updateRunBroadcastApp(envelope);
          const broadcastCharacterId = updateRunBroadcastCharacterId(envelope);
          if (characterId && broadcastCharacterId) {
            if (broadcastCharacterId !== characterId.trim()) return;
            cbRef.current();
            return;
          }
          if (app?.toLowerCase() === "character") {
            cbRef.current();
          }
        })
        .subscribe();
    },
  });
}
