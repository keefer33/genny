import type { StoreApi, UseBoundStore } from "zustand";

type State = object;

type WithSelectors<S> = S extends { getState: () => infer T }
  ? S & { use: { [K in keyof T]: () => T[K] } }
  : never;

/**
 * Universal selector creator that works with any Zustand store
 * @param store - The Zustand store to add selectors to
 * @returns The store with selectors attached
 */
const createUniversalSelectors = <S extends UseBoundStore<StoreApi<State>>>(store: S) => {
  const storeWithSelectors = store as WithSelectors<typeof store>;
  storeWithSelectors.use = {};

  for (const k of Object.keys(storeWithSelectors.getState())) {
    (storeWithSelectors.use as any)[k] = () => storeWithSelectors((s) => s[k as keyof typeof s]);
  }

  return storeWithSelectors;
};

export default createUniversalSelectors;
