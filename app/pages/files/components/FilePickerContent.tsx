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
  Select,
} from "@mantine/core";
import { useMemo, useState, useEffect } from "react";
import useAppStore from "~/lib/stores/appStore";
import useCharactersStore from "~/lib/stores/charactersStore";
import { authFetchJson } from "~/lib/stores/authFetch";
import { endpoint } from "~/lib/utils";
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

type PickerCharacter = {
  id: string;
  name: string | null;
};

export function FilePickerContent({
  onFileSelect,
  allowedTypes = "all",
  showUpload = true,
  onUploadComplete,
  onPasteUrl,
}: FilePickerContentProps) {
  const { getUser } = useAppStore();
  const selectedCharacter = useCharactersStore((s) => s.selectedCharacter);
  const { paginationData, gridLoading, loadUserFiles } = useFilesFoldersStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(
    () => selectedCharacter?.id?.trim() || null
  );
  const [characters, setCharacters] = useState<PickerCharacter[]>([]);
  const [charactersLoading, setCharactersLoading] = useState(false);
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
    const id = selectedCharacter?.id?.trim();
    if (id) {
      setSelectedCharacterId(id);
    } else {
      setSelectedCharacterId(null);
    }
  }, [selectedCharacter?.id]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setCharactersLoading(true);
    void authFetchJson<{ characters: PickerCharacter[] }>(
      `${endpoint}/characters?minimal=1`,
      undefined,
      { errorMessage: "Failed to load characters" }
    )
      .then((json) => {
        if (!cancelled) setCharacters(json.characters ?? []);
      })
      .catch(() => {
        if (!cancelled) setCharacters([]);
      })
      .finally(() => {
        if (!cancelled) setCharactersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadUserFiles(currentPage, userId, [], null, effectiveFileType, false, selectedCharacterId);
    }
  }, [userId, currentPage, effectiveFileType, selectedCharacterId, loadUserFiles]);

  useEffect(() => {
    setCurrentPage(1);
  }, [effectiveFileType, selectedCharacterId]);

  const characterSelectData = useMemo(
    () =>
      characters.map((c) => ({
        value: c.id,
        label: c.name?.trim() || "Unnamed character",
      })),
    [characters]
  );

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
              <Box style={{ flex: 1, minWidth: 0 }}>
                <Text size="sm" fw={500} mb="sm">
                  Add from URL
                </Text>
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
                <Text size="xs" c="dimmed" mt="xs">
                  Use a direct link to an image, video, or audio file.
                </Text>
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

      <Select
        label="Character"
        description="Filter files linked to a character"
        placeholder="All files"
        clearable
        searchable
        data={characterSelectData}
        value={selectedCharacterId}
        onChange={(value) => setSelectedCharacterId(typeof value === "string" ? value : null)}
        disabled={charactersLoading && characterSelectData.length === 0}
        comboboxProps={{ withinPortal: true }}
      />

      {/* Files Grid */}
      {gridLoading ? (
        <Box ta="center" py="xl">
          <Loader size="lg" />
          <Text mt="md">Loading files...</Text>
        </Box>
      ) : filteredFiles.length === 0 ? (
        <Alert title="No files found" color="yellow">
          {selectedCharacterId
            ? "No files found for this character."
            : "You haven't uploaded any files yet."}
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
