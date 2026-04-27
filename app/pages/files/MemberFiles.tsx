import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Checkbox,
  Group,
  Modal,
  Paper,
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
import FileUpload from "./components/FileUpload";
import useAppStore from "~/lib/stores/appStore";
import PageLoader from "~/shared/PageLoader";
import { FileFilters } from "~/pages/files/components/FileFilters";
import { AppPagination } from "~/shared/AppPagination";
import DesktopSplitLayout from "~/shared/DesktopSplitLayout";
import MobileScrollBox from "~/shared/MobileScrollBox";
import { RiDeleteBinLine, RiFilter3Line } from "@remixicon/react";
import FileDetailModal from "~/shared/FileDetailModal";

export default function MemberFiles() {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [selectedFileData, setSelectedFileData] = useState<Map<string, any>>(new Map());
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] =
    useDisclosure(false);
  const [filtersModalOpened, { open: openFiltersModal, close: closeFiltersModal }] =
    useDisclosure(false);
  const [opened, { open, close }] = useDisclosure(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [currentFile, setCurrentFile] = useState<any | null>(null);

  const { user, isMobile } = useAppStore();
  const {
    paginationData,
    gridLoading,
    selectedTags,
    fileTypeFilter,
    setPaginationData,
    loadUserFiles,
    deleteFile,
    handleFilesPageChange,
  } = useFilesFoldersStore();
  const { loadTags } = useTagStore();

  useEffect(() => {
    if (user?.user?.id) {
      // Files page only shows uploaded files (upload_type = "upload")
      loadUserFiles(paginationData.currentPage, user.user.id, undefined, undefined, undefined);
      loadTags(user.user.id);
    }
  }, [fileTypeFilter, selectedTags, user?.user?.id]);

  // Refresh file list showing only uploads (not generations). Used after upload/delete/update.
  const handleFileUpdate = async () => {
    if (user?.user?.id) {
      await loadUserFiles(
        paginationData.currentPage,
        user.user.id,
        undefined,
        undefined,
        undefined
      );
    }
  };

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
        loadUserFiles(paginationData.currentPage, user.user.id, undefined, undefined, undefined);
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

  const sidebar = (
    <Stack gap="xl">
      <FileUpload onUploadComplete={handleFileUpdate} />
      {!isMobile && <FileFilters showTagManager />}
    </Stack>
  );

  const sidebarMobile = (
    <Group gap="xs" justify="space-between" grow>
      <FileUpload onUploadComplete={handleFileUpdate} />
      <Button
        variant="light"
        size="sm"
        onClick={openFiltersModal}
        leftSection={<RiFilter3Line />}
        rightSection={
          <Badge size="sm">
            {[selectedTags.length > 0, fileTypeFilter !== "all"].filter(Boolean).length}
          </Badge>
        }
      >
        Filters
      </Button>
    </Group>
  );

  const fileActions = (
    <>
      {/* Selection Controls */}
      {paginationData.data.length > 0 && (
        <Group justify="space-between" align="center">
          <Group gap="sm">
            <Checkbox
              size="md"
              checked={isAllSelected}
              indeterminate={isIndeterminate}
              onChange={(event) => handleSelectAll(event.currentTarget.checked)}
              label={`${selectedFiles.size} Selected`}
            />
            {selectedFiles.size > 0 && (
              <ActionIcon
                color="red"
                size="sm"
                onClick={openDeleteModal}
                loading={bulkLoading}
                aria-label="Delete selected files"
              >
                <RiDeleteBinLine size={16} />
              </ActionIcon>
            )}
          </Group>

          <Group gap="xs">
            <Text size="sm" c="dimmed">
              {filteredFiles.length}/{paginationData.total} file
              {paginationData.total !== 1 ? "s" : ""}
              {paginationData.totalPages > 1 &&
                ` (Page ${paginationData.currentPage}/${paginationData.totalPages})`}
            </Text>
          </Group>
        </Group>
      )}
    </>
  );

  const filesContent = (
    <ScrollArea style={{ flex: 1, minHeight: 0 }}>
      <Stack gap="md" p={isMobile ? 0 : "xs"}>
        {/* Files Grid */}
        {gridLoading ? (
          <PageLoader />
        ) : filteredFiles.length > 0 ? (
          <SimpleGrid cols={{ base: 2, sm: 3, md: 3, lg: 4 }} spacing="md">
            {filteredFiles.map((file) => (
              <Box
                key={file.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentFile(file);
                  open();
                }}
              >
                <MemberFilesCard
                  file={file}
                  onFileUpdate={handleFileUpdate}
                  selected={selectedFiles.has(file.id)}
                  onSelect={(selected) => handleFileSelect(file.id, selected, file)}
                  onOpen={() => {
                    setCurrentFile(file);
                    open();
                  }}
                />
              </Box>
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
      </Stack>
    </ScrollArea>
  );
  const pagination = (
    <>
      {paginationData.totalPages > 1 && (
        <Group justify="center" mt="md">
          <AppPagination
            total={paginationData.totalPages}
            value={paginationData.currentPage}
            onChange={handleFilesPageChange}
            size="md"
            withEdges
          />
        </Group>
      )}
    </>
  );
  return (
    <>
      {isMobile ? (
        <MobileScrollBox>
          <Stack gap="md" pb="sm">
            {sidebarMobile}
            {fileActions}
          </Stack>
          {filesContent}
          {pagination}
        </MobileScrollBox>
      ) : (
        <DesktopSplitLayout>
          <Paper
            w={380}
            p="sm"
            style={{
              flex: "0 0 auto",
              alignSelf: "stretch",
              minHeight: 0,
              maxHeight: "100%",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {sidebar}
          </Paper>
          <Box
            style={{
              flex: 1,
              minHeight: 0,
              overflow: "hidden",
              display: "flex",
            }}
          >
            <Stack gap="xs" px="xs" pt="xs" style={{ flex: 1, minHeight: 0 }}>
              {fileActions}
              {filesContent}
              {pagination}
            </Stack>
          </Box>
        </DesktopSplitLayout>
      )}

      <FileDetailModal
        opened={opened}
        onClose={close}
        file={currentFile}
        onTagsUpdated={(fileId, updatedTags) => handleTagsUpdated(fileId, updatedTags)}
        //modelName={modelNameProp ?? currentFile?.model_name ?? undefined}
      />

      <Modal
        opened={filtersModalOpened}
        onClose={closeFiltersModal}
        title="Filters"
        centered
        size="sm"
      >
        <Stack gap="md">
          <FileFilters showTagManager />
          <Group justify="flex-end">
            <Button onClick={closeFiltersModal}>Done</Button>
          </Group>
        </Stack>
      </Modal>

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
    </>
  );
}
