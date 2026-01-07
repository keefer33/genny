import {
  Modal,
  TextInput,
  Button,
  Stack,
  Group,
  Text,
  ActionIcon,
  Box,
  Loader,
  Flex,
  ScrollArea,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { useMantineTheme } from "@mantine/core";
import { RiAddLine, RiDeleteBinLine, RiEditLine, RiCheckLine, RiCloseLine } from "@remixicon/react";
import { useEffect, useState } from "react";
import useTagStore from "~/lib/stores/tagStore";
import useAppStore from "~/lib/stores/appStore";
import { useTheme } from "~/lib/hooks/useTheme";

interface TagManagerModalProps {
  buttonText?: string;
  buttonVariant?: string;
  buttonSize?: string;
}

export default function TagManagerModal({
  buttonText = "Manage Tags",
  buttonVariant = "light",
  buttonSize = "sm",
}: TagManagerModalProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [creatingTag, setCreatingTag] = useState(false);
  const [deletingTag, setDeletingTag] = useState<string | null>(null);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editingTagName, setEditingTagName] = useState("");
  const [savingTag, setSavingTag] = useState<string | null>(null);
  const { getUser } = useAppStore();
  const { colorScheme, themeColor } = useTheme();
  const theme = useMantineTheme();
  const { tags, loading: tagsLoading, loadTags, createTag, updateTag, deleteTag } = useTagStore();

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

  const handleCreateTag = async (values: { tagName: string }) => {
    if (!userId) return;

    setCreatingTag(true);
    try {
      const newTag = await createTag(userId, values.tagName);
      if (newTag) {
        form.reset();
      }
    } finally {
      setCreatingTag(false);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    setDeletingTag(tagId);
    try {
      await deleteTag(tagId);
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
      await updateTag(tagId, editingTagName.trim());
      setEditingTag(null);
      setEditingTagName("");
    } finally {
      setSavingTag(null);
    }
  };

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

      <Modal opened={opened} onClose={close} title="Manage Tags" size="md" centered>
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

          {/* Available tags */}
          <Box>
            <Text size="sm" fw={500} mb="xs">
              Your Tags
            </Text>
            {tagsLoading ? (
              <Group justify="center" py="md">
                <Loader size="sm" />
                <Text size="sm" c="dimmed">
                  Loading tags...
                </Text>
              </Group>
            ) : tags.length === 0 ? (
              <Text size="sm" c="dimmed" ta="center" py="md">
                No tags yet. Create your first tag above!
              </Text>
            ) : (
              <ScrollArea style={{ height: 300 }}>
                <Stack gap="xs">
                  {tags.map((tag) => (
                    <Flex
                      key={tag.id}
                      justify="space-between"
                      align="center"
                      p="xs"
                      style={{
                        backgroundColor:
                          colorScheme === "dark" ? theme.colors.dark[8] : theme.colors.gray[0],
                        borderRadius: theme.radius.sm,
                        border:
                          colorScheme === "dark"
                            ? `1px solid ${theme.colors.dark[6]}`
                            : `1px solid ${theme.colors.gray[3]}`,
                        transition: "all 0.2s ease",
                      }}
                    >
                      <Group gap="xs" style={{ flex: 1 }}>
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
                          <Text size="sm" fw={400} style={{ flex: 1 }}>
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
                  ))}
                </Stack>
              </ScrollArea>
            )}
          </Box>
        </Stack>
      </Modal>
    </>
  );
}
