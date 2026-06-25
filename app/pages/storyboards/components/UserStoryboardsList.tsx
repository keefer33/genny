import { Box, Group, Loader, ScrollArea, SimpleGrid, Stack, Text } from "@mantine/core";
import { useEffect } from "react";
import useStoryboardsStore from "~/lib/stores/storyboardsStore";
import { StoryboardCard } from "~/pages/storyboards/components/StoryboardCard";

export function UserStoryboardsList() {
  const { storyboards, storyboardsLoading, loadStoryboards } = useStoryboardsStore();

  useEffect(() => {
    void loadStoryboards();
  }, [loadStoryboards]);

  const isEmpty = storyboards.length === 0;

  return (
    <Stack
      style={{
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
      gap={4}
    >
      <Box style={{ flex: 1, minHeight: 0, minWidth: 0 }}>
        <ScrollArea h="100%" type="auto" offsetScrollbars="y">
          {storyboardsLoading && isEmpty ? (
            <Group justify="center" py="xl">
              <Loader size="sm" />
            </Group>
          ) : isEmpty ? (
            <Box py="md" px="xs">
              <Text c="dimmed" size="sm">
                You have not created any storyboards yet. Use New to add one.
              </Text>
            </Box>
          ) : (
            <Box pb="md">
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md" p="xs">
                {storyboards.map((storyboard) => (
                  <StoryboardCard key={storyboard.id} storyboard={storyboard} />
                ))}
              </SimpleGrid>
            </Box>
          )}
        </ScrollArea>
      </Box>
    </Stack>
  );
}
