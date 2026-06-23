import {
  Avatar,
  Badge,
  Box,
  Divider,
  Group,
  Loader,
  Stack,
  Title,
  Text,
  Card,
  UnstyledButton,
} from "@mantine/core";
import { useMemo } from "react";
import { Link } from "react-router";
import useAppStore from "~/lib/stores/appStore";
import useGenerationsStore from "~/lib/stores/generateStore";
import { MediaTypeBadge } from "~/shared/MediaTypeBadge";
import type { GenModelsItem } from "~/types/generations";

type GenModelProductRow = {
  item: GenModelsItem;
  generationType: string;
  product: string;
};

type GenModelProductGroup = {
  generationType: string;
  product: string;
  representative: GenModelsItem;
  variants: GenModelsItem[];
};

const GENERATION_TYPES = ["video", "image", "audio"] as const;

const TYPE_ORDER: Record<string, number> = {
  video: 0,
  image: 1,
  audio: 2,
};

const linkButtonStyles = {
  root: {
    "&:hover": {
      backgroundColor: "var(--mantine-color-default-hover)",
    },
  },
} as const;

function routeModelId(item: GenModelsItem): string {
  const modelId = (item.model_id ?? "").trim();
  return modelId || item.id;
}

function rowKey({ generationType, product }: { generationType: string; product: string }): string {
  return `${generationType}:${product}`;
}

function variantRowLabel(item: GenModelsItem): string {
  return item.model_variant?.trim() || item.model_name?.trim() || "Variant";
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

function getSavedModelIdFromMeta(
  meta: Record<string, unknown> | null | undefined,
  generationType: string
): string | null {
  if (!meta || typeof meta !== "object") return null;
  const modelHistory = meta.model_history;
  if (!modelHistory || typeof modelHistory !== "object" || Array.isArray(modelHistory)) return null;
  const bucket = (modelHistory as Record<string, unknown>)[generationType.trim().toLowerCase()];
  if (!bucket || typeof bucket !== "object" || Array.isArray(bucket)) return null;
  const model = (bucket as Record<string, unknown>).model;
  if (typeof model === "string" && model.trim()) return model.trim();
  return null;
}

function findModelByHistoryId(
  allGenModels: GenModelsItem[],
  modelId: string
): GenModelsItem | undefined {
  return allGenModels.find((item) => item.id === modelId || routeModelId(item) === modelId);
}

function lastVisitedRows(
  allGenModels: GenModelsItem[],
  meta: Record<string, unknown> | null | undefined
): GenModelProductRow[] {
  const rows: GenModelProductRow[] = [];

  for (const generationType of GENERATION_TYPES) {
    const savedId = getSavedModelIdFromMeta(meta, generationType);
    if (!savedId) continue;

    const item = findModelByHistoryId(allGenModels, savedId);
    if (!item) continue;

    const product = (item.model_product ?? "").trim();
    if (!product) continue;

    rows.push({ item, generationType, product });
  }

  return rows;
}

function productGroups(allGenModels: GenModelsItem[]): GenModelProductGroup[] {
  const groups = new Map<string, GenModelProductGroup>();

  for (const item of allGenModels) {
    const generationType = (item.generation_type ?? "").trim().toLowerCase();
    if (!GENERATION_TYPES.includes(generationType as (typeof GENERATION_TYPES)[number])) continue;

    const product = (item.model_product ?? "").trim();
    if (!product) continue;

    const key = rowKey({ generationType, product });
    const existing = groups.get(key);
    if (existing) {
      existing.variants.push(item);
      continue;
    }

    groups.set(key, {
      generationType,
      product,
      representative: item,
      variants: [item],
    });
  }

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      variants: [...group.variants].sort(sortVariantsByCatalog),
    }))
    .sort((a, b) => {
      const typeDiff = (TYPE_ORDER[a.generationType] ?? 99) - (TYPE_ORDER[b.generationType] ?? 99);
      if (typeDiff !== 0) return typeDiff;

      const sa = a.representative.sort_order;
      const sb = b.representative.sort_order;
      if (sa != null && sb != null && sa !== sb) return sa - sb;
      if (sa != null && sb == null) return -1;
      if (sa == null && sb != null) return 1;

      return a.product.localeCompare(b.product, undefined, { sensitivity: "base" });
    });
}

