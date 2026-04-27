import { Box, Paper, Stack } from "@mantine/core";
import useAppStore from "~/lib/stores/appStore";
import { useEffect } from "react";
import useGenerationsStore from "~/lib/stores/generateStore";
import type { GenModelsItem } from "~/types/generations";
import { Outlet, useNavigate, useParams } from "react-router";
import DesktopSplitLayout from "~/shared/DesktopSplitLayout";
import GenerationsHistory from "../generations/components/GenerationsHistory";
import MobileScrollBox from "~/shared/MobileScrollBox";
import GenerateModelPicker from "~/pages/generate/components/GenerateModelPicker";

const ALLOWED_GENERATION_TYPES = new Set(["image", "video", "audio", "tool"]);

function routeModelId(item: GenModelsItem): string {
  const modelId = (item.model_id ?? "").trim();
  return modelId || item.id;
}

function readSavedModelIdForType(
  meta: Record<string, unknown> | null | undefined,
  generationType: string
): string | null {
  if (!meta || typeof meta !== "object") return null;
  const modelHistory = meta.model_history;
  if (!modelHistory || typeof modelHistory !== "object" || Array.isArray(modelHistory)) return null;
  const typeBucket = (modelHistory as Record<string, unknown>)[generationType];
  if (!typeBucket || typeof typeBucket !== "object" || Array.isArray(typeBucket)) return null;
  const model = (typeBucket as Record<string, unknown>).model;
  if (typeof model !== "string") return null;
  const trimmed = model.trim();
  return trimmed || null;
}

export default function GenerateModelLayout() {
  const params = useParams();
  const navigate = useNavigate();
  const { isMobile, getUser } = useAppStore();
  const { allGenModels, loadGenModels, setSelectedModel } = useGenerationsStore();

  const init = async () => {
    const generationType = (params.generation_type ?? "").trim().toLowerCase();
    if (!ALLOWED_GENERATION_TYPES.has(generationType)) {
      navigate("/generate", { replace: true });
      return;
    }

    if (!useGenerationsStore.getState().allGenModels.length) {
      await loadGenModels();
    }

    const catalog = useGenerationsStore
      .getState()
      .allGenModels.filter(
        (item) => (item.generation_type ?? "").trim().toLowerCase() === generationType
      );
    const modelParam = (params["*"] ?? "").trim();

    if (!catalog.length) {
      setSelectedModel(null);
      return;
    }

    if (!modelParam) {
      const defaultModel = catalog[0];
      const meta = getUser()?.profile?.meta as Record<string, unknown> | null | undefined;
      const savedModelId = readSavedModelIdForType(meta, generationType);
      if (savedModelId) {
        const preferredItem = catalog.find(
          (item) => item.id === savedModelId || routeModelId(item) === savedModelId
        );
        const nextModel = preferredItem ?? defaultModel;

        setSelectedModel(nextModel);
        navigate(`/generate/${generationType}/${routeModelId(nextModel)}`, { replace: true });
        return;
      } else {
        setSelectedModel(defaultModel);
        navigate(`/generate/${generationType}/${routeModelId(defaultModel)}`, { replace: true });
        return;
      }
    }

    const selectedItem = catalog.find(
      (item) => item.id === modelParam || routeModelId(item) === modelParam
    );
    if (!selectedItem) {
      navigate("/generate", { replace: true });
      return;
    }
    setSelectedModel(selectedItem);
    return;
  };

  useEffect(() => {
    init();
  }, [allGenModels.length, navigate, params["*"], params.generation_type]);

  return isMobile ? (
    <MobileScrollBox>
      <Stack gap="md" style={{ flex: 1, minHeight: 0 }}>
        <GenerateModelPicker />
        <Outlet />
      </Stack>
    </MobileScrollBox>
  ) : (
    <DesktopSplitLayout>
      <Paper
        w={420}
        p="sm"
        style={{
          flex: "0 0 auto",
          alignSelf: "stretch",
          minHeight: 0,
          maxHeight: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Stack gap="xs" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <GenerateModelPicker />
          <Outlet />
        </Stack>
      </Paper>
      <Box style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        <GenerationsHistory />
      </Box>
    </DesktopSplitLayout>
  );
}
