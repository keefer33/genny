import {
  Avatar,
  Box,
  Button,
  Group,
  Loader,
  Menu,
  ScrollArea,
  SegmentedControl,
  Select,
  Stack,
  Text,
} from "@mantine/core";
import { RiArrowDownSLine, RiCheckLine } from "@remixicon/react";
import { useEffect, useState } from "react";
import useGenerationsStore from "~/lib/stores/generateStore";
import type { GenModelsItem } from "~/types/generations";
import useAppStore from "~/lib/stores/appStore";

export type ModelProductPickerProps = {
  /** Matches `gen_models.generation_type` (e.g. `"video"`). */
  generationType: string;
};

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

function itemsConflictWithGenerationType(items: GenModelsItem[], generationType: string): boolean {
  const want = generationType.trim().toLowerCase();
  if (!items.length) return false;
  return items.some((it) => {
    const g = (it.generation_type ?? "").trim().toLowerCase();
    return g !== "" && g !== want;
  });
}

function getSavedModelIdFromMeta(
  meta: Record<string, unknown> | null | undefined,
  generationType: string
): string | null {
  if (!meta || typeof meta !== "object") return null;
  const mh = meta.model_history;
  if (!mh || typeof mh !== "object" || Array.isArray(mh)) return null;
  const bucket = (mh as Record<string, unknown>)[generationType.trim().toLowerCase()];
  if (!bucket || typeof bucket !== "object" || Array.isArray(bucket)) return null;
  const model = (bucket as Record<string, unknown>).model;
  if (typeof model === "string" && model.trim()) return model.trim();
  return null;
}

function syncRunHistoryFiltersFromModel(model: GenModelsItem | null) {
  const {
    setGenerationsHistoryGenModelFilter,
    setGenerationsHistoryBrandFilters,
    setGenerationsHistoryModelProductFilters,
  } = useGenerationsStore.getState();
  if (!model) {
    setGenerationsHistoryGenModelFilter(null);
    setGenerationsHistoryBrandFilters([]);
    setGenerationsHistoryModelProductFilters([]);
    return;
  }
  const brandSlug = (model.brand_name?.slug ?? "").trim();
  const product = (model.model_product ?? "").trim();
  setGenerationsHistoryGenModelFilter(model.id);
  setGenerationsHistoryBrandFilters(brandSlug ? [brandSlug] : []);
  setGenerationsHistoryModelProductFilters(product ? [product] : []);
}

