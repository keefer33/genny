import {
  Group,
  Loader,
  Stack,
  Text,
  ThemeIcon,
  Center,
  Pagination,
  AppShell,
  ScrollArea,
  SimpleGrid,
} from "@mantine/core";
import { RiImageLine } from "@remixicon/react";
import { useEffect } from "react";
import useAppStore from "~/lib/stores/appStore";
import useGenerateStore from "~/lib/stores/generateStore";
import { GenerationsFileCard } from "~/pages/generate/components/GenerationsFileCard";
import { LoginCTA } from "~/shared/LoginCTA";
import { PromotionCard } from "~/shared/PromotionCard";

export function GenerationResults() {
  const { getUser, getApi } = useAppStore();
  const {
    selectedModel,
    currentTaskId,
    generations,
    loadingGenerations,
    pagination,
    totalGenerations,
    loadGenerations,
    handlePageChange,
    setSelectedFilterModelId,
  } = useGenerateStore();

  const user = getUser();
  const userId = user?.user?.id;
  const supabase = getApi();

  if (!userId) {
    return (
      <Center h={400}>
        <Stack gap="md">
          <LoginCTA
            title="Login to View Generations"
            subtitle="Sign in to access and manage your generated results."
          />
          <PromotionCard />
        </Stack>
      </Center>
    );
  }

  // Load generations for the selected model when model or task changes
  useEffect(() => {
    if (userId && supabase && selectedModel?.id) {
      setSelectedFilterModelId(selectedModel.id);
      loadGenerations(1, selectedModel.id);
    }
  }, [selectedModel?.id, currentTaskId]);

  const handleFileUpdate = () => {
    // Refresh the generations when a file is updated
    if (userId && supabase && selectedModel?.id) {
      loadGenerations(pagination.currentPage, selectedModel?.id);
    }
  };
  // If no model is selected, show placeholder
  if (!selectedModel && !loadingGenerations) {
    return (
      <Center h={400}>
        <Stack align="center" gap="md">
          <ThemeIcon size="xl" color="gray" variant="light">
            <RiImageLine size={40} />
          </ThemeIcon>
          <Text size="lg" c="dimmed">
            Select a model to view generations
          </Text>
        </Stack>
      </Center>
    );
  }

  // Only show full loading screen if we're loading and have no generations yet
  if (loadingGenerations && generations.length === 0) {
    return (
      <Center h={400}>
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text>Loading generations...</Text>
        </Stack>
      </Center>
    );
  }

  // Show empty state only if not loading and no generations
  if (!loadingGenerations && generations.length === 0) {
    return (
      <Center h={400}>
        <Stack align="center" gap="md">
          <ThemeIcon size="xl" color="gray" variant="light">
            <RiImageLine size={40} />
          </ThemeIcon>
          <Text size="lg" c="dimmed">
            No generations found
          </Text>
          <Text size="sm" c="dimmed" ta="center">
            Generate content with {selectedModel.name} to see results here
          </Text>
        </Stack>
      </Center>
    );
  }

  return (
    <>
      <AppShell.Section>
        <Stack gap="md">
          {/* Header with count and refresh */}
          <Group justify="space-between" align="center">
            <Text size="sm" c="dimmed">
              {generations.length} / {totalGenerations} generation
              {totalGenerations !== 1 ? "s" : ""} with {selectedModel.name}
            </Text>
          </Group>
        </Stack>
      </AppShell.Section>
      <AppShell.Section grow component={ScrollArea}>
        <SimpleGrid cols={{ base: 1, sm: 2, md: 1, lg: 2, xl: 3 }} spacing="md">
          {generations.map((file) => (
            <GenerationsFileCard key={file.id} file={file} onFileUpdate={handleFileUpdate} />
          ))}
        </SimpleGrid>
      </AppShell.Section>
      <AppShell.Section>
        {/* Pagination at bottom */}
        {pagination.totalPages > 1 && (
          <Group justify="center" mt="md">
            <Pagination
              total={pagination.totalPages}
              value={pagination.currentPage}
              onChange={handlePageChange}
              size="sm"
              withEdges
            />
          </Group>
        )}
      </AppShell.Section>
    </>
  );
}
