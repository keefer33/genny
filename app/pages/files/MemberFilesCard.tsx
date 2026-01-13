import {
  Badge,
  Box,
  Button,
  Card,
  Center,
  Checkbox,
  Group,
  Image,
  Modal,
  Stack,
  TextInput,
  useMantineTheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  RiFileLine,
  RiFilePdf2Fill,
  RiFileTextLine,
  RiImageLine,
  RiPlayLine,
} from "@remixicon/react";
import { useEffect, useState } from "react";
import useFilesFoldersStore from "~/lib/stores/filesFoldersStore";
import { getFileExtension, isTextFile } from "~/lib/utils";
import useAppStore from "~/lib/stores/appStore";
import FileDetailModal from "~/shared/FileDetailModal";

interface UserTag {
  id: string;
  created_at: string;
  user_id: string;
  tag_name: string;
}

interface UserFileTag {
  file_id: string;
  tag_id: string;
  created_at: string;
  user_tags: UserTag;
}

interface FileData {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  created_at: string;
  user_file_tags?: UserFileTag[];
  thumbnail_url?: string;
  generated_info?: {
    payload: {
      prompt: string;
    };
  };
}

interface MemberFilesCardProps {
  file: FileData;
  onFileUpdate?: () => void;
  onTagsUpdated?: (fileId: string, updatedTags: UserFileTag[]) => void;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
}

