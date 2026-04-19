import { useEffect, useMemo, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router";
import usePlaygroundStore from "~/lib/stores/playgroundStore";
import PlayGroundRunForm from "./components/PlayGroundRunForm";
import PageLoader from "~/shared/PageLoader";
import { Anchor, Box, Select, Stack, Text } from "@mantine/core";
import { PlayGroundBreadcrumbs } from "~/pages/playground/components/PlayGroundBreadcrumbs";
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

export default function PlayGroundRun() {
  const navigate = useNavigate();
  const { brand_slug = "", model_product = "", model_variant = "" } = useParams();
  const {
    loading,
    setLoading,
    searchPlayground,
    setSelectedModelByRoute,
    selectedModel,
    items,
    setSelectedModel,
  } = usePlaygroundStore();
  /** Avoid refetching when only `model_variant` changes (same brand + product). */
  const loadedProductKeyRef = useRef<string | null>(null);

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

  const routeBrand = decodeURIComponent(brand_slug).trim();
  const routeProduct = decodeURIComponent(model_product).trim();
  const routeVariant = decodeURIComponent(model_variant).trim();

  const brandSegment = selectedModel ? (selectedModel.brand_name?.slug ?? "") : routeBrand;
  const productSegment = (selectedModel?.model_product ?? routeProduct).trim();
  const variantSegment = (selectedModel?.model_variant ?? routeVariant).trim();

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const brandName = decodeURIComponent(brand_slug);
      const modelProduct = decodeURIComponent(model_product);
      const modelVariant = decodeURIComponent(model_variant);
      const productKey = `${brandName}\0${modelProduct}`;
      const sameProductCatalog = loadedProductKeyRef.current === productKey;

      if (!sameProductCatalog) {
        setLoading(true);
        /** Omit `model_variant` so the catalog includes every variant for this product (run form switcher). */
        await searchPlayground(
          {
            brands: [brandName],
            model_product: [modelProduct],
          },
          { silent: true }
        );
        if (cancelled) return;
        loadedProductKeyRef.current = productKey;
      }

      if (cancelled) return;
      setSelectedModelByRoute({
        brand_slug: brandName,
        model_product: modelProduct,
        model_variant: modelVariant,
      });
      setLoading(false);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [
    brand_slug,
    model_product,
    model_variant,
    searchPlayground,
    setSelectedModelByRoute,
    setLoading,
  ]);

  if (loading) return <PageLoader />;

  if (!selectedModel) {
    return (
      <Box h="100%" p="md" style={{ minHeight: 0, display: "flex", flexDirection: "column" }}>
        <Stack gap="md">
          <PlayGroundBreadcrumbs
            brandSegment={brandSegment}
            productSegment={productSegment}
            variantLabel={variantSegment || "Run"}
            depth="run"
          />
          <Text c="dimmed" size="sm">
            No playground model matches this URL. The catalog may still be loading, or this model
            was removed.
          </Text>
          <Anchor component={Link} to="/playground" size="sm">
            Back to Playground
          </Anchor>
        </Stack>
      </Box>
    );
  }

  return (
    <Box h="100%" style={{ minHeight: 0, display: "flex", flexDirection: "column" }}>
      <Box p="xs" style={{ minHeight: 0, display: "flex", flexDirection: "column" }}>
        <Stack gap="lg" pb="md">
          <PlayGroundBreadcrumbs
            brandSegment={brandSegment}
            productSegment={productSegment}
            variantLabel={variantSegment || selectedModel.model_name || "Run"}
            depth="run"
          />
          {siblingVariants.length > 1 ? (
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
          ) : (
            <Text fw={700}>{selectedModel.model_name ?? "Playground Run"}</Text>
          )}
        </Stack>
        <PlayGroundRunForm />
      </Box>
    </Box>
  );
}
