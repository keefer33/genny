import { Avatar, Box, Button, Group, Menu, ScrollArea, Skeleton, Stack, Text } from "@mantine/core";
import { RiArrowDownSLine, RiCheckLine } from "@remixicon/react";
import { useEffect, useMemo, useState } from "react";
import useAppStore from "~/lib/stores/appStore";
import useGenerationsStore from "~/lib/stores/generateStore";
import type { GenModelsItem } from "~/types/generations";
import { useNavigate, useParams } from "react-router";
import ModelDescription from "~/shared/ModelDescription";

function uniqueModelProductsInOrder(items: GenModelsItem[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const it of items) {
    const p = (it.model_product ?? "").trim();
    if (!p || seen.has(p)) continue;
    seen.add(p);
    out.push(p);
  }
  return out;
}

function variantRowLabel(item: GenModelsItem): string {
  return item.model_variant?.trim() || item.model_name?.trim() || "Variant";
}

function firstItemForProduct(items: GenModelsItem[], product: string): GenModelsItem | undefined {
  return items.find((it) => (it.model_product ?? "").trim() === product);
}

/** Single-line label shown in the closed product control (matches former Select `label`). */
function productDisplayLine(items: GenModelsItem[], productSlug: string): string {
  const row = firstItemForProduct(items, productSlug);
  const brand = row?.brand_name;
  const brandPart = (brand?.name ?? "").trim() || (brand?.slug ?? "").trim();
  return brandPart ? `${brandPart} ${productSlug}` : productSlug;
}

function sortVariantsByCatalog(a: GenModelsItem, b: GenModelsItem): number {
  const oa = a.sort_order_variant;
  const ob = b.sort_order_variant;
  if (oa != null && ob != null && oa !== ob) return oa - ob;
  if (oa != null && ob == null) return -1;
  if (oa == null && ob != null) return 1;
  const pa = a.sort_order;
  const pb = b.sort_order;
  if (pa != null && pb != null && pa !== pb) return pa - pb;
  if (pa != null && pb == null) return -1;
  if (pa == null && pb != null) return 1;
  return (a.model_variant ?? "").localeCompare(b.model_variant ?? "", undefined, {
    sensitivity: "base",
  });
}

function routeModelId(item: GenModelsItem): string {
  const modelId = (item.model_id ?? "").trim();
  return modelId || item.id;
}

