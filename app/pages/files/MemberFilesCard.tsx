import {
  Badge,
  Box,
  Button,
  Card,
  Center,
  Checkbox,
  Group,
  Image,
  Stack,
  Text,
  useMantineTheme,
} from "@mantine/core";
import {
  RiFileLine,
  RiFilePdf2Fill,
  RiFileTextLine,
  RiImageLine,
  RiPlayLine,
  RiDeleteBinLine,
} from "@remixicon/react";
import { useEffect, useState } from "react";
import { isTextFile } from "~/lib/utils";
import useAppStore from "~/lib/stores/appStore";
import { MediaTypeBadge } from "~/shared/MediaTypeBadge";
import useFilesFoldersStore from "~/lib/stores/filesFoldersStore";

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
  model_name?: string | null;
  generated_info?: {
    payload: {
      prompt: string;
    };
  };
}

interface MemberFilesCardProps {
  file: FileData;
  modelName?: string | null;
  onFileUpdate?: () => void;
  onTagsUpdated?: (fileId: string, updatedTags: UserFileTag[]) => void;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
  onOpen?: () => void;
}

export default function MemberFilesCard({
  file,
  onFileUpdate,
  selected = false,
  onSelect,
  onOpen,
}: MemberFilesCardProps) {
  const theme = useMantineTheme();
  const [deleting, setDeleting] = useState(false);
  const [currentFile, setCurrentFile] = useState(file);
  const { user } = useAppStore();
  const { deleteFile } = useFilesFoldersStore();

  // Update currentFile when file prop changes
  useEffect(() => {
    setCurrentFile(file);
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
      >
        <Card.Section pos="relative">
          <Box pos="relative" onMouseDown={(e) => e.preventDefault()} style={{ cursor: "pointer" }}>
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
                    height={200}
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
                <Center h={200}>
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
              <Box>
                <MediaTypeBadge
                  file_type={
                    isTextFile(currentFile.file_name) ? "text/plain" : currentFile.file_type
                  }
                  file_name={currentFile.file_name}
                  size="sm"
                  variant="filled"
                />
              </Box>

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
        </Card.Section>
        <Stack gap={6} p="xs">
          <Text size="sm" fw={600} lineClamp={2}>
            {currentFile.file_name}
          </Text>
          {currentFile.user_file_tags && currentFile.user_file_tags.length > 0 ? (
            <Group gap={4} wrap="wrap">
              {currentFile.user_file_tags.slice(0, 3).map((fileTag) => (
                <Badge key={fileTag.tag_id} size="xs">
                  {fileTag.user_tags.tag_name}
                </Badge>
              ))}
              {currentFile.user_file_tags.length > 3 ? (
                <Badge color="gray" variant="light" size="xs">
                  +{currentFile.user_file_tags.length - 3} more
                </Badge>
              ) : null}
            </Group>
          ) : null}
          <Group gap="xs" justify="space-between">
            <Button
              variant="subtle"
              color="red"
              size="compact-xs"
              leftSection={<RiDeleteBinLine size={14} />}
              loading={deleting}
              aria-label="Delete file"
              title="Delete file"
              onClick={(event) => {
                event.stopPropagation();
                event.preventDefault();
                void handleDelete();
              }}
            >
              Delete file
            </Button>
            <Button
              variant="subtle"
              size="compact-xs"
              aria-label="View file details"
              title="View file details"
              onClick={(event) => {
                event.stopPropagation();
                event.preventDefault();
                onOpen?.();
              }}
            >
              View details
            </Button>
          </Group>
        </Stack>
      </Card>
    </>
  );
}
