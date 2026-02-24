import {
  Button,
  Checkbox,
  Group,
  Loader,
  Modal,
  Stack,
  Text,
  ThemeIcon,
  Center,
  ScrollArea,
  SimpleGrid,
  Box,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { RiImageLine } from "@remixicon/react";
import { useEffect, useState } from "react";
import useAppStore from "~/lib/stores/appStore";
import useGenerateStore from "~/lib/stores/generateStore";
import useFilesFoldersStore from "~/lib/stores/filesFoldersStore";
import useTagStore from "~/lib/stores/tagStore";
import { GenerationsFileCard } from "~/pages/generate/components/GenerationsFileCard";
import { GenerationsFiltersModal } from "~/shared/GenerationsFiltersModal";
import { LoginCTA } from "~/shared/LoginCTA";
import { PromotionCard } from "~/shared/PromotionCard";
import { AppPagination } from "~/shared/AppPagination";

export function GenerationResults() {
  const [selectedGenerations, setSelectedGenerations] = useState<Set<string>>(new Set());
  const [selectedGenerationData, setSelectedGenerationData] = useState<Map<string, any>>(new Map());
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] =
    useDisclosure(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const { getUser, getApi } = useAppStore();
  const {
    currentTaskId,
    generations,
    loadingGenerations,
    pagination,
    loadGenerations,
    setSelectedFilterModelId,
    selectedFilterModelId,
    models,
  } = useGenerateStore();
  const { fileTypeFilter, selectedTags, deleteFile } = useFilesFoldersStore();
  const { loadTags } = useTagStore();
  const { isMobile } = useAppStore();
  const user = getUser();
  const userId = user?.user?.id;
  const supabase = getApi();
  const availableModels = models.map((model) => ({ id: model.id, name: model.name }));

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

  useEffect(() => {
    if (userId) {
      loadTags(userId);
    }
  }, [userId, loadTags]);

  // Always show all models by default when this view first loads.
  useEffect(() => {
    setSelectedFilterModelId(null);
  }, [setSelectedFilterModelId]);

  // Load generations using active filters (model filter optional from modal).
  useEffect(() => {
    if (userId && supabase) {
      loadGenerations(
        1,
        selectedFilterModelId || undefined,
        fileTypeFilter || undefined,
        false,
        selectedTags
      );
    }
  }, [
    currentTaskId,
    fileTypeFilter,
    selectedTags,
    selectedFilterModelId,
    userId,
    supabase,
    loadGenerations,
  ]);

  const handleFileUpdate = () => {
    // Refresh the generations when a file is updated
    if (userId && supabase) {
      loadGenerations(
        pagination.currentPage,
        selectedFilterModelId || undefined,
        fileTypeFilter || undefined,
        false,
        selectedTags
      );
    }
  };

  const handleGenerationSelect = (generationId: string, selected: boolean, generationData: any) => {
    setSelectedGenerations((prev) => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(generationId);
        setSelectedGenerationData((prevData) =>
          new Map(prevData).set(generationId, generationData)
        );
      } else {
        newSet.delete(generationId);
        setSelectedGenerationData((prevData) => {
          const newMap = new Map(prevData);
          newMap.delete(generationId);
          return newMap;
        });
      }
      return newSet;
    });
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const currentPageIds = new Set(generations.map((gen) => gen.id));
      const currentPageData = new Map(generations.map((gen) => [gen.id, gen]));
      setSelectedGenerations((prev) => {
        const merged = new Set(prev);
        currentPageIds.forEach((id) => merged.add(id));
        return merged;
      });
      setSelectedGenerationData((prevData) => {
        const merged = new Map(prevData);
        currentPageData.forEach((value, key) => merged.set(key, value));
        return merged;
      });
    } else {
      const currentPageIds = new Set(generations.map((gen) => gen.id));
      setSelectedGenerations((prev) => {
        const filtered = new Set(prev);
        currentPageIds.forEach((id) => filtered.delete(id));
        return filtered;
      });
      setSelectedGenerationData((prevData) => {
        const filtered = new Map(prevData);
        currentPageIds.forEach((id) => filtered.delete(id));
        return filtered;
      });
    }
  };

  const selectedOnCurrentPage = generations.filter((gen) => selectedGenerations.has(gen.id));
  const isAllSelected =
    generations.length > 0 && selectedOnCurrentPage.length === generations.length;
  const isIndeterminate =
    selectedOnCurrentPage.length > 0 && selectedOnCurrentPage.length < generations.length;

  const handleBulkDelete = async () => {
    if (!userId || selectedGenerations.size === 0) return;

    setBulkLoading(true);
    try {
      const allSelectedGenerations = Array.from(selectedGenerations)
        .map((genId) => selectedGenerationData.get(genId))
        .filter(Boolean);

      const deletePromises = allSelectedGenerations.map((gen) =>
        deleteFile(
          gen.user_generation_files[0].user_files.file_name,
          gen.user_generation_files[0].user_files.id,
          userId
        )
      );

      const results = await Promise.all(deletePromises);
      const successCount = results.filter((r) => r).length;

      if (successCount > 0) {
        setSelectedGenerations(new Set());
        setSelectedGenerationData(new Map());
        closeDeleteModal();
        if (userId && supabase) {
          loadGenerations(
            pagination.currentPage,
            selectedFilterModelId || undefined,
            fileTypeFilter || undefined,
            false,
            selectedTags
          );
        }
      }
    } catch (error) {
      console.error("Error deleting generations:", error);
    } finally {
      setBulkLoading(false);
    }
  };

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
      <Stack gap="xs">
        <GenerationsFiltersModal availableModels={availableModels} showTagManager />
        <Center h={400}>
          <Stack align="center" gap="md">
            <ThemeIcon size="xl" color="gray" variant="light">
              <RiImageLine size={40} />
            </ThemeIcon>
            <Text size="lg" c="dimmed">
              No generations found
            </Text>
            <Text size="sm" c="dimmed" ta="center">
              Generate content to see results here
            </Text>
          </Stack>
        </Center>
      </Stack>
    );
  }

  return (
    <Box
      h="calc(100dvh - var(--app-shell-header-height, 0px) - var(--app-shell-footer-height, 0px))"
      style={{ minHeight: 0 }}
    >
      <Stack gap="xs" h="100%" style={{ minHeight: 0 }}>
        <Group justify="space-between" align="center">
          <GenerationsFiltersModal availableModels={availableModels} showTagManager />

          <Group gap="sm">
            <Checkbox
              checked={isAllSelected}
              indeterminate={isIndeterminate}
              onChange={(event) => handleSelectAll(event.currentTarget.checked)}
              label={`${selectedGenerations.size} selected`}
            />
            {selectedGenerations.size > 0 && (
              <Button
                variant="light"
                color="red"
                size="xs"
                onClick={openDeleteModal}
                loading={bulkLoading}
              >
                Delete
              </Button>
            )}
          </Group>
        </Group>

        <ScrollArea h="90%" pr={!isMobile ? "xs" : 0}>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 1, lg: 2, xl: 3 }} spacing="md">
            {generations.map((file) => (
              <GenerationsFileCard
                key={file.id}
                file={file}
                onFileUpdate={handleFileUpdate}
                selected={selectedGenerations.has(file.id)}
                onSelect={(selected) => handleGenerationSelect(file.id, selected, file)}
              />
            ))}
          </SimpleGrid>
        </ScrollArea>

        {pagination.totalPages > 1 && (
          <Group justify="center" py="lg">
            <AppPagination
              total={pagination.totalPages}
              value={pagination.currentPage}
              onChange={(page) =>
                loadGenerations(
                  page,
                  selectedFilterModelId || undefined,
                  fileTypeFilter || undefined,
                  false,
                  selectedTags
                )
              }
              size="sm"
              withEdges
            />
          </Group>
        )}

        <Modal
          opened={deleteModalOpened}
          onClose={closeDeleteModal}
          title="Delete Selected Generations"
          centered
        >
          <Stack gap="md">
            <Text>
              Are you sure you want to delete {selectedGenerations.size} generation
              {selectedGenerations.size !== 1 ? "s" : ""}? This action cannot be undone.
            </Text>
            <Group justify="flex-end" gap="sm">
              <Button variant="light" onClick={closeDeleteModal} disabled={bulkLoading}>
                Cancel
              </Button>
              <Button color="red" onClick={handleBulkDelete} loading={bulkLoading}>
                Delete Generations
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </Box>
  );
}