export default function MemberFilesCard({
  file,
  onFileUpdate,
  onTagsUpdated,
  selected = false,
  onSelect,
}: MemberFilesCardProps) {
  const theme = useMantineTheme();
  const [opened, { open, close }] = useDisclosure(false);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [newFileName, setNewFileName] = useState(file.file_name);
  const [currentFile, setCurrentFile] = useState(file);
  const { user } = useAppStore();
  const { deleteFile, updateFileName } = useFilesFoldersStore();

  const handleTagsUpdated = (updatedTags: UserFileTag[]) => {
    // Check if this is a signal for full refresh (empty array means tag was deleted)
    if (updatedTags.length === 0 && onFileUpdate) {
      // Trigger full refresh to update all files
      onFileUpdate();
      return;
    }

    // Update local file state with new tags
    setCurrentFile((prev) => ({
      ...prev,
      user_file_tags: updatedTags,
    }));

    // Notify parent component if callback is provided
    if (onTagsUpdated) {
      onTagsUpdated(currentFile.id, updatedTags);
    }
  };

  // Update currentFile when file prop changes
  useEffect(() => {
    setCurrentFile(file);
    setNewFileName(file.file_name);
  }, [file]);

  const handleDelete = async () => {
    if (!user?.user?.id) return;

    setDeleting(true);
    try {
      const success = await deleteFile(file.file_name, file.id, user.user.id);
      if (success) {
        // Call the parent's update function to refresh the current page
        if (onFileUpdate) {
          onFileUpdate();
        }
      }
    } catch (error) {
      console.error("Error deleting file:", error);
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = () => {
    window.open(currentFile.file_path, "_blank");
  };

  const handleEdit = () => {
    setNewFileName(currentFile.file_name);
    openEdit();
  };

  const handleSaveEdit = async () => {
    if (!user?.user?.id || newFileName.trim() === "" || newFileName === currentFile.file_name) {
      closeEdit();
      return;
    }

    setEditing(true);
    try {
      const result = await updateFileName(currentFile.id, newFileName.trim(), user.user.id);
      if (result && typeof result === "object" && result.success && result.updatedFile) {
        // Update the local file state with the updated file data
        setCurrentFile((prev) => ({
          ...prev,
          file_name: result.updatedFile.file_name,
          file_path: result.updatedFile.file_path,
        }));
        closeEdit();
        // Call the parent's update function to refresh the current page
        if (onFileUpdate) {
          onFileUpdate();
        }
      }
    } catch (error) {
      console.error("Error updating file name:", error);
    } finally {
      setEditing(false);
    }
  };

  const getFileIcon = (size: number = 24) => {
    if (currentFile.file_type.startsWith("image/")) {
      return <RiImageLine size={size} />;
    }
    if (currentFile.file_type.startsWith("video/")) {
      return <RiPlayLine size={size} />;
    }
    if (currentFile.file_type === "application/pdf") {
      return <RiFilePdf2Fill size={size} />;
    }
    if (currentFile.file_type.startsWith("text/") || isTextFile(currentFile.file_name)) {
      return <RiFileTextLine size={size} />;
    }
    return <RiFileLine size={size} />;
  };

  const getFileTypeBadge = () => {
    const ext = getFileExtension(currentFile.file_name);
    if (currentFile.file_type.startsWith("image/")) {
      return (
        <Badge color="green" size="sm">
          Image
        </Badge>
      );
    }
    if (currentFile.file_type.startsWith("video/")) {
      return (
        <Badge color="orange" size="sm">
          Video
        </Badge>
      );
    }
    if (currentFile.file_type === "application/pdf") {
      return (
        <Badge color="red" variant="light" size="sm">
          PDF
        </Badge>
      );
    }
    if (currentFile.file_type.startsWith("text/") || isTextFile(currentFile.file_name)) {
      return (
        <Badge color="blue" variant="light" size="sm">
          Text
        </Badge>
      );
    }
    return (
      <Badge color="gray" variant="light" size="sm">
        {ext.toUpperCase()}
      </Badge>
    );
  };

  return (
    <>
      <Card
        shadow="lg"
        padding={2}
        radius="0"
        //withBorder
        style={{
          borderColor: selected ? theme.primaryColor : undefined,
          cursor: "pointer",
        }}
        pos="relative"
        data-member-files-card="true"
        onClick={(e) => {
          // Stop propagation to prevent parent handlers (like in GenerationsFileCard) from firing
          e.preventDefault();
          e.stopPropagation();
          open();
        }}
      >
        <Card.Section pos="relative">
          <Box
            onMouseDown={(e) => e.preventDefault()}
            style={{ cursor: "pointer", position: "relative", zIndex: 1 }}
          >
            {(() => {
              const isImage = currentFile.file_type.startsWith("image/");
              const isVideo = currentFile.file_type.startsWith("video/");
              const imageSrc = isImage
                ? currentFile?.thumbnail_url || currentFile.file_path
                : isVideo && currentFile.thumbnail_url
                  ? currentFile.thumbnail_url
                  : null;

              if (imageSrc) {
                return (
                  <Image
                    src={imageSrc}
                    height={200}
                    fit="cover"
                    alt={currentFile?.file_name}
                    onDragStart={(e) => e.preventDefault()}
                    onContextMenu={(e) => e.preventDefault()}
                    style={{ userSelect: "none" }}
                  />
                );
              }

              if (isVideo) {
                return (
                  <video
                    src={currentFile.file_path}
                    height={240}
                    style={{ width: "100%", objectFit: "cover" }}
                    preload="metadata"
                    muted
                    onContextMenu={(e) => e.preventDefault()}
                    onDragStart={(e) => e.preventDefault()}
                  >
                    Your browser does not support the video tag.
                  </video>
                );
              }

              return (
                <Center h={240}>
                  <Box>{getFileIcon(200)}</Box>
                </Center>
              );
            })()}
          </Box>
          {/* Selection Checkbox */}
          <Box
            pos="absolute"
            top={0}
            right={0}
            left={0}
            p="xs"
            style={{ zIndex: 2 }}
            //bg="dark.7"
            onClick={(e) => {
              e.stopPropagation();
              if (onSelect) {
                onSelect(!selected);
              }
            }}
          >
            <Group gap="xs" justify="space-between" align="center">
              <Box>{getFileTypeBadge()}</Box>

              <Group gap="xs">
                {onSelect && (
                  <Checkbox
                    checked={selected}
                    onChange={(event) => onSelect(event.currentTarget.checked)}
                    size="sm"
                    style={{ zIndex: 4 }}
                  />
                )}
              </Group>
            </Group>
          </Box>

          {/* Tags Overlay - Bottom */}
          {currentFile.user_file_tags && currentFile.user_file_tags.length > 0 && (
            <Box
              pos="absolute"
              bottom={8}
              left={8}
              right={8}
              style={{
                zIndex: 20,
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                borderRadius: "4px",
                padding: "4px 8px",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Group gap="xs" justify="center" wrap="wrap">
                {currentFile.user_file_tags.slice(0, 3).map((fileTag) => (
                  <Badge key={fileTag.tag_id} color="blue" variant="light" size="xs">
                    {fileTag.user_tags.tag_name}
                  </Badge>
                ))}
                {currentFile.user_file_tags.length > 3 && (
                  <Badge color="gray" variant="light" size="xs">
                    +{currentFile.user_file_tags.length - 3} more
                  </Badge>
                )}
              </Group>
            </Box>
          )}
        </Card.Section>
      </Card>

      <FileDetailModal
        opened={opened}
        onClose={close}
        file={currentFile}
        onDownload={handleDownload}
        onEdit={handleEdit}
        onDelete={handleDelete}
        deleting={deleting}
        onTagsUpdated={handleTagsUpdated}
      />

      <Modal opened={editOpened} onClose={closeEdit} title="Edit File Name" size="md">
        <Stack gap="md">
          <TextInput
            label="File Name"
            value={newFileName}
            onChange={(event) => setNewFileName(event.currentTarget.value)}
            placeholder="Enter new file name"
            required
          />
          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={closeEdit}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} loading={editing}>
              Save
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
