import { Modal, Badge, Stack, Group, Text, Loader, Button, Divider } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useEffect, useState } from "react";
import useTagStore from "~/lib/stores/tagStore";
import useAppStore from "~/lib/stores/appStore";
import { useTheme } from "~/lib/hooks/useTheme";
import TagManagerModal from "../../../shared/TagManagerModal";

interface FileTagModalProps {
  fileId: string;
  fileTags: Array<{
    file_id: string;
    tag_id: string;
    created_at: string;
    user_tags: {
      id: string;
      created_at: string;
      user_id: string;
      tag_name: string;
    };
  }>;
  onTagsUpdated: (
    updatedFileTags: Array<{
      file_id: string;
      tag_id: string;
      created_at: string;
      user_tags: {
        id: string;
        created_at: string;
        user_id: string;
        tag_name: string;
      };
    }>
  ) => void;
}

export default function FileTagModal({ fileId, fileTags, onTagsUpdated }: FileTagModalProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [togglingTag, setTogglingTag] = useState<string | null>(null);
  const [currentFileTags, setCurrentFileTags] = useState(fileTags);
  const { getUser } = useAppStore();
  const { themeColor } = useTheme();
  const { tags, loading: tagsLoading, loadTags, addTagToFile, removeTagFromFile } = useTagStore();

  const user = getUser();
  const userId = user?.user?.id;

  // Load tags when modal opens
  useEffect(() => {
    if (opened && userId) {
      loadTags(userId);
      setCurrentFileTags(fileTags);
    }
  }, [opened, userId]);

  const handleToggleTag = async (tagId: string) => {
    const isCurrentlyTagged = currentFileTags.some((ft) => ft.tag_id === tagId);

    setTogglingTag(tagId);
    try {
      if (isCurrentlyTagged) {
        await removeTagFromFile(fileId, tagId);
        setCurrentFileTags((prev) => prev.filter((ft) => ft.tag_id !== tagId));
      } else {
        await addTagToFile(fileId, tagId);
        const tagToAdd = tags.find((tag) => tag.id === tagId);
        if (tagToAdd) {
          setCurrentFileTags((prev) => [
            ...prev,
            {
              file_id: fileId,
              tag_id: tagId,
              created_at: new Date().toISOString(),
              user_tags: tagToAdd,
            },
          ]);
        }
      }
    } finally {
      setTogglingTag(null);
    }
  };

  const handleClose = () => {
    close();
    onTagsUpdated(currentFileTags);
  };

  const currentTagIds = currentFileTags.map((ft) => ft.tag_id);

  return (
    <>
      <Badge
        component="button"
        onClick={open}
        color={themeColor}
        variant={currentFileTags.length > 0 ? "filled" : "default"}
        size="sm"
      >
        {currentFileTags.length > 0 ? `${currentFileTags.length} tags` : "Add tags"}
      </Badge>

      <Modal opened={opened} onClose={handleClose} title="Edit File Tags" size="md" centered>
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Click on a tag to add or remove it from this file
          </Text>

          {tagsLoading ? (
            <Group justify="center" py="md">
              <Loader size="sm" />
              <Text size="sm" c="dimmed">
                Loading tags...
              </Text>
            </Group>
          ) : tags.length === 0 ? (
            <Text size="sm" c="dimmed" ta="center">
              No tags available. Create tags to get started.
            </Text>
          ) : (
            <Group pb="xl">
              {tags.map((tag) => {
                const isTagged = currentTagIds.includes(tag.id);
                return (
                  <Badge
                    key={tag.id}
                    variant={isTagged ? "filled" : "default"}
                    size="lg"
                    style={{
                      cursor: "pointer",
                      opacity: togglingTag === tag.id ? 0.6 : 1,
                      transition: "all 0.2s ease",
                    }}
                    onClick={() => handleToggleTag(tag.id)}
                  >
                    {tag.tag_name}
                  </Badge>
                );
              })}
            </Group>
          )}
          <Divider />
          <Group justify="space-between">
            <TagManagerModal />
            <Button variant="light" size="xs" onClick={() => handleClose()}>
              Close
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
