import {
  Group,
  Text,
  Stack,
  Loader,
  Pagination,
  ScrollArea,
  Grid,
  SimpleGrid,
  Checkbox,
  Button,
  Modal,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useViewportSize } from "@mantine/hooks";
import { useEffect, useMemo, useState } from "react";
import useAppStore from "~/lib/stores/appStore";
import useGenerateStore from "~/lib/stores/generateStore";
import { GenerationsFileCard } from "~/pages/generate/components/GenerationsFileCard";
import Mounted from "~/shared/Mounted";
import { GenerationFilters } from "~/pages/generate/components/GenerationFilters";
import { FileFilters } from "~/pages/files/components/FileFilters";
import useFilesFoldersStore from "~/lib/stores/filesFoldersStore";
import useTagStore from "~/lib/stores/tagStore";

export default function Generations() {
  const [selectedGenerations, setSelectedGenerations] = useState<Set<string>>(new Set());
  const [selectedGenerationData, setSelectedGenerationData] = useState<Map<string, any>>(new Map());
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] =
    useDisclosure(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  const { getUser, getApi, isMobile } = useAppStore();
  const { models } = useGenerateStore();
  const {
    generations,
    loadingGenerations,
    pagination,
    loadGenerations,
    selectedFilterModelId,
    deleteGeneration,
  } = useGenerateStore();
  const { fileTypeFilter, selectedTags } = useFilesFoldersStore();
  const { loadTags } = useTagStore();
  const { height: viewportHeight } = useViewportSize();

  const user = getUser();
  const userId = user?.user?.id;
  const supabase = getApi();

  const availableModels = useMemo(() => {
    return models.map((model) => ({
      id: model.id,
      name: model.name,
    }));
  }, [models]);

  // Load tags on mount
  useEffect(() => {
    if (userId) {
      loadTags(userId);
    }
  }, [userId, loadTags]);

  // Load generations on mount and when filters change
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
  }, [userId, supabase, loadGenerations, selectedFilterModelId, fileTypeFilter, selectedTags]);

  const handleFileUpdate = () => {
    // Refresh the polling files when a file is updated
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
      // Add current page items to existing selections
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
      // Remove only current page items from selections
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

  const filteredGenerations = generations;
  const selectedOnCurrentPage = filteredGenerations.filter((gen) =>
    selectedGenerations.has(gen.id)
  );
  const isAllSelected =
    filteredGenerations.length > 0 && selectedOnCurrentPage.length === filteredGenerations.length;
  const isIndeterminate =
    selectedOnCurrentPage.length > 0 && selectedOnCurrentPage.length < filteredGenerations.length;

  const handleBulkDelete = async () => {
    if (!userId || selectedGenerations.size === 0) return;

    setBulkLoading(true);
    try {
      const allSelectedGenerations = Array.from(selectedGenerations)
        .map((genId) => selectedGenerationData.get(genId))
        .filter(Boolean);

      if (allSelectedGenerations.length === 0) {
        console.warn("No generation data available for selected generations");
        setBulkLoading(false);
        return;
      }

      const deletePromises = allSelectedGenerations.map((gen) => {
        return deleteGeneration(gen.id);
      });

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

  // Calculate available height for ScrollArea
  // Subtract: drawer header (~60px) + component header (~60px) + pagination area (~80px) + margins (~40px)
  const availableHeight = Math.max(300, viewportHeight - 220);

  if (!userId || !supabase) {
    return null;
  }

  return (
    <Mounted size="xl">
      <Grid gutter="xs">
        <Grid.Col span={{ base: 12, md: 4 }}>
          {!isMobile && (
            <Stack gap="xl">
              <GenerationFilters availableModels={availableModels} />
              <FileFilters showTagManager showFileTypeFilter />
            </Stack>
          )}
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 8 }}>
          {loadingGenerations ? (
            <Stack align="center" justify="center" gap="md" style={{ minHeight: "400px" }}>
              <Loader size="lg" />
              <Text size="sm" c="dimmed">
                Loading generations...
              </Text>
            </Stack>
          ) : generations.length === 0 ? (
            <Stack align="center" gap="md">
              <Text size="sm" c="dimmed">
                No generations found
              </Text>
            </Stack>
          ) : (
            <Stack gap="xs">
              {/* Selection Controls */}
              {generations.length > 0 && (
                <Group justify="space-between" align="center">
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
                        size="sm"
                        onClick={openDeleteModal}
                        loading={bulkLoading}
                      >
                        Delete Selected
                      </Button>
                    )}
                  </Group>
                  <Group gap="xs">
                    <Text size="sm" c="dimmed">
                      {filteredGenerations.length} of {pagination.total} generation
                      {pagination.total !== 1 ? "s" : ""}
                      {pagination.totalPages > 1 &&
                        ` (Page ${pagination.currentPage} of ${pagination.totalPages})`}
                    </Text>
                    {(selectedTags.length > 0 ||
                      fileTypeFilter !== "all" ||
                      selectedFilterModelId) && (
                      <Text size="xs" c="blue">
                        (Filtered by{" "}
                        {selectedTags.length > 0 &&
                          `${selectedTags.length} tag${selectedTags.length !== 1 ? "s" : ""}`}
                        {selectedTags.length > 0 &&
                          (fileTypeFilter !== "all" || selectedFilterModelId) &&
                          ", "}
                        {fileTypeFilter !== "all" && fileTypeFilter}
                        {fileTypeFilter !== "all" && selectedFilterModelId && ", "}
                        {selectedFilterModelId &&
                          availableModels.find((m) => m.id === selectedFilterModelId)?.name}
                        )
                      </Text>
                    )}
                  </Group>
                </Group>
              )}

              {!isMobile ? (
                <>
                  <ScrollArea style={{ height: `${availableHeight}px` }}>
                    <SimpleGrid cols={{ base: 1, sm: 2, md: 2, lg: 2 }} spacing="md">
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

                  {/* Pagination at bottom */}
                  {pagination.totalPages > 1 && (
                    <Group justify="center" mt="md">
                      <Pagination
                        total={pagination.totalPages}
                        value={pagination.currentPage}
                        onChange={(page) => {
                          if (userId && supabase) {
                            loadGenerations(
                              page,
                              selectedFilterModelId || undefined,
                              fileTypeFilter || undefined,
                              false,
                              selectedTags
                            );
                          }
                        }}
                        size="sm"
                        withEdges
                      />
                    </Group>
                  )}
                </>
              ) : (
                <Stack gap="lg">
                  {generations.map((file) => (
                    <GenerationsFileCard
                      key={file.id}
                      file={file}
                      onFileUpdate={handleFileUpdate}
                      selected={selectedGenerations.has(file.id)}
                      onSelect={(selected) => handleGenerationSelect(file.id, selected, file)}
                    />
                  ))}
                </Stack>
              )}
            </Stack>
          )}
        </Grid.Col>
      </Grid>

      {/* Bulk Delete Modal */}
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
    </Mounted>
  );
}
