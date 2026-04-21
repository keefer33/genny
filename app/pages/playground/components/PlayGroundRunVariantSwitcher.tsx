import { Select, Text } from "@mantine/core";
import { useMemo } from "react";
import { useNavigate } from "react-router";
import usePlaygroundStore from "~/lib/stores/playgroundStore";
import type { PlaygroundItem } from "~/types/playground";

function sortPlaygroundItemsByVariant(a: PlaygroundItem, b: PlaygroundItem): number {
  const oa = a.sort_order;
  const ob = b.sort_order;
  if (oa != null && ob != null && oa !== ob) return oa - ob;
  if (oa != null && ob == null) return -1;
  if (oa == null && ob != null) return 1;
  return (a.model_variant ?? "").localeCompare(b.model_variant ?? "", undefined, {
    sensitivity: "base",
  });
}

export default function PlayGroundRunVariantSwitcher() {
  const navigate = useNavigate();
  const { selectedModel, items, setSelectedModel } = usePlaygroundStore();

  const brandSegForSiblings = selectedModel ? (selectedModel.brand_name?.slug ?? "") : "";
  const productSegForSiblings = (selectedModel?.model_product ?? "").trim();

  const siblingVariants = useMemo(() => {
    if (!brandSegForSiblings || !productSegForSiblings) return [];
    return items
      .filter(
        (item) =>
          item.brand_name?.slug === brandSegForSiblings &&
          (item.model_product ?? "").trim() === productSegForSiblings
      )
      .sort(sortPlaygroundItemsByVariant);
  }, [items, brandSegForSiblings, productSegForSiblings]);

  if (!selectedModel) {
    return <Text fw={700}>Playground Run</Text>;
  }

  if (siblingVariants.length <= 1) {
    return <Text fw={700}>{selectedModel.model_name ?? "Playground Run"}</Text>;
  }

  return (
    <Select
      variant="filled"
      placeholder="Choose variant"
      data={siblingVariants.map((item) => ({
        value: item.id,
        label: item.model_variant?.trim() || item.model_id || "Model",
      }))}
      value={selectedModel.id}
      onChange={(id) => {
        if (!id) return;
        const item = siblingVariants.find((i) => i.id === id);
        if (!item) return;
        const b = item.brand_name?.slug ?? "";
        const p = (item.model_product ?? "").trim();
        const v = (item.model_variant ?? "").trim();
        if (!b || !p || !v) return;
        setSelectedModel(item);
        navigate(
          `/playground/${encodeURIComponent(b)}/${encodeURIComponent(p)}/${encodeURIComponent(v)}`
        );
      }}
      searchable
    />
  );
}
