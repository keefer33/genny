import { Anchor, Box, Group, Select, Stack, Text, Title } from "@mantine/core";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { formatPlaygroundGenModelDisplayName } from "~/lib/playgroundRunHistoryUtils";
import useAppStore from "~/lib/stores/appStore";
import usePlaygroundStore from "~/lib/stores/playgroundStore";
import { PlayGroundModelBrowser } from "./components/PlayGroundModelBrowser";
import PageLoader from "~/shared/PageLoader";
import { RiAiGenerate2 } from "@remixicon/react";
import type { PlaygroundItem } from "~/types/playground";

function playgroundRunPath(item: PlaygroundItem): string | null {
  const brand = item.brand_name?.slug ?? "";
  const product = (item.model_product ?? "").trim();
  const variant = (item.model_variant ?? "").trim();
  if (!brand || !product || !variant) return null;
  return `/playground/${encodeURIComponent(brand)}/${encodeURIComponent(product)}/${encodeURIComponent(variant)}`;
}

export default function PlayGround() {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.getUser());
  const {
    searchPlayground,
    loading,
    error,
    items,
    recentPlaygroundModels,
    recentPlaygroundModelsLoading,
    fetchRecentPlaygroundModels,
    setSelectedModel,
  } = usePlaygroundStore();

  useEffect(() => {
    void searchPlayground();
  }, [searchPlayground]);

  useEffect(() => {
    if (user?.user?.id) void fetchRecentPlaygroundModels();
  }, [user?.user?.id, fetchRecentPlaygroundModels]);

  const navigableRecent = recentPlaygroundModels.filter((item) => playgroundRunPath(item));

  if (loading) return <PageLoader />;
  if (error) return <Text c="red">{error}</Text>;
  if (items.length === 0) return <Text c="dimmed">No playground models found.</Text>;

  return (
    <Box px="xs" h="100%" style={{ minHeight: 0, display: "flex", flexDirection: "column" }}>
      <Stack gap="md" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <Stack gap="sm">
          <Group gap="xs">
            <RiAiGenerate2 size={30} />
            <Title order={3}>Playground</Title>
          </Group>

          {user?.user?.id ? (
            <Stack gap="xs">
              {recentPlaygroundModelsLoading ? (
                <Text size="xs" c="dimmed">
                  Loading…
                </Text>
              ) : navigableRecent.length === 0 ? null : navigableRecent.length === 1 ? (
                <Text size="sm">
                  <Anchor
                    component={Link}
                    to={playgroundRunPath(navigableRecent[0])!}
                    onClick={() => setSelectedModel(navigableRecent[0])}
                  >
                    {formatPlaygroundGenModelDisplayName(navigableRecent[0])}
                  </Anchor>
                </Text>
              ) : (
                <Select
                  variant="filled"
                  placeholder="Recently used models"
                  clearable
                  data={navigableRecent.map((item) => ({
                    value: item.id,
                    label: formatPlaygroundGenModelDisplayName(item),
                  }))}
                  onChange={(value) => {
                    if (!value) return;
                    const item = navigableRecent.find((i) => i.id === value);
                    const path = item ? playgroundRunPath(item) : null;
                    if (item && path) {
                      setSelectedModel(item);
                      void navigate(path);
                    }
                  }}
                />
              )}
            </Stack>
          ) : null}
        </Stack>

        <PlayGroundModelBrowser
          linkMode="run"
          showSearchLabel
          fetchOnMount={false}
          singleColumnGrid={true}
        />
      </Stack>
    </Box>
  );
}
