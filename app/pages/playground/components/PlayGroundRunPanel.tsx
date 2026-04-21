import { useEffect, useRef } from "react";
import { Link } from "react-router";
import usePlaygroundStore from "~/lib/stores/playgroundStore";
import PlayGroundRunForm from "./PlayGroundRunForm";
import PageLoader from "~/shared/PageLoader";
import { Anchor, Box, Stack, Text } from "@mantine/core";

export default function PlayGroundRunPanel({
  brandSegmentParam,
  productSegmentParam,
  variantSegmentParam,
}: {
  brandSegmentParam: string;
  productSegmentParam: string;
  variantSegmentParam: string;
}) {
  const { loading, setLoading, searchPlayground, setSelectedModelByRoute, selectedModel } =
    usePlaygroundStore();

  /** Avoid refetching when only `model_variant` changes (same brand + product). */
  const loadedProductKeyRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const brandName = decodeURIComponent(brandSegmentParam);
      const modelProduct = decodeURIComponent(productSegmentParam);
      const modelVariant = decodeURIComponent(variantSegmentParam);
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
    brandSegmentParam,
    productSegmentParam,
    variantSegmentParam,
    searchPlayground,
    setSelectedModelByRoute,
    setLoading,
  ]);

  if (loading) return <PageLoader />;

  if (!selectedModel) {
    return (
      <Box h="100%" p="md" style={{ minHeight: 0, display: "flex", flexDirection: "column" }}>
        <Stack gap="md">
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
        <PlayGroundRunForm />
      </Box>
    </Box>
  );
}
