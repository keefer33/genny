import { Badge, Button, Group, Stack, Text } from "@mantine/core";
import { RiImageLine, RiVideoLine } from "@remixicon/react";
import useFilesFoldersStore from "~/lib/stores/filesFoldersStore";
import useTagStore from "~/lib/stores/tagStore";
import TagManagerModal from "~/shared/TagManagerModal";

interface FileFiltersProps {
  showTagManager?: boolean;
  onTagFilterChange?: (tags: string[]) => void;
  showFileTypeFilter?: boolean; // Option to show/hide file type filter
  lockFileType?: "images" | "videos" | null; // Lock file type filter to specific type
  /** When set, file type + tags use these values instead of filesFoldersStore (e.g. playground run history). */
  controlled?: {
    fileType: "all" | "images" | "videos";
    onFileTypeChange: (v: "all" | "images" | "videos") => void;
    selectedTags: string[];
    onSelectedTagsChange: (ids: string[]) => void;
  };
}

export function FileFilters({
  showTagManager = false,
  onTagFilterChange,
  showFileTypeFilter = true,
  lockFileType = null,
  controlled,
}: FileFiltersProps) {
  const store = useFilesFoldersStore();
  const fileTypeFilter = controlled?.fileType ?? store.fileTypeFilter;
  const setFileTypeFilter = controlled?.onFileTypeChange ?? store.setFileTypeFilter;
  const selectedTags = controlled?.selectedTags ?? store.selectedTags;
  const setSelectedTags = controlled?.onSelectedTagsChange ?? store.setSelectedTags;
  const { selectedUploadType, setSelectedUploadType } = store;
  const { tags } = useTagStore();

  const isFileTypeLocked = lockFileType !== null;

  const handleTagFilterChange = (value: string[]) => {
    setSelectedTags(value);
    if (onTagFilterChange) {
      onTagFilterChange(value);
    }
  };

  return (
    <Stack gap="xl">
      {/* File Type Filter: hidden when schema locks to images or videos so user cannot change it */}
      {showFileTypeFilter && !isFileTypeLocked && (
        <Stack gap="sm">
          <Group justify="space-between" align="center">
            <Text size="sm" fw={500}>
              File type
              {fileTypeFilter !== "all" && (
                <Text component="span" size="xs" c="blue" ml="xs">
                  ({fileTypeFilter})
                </Text>
              )}
            </Text>
            {fileTypeFilter !== "all" && (
              <Button
                variant="light"
                size="xs"
                color="red"
                onClick={() => setFileTypeFilter("all")}
              >
                Clear filter
              </Button>
            )}
          </Group>
          <Group gap="xs">
            {(["images", "videos", "all"] as const).map((type) => {
              const isSelected = fileTypeFilter === type;
              return (
                <Badge
                  key={type}
                  variant={isSelected ? "filled" : "light"}
                  color={isSelected ? "blue" : "gray"}
                  style={{
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    userSelect: "none",
                    opacity: isSelected ? 1 : 0.7,
                    textTransform: "capitalize",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.opacity = "1";
                      e.currentTarget.style.transform = "scale(1.05)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.opacity = "0.7";
                      e.currentTarget.style.transform = "scale(1)";
                    }
                  }}
                  onClick={() => setFileTypeFilter(type)}
                >
                  {type === "images" ? (
                    <Group gap={4}>
                      <RiImageLine size={14} />
                      <span>Images</span>
                    </Group>
                  ) : type === "videos" ? (
                    <Group gap={4}>
                      <RiVideoLine size={14} />
                      <span>Videos</span>
                    </Group>
                  ) : (
                    "All"
                  )}
                </Badge>
              );
            })}
          </Group>
        </Stack>
      )}

      {/* Tags Filter */}
      {tags.length > 0 && (
        <Stack gap="sm">
          <Group justify="space-between" align="center">
            <Text size="sm" fw={500}>
              Filter by tags
              {selectedTags.length > 0 && (
                <Text component="span" size="xs" c="blue" ml="xs">
                  ({selectedTags.length} selected)
                </Text>
              )}
            </Text>
            {selectedTags.length > 0 && (
              <Button variant="light" size="xs" color="red" onClick={() => setSelectedTags([])}>
                Clear all
              </Button>
            )}
          </Group>
          <Group gap="xs">
            {tags.map((tag) => {
              const isSelected = selectedTags.includes(tag.id);
              return (
                <Badge
                  key={tag.id}
                  variant={isSelected ? "filled" : "light"}
                  color={isSelected ? "blue" : "gray"}
                  style={{
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    userSelect: "none",
                    opacity: isSelected ? 1 : 0.7,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.opacity = "1";
                      e.currentTarget.style.transform = "scale(1.05)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.opacity = "0.7";
                      e.currentTarget.style.transform = "scale(1)";
                    }
                  }}
                  onClick={() => {
                    if (isSelected) {
                      handleTagFilterChange(selectedTags.filter((id) => id !== tag.id));
                    } else {
                      handleTagFilterChange([...selectedTags, tag.id]);
                    }
                  }}
                >
                  {tag.tag_name}
                </Badge>
              );
            })}
          </Group>
          {showTagManager && (
            <Group justify="flex-end" pt="md">
              <TagManagerModal />
            </Group>
          )}
        </Stack>
      )}
    </Stack>
  );
}
