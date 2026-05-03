import { Avatar, Card, Group, Loader, Scroller, Stack, Text, Title } from "@mantine/core";
import {
  RiImageLine,
  RiVideoLine,
  RiArrowRightWideFill,
  RiArrowLeftWideFill,
  RiMusic2Line,
} from "@remixicon/react";
import { Link } from "react-router";
import useGenerationsStore from "~/lib/stores/generateStore";

type GenModelsProductScrollerProps = {
  title: string;
  generationType: "video" | "image" | "audio";
};

export default function GenModelsProductScroller({
  title,
  generationType,
}: GenModelsProductScrollerProps) {
  const { allGenModels, loading, error } = useGenerationsStore();

  if (loading && !allGenModels.length) return <Loader size="sm" />;
  if (error) return <Text c="red">{error}</Text>;
  const seen = new Set<string>();
  const products = allGenModels.filter((it) => {
    const rowType = (it.generation_type ?? "").trim().toLowerCase();
    if (rowType !== generationType) return false;
    const product = (it.model_product ?? "").trim();
    if (!product || seen.has(product)) return false;
    seen.add(product);
    return true;
  });

  if (!products.length) return null;
  const TitleIcon =
    generationType === "video"
      ? RiVideoLine
      : generationType === "image"
        ? RiImageLine
        : generationType === "audio"
          ? RiMusic2Line
          : null;

  return (
    <Stack gap="lg">
      <Group gap="xs" align="center" pl="xs">
        <TitleIcon size={30} />
        <Title order={3} c="dimmed">
          {title}
        </Title>
      </Group>
      <Scroller
        draggable
        controlSize={30}
        startControlIcon={<RiArrowLeftWideFill size={30} />}
        endControlIcon={<RiArrowRightWideFill size={30} />}
        styles={{
          control: {
            background: "var(--mantine-color-default)",
            justifyContent: "center",
          },
        }}
      >
        <Group wrap="nowrap" gap="md" pb={4}>
          {products.map((item) => {
            const brand = item.brand_name;
            const brandLabel = (brand?.name ?? "").trim() || (brand?.slug ?? "").trim() || "—";
            const logoUrl =
              typeof brand?.logo === "string" && brand.logo.trim() ? brand.logo.trim() : null;
            const modelId = (item.model_id ?? "").trim() || item.id;
            const product = (item.model_product ?? "").trim() || item.model_name || "Model";
            return (
              <Card
                key={item.id}
                component={Link}
                to={`/generate/${generationType}/${modelId}`}
                radius="md"
                p="xs"
                miw={200}
                //style={{ width: 260, flexShrink: 0, textDecoration: "none" }}
              >
                <Stack gap={6} align="center">
                  <Group gap="xs" wrap="nowrap">
                    <Avatar src={logoUrl ?? undefined} size="sm" radius="sm">
                      {!logoUrl ? brandLabel.charAt(0).toUpperCase() : null}
                    </Avatar>
                    <Text fw={700} truncate>
                      {brandLabel}
                    </Text>
                  </Group>
                  <Text fw={600} truncate>
                    {product}
                  </Text>
                </Stack>
              </Card>
            );
          })}
        </Group>
      </Scroller>
    </Stack>
  );
}