export default function GenerateModelPicker() {
  const params = useParams();
  const navigate = useNavigate();
  const { user, authApiKey, updateUserProfile } = useAppStore();
  const {
    error,
    selectedModel,
    allGenModels,
    setSelectedModel,
    setGenerationsHistoryGenModelFilter,
    clearGenerationsHistoryFilters,
  } = useGenerationsStore();
  const generationType = (params.generation_type ?? "").trim().toLowerCase();
  const routeModelParam = (params["*"] ?? "").trim();
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const items = useMemo(
    () =>
      allGenModels.filter(
        (item) => (item.generation_type ?? "").trim().toLowerCase() === generationType
      ),
    [allGenModels, generationType]
  );
  const uniqueProducts = useMemo(() => uniqueModelProductsInOrder(items), [items]);
  const routeSelectedModel = useMemo(
    () =>
      routeModelParam
        ? items.find(
            (item) => item.id === routeModelParam || routeModelId(item) === routeModelParam
          )
        : null,
    [items, routeModelParam]
  );
  const currentModel =
    routeSelectedModel ??
    ((selectedModel?.generation_type ?? "").trim().toLowerCase() === generationType
      ? selectedModel
      : null);
  const selectedModelProduct =
    currentModel && (currentModel.model_product ?? "").trim()
      ? (currentModel.model_product ?? "").trim()
      : null;

  useEffect(() => {
    if (!uniqueProducts.length) {
      setSelectedProduct(null);
      return;
    }
    if (!routeModelParam && !selectedModelProduct) {
      setSelectedProduct(null);
      return;
    }
    const fallback = uniqueProducts[0];
    if (!selectedModelProduct) {
      setSelectedProduct((prev) => (prev && uniqueProducts.includes(prev) ? prev : fallback));
      return;
    }
    if (!uniqueProducts.includes(selectedModelProduct)) {
      setSelectedProduct(fallback);
      return;
    }
    setSelectedProduct((prev) => (prev === selectedModelProduct ? prev : selectedModelProduct));
  }, [routeModelParam, selectedModelProduct, uniqueProducts]);

  useEffect(() => {
    if (!currentModel?.id) return;
    clearGenerationsHistoryFilters();
    setGenerationsHistoryGenModelFilter(currentModel.id);
  }, [clearGenerationsHistoryFilters, currentModel?.id, setGenerationsHistoryGenModelFilter]);

  const variantsForProduct = selectedProduct
    ? items
        .filter((it) => (it.model_product ?? "").trim() === selectedProduct)
        .sort(sortVariantsByCatalog)
    : [];

  function persistModelHistory(model: GenModelsItem) {
    const prof = user?.profile;
    if (!user?.user?.id || !authApiKey || !prof?.username?.trim()) return;
    const key = generationType.trim().toLowerCase();
    if (!key) return;
    void updateUserProfile({
      first_name: prof.first_name ?? "",
      last_name: prof.last_name ?? "",
      bio: prof.bio ?? "",
      username: prof.username,
      model_history: { [key]: { model: model.id } },
    });
  }

  function handleProductChange(value: string | null) {
    if (!value || !generationType) return;
    const first = firstItemForProduct(items, value);
    if (!first) return;
    setSelectedProduct(value);
    setSelectedModel(first);
    clearGenerationsHistoryFilters();
    setGenerationsHistoryGenModelFilter(first.id);
    navigate(`/generate/${generationType}/${routeModelId(first)}`, { replace: true });
    persistModelHistory(first);
  }

  function handleVariantChange(item: GenModelsItem) {
    if (!generationType) return;
    setSelectedModel(item);
    clearGenerationsHistoryFilters();
    setGenerationsHistoryGenModelFilter(item.id);
    navigate(`/generate/${generationType}/${routeModelId(item)}`, { replace: true });
    persistModelHistory(item);
  }

  const productSelectLeftSection = (() => {
    const p = selectedProduct ?? uniqueProducts[0] ?? "";
    if (!p) return null;
    const row = firstItemForProduct(items, p);
    const brand = row?.brand_name;
    const logoUrl = typeof brand?.logo === "string" && brand.logo.trim() ? brand.logo.trim() : null;
    const brandLabel = (brand?.name ?? "").trim() || (brand?.slug ?? "").trim() || "—";
    return (
      <Avatar src={logoUrl ?? undefined} size="sm" radius="sm" alt="" style={{ flexShrink: 0 }}>
        {!logoUrl ? brandLabel.charAt(0).toUpperCase() : null}
      </Avatar>
    );
  })();

  const currentProductSlug = selectedProduct ?? uniqueProducts[0] ?? "";
  const currentProductTriggerLabel = productDisplayLine(items, currentProductSlug);

  const currentVariantLabel = (() => {
    const match = variantsForProduct.find((v) => v.id === currentModel?.id);
    if (match) return variantRowLabel(match);
    return variantsForProduct[0] ? variantRowLabel(variantsForProduct[0]) : "Variant";
  })();

  if (!generationType) {
    return null;
  }

  if (error) {
    return (
      <Text size="sm" c="red">
        {error}
      </Text>
    );
  }

  if (!uniqueProducts.length || !currentProductSlug) {
    return <Skeleton height={36} />;
  }

  const variantSelect =
    variantsForProduct.length > 0 ? (
      <Menu position="bottom-start" withinPortal shadow="md" width="target">
        <Menu.Target>
          <Button
            variant="default"
            size="sm"
            rightSection={<RiArrowDownSLine size={24} />}
            fullWidth
            aria-label="Choose variant"
            justify="space-between"
            styles={{
              root: { fontWeight: 500, fontSize: "1rem", border: "none" },
            }}
          >
            {currentVariantLabel}
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          <ScrollArea.Autosize mah={280} type="auto" offsetScrollbars>
            {variantsForProduct.map((item) => {
              const label = variantRowLabel(item);
              const isActive = currentModel?.id === item.id;
              return (
                <Menu.Item
                  key={item.id}
                  onClick={() => handleVariantChange(item)}
                  leftSection={
                    isActive ? (
                      <RiCheckLine size={16} aria-hidden />
                    ) : (
                      <span style={{ width: 16, display: "inline-block" }} aria-hidden />
                    )
                  }
                  fw={isActive ? 600 : undefined}
                >
                  {label}
                </Menu.Item>
              );
            })}
          </ScrollArea.Autosize>
        </Menu.Dropdown>
      </Menu>
    ) : null;

  return (
    <Stack gap="xs" px="xs">
      <Menu position="bottom-start" withinPortal shadow="md" width="target">
        <Menu.Target>
          <Button
            variant="default"
            size="sm"
            fullWidth
            rightSection={<RiArrowDownSLine size={24} />}
            justify="space-between"
            aria-label="Choose model product"
            styles={{
              root: {
                fontWeight: 600,
                fontSize: "1.25rem",
                border: "none",
              },
            }}
          >
            <Group gap="sm" wrap="nowrap" align="center" justify="space-between" w="100%">
              <Group gap="sm" wrap="nowrap" align="center" style={{ flex: 1, minWidth: 0 }}>
                {productSelectLeftSection}
                <Text component="span" truncate fw={700} style={{ fontSize: "1.25rem" }}>
                  {currentProductTriggerLabel}
                </Text>
              </Group>
            </Group>
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          <ScrollArea.Autosize mah={280} type="auto" offsetScrollbars>
            {uniqueProducts.map((p) => {
              const currentValue = selectedProduct ?? uniqueProducts[0] ?? null;
              const isSelected = p === currentValue;
              const row = firstItemForProduct(items, p);
              const brand = row?.brand_name;
              const logoUrl =
                typeof brand?.logo === "string" && brand.logo.trim() ? brand.logo.trim() : null;
              const brandLabel = (brand?.name ?? "").trim() || (brand?.slug ?? "").trim() || "—";
              return (
                <Menu.Item key={p} onClick={() => handleProductChange(p)}>
                  <Group
                    gap="sm"
                    wrap="nowrap"
                    justify="space-between"
                    w="100%"
                    style={{
                      fontWeight: isSelected ? 600 : undefined,
                    }}
                  >
                    <Group gap="sm" wrap="nowrap" align="center" style={{ flex: 1, minWidth: 0 }}>
                      <Avatar src={logoUrl ?? undefined} size="sm" radius="sm" alt="">
                        {!logoUrl ? brandLabel.charAt(0).toUpperCase() : null}
                      </Avatar>
                      <Box style={{ flex: 1, minWidth: 0 }}>
                        <Group gap={6} wrap="nowrap" align="baseline">
                          <Text component="span" size="sm" fw={isSelected ? 700 : 600} truncate>
                            {brandLabel}
                          </Text>
                          <Text component="span" size="sm" c="dimmed" truncate>
                            {p}
                          </Text>
                        </Group>
                      </Box>
                    </Group>
                    {isSelected ? (
                      <RiCheckLine
                        size={18}
                        color="var(--mantine-primary-color-filled)"
                        aria-hidden
                      />
                    ) : (
                      <span style={{ width: 18, flexShrink: 0 }} aria-hidden />
                    )}
                  </Group>
                </Menu.Item>
              );
            })}
          </ScrollArea.Autosize>
        </Menu.Dropdown>
      </Menu>

      <Group justify="space-between" align="center" wrap="nowrap" gap="xs">
        <Box style={{ flex: 1, minWidth: 0 }}>{variantSelect}</Box>
        <ModelDescription
          modelName={currentModel?.model_name}
          description={currentModel?.model_description}
        />
      </Group>
    </Stack>
  );
}
