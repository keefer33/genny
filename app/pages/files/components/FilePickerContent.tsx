import {
  Box,
  Button,
  Group,
  Text,
  Stack,
  Pagination,
  ActionIcon,
  Badge,
  Loader,
  Alert,
  Divider,
  Collapse,
} from "@mantine/core";
import { RiArrowDownLine, RiArrowUpLine } from "@remixicon/react";
import { useState, useEffect } from "react";
import { useDisclosure } from "@mantine/hooks";
import useAppStore from "~/lib/stores/appStore";
import useFilesFoldersStore, { type FileData } from "~/lib/stores/filesFoldersStore";
import { FileFilters } from "./FileFilters";
import { FileGrid } from "./FileGrid";
import FileUpload from "./FileUpload";

interface FilePickerContentProps {
  onFileSelect?: (file: FileData) => void;
  allowedTypes?: "images" | "videos" | "all";
  showUpload?: boolean;
  onUploadComplete?: () => void;
}

export function FilePickerContent({
  onFileSelect,
  allowedTypes = "all",
  showUpload = true,
  onUploadComplete,
}: FilePickerContentProps) {
  const { getUser } = useAppStore();
  const {
    paginationData,
    loading,
    loadUserFiles,
    selectedTags,
    selectedUploadType,
    fileTypeFilter,
    setSelectedTags,
    setSelectedUploadType,
  } = useFilesFoldersStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersOpened, { toggle: toggleFilters }] = useDisclosure(false);

  const user = getUser();
  const userId = user?.user?.id;

  // Reset filters when component mounts if allowedTypes is locked
  const isFileTypeLocked = allowedTypes === "images" || allowedTypes === "videos";

  useEffect(() => {
    if (isFileTypeLocked) {
      // Set file type filter to match allowedTypes
      useFilesFoldersStore.getState().setFileTypeFilter(allowedTypes);
    }
  }, [allowedTypes, isFileTypeLocked]);

  // Load files when filters change
  useEffect(() => {
    if (userId) {
      loadUserFiles(
        currentPage,
        12,
        userId,
        selectedTags,
        selectedUploadType || null,
        fileTypeFilter || null
      );
    }
  }, [userId, currentPage, selectedTags, selectedUploadType, fileTypeFilter, loadUserFiles]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTags, selectedUploadType, fileTypeFilter]);

  // Files are filtered server-side
  const filteredFiles = paginationData.data;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleClearAll = () => {
    setSelectedTags([]);
    setSelectedUploadType(null);
    if (!isFileTypeLocked) {
      useFilesFoldersStore.getState().setFileTypeFilter("all");
    }
  };

  const hasActiveFilters =
    selectedTags.length > 0 ||
    selectedUploadType ||
    (!isFileTypeLocked && fileTypeFilter !== "all");

  return (
    <Stack gap="md">
      {/* Upload Section */}
      {showUpload && (
        <>
          <Box>
            <Group justify="space-between" align="center" mb="sm">
              <Text size="sm" fw={500}>
                Upload New File
              </Text>
            </Group>
            <FileUpload onUploadComplete={onUploadComplete} allowedTypes={allowedTypes} />
            <Text size="xs" c="dimmed" mt="xs">
              {allowedTypes === "images"
                ? "Upload images to add them to your collection"
                : allowedTypes === "videos"
                  ? "Upload videos to add them to your collection"
                  : "Upload images or videos to add them to your collection"}
            </Text>
          </Box>
          <Divider />
        </>
      )}

      {/* Filters Toggle */}
      <Group justify="space-between" align="center">
        <Group gap="xs">
          <ActionIcon variant="light" onClick={toggleFilters}>
            {filtersOpened ? <RiArrowUpLine size={16} /> : <RiArrowDownLine size={16} />}
          </ActionIcon>
          <Group gap="xs" align="center">
            <Text size="sm" fw={500}>
              Filters
            </Text>
            {hasActiveFilters && (
              <Badge size="sm" variant="filled" color="blue">
                {selectedTags.length +
                  (selectedUploadType ? 1 : 0) +
                  (!isFileTypeLocked && fileTypeFilter !== "all" ? 1 : 0)}
              </Badge>
            )}
          </Group>
        </Group>
        {hasActiveFilters && (
          <Button variant="light" size="xs" color="red" onClick={handleClearAll}>
            Clear all
          </Button>
        )}
      </Group>

      <Collapse in={filtersOpened}>
        <FileFilters
          showFileTypeFilter={true}
          lockFileType={isFileTypeLocked ? allowedTypes : null}
        />
      </Collapse>

      {/* Files Grid */}
      {loading ? (
        <Box ta="center" py="xl">
          <Loader size="lg" />
          <Text mt="md">Loading files...</Text>
        </Box>
      ) : filteredFiles.length === 0 ? (
        <Alert title="No files found" color="yellow">
          {hasActiveFilters
            ? "No files found matching your filters."
            : "You haven't uploaded any files yet."}
        </Alert>
      ) : (
        <>
          <FileGrid files={filteredFiles} onFileClick={onFileSelect} />

          {/* Pagination */}
          {paginationData.totalPages > 1 && (
            <Group justify="center" mt="md">
              <Pagination
                total={paginationData.totalPages}
                value={currentPage}
                onChange={handlePageChange}
                size="sm"
                withEdges
              />
            </Group>
          )}

          {/* Footer */}
          <Group justify="space-between" mt="md">
            <Text size="sm" c="dimmed">
              {paginationData.data.length} of {paginationData.total} files
            </Text>
          </Group>
        </>
      )}
    </Stack>
  );
}
