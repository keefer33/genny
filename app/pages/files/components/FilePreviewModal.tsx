import {
  Anchor,
  Badge,
  Box,
  Button,
  Center,
  Group,
  Image,
  Modal,
  Stack,
  Grid,
  Table,
  Text,
  useMantineColorScheme,
  Container,
  Card,
} from "@mantine/core";
import {
  RiDeleteBinLine,
  RiDownloadLine,
  RiEditLine,
  RiFileLine,
  RiFilePdf2Fill,
  RiFileTextLine,
  RiImageLine,
  RiPlayLine,
} from "@remixicon/react";
import dayjs from "dayjs";
import { formatDate, formatFileSize, getFileExtension, isTextFile } from "~/lib/utils";
import FileTagModal from "~/pages/files/components/FileTagModal";

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
  file_size?: number;
  file_type: string;
  created_at?: string;
  user_file_tags?: UserFileTag[];
}

interface FilePreviewModalProps {
  opened: boolean;
  onClose: () => void;
  file: FileData;
  onDownload?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onTagsUpdated?: (updatedTags: UserFileTag[]) => void;
  deleting?: boolean;
  showActions?: boolean;
}

export function FilePreviewModal({
  opened,
  onClose,
  file,
  onDownload,
  onEdit,
  onDelete,
  onTagsUpdated,
  deleting = false,
  showActions = true,
}: FilePreviewModalProps) {
  const { colorScheme } = useMantineColorScheme();

  const getFileIcon = (size: number = 24) => {
    if (file.file_type.startsWith("image/")) {
      return <RiImageLine size={size} />;
    }
    if (file.file_type.startsWith("video/")) {
      return <RiPlayLine size={size} />;
    }
    if (file.file_type === "application/pdf") {
      return <RiFilePdf2Fill size={size} />;
    }
    if (file.file_type.startsWith("text/") || isTextFile(file.file_name)) {
      return <RiFileTextLine size={size} />;
    }
    return <RiFileLine size={size} />;
  };

  const getFileTypeBadge = () => {
    const ext = getFileExtension(file.file_name);
    if (file.file_type.startsWith("image/")) {
      return (
        <Badge color="green" variant="light" size="sm">
          Image
        </Badge>
      );
    }
    if (file.file_type.startsWith("video/")) {
      return (
        <Badge color="purple" variant="light" size="sm">
          Video
        </Badge>
      );
    }
    if (file.file_type === "application/pdf") {
      return (
        <Badge color="red" variant="light" size="sm">
          PDF
        </Badge>
      );
    }
    if (file.file_type.startsWith("text/") || isTextFile(file.file_name)) {
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

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      window.open(file.file_path, "_blank");
    }
  };

  const handleTagsUpdated = (updatedTags: UserFileTag[]) => {
    if (onTagsUpdated) {
      onTagsUpdated(updatedTags);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={file.file_name}
      size="xl"
      fullScreen
      styles={{
        body: { padding: 0 },
        header: { padding: "1rem" },
      }}
    >
      <Container fluid={true} size="xl">
        <Grid gutter="xs">
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Box>
              {file.file_type.startsWith("image/") ? (
                <Image
                  src={file.file_path}
                  alt={file.file_name}
                  style={{ maxHeight: "90vh", objectFit: "contain" }}
                  //m-h="60vh"
                  radius="md"
                />
              ) : file.file_type.startsWith("video/") ? (
                <video
                  src={file.file_path}
                  style={{
                    width: "100%",
                    //maxHeight: "60vh",
                    //objectFit: "contain",
                    borderRadius: "8px",
                  }}
                  controls
                  preload="metadata"
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <Center
                  h={400}
                  style={{
                    backgroundColor:
                      colorScheme === "dark"
                        ? "var(--mantine-color-dark-6)"
                        : "var(--mantine-color-gray-0)",
                    borderRadius: "8px",
                  }}
                >
                  <Stack align="center" gap="md">
                    <Box>{getFileIcon(120)}</Box>
                    <Text size="lg" fw={500}>
                      {file.file_name}
                    </Text>
                  </Stack>
                </Center>
              )}
            </Box>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Card radius="md" p="md" bg={colorScheme === "dark" ? "dark.6" : "gray.0"}>
              <Stack gap="md">
                <Group justify="space-between" align="flex-start">
                  <Stack gap="xs">
                    <Text size="xl" fw={600}>
                      {file.file_name}
                    </Text>
                    <Group gap="xs">
                      {getFileTypeBadge()}
                      {file.file_size && (
                        <Text size="sm" c="dimmed">
                          {formatFileSize(file.file_size)}
                        </Text>
                      )}
                      {file.created_at && (
                        <Text size="sm" c="dimmed">
                          {formatDate(file.created_at)}
                        </Text>
                      )}
                    </Group>
                  </Stack>

                  {/* Action Buttons */}
                  {showActions && (
                    <Group gap="sm">
                      <Button
                        leftSection={<RiDownloadLine size={16} />}
                        onClick={handleDownload}
                        variant="light"
                      >
                        Download
                      </Button>
                      {onEdit && (
                        <Button
                          leftSection={<RiEditLine size={16} />}
                          onClick={onEdit}
                          variant="light"
                          color="blue"
                        >
                          Rename
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          leftSection={<RiDeleteBinLine size={16} />}
                          onClick={onDelete}
                          variant="light"
                          color="red"
                          loading={deleting}
                        >
                          Delete
                        </Button>
                      )}
                    </Group>
                  )}
                </Group>

                {/* Tags Section */}
                {file.user_file_tags !== undefined && (
                  <Box>
                    <Group gap="xs" justify="space-between" align="center" mb="xs">
                      <Text size="sm" fw={500}>
                        Tags
                      </Text>
                      {onTagsUpdated && (
                        <FileTagModal
                          fileId={file.id}
                          fileTags={file.user_file_tags || []}
                          onTagsUpdated={handleTagsUpdated}
                        />
                      )}
                    </Group>
                    <Group gap="xs">
                      {file.user_file_tags && file.user_file_tags.length > 0 ? (
                        file.user_file_tags.map((fileTag) => (
                          <Badge key={fileTag.tag_id} color="blue" variant="light" size="sm">
                            {fileTag.user_tags.tag_name}
                          </Badge>
                        ))
                      ) : (
                        <Text size="sm" c="dimmed">
                          No tags assigned
                        </Text>
                      )}
                    </Group>
                  </Box>
                )}

                {/* File Details Table */}
                <Table variant="vertical" layout="fixed" withTableBorder>
                  <Table.Tbody>
                    <Table.Tr>
                      <Table.Th w={160}>File Name</Table.Th>
                      <Table.Td>
                        <Anchor href={file.file_path} target="_blank">
                          {file.file_name}
                        </Anchor>
                      </Table.Td>
                    </Table.Tr>
                    {file.created_at && (
                      <Table.Tr>
                        <Table.Th>Date Created</Table.Th>
                        <Table.Td>{`${dayjs(file.created_at).format("MM/DD/YYYY h:mm A")}`}</Table.Td>
                      </Table.Tr>
                    )}
                    {file.file_size && (
                      <Table.Tr>
                        <Table.Th>File Size</Table.Th>
                        <Table.Td>{formatFileSize(file.file_size)}</Table.Td>
                      </Table.Tr>
                    )}
                    <Table.Tr>
                      <Table.Th>File Type</Table.Th>
                      <Table.Td>{file.file_type.toUpperCase()}</Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Th>File Path</Table.Th>
                      <Table.Td>
                        <Text size="sm" style={{ wordBreak: "break-all" }}>
                          {file.file_path}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  </Table.Tbody>
                </Table>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>
      </Container>
    </Modal>
  );
}
