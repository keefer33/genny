import { Container, ScrollArea, Stack, Text } from "@mantine/core";
import { useEffect, useMemo } from "react";
import { useParams } from "react-router";
import usePlaygroundStore from "~/lib/stores/playgroundStore";
import { PlayGroundBreadcrumbs } from "~/pages/playground/components/PlayGroundBreadcrumbs";
import PageLoader from "~/shared/PageLoader";
import PlayGroundModelGrid from "./components/PlayGroundModelGrid";

export default function PlayGroundModelProduct() {
  const { brand_slug = "", model_product = "" } = useParams();
  const { searchPlayground, items, loading, error } = usePlaygroundStore();
  const decodedBrand = decodeURIComponent(brand_slug);
  const decodedProduct = decodeURIComponent(model_product);

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
        <PlayGroundBreadcrumbs
          brandSegment={decodedBrand}
          productSegment={decodedProduct}
          depth="product"
        />
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
