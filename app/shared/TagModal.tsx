import {
  Modal,
  TextInput,
  Button,
  Stack,
  Group,
  Text,
  Badge,
  ActionIcon,
  Box,
  Loader,
  Alert,
  Divider,
  ScrollArea,
  Checkbox,
  Flex,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { useMantineTheme } from "@mantine/core";
import { RiAddLine, RiCloseLine, RiDeleteBinLine, RiEditLine, RiCheckLine } from "@remixicon/react";
import { useEffect, useState, useRef } from "react";
import useTagStore from "~/lib/stores/tagStore";
import useAppStore from "~/lib/stores/appStore";
import { useTheme } from "~/lib/hooks/useTheme";

interface TagModalProps {
  fileId?: string;
  fileTags?: Array<{
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
  onTagsUpdated?: (
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
  buttonText?: string;
  buttonVariant?: string;
  buttonSize?: string;
}

export default function TagModal({
  fileId,
  fileTags = [],
  onTagsUpdated,
  buttonText = "Tags",
  buttonVariant = "light",
  buttonSize = "xs",
}: TagModalProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [creatingTag, setCreatingTag] = useState(false);
  const [togglingTag, setTogglingTag] = useState<string | null>(null);
  const [deletingTag, setDeletingTag] = useState<string | null>(null);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editingTagName, setEditingTagName] = useState("");
  const [savingTag, setSavingTag] = useState<string | null>(null);
  const [currentFileTags, setCurrentFileTags] = useState(fileTags);
  const [tagWasDeleted, setTagWasDeleted] = useState(false);
  const [tagWasRenamed, setTagWasRenamed] = useState(false);
  const prevFileTagsRef = useRef(fileTags);
  const { getUser } = useAppStore();
  const { colorScheme, themeColor } = useTheme();
  const theme = useMantineTheme();
  const {
    tags,
    loading: tagsLoading,
    loadTags,
    createTag,
    updateTag,
    deleteTag,
    addTagToFile,
    removeTagFromFile,
  } = useTagStore();

  const user = getUser();
  const userId = user?.user?.id;

  const form = useForm({
    initialValues: {
      tagName: "",
    },
    validate: {
      tagName: (value) => {
        if (!value.trim()) return "Tag name is required";
        if (value.trim().length < 2) return "Tag name must be at least 2 characters";
        if (value.trim().length > 50) return "Tag name must be less than 50 characters";
        if (tags.some((tag) => tag.tag_name.toLowerCase() === value.trim().toLowerCase())) {
          return "Tag already exists";
        }
        return null;
      },
    },
  });

  // Load tags when modal opens
  useEffect(() => {
    if (opened && userId) {
      loadTags(userId);
    }
  }, [opened, userId]);

  // Update current file tags when fileTags prop changes
  useEffect(() => {
    if (JSON.stringify(prevFileTagsRef.current) !== JSON.stringify(fileTags)) {
      prevFileTagsRef.current = fileTags;
      setCurrentFileTags(fileTags);
    }
  }, [fileTags]);

  const handleCreateTag = async (values: { tagName: string }) => {
    if (!userId) return;

    setCreatingTag(true);
    try {
      const newTag = await createTag(userId, values.tagName);
      if (newTag) {
        form.reset();
        // Don't call onTagsUpdated here to keep modal open
      }
    } finally {
      setCreatingTag(false);
    }
  };

  const handleToggleTag = async (tagId: string, isCurrentlyTagged: boolean) => {
    if (!fileId) return; // Only toggle tags if a file is provided

    setTogglingTag(tagId);
    try {
      if (isCurrentlyTagged) {
        await removeTagFromFile(fileId, tagId);
        // Update local state - remove the tag
        setCurrentFileTags((prev) => prev.filter((ft) => ft.tag_id !== tagId));
      } else {
        await addTagToFile(fileId, tagId);
        // Update local state - add the tag
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
      // Don't call onTagsUpdated here to keep modal open
    } finally {
      setTogglingTag(null);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    setDeletingTag(tagId);
    try {
      await deleteTag(tagId);
      // Remove the tag from local state immediately
      setCurrentFileTags((prev) => prev.filter((ft) => ft.tag_id !== tagId));
      // Mark that a tag was deleted so we know to refresh all files
      setTagWasDeleted(true);
      // Don't call onTagsUpdated here to keep modal open
    } finally {
      setDeletingTag(null);
    }
  };

  const handleStartEdit = (tagId: string, currentName: string) => {
    setEditingTag(tagId);
    setEditingTagName(currentName);
  };

  const handleCancelEdit = () => {
    setEditingTag(null);
    setEditingTagName("");
  };

  const handleSaveEdit = async (tagId: string) => {
    if (!editingTagName.trim()) return;

    setSavingTag(tagId);
    try {
      const updatedTag = await updateTag(tagId, editingTagName.trim());
      if (updatedTag) {
        // Update local state for current file tags
        setCurrentFileTags((prev) =>
          prev.map((ft) => (ft.tag_id === tagId ? { ...ft, user_tags: updatedTag } : ft))
        );
        // Mark that a tag was renamed so we know to refresh all files
        setTagWasRenamed(true);
        setEditingTag(null);
        setEditingTagName("");
      }
    } finally {
      setSavingTag(null);
    }
  };

  const currentTagIds = currentFileTags.map((ft) => ft.tag_id);

  return (
    <>
      <Button
        variant={buttonVariant as any}
        size={buttonSize as any}
        leftSection={<RiAddLine size={12} />}
        onClick={open}
      >
        {buttonText}
      </Button>

      <Modal
        opened={opened}
        onClose={() => {
          close();
          if (onTagsUpdated) {
            if (tagWasDeleted || tagWasRenamed) {
              // If a tag was deleted or renamed, trigger a full refresh to update all files
              // We'll pass a special signal to indicate full refresh needed
              onTagsUpdated([]); // Empty array signals full refresh needed
              setTagWasDeleted(false); // Reset the flags
              setTagWasRenamed(false);
            } else {
              // Normal update - just pass the current file tags
              onTagsUpdated(currentFileTags);
            }
          }
        }}
        title={fileId ? "Manage File Tags" : "Manage Tags"}
        size="md"
        centered
      >
        <Stack gap="md">
          {/* Create new tag */}
          <Box>
            <Text size="sm" fw={500} mb="xs">
              Create New Tag
            </Text>
            <form onSubmit={form.onSubmit(handleCreateTag)}>
              <Group gap="xs">
                <TextInput
                  placeholder="Enter tag name"
                  {...form.getInputProps("tagName")}
                  style={{ flex: 1 }}
                  size="sm"
                />
                <Button type="submit" size="sm" loading={creatingTag} disabled={!form.isValid()}>
                  Create
                </Button>
              </Group>
            </form>
          </Box>

          <Divider />

          {/* Current tags for this file */}
          {fileId && currentFileTags.length > 0 && (
            <Box>
              <Text size="sm" fw={500} mb="xs">
                Current Tags
              </Text>
              <Group gap="xs">
                {currentFileTags.map((fileTag) => (
                  <Badge
                    key={fileTag.tag_id}
                    color={themeColor}
                    variant="filled"
                    rightSection={
                      <ActionIcon
                        size="xs"
                        color="white"
                        variant="transparent"
                        onClick={() => handleToggleTag(fileTag.tag_id, true)}
                        loading={togglingTag === fileTag.tag_id}
                      >
                        <RiCloseLine size={10} />
                      </ActionIcon>
                    }
                  >
                    {fileTag.user_tags.tag_name}
                  </Badge>
                ))}
              </Group>
            </Box>
          )}

          {fileId && currentFileTags.length > 0 && <Divider />}

          {/* Available tags */}
          <Box>
            <Text size="sm" fw={500} mb="xs">
              Available Tags
            </Text>
            {tagsLoading ? (
              <Group justify="center" py="md">
                <Loader size="sm" />
                <Text size="sm" c="dimmed">
                  Loading tags...
                </Text>
              </Group>
            ) : tags.length === 0 ? (
              <Alert color="blue" variant="light">
                <Text size="sm">No tags available. Create your first tag above!</Text>
              </Alert>
            ) : (
              <ScrollArea style={{ height: 300 }}>
                <Stack gap="xs">
                  {tags.map((tag) => {
                    const isTagged = currentTagIds.includes(tag.id);
                    return (
                      <Flex
                        key={tag.id}
                        justify="space-between"
                        align="center"
                        p="xs"
                        style={{
                          backgroundColor:
                            colorScheme === "dark" ? theme.colors.dark[8] : theme.colors.gray[0],
                          borderRadius: theme.radius.sm,
                          border: isTagged
                            ? `1px solid ${theme.colors[themeColor][3]}`
                            : colorScheme === "dark"
                              ? `1px solid ${theme.colors.dark[6]}`
                              : `1px solid ${theme.colors.gray[3]}`,
                          transition: "all 0.2s ease",
                        }}
                      >
                        <Group gap="xs" style={{ flex: 1 }}>
                          {fileId && (
                            <Checkbox
                              checked={isTagged}
                              onChange={() => handleToggleTag(tag.id, isTagged)}
                              disabled={togglingTag === tag.id}
                            />
                          )}
                          {editingTag === tag.id ? (
                            <TextInput
                              value={editingTagName}
                              onChange={(e) => setEditingTagName(e.target.value)}
                              size="sm"
                              style={{ flex: 1 }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleSaveEdit(tag.id);
                                } else if (e.key === "Escape") {
                                  handleCancelEdit();
                                }
                              }}
                              autoFocus
                            />
                          ) : (
                            <Text
                              size="sm"
                              fw={isTagged ? 500 : 400}
                              style={{
                                flex: 1,
                                color: isTagged
                                  ? theme.colors[themeColor][7]
                                  : colorScheme === "dark"
                                    ? theme.colors.dark[0]
                                    : theme.colors.dark[7],
                              }}
                            >
                              {tag.tag_name}
                            </Text>
                          )}
                        </Group>
                        <Group gap="xs">
                          {editingTag === tag.id ? (
                            <>
                              <ActionIcon
                                color="green"
                                variant="subtle"
                                size="sm"
                                onClick={() => handleSaveEdit(tag.id)}
                                loading={savingTag === tag.id}
                              >
                                <RiCheckLine size={14} />
                              </ActionIcon>
                              <ActionIcon
                                color="gray"
                                variant="subtle"
                                size="sm"
                                onClick={handleCancelEdit}
                              >
                                <RiCloseLine size={14} />
                              </ActionIcon>
                            </>
                          ) : (
                            <>
                              <ActionIcon
                                color={themeColor}
                                variant="subtle"
                                size="sm"
                                onClick={() => handleStartEdit(tag.id, tag.tag_name)}
                                disabled={editingTag !== null}
                              >
                                <RiEditLine size={14} />
                              </ActionIcon>
                              <ActionIcon
                                color="red"
                                variant="subtle"
                                size="sm"
                                onClick={() => handleDeleteTag(tag.id)}
                                loading={deletingTag === tag.id}
                                disabled={editingTag !== null}
                              >
                                <RiDeleteBinLine size={14} />
                              </ActionIcon>
                            </>
                          )}
                        </Group>
                      </Flex>
                    );
                  })}
                </Stack>
              </ScrollArea>
            )}
          </Box>
        </Stack>
      </Modal>
    </>
  );
}
