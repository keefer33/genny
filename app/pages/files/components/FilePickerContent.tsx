import { Box, Group, Text, Stack, Loader, Alert, Divider } from "@mantine/core";
import { useState, useEffect } from "react";
import useAppStore from "~/lib/stores/appStore";
import useFilesFoldersStore, { type FileData } from "~/lib/stores/filesFoldersStore";
import { AppPagination } from "~/shared/AppPagination";
import { FileGrid } from "./FileGrid";
import FileUpload from "./FileUpload";

interface FilePickerContentProps {
  onFileSelect?: (file: FileData) => void;
  allowedTypes?: "images" | "videos" | "audio" | "all";
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
  const { paginationData, loading, loadUserFiles } = useFilesFoldersStore();
  const [currentPage, setCurrentPage] = useState(1);

  const user = getUser();
  const userId = user?.user?.id;

  // Use allowedTypes for picker results only; do not read or set global store filters (so generation results are unaffected)
  const effectiveFileType = allowedTypes === "all" ? null : allowedTypes;

  useEffect(() => {
    if (userId) {
      loadUserFiles(currentPage, userId, [], null, effectiveFileType);
    }
  }, [userId, currentPage, effectiveFileType, loadUserFiles]);

  useEffect(() => {
    setCurrentPage(1);
  }, [effectiveFileType]);

  const filteredFiles = paginationData.data;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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
                  : allowedTypes === "audio"
                    ? "Upload audio files to add them to your collection"
                    : "Upload images, video, or audio to add them to your collection"}
            </Text>
          </Box>
          <Divider />
        </>
      )}

      {/* Files Grid */}
      {loading ? (
        <Box ta="center" py="xl">
          <Loader size="lg" />
          <Text mt="md">Loading files...</Text>
        </Box>
      ) : filteredFiles.length === 0 ? (
        <Alert title="No files found" color="yellow">
          You haven&apos;t uploaded any files yet.
        </Alert>
      ) : (
        <>
          <FileGrid files={filteredFiles} onFileClick={onFileSelect} />

          {/* Pagination */}
          {paginationData.totalPages > 1 && (
            <Group justify="center" mt="md">
              <AppPagination
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
