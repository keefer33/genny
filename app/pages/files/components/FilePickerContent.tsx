import {
  Box,
  Button,
  Flex,
  Group,
  Text,
  Stack,
  Loader,
  Alert,
  Divider,
  TextInput,
} from "@mantine/core";
import { useState, useEffect } from "react";
import useAppStore from "~/lib/stores/appStore";
import useFilesFoldersStore, {
  type FileData,
  type FileTypeFilter,
} from "~/lib/stores/filesFoldersStore";
import { AppPagination } from "~/shared/AppPagination";
import { FileGrid } from "./FileGrid";
import FileUpload from "./FileUpload";

interface FilePickerContentProps {
  onFileSelect?: (file: FileData) => void;
  allowedTypes?: FileTypeFilter;
  showUpload?: boolean;
  onUploadComplete?: () => void;
  /** Shown beside upload (desktop) / below (mobile); submit calls this with trimmed URL. */
  onPasteUrl?: (url: string) => void;
}

function uploadDescription(allowedTypes: FileTypeFilter): string {
  const labels = [
    allowedTypes.includes("images") ? "images" : null,
    allowedTypes.includes("videos") ? "videos" : null,
    allowedTypes.includes("audio") ? "audio files" : null,
  ].filter((label): label is string => Boolean(label));
  if (labels.length === 0) return "Upload images, video, or audio to add them to your collection";
  if (labels.length === 1) return `Upload ${labels[0]} to add them to your collection`;
  return `Upload ${labels.slice(0, -1).join(", ")} or ${labels.at(-1)} to add them to your collection`;
}

export function FilePickerContent({
  onFileSelect,
  allowedTypes = "all",
  showUpload = true,
  onUploadComplete,
  onPasteUrl,
}: FilePickerContentProps) {
  const { getUser } = useAppStore();
  const { paginationData, gridLoading, loadUserFiles } = useFilesFoldersStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingUrl, setPendingUrl] = useState("");

  const flushUrl = () => {
    const t = pendingUrl.trim();
    if (!t || !onPasteUrl) return;
    onPasteUrl(t);
    setPendingUrl("");
  };

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
          {onPasteUrl ? (
            <Flex direction={{ base: "column", sm: "row" }} gap="md" align="stretch" wrap="nowrap">
              <Box style={{ flex: 1, minWidth: 0 }}>
                <FileUpload onUploadComplete={onUploadComplete} allowedTypes={allowedTypes} />
              </Box>
              <Box style={{ flex: 1, minWidth: 0 }}>
                <Group align="flex-end" gap="xs" wrap="nowrap">
                  <TextInput
                    style={{ flex: 1 }}
                    size="sm"
                    placeholder="Paste a media URL, then Enter"
                    aria-label="Media URL"
                    value={pendingUrl}
                    onChange={(e) => setPendingUrl(e.currentTarget.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        flushUrl();
                      }
                    }}
                  />
                  <Button size="xs" variant="light" type="button" onClick={flushUrl}>
                    Add URL
                  </Button>
                </Group>
              </Box>
            </Flex>
          ) : (
            <Box>
              <Group justify="space-between" align="center" mb="sm">
                <Text size="sm" fw={500}>
                  Upload New File
                </Text>
              </Group>
              <FileUpload onUploadComplete={onUploadComplete} allowedTypes={allowedTypes} />
              <Text size="xs" c="dimmed" mt="xs">
                {uploadDescription(allowedTypes)}
              </Text>
            </Box>
          )}
          <Divider />
        </>
      )}

      {/* Files Grid */}
      {gridLoading ? (
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