function GenModelRowContent({
  item,
  generationType,
  product,
  variantLabel,
}: {
  item: GenModelsItem;
  generationType: string;
  product: string;
  variantLabel?: string | null;
}) {
  const brand = item.brand_name;
  const brandLabel = (brand?.name ?? "").trim() || (brand?.slug ?? "").trim() || "—";
  const logoUrl = typeof brand?.logo === "string" && brand.logo.trim() ? brand.logo.trim() : null;

  return (
    <Group wrap="nowrap" gap="sm" justify="space-between" align="center">
      <Group wrap="nowrap" gap="sm" align="center" style={{ flex: 1, minWidth: 0 }}>
        <Avatar src={logoUrl ?? undefined} size="sm" radius="sm" alt="">
          {!logoUrl ? brandLabel.charAt(0).toUpperCase() : null}
        </Avatar>
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Group gap={6} wrap="nowrap" align="baseline">
            <Text component="span" size="lg" fw={700} truncate>
              {brandLabel}
            </Text>
            <Text component="span" size="md" fw={700} c="dimmed" truncate>
              {product}
            </Text>
            {variantLabel ? (
              <Text component="span" size="xs" c="dimmed" truncate>
                {variantLabel}
              </Text>
            ) : null}
          </Group>
        </Box>
      </Group>
      <MediaTypeBadge type={generationType} size="sm" style={{ flexShrink: 0 }} />
    </Group>
  );
}

function GenModelListRow({
  item,
  generationType,
  product,
  showVariant = false,
}: GenModelProductRow & { showVariant?: boolean }) {
  return (
    <Card p={0}>
      <UnstyledButton
        component={Link}
        to={`/generate/${generationType}/${routeModelId(item)}`}
        w="100%"
        p="xs"
        style={{
          borderRadius: "var(--mantine-radius-sm)",
          textDecoration: "none",
          color: "inherit",
        }}
        styles={linkButtonStyles}
      >
        <GenModelRowContent
          item={item}
          generationType={generationType}
          product={product}
          variantLabel={showVariant ? variantRowLabel(item) : null}
        />
      </UnstyledButton>
    </Card>
  );
}

function GenModelProductGroupRow({
  generationType,
  product,
  representative,
  variants,
}: GenModelProductGroup) {
  if (variants.length === 1) {
    return <GenModelListRow item={variants[0]} generationType={generationType} product={product} />;
  }

  return (
    <Card>
      <Card.Section withBorder p="xs">
        <GenModelRowContent
          item={representative}
          generationType={generationType}
          product={product}
        />
      </Card.Section>
      <Stack gap="xs" p="xs">
        <Group gap="xs" wrap="wrap">
          {variants.map((variant) => (
            <Badge
              key={variant.id}
              component={Link}
              to={`/generate/${generationType}/${routeModelId(variant)}`}
              variant="default"
              size="sm"
              style={{ cursor: "pointer", textDecoration: "none" }}
            >
              {variantRowLabel(variant)}
            </Badge>
          ))}
        </Group>
      </Stack>
    </Card>
  );
}

export default function GenModelsList() {
  const { user } = useAppStore();
  const { allGenModels, loading, error } = useGenerationsStore();

  const meta = user?.profile?.meta as Record<string, unknown> | null | undefined;

  const lastVisited = useMemo(() => lastVisitedRows(allGenModels, meta), [allGenModels, meta]);

  const groups = useMemo(() => {
    const allGroups = productGroups(allGenModels);
    if (!lastVisited.length) return allGroups;

    const visitedKeys = new Set(lastVisited.map(rowKey));
    return allGroups.filter((group) => !visitedKeys.has(rowKey(group)));
  }, [allGenModels, lastVisited]);

  if (loading && !allGenModels.length) return <Loader size="sm" />;
  if (error) return <Text c="red">{error}</Text>;
  if (!lastVisited.length && !groups.length) return null;

  return (
    <Stack gap="md">
      {lastVisited.length > 0 ? (
        <>
          <Title order={3}>Last visited</Title>
          {lastVisited.map((row) => (
            <GenModelListRow key={`recent:${rowKey(row)}`} {...row} showVariant />
          ))}
          {groups.length > 0 ? <Divider my={0} /> : null}
        </>
      ) : null}

      {groups.map((group) => (
        <GenModelProductGroupRow key={rowKey(group)} {...group} />
      ))}
    </Stack>
  );
}
