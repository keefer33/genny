import { Box, Container, Stack, Text } from "@mantine/core";
import { useEffect } from "react";
import usePlaygroundStore from "~/lib/stores/playgroundStore";
import { PlayGroundModelBrowser } from "../playground/components/PlayGroundModelBrowser";
import PageLoader from "~/shared/PageLoader";

export default function BrowseModels() {
  const { searchPlayground, loading, error, items } = usePlaygroundStore();

  useEffect(() => {
    void searchPlayground();
  }, [searchPlayground]);

  if (loading) return <PageLoader />;
  if (error) return <Text c="red">{error}</Text>;
  if (items.length === 0) return <Text c="dimmed">No playground models found.</Text>;

  return (
    <Container
      size="lg"
      h="calc(100dvh - var(--app-shell-header-height, 0px) - var(--app-shell-footer-height, 0px))"
      style={{ minHeight: 0, overflow: "hidden" }}
    >
      <Box h="100%" style={{ minHeight: 0, display: "flex", flexDirection: "column" }}>
        <Stack
          gap="md"
          style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
          pb="md"
        >
          <PlayGroundModelBrowser linkMode="run" showSearchLabel fetchOnMount={false} />
        </Stack>
      </Box>
    </Container>
  );
}