export default function ModelProductPicker({ generationType }: ModelProductPickerProps) {
  const { themeSettings, user, authApiKey, updateUserProfile, isMobile } = useAppStore();
  const { allGenModels, loading, error, setSelectedModel, selectedModel } = useGenerationsStore();
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  let catalog = allGenModels.filter((it) => it.generation_type === generationType);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (cancelled) return;
      if (loading) return;
      catalog = allGenModels.filter((it) => it.generation_type === generationType);
      if (!catalog.length) {
        setSelectedProduct(null);
        setSelectedModel(null);
        syncRunHistoryFiltersFromModel(null);
        return;
      }

      if (itemsConflictWithGenerationType(catalog, generationType)) {
        return;
      }

      const meta = user?.profile?.meta as Record<string, unknown> | null | undefined;
      const savedId = getSavedModelIdFromMeta(meta, generationType);
      const fromMeta = savedId ? catalog.find((it) => it.id === savedId) : undefined;
      const initial = fromMeta ?? catalog[0];
      const current = selectedModel;
      const product = (initial.model_product ?? "").trim() || null;

      if (current?.id === initial.id) {
        setSelectedProduct((prev) => (prev === product ? prev : product));
        return;
      }

      setSelectedModel(initial);
      setSelectedProduct(product);
      syncRunHistoryFiltersFromModel(initial);

      const u = user;
      const prof = u?.profile;
      const apiKey = authApiKey;
      if (initial?.id && u?.user?.id && apiKey && prof?.username?.trim()) {
        const key = generationType.trim().toLowerCase();
        if (key) {
          void updateUserProfile({
            first_name: prof.first_name ?? "",
            last_name: prof.last_name ?? "",
            bio: prof.bio ?? "",
            username: prof.username,
            model_history: { [key]: { model: initial.id } },
          });
        }
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, [loading, generationType]);

  function handleProductChange(value: string | null) {
    if (!value) return;
    setSelectedProduct(value);
    const first = catalog.find((it) => (it.model_product ?? "").trim() === value);
    if (!first) return;
    setSelectedModel(first);
    syncRunHistoryFiltersFromModel(first);
    const prof = user?.profile;
    if (!user?.user?.id || !authApiKey || !prof?.username?.trim()) return;
    const key = generationType.trim().toLowerCase();
    if (!key) return;
    void updateUserProfile({
      first_name: prof.first_name ?? "",
      last_name: prof.last_name ?? "",
      bio: prof.bio ?? "",
      username: prof.username,
      model_history: { [key]: { model: first.id } },
    });
  }

  function handleVariantChange(item: GenModelsItem) {
    setSelectedModel(item);
    syncRunHistoryFiltersFromModel(item);
    const prof = user?.profile;
    if (!user?.user?.id || !authApiKey || !prof?.username?.trim()) return;
    const key = generationType.trim().toLowerCase();
    if (!key) return;
    void updateUserProfile({
      first_name: prof.first_name ?? "",
      last_name: prof.last_name ?? "",
      bio: prof.bio ?? "",
      username: prof.username,
      model_history: { [key]: { model: item.id } },
    });
  }

  const staleCatalog =
    catalog.length > 0 && itemsConflictWithGenerationType(catalog, generationType);
  const uniqueProducts = uniqueModelProductsInOrder(catalog);
  const variantsForProduct = selectedProduct
    ? catalog
        .filter((it) => (it.model_product ?? "").trim() === selectedProduct)
        .sort(sortVariantsByCatalog)
    : [];

  const productSelectData = uniqueProducts.map((p) => {
    const row = firstItemForProduct(catalog, p);
    const brand = row?.brand_name;
    const brandPart = (brand?.name ?? "").trim() || (brand?.slug ?? "").trim();
    const label = brandPart ? `${brandPart} ${p}` : p;
    return { value: p, label };
  });

  const productSelectLeftSection = (() => {
    const p = selectedProduct ?? uniqueProducts[0] ?? "";
    if (!p) return null;
    const row = firstItemForProduct(catalog, p);
    const brand = row?.brand_name;
    const logoUrl = typeof brand?.logo === "string" && brand.logo.trim() ? brand.logo.trim() : null;
    const brandLabel = (brand?.name ?? "").trim() || (brand?.slug ?? "").trim() || "—";
    return (
      <Avatar src={logoUrl ?? undefined} size="sm" radius="sm" alt="" style={{ flexShrink: 0 }}>
        {!logoUrl ? brandLabel.charAt(0).toUpperCase() : null}
      </Avatar>
    );
  })();

  const currentVariantLabel = (() => {
    const match = variantsForProduct.find((v) => v.id === selectedModel?.id);
    if (match) return variantRowLabel(match);
    return variantsForProduct[0] ? variantRowLabel(variantsForProduct[0]) : "Variant";
  })();

  if ((loading && !catalog.length) || staleCatalog) {
    return <Loader size="sm" />;
  }

  if (error) {
    return (
      <Text size="sm" c="red">
        {error}
      </Text>
    );
  }

  if (!uniqueProducts.length) {
    return (
      <Text size="sm" c="dimmed">
        No models for this category.
      </Text>
    );
  }

  const variantSelect =
    variantsForProduct.length > 0 ? (
      variantsForProduct.length <= 3 ? (
        <SegmentedControl
          size="xs"
          color={themeSettings.themeColor}
          fullWidth
          data={variantsForProduct.map((item) => ({
            value: item.id,
            label: variantRowLabel(item),
          }))}
          value={
            selectedModel && variantsForProduct.some((v) => v.id === selectedModel.id)
              ? selectedModel.id
              : (variantsForProduct[0]?.id ?? "")
          }
          onChange={(id) => {
            const item = variantsForProduct.find((i) => i.id === id);
            if (item) handleVariantChange(item);
          }}
          aria-label="Choose variant"
        />
      ) : (
        <Menu position="bottom-start" withinPortal shadow="md" width="target">
          <Menu.Target>
            <Button
              variant="filled"
              size="xs"
              rightSection={<RiArrowDownSLine size={18} />}
              fullWidth
              aria-label="Choose variant"
              justify="space-between"
            >
              {currentVariantLabel}
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            <ScrollArea.Autosize mah={280} type="auto" offsetScrollbars>
              {variantsForProduct.map((item) => {
                const label = variantRowLabel(item);
                const isActive = selectedModel?.id === item.id;
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
      )
    ) : null;

  return (
    <Stack gap="xs">
      <Select
        variant="default"
        size="sm"
        bd={0}
        data={productSelectData}
        value={selectedProduct ?? uniqueProducts[0] ?? null}
        onChange={handleProductChange}
        searchable
        leftSection={productSelectLeftSection}
        leftSectionWidth={36}
        renderOption={({ option, checked }) => {
          const currentValue = selectedProduct ?? uniqueProducts[0] ?? null;
          const isSelected = Boolean(checked) || option.value === currentValue;
          const row = firstItemForProduct(catalog, option.value);
          const brand = row?.brand_name;
          const logoUrl =
            typeof brand?.logo === "string" && brand.logo.trim() ? brand.logo.trim() : null;
          const brandLabel = (brand?.name ?? "").trim() || (brand?.slug ?? "").trim() || "—";
          return (
            <Group
              gap="sm"
              wrap="nowrap"
              align="center"
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
                      {option.value}
                    </Text>
                  </Group>
                </Box>
              </Group>
              {isSelected ? (
                <RiCheckLine size={18} color="var(--mantine-primary-color-filled)" aria-hidden />
              ) : (
                <span style={{ width: 18, flexShrink: 0 }} aria-hidden />
              )}
            </Group>
          );
        }}
      />

      {isMobile ? (
        <Group justify="space-between" align="center" wrap="nowrap">
          {variantSelect}
        </Group>
      ) : (
        <>{variantSelect}</>
      )}
    </Stack>
  );
}
