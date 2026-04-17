import {
  Avatar,
  Badge,
  Button,
  Card,
  Group,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { useMemo } from "react";
import { useNavigate } from "react-router";
import usePlaygroundStore from "~/lib/stores/playgroundStore";
import type { BrandGroup, PlaygroundItem } from "~/types/playground";

function routeBrandKey(item: PlaygroundItem): string {
  return (item.brands?.slug ?? item.brand_name ?? "").trim();
}

function productKey(item: PlaygroundItem): string {
  return (item.model_product ?? "").trim();
}

function sortItemsWithinProduct(a: PlaygroundItem, b: PlaygroundItem): number {
  const oa = a.sort_order;
  const ob = b.sort_order;
  if (oa != null && ob != null && oa !== ob) return oa - ob;
  if (oa != null && ob == null) return -1;
  if (oa == null && ob != null) return 1;
  return (a.model_variant ?? "").localeCompare(b.model_variant ?? "", undefined, {
    sensitivity: "base",
  });
}

function groupItemsByBrandThenProduct(items: PlaygroundItem[]): BrandGroup[] {
  const byBrand = new Map<string, PlaygroundItem[]>();
  for (const item of items) {
    const bk = routeBrandKey(item) || "\0";
    const list = byBrand.get(bk);
    if (list) list.push(item);
    else byBrand.set(bk, [item]);
  }

  const brandKeys = Array.from(byBrand.keys()).sort((a, b) => {
    if (a === "\0") return 1;
    if (b === "\0") return -1;
    const aItems = byBrand.get(a) ?? [];
    const bItems = byBrand.get(b) ?? [];
    const aSort = aItems[0]?.brands?.sort_order;
    const bSort = bItems[0]?.brands?.sort_order;
    if (aSort != null && bSort != null && aSort !== bSort) return aSort - bSort;
    if (aSort != null && bSort == null) return -1;
    if (aSort == null && bSort != null) return 1;
    return a.localeCompare(b, undefined, { sensitivity: "base" });
  });

  const result: BrandGroup[] = [];
  for (const bk of brandKeys) {
    const brandItems = byBrand.get(bk)!;
    const first = brandItems[0];
    const brandLabel = first.brand_name || "Unknown";
    const brandLogo = first.brands?.logo;

    const byProduct = new Map<string, PlaygroundItem[]>();
    for (const item of brandItems) {
      const pk = productKey(item) || "\0";
      const pl = byProduct.get(pk);
      if (pl) pl.push(item);
      else byProduct.set(pk, [item]);
    }

    const productKeys = Array.from(byProduct.keys()).sort((a, b) => {
      if (a === "\0") return 1;
      if (b === "\0") return -1;
      const aItems = byProduct.get(a) ?? [];
      const bItems = byProduct.get(b) ?? [];
      const aSort = aItems
        .map((item) => item.sort_order)
        .find((value): value is number => value != null);
      const bSort = bItems
        .map((item) => item.sort_order)
        .find((value): value is number => value != null);
      if (aSort != null && bSort != null && aSort !== bSort) return aSort - bSort;
      if (aSort != null && bSort == null) return -1;
      if (aSort == null && bSort != null) return 1;
      return a.localeCompare(b, undefined, { sensitivity: "base" });
    });

    const products = productKeys.map((pk) => {
      const productItems = byProduct.get(pk)!;
      const productLabel = pk === "\0" ? "Unknown product" : pk;
      const sorted = [...productItems].sort(sortItemsWithinProduct);
      const generationType =
        productItems.find((item) => item.generation_type === "video")?.generation_type ??
        productItems.find((item) => item.generation_type === "image")?.generation_type ??
        productItems[0]?.generation_type ??
        null;
      return { productKey: pk, productLabel, generationType, items: sorted };
    });

    result.push({
      brandKey: bk === "\0" ? "" : bk,
      brandLabel,
      brandLogo,
      products,
    });
  }
  return result;
}

export default function PlayGroundModelGrid({
  items,
  linkMode = "segments",
  onAfterNavigate,
  /** One card per row (e.g. modal body is narrow while viewport is still “lg”). */
  singleColumn: _singleColumn = false,
}: {
  items: PlaygroundItem[];
  linkMode?: "segments" | "run";
  onAfterNavigate?: () => void;
  singleColumn?: boolean;
}) {
  const navigate = useNavigate();
  const { setSelectedModel } = usePlaygroundStore();

  const grouped = useMemo(() => groupItemsByBrandThenProduct(items), [items]);

  const go = (path: string, item: PlaygroundItem) => {
    setSelectedModel(item);
    navigate(path);
    onAfterNavigate?.();
  };

  return (
    <Stack gap="xl" pr="xs">
      {grouped.map((brandGroup) => {
        const brandParam = brandGroup.brandKey;
        const canBrand = Boolean(brandParam);
        const brandHeaderItem = brandGroup.products[0]?.items[0];

        return (
          <Stack key={brandGroup.brandKey || "__unknown_brand__"} gap="xs" w="100%">
            <Group gap="xs" align="center" wrap="nowrap">
              {brandGroup.brandLogo ? (
                <Avatar
                  src={brandGroup.brandLogo}
                  alt={`${brandGroup.brandLabel} logo`}
                  size={32}
                  radius="xl"
                />
              ) : null}
              {canBrand && brandHeaderItem ? (
                <UnstyledButton
                  onClick={() => {
                    go(`/playground/${encodeURIComponent(brandParam)}`, brandHeaderItem);
                  }}
                  style={{ cursor: "pointer", textAlign: "left" }}
                >
                  <Title order={3} lineClamp={2}>
                    {brandGroup.brandLabel}
                  </Title>
                </UnstyledButton>
              ) : (
                <Title order={3} lineClamp={2}>
                  {brandGroup.brandLabel}
                </Title>
              )}
            </Group>

            {brandGroup.products.map((productGroup) => {
              const productParam = productGroup.productKey === "\0" ? "" : productGroup.productKey;
              const canProduct = canBrand && Boolean(productParam);
              const productNavItem = productGroup.items[0];

              return (
                <Stack key={`${brandGroup.brandKey}::${productGroup.productKey}`} gap="xs" w="100%">
                  {canProduct && productNavItem ? (
                    <UnstyledButton
                      onClick={() => {
                        go(
                          `/playground/${encodeURIComponent(brandParam)}/${encodeURIComponent(productParam)}`,
                          productNavItem
                        );
                      }}
                      style={{ cursor: "pointer", textAlign: "left", alignSelf: "flex-start" }}
                      w="100%"
                    >
                      <Group align="center" w="100%" justify="space-between">
                        <Text size="lg" fw={600}>
                          {productGroup.productLabel}
                        </Text>
                        {productGroup.generationType ? (
                          <Badge
                            size="xs"
                            //variant="light"
                            color={productGroup.generationType === "video" ? "violet" : "orange"}
                          >
                            {productGroup.generationType}
                          </Badge>
                        ) : null}
                      </Group>
                    </UnstyledButton>
                  ) : (
                    <Group align="center" w="100%">
                      <Text size="lg" fw={600}>
                        {productGroup.productLabel}
                      </Text>
                      {productGroup.generationType ? (
                        <Badge
                          size="xs"
                          variant="light"
                          color={productGroup.generationType === "video" ? "violet" : "cyan"}
                        >
                          {productGroup.generationType}
                        </Badge>
                      ) : null}
                    </Group>
                  )}

                  <Group gap="xs">
                    {productGroup.items.map((item) => {
                      const modelType = item.model_type || "unknown";
                      const brandParamItem = routeBrandKey(item);
                      const productParamItem = (item.model_product ?? "").trim();
                      const variantParam = (item.model_variant ?? "").trim();
                      const canBrandItem = Boolean(brandParamItem);
                      const canProductItem = canBrandItem && Boolean(productParamItem);
                      const canVariant = canProductItem && Boolean(variantParam);
                      const runPath = canVariant
                        ? `/playground/${encodeURIComponent(brandParamItem)}/${encodeURIComponent(
                            productParamItem
                          )}/${encodeURIComponent(variantParam)}`
                        : "";

                      if (linkMode === "run") {
                        return (
                          <Button
                            size="compact-xs"
                            variant="light"
                            disabled={!canVariant}
                            onClick={() => {
                              if (!runPath) return;
                              go(runPath, item);
                            }}
                          >
                            {variantParam || "Unknown variant"}
                          </Button>
                        );
                      }

                      return (
                        <Card key={item.id} radius="md" p="xs" w="100%">
                          <UnstyledButton
                            disabled={!canVariant}
                            onClick={() => {
                              if (!runPath) return;
                              go(runPath, item);
                            }}
                            style={{
                              flex: 1,
                              minWidth: 0,
                              textAlign: "left",
                              cursor: canVariant ? "pointer" : "not-allowed",
                              opacity: canVariant ? 1 : 0.6,
                            }}
                            w="100%"
                          >
                            <Group justify="space-between" wrap="nowrap" gap="sm">
                              <Text size="md" lineClamp={2}>
                                {variantParam || "Unknown variant"}
                              </Text>
                              <Badge size="xs" variant="light" style={{ flexShrink: 0 }}>
                                {modelType}
                              </Badge>
                            </Group>
                          </UnstyledButton>
                        </Card>
                      );
                    })}
                  </Group>
                </Stack>
              );
            })}
          </Stack>
        );
      })}
    </Stack>
  );
}
