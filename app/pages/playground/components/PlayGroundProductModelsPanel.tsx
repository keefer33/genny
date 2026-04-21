import { Container, ScrollArea, Stack, Text } from "@mantine/core";
import { useEffect, useMemo } from "react";
import usePlaygroundStore from "~/lib/stores/playgroundStore";
import PageLoader from "~/shared/PageLoader";
import PlayGroundModelGrid from "./PlayGroundModelGrid";

export default function PlayGroundProductModelsPanel({
  brandSegmentParam,
  productSegmentParam,
}: {
  brandSegmentParam: string;
  productSegmentParam: string;
}) {
  const decodedBrand = decodeURIComponent(brandSegmentParam);
  const decodedProduct = decodeURIComponent(productSegmentParam);
  const { searchPlayground, items, loading, error } = usePlaygroundStore();

  useEffect(() => {
    if (!decodedBrand || !decodedProduct) return;
    void searchPlayground({ brands: [decodedBrand], model_product: [decodedProduct] });
  }, [decodedBrand, decodedProduct, searchPlayground]);

  const filteredItems = useMemo(() => {
    if (!decodedBrand || !decodedProduct) return [];
    return items.filter((item) => {
      const brand = item.brand_name?.slug ?? "";
      const product = (item.model_product ?? "").trim();
      return brand === decodedBrand && product === decodedProduct;
    });
  }, [items, decodedBrand, decodedProduct]);

  if (loading) return <PageLoader />;
  if (error) return <Text c="red">{error}</Text>;

  return (
    <Container
      size="lg"
      h="100%"
      style={{ minHeight: 0, display: "flex", flexDirection: "column" }}
    >
      <Stack
        gap="md"
        pb="md"
        style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
      >
        <ScrollArea h="100%" type="auto" offsetScrollbars="y">
          {filteredItems.length === 0 ? (
            <Text c="dimmed">No playground models found for this product.</Text>
          ) : (
            <PlayGroundModelGrid items={filteredItems} singleColumn={true} />
          )}
        </ScrollArea>
      </Stack>
    </Container>
  );
}
