import useAppStore from "~/lib/stores/appStore";
import useGenerateStore from "~/lib/stores/generateStore";
import { useChatsStore } from "~/lib/stores/chatsStore";

/** Run after `userProfile` succeeds: load catalogs, then clear `appLoading`. */
export async function loadCatalogsAndFinishAppLoading() {
  const { loadGenerationModels } = useGenerateStore();
  const { loadAgentModels } = useChatsStore();
  const { setAppLoading } = useAppStore.getState();
  console.log("loadCatalogsAndFinishAppLoading: loading catalogs");
  try {
    await Promise.all([loadGenerationModels(), loadAgentModels()]);
  } catch (e) {
    console.error("[authBootstrap] loadCatalogsAndFinishAppLoading:", e);
  } finally {
    console.log("loadCatalogsAndFinishAppLoading: setting appLoading to false");
    setAppLoading(false);
  }
}
