import {
  Button,
  Checkbox,
  Grid,
  Group,
  Modal,
  Pagination,
  ScrollArea,
  SimpleGrid,
  Stack,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useEffect, useState } from "react";
import useFilesFoldersStore from "~/lib/stores/filesFoldersStore";
import useTagStore from "~/lib/stores/tagStore";
import MemberFilesCard from "~/pages/files/MemberFilesCard";
import Mounted from "~/shared/Mounted";
import FileUpload from "./components/FileUpload";
import useAppStore from "~/lib/stores/appStore";
import PageLoader from "~/shared/PageLoader";
import { FileFilters } from "~/pages/files/components/FileFilters";

export default function MemberFiles() {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [selectedFileData, setSelectedFileData] = useState<Map<string, any>>(new Map());
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] =
    useDisclosure(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  const { user, isMobile } = useAppStore();
  const {
    paginationData,
    gridLoading,
    selectedTags,
    fileTypeFilter,
    setPaginationData,
    loadUserFiles,
    deleteFile,
    handleFileUpdate,
    handleFilesPageChange,
  } = useFilesFoldersStore();
  const { loadTags } = useTagStore();

  useEffect(() => {
    if (user?.user?.id) {
      // Files page only shows uploaded files (upload_type = "upload")
      loadUserFiles(paginationData.currentPage, 12, user.user.id, undefined, "upload", undefined);
      loadTags(user.user.id);
    }
  }, [user?.user?.id]);

  // Load files when selected tags change
  useEffect(() => {
    if (user?.user?.id) {
      loadUserFiles(1, 12, user.user.id, undefined, "upload", undefined); // Reset to page 1 when tags change
    }
  }, [selectedTags, user?.user?.id]);

  // Load files when file type filter changes
  useEffect(() => {
    if (user?.user?.id) {
      loadUserFiles(1, 12, user.user.id, undefined, "upload", undefined); // Reset to page 1 when file type filter changes
    }
  }, [fileTypeFilter, user?.user?.id]);

  const handleFileSelect = (fileId: string, selected: boolean, fileData: any) => {
    setSelectedFiles((prev) => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(fileId);
        setSelectedFileData((prevData) => new Map(prevData).set(fileId, fileData));
      } else {
        newSet.delete(fileId);
        setSelectedFileData((prevData) => {
          const newMap = new Map(prevData);
          newMap.delete(fileId);
          return newMap;
        });
      }
      return newSet;
    });
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const allFileIds = new Set(paginationData.data.map((file) => file.id));
      const allFileData = new Map(paginationData.data.map((file) => [file.id, file]));
      setSelectedFiles(allFileIds);
      setSelectedFileData(allFileData);
    } else {
      setSelectedFiles(new Set());
      setSelectedFileData(new Map());
    }
  };

  // Files are now filtered server-side, so we can use paginationData.data directly
  const filteredFiles = paginationData.data;

  const selectedOnCurrentPage = filteredFiles.filter((file) => selectedFiles.has(file.id));
  const isAllSelected =
    filteredFiles.length > 0 && selectedOnCurrentPage.length === filteredFiles.length;
  const isIndeterminate =
    selectedOnCurrentPage.length > 0 && selectedOnCurrentPage.length < filteredFiles.length;

  const handleBulkDelete = async () => {
    if (!user?.user?.id || selectedFiles.size === 0) return;

    setBulkLoading(true);
    try {
      // Get all selected files using stored file data
      const allSelectedFiles = Array.from(selectedFiles)
        .map((fileId) => selectedFileData.get(fileId))
        .filter(Boolean);

      if (allSelectedFiles.length === 0) {
        console.warn("No file data available for selected files");
        setBulkLoading(false);
        return;
      }

      const deletePromises = allSelectedFiles.map((file) => {
        return deleteFile(file.file_name, file.id, user.user.id);
      });

      const results = await Promise.all(deletePromises);
      const successCount = results.filter((r) => r).length;

      if (successCount > 0) {
        setSelectedFiles(new Set());
        setSelectedFileData(new Map());
        closeDeleteModal();
        loadUserFiles(paginationData.currentPage, 12, user.user.id, undefined, "upload", undefined);
      }
    } catch (error) {
      console.error("Error deleting files:", error);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleTagsUpdated = (fileId: string, updatedTags: any[]) => {
    // Update the specific file in the pagination data without reloading
    setPaginationData({
      ...paginationData,
      data: paginationData.data.map((file) =>
        file.id === fileId ? { ...file, user_file_tags: updatedTags } : file
      ),
    });
  };

  return (
    <Mounted size="xl" pt="md">
      <Grid gutter="xl">
        <Grid.Col span={{ base: 12, md: 4 }}>
          {!isMobile && (
            <Stack gap="xl">
              <FileUpload onUploadComplete={handleFileUpdate} />
              <FileFilters showTagManager />
            </Stack>
          )}
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 8 }}>
          {/* Files Grid */}
          <ScrollArea>
            <Stack gap="md">
              {/* Selection Controls */}
              {paginationData.data.length > 0 && (
                <Group justify="space-between" align="center">
                  <Group gap="sm">
                    <Checkbox
                      checked={isAllSelected}
                      indeterminate={isIndeterminate}
                      onChange={(event) => handleSelectAll(event.currentTarget.checked)}
                      label={`${selectedFiles.size} selected`}
                    />
                    {selectedFiles.size > 0 && (
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
                      {filteredFiles.length} of {paginationData.total} file
                      {paginationData.total !== 1 ? "s" : ""}
                      {paginationData.totalPages > 1 &&
                        ` (Page ${paginationData.currentPage} of ${paginationData.totalPages})`}
                    </Text>
                    {(selectedTags.length > 0 || fileTypeFilter !== "all") && (
                      <Text size="xs" c="blue">
                        (Filtered by{" "}
                        {selectedTags.length > 0 &&
                          `${selectedTags.length} tag${selectedTags.length !== 1 ? "s" : ""}`}
                        {selectedTags.length > 0 && fileTypeFilter !== "all" && ", "}
                        {fileTypeFilter !== "all" && fileTypeFilter})
                      </Text>
                    )}
                  </Group>
                </Group>
              )}

              {/* Files Grid */}
              {gridLoading ? (
                <PageLoader />
              ) : filteredFiles.length > 0 ? (
                <SimpleGrid cols={{ base: 2, sm: 3, md: 3, lg: 4 }} spacing="md">
                  {filteredFiles.map((file) => (
                    <MemberFilesCard
                      key={file.id}
                      file={file}
                      onFileUpdate={handleFileUpdate}
                      onTagsUpdated={handleTagsUpdated}
                      selected={selectedFiles.has(file.id)}
                      onSelect={(selected) => handleFileSelect(file.id, selected, file)}
                    />
                  ))}
                </SimpleGrid>
              ) : (
                <Stack align="center" gap="md" py="xl">
                  <Text size="lg" c="dimmed">
                    No files found
                  </Text>
                  <Text size="sm" c="dimmed">
                    {selectedTags.length > 0 || fileTypeFilter !== "all"
                      ? "No files found matching your filters. Try adjusting your filters."
                      : "Upload your first file to get started"}
                  </Text>
                </Stack>
              )}

              {/* Pagination */}
              {!isMobile && paginationData.totalPages > 1 && (
                <Group justify="center" mt="md">
                  <Pagination
                    total={paginationData.totalPages}
                    value={paginationData.currentPage}
                    onChange={handleFilesPageChange}
                    size="sm"
                    withEdges
                  />
                </Group>
              )}
            </Stack>
          </ScrollArea>
        </Grid.Col>
      </Grid>

      {/* Bulk Delete Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title="Delete Selected Files"
        centered
      >
        <Stack gap="md">
          <Text>
            Are you sure you want to delete {selectedFiles.size} file
            {selectedFiles.size !== 1 ? "s" : ""}? This action cannot be undone.
          </Text>
          <Group justify="flex-end" gap="sm">
            <Button variant="light" onClick={closeDeleteModal} disabled={bulkLoading}>
              Cancel
            </Button>
            <Button color="red" onClick={handleBulkDelete} loading={bulkLoading}>
              Delete Files
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Mounted>
  );
}
