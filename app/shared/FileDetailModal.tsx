import {
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Center,
  Group,
  Image,
  Modal,
  Stack,
  Table,
  Text,
} from "@mantine/core";
import {
  RiDeleteBinLine,
  RiDownloadLine,
  RiFileLine,
  RiFilePdf2Fill,
  RiFileTextLine,
  RiImageLine,
  RiPlayLine,
} from "@remixicon/react";
import dayjs from "dayjs";
import FileTagModal from "~/pages/files/components/FileTagModal";
import FileShare from "~/shared/FileShare";
import { formatDate, formatFileSize, getFileExtension, isTextFile } from "~/lib/utils";

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

interface FileDetailModalProps {
  opened: boolean;
  onClose: () => void;
  file: FileData;
  onDownload: () => void;
  onEdit: () => void;
  onDelete: () => void;
  deleting?: boolean;
  onTagsUpdated: (updatedTags: UserFileTag[]) => void;
}

export default function FileDetailModal({
  opened,
  onClose,
  file,
  onDownload,
  onDelete,
  deleting = false,
  onTagsUpdated,
}: FileDetailModalProps) {
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
        <Badge color="green" size="sm">
          Image
        </Badge>
      );
    }
    if (file.file_type.startsWith("video/")) {
      return (
        <Badge color="orange" size="sm">
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
      <Stack gap="lg" p="md">
        {/* File Preview Section */}
        <Box>
          {file.file_type.startsWith("image/") ? (
            <Image
              src={file.file_path}
              alt={file.file_name}
              style={{ maxHeight: "60vh", width: "100%", objectFit: "contain" }}
              radius="md"
            />
          ) : file.file_type.startsWith("video/") ? (
            <video
              src={file.file_path}
              style={{
                width: "100%",
                maxHeight: "60vh",
                objectFit: "contain",
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
              style={{ backgroundColor: "var(--mantine-color-gray-0)", borderRadius: "8px" }}
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

        {/* File Information */}
        <Card withBorder radius="md" p="md">
          <Stack gap="md">
            <Group justify="space-between" align="flex-start">
              <Stack gap="xs">
                <Text size="xl" fw={600}>
                  {file.file_name}
                </Text>
                <Group gap="xs">
                  {getFileTypeBadge()}
                  <Text size="sm" c="dimmed">
                    {formatFileSize(file.file_size)}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {formatDate(file.created_at)}
                  </Text>
                </Group>
              </Stack>

              {/* Action Buttons */}
              <Group gap="sm">
                <FileShare
                  fileUrl={file.file_path}
                  fileName={file.file_name}
                  fileType={
                    file.file_type.startsWith("image/")
                      ? "image"
                      : file.file_type.startsWith("video/")
                        ? "video"
                        : "other"
                  }
                  variant="button"
                  size="sm"
                />
                <Button
                  leftSection={<RiDownloadLine size={16} />}
                  onClick={onDownload}
                  variant="light"
                >
                  Download
                </Button>
                <Button
                  leftSection={<RiDeleteBinLine size={16} />}
                  onClick={onDelete}
                  variant="light"
                  color="red"
                  loading={deleting}
                >
                  Delete
                </Button>
              </Group>
            </Group>

            {/* Tags Section */}
            <Box>
              <Group gap="xs" justify="space-between" align="center" mb="xs">
                <Text size="sm" fw={500}>
                  Tags
                </Text>
                <FileTagModal
                  fileId={file.id}
                  fileTags={file.user_file_tags || []}
                  onTagsUpdated={onTagsUpdated}
                />
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
                <Table.Tr>
                  <Table.Th>Date Created</Table.Th>
                  <Table.Td>{`${dayjs(file.created_at).format("MM/DD/YYYY h:mm A")}`}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Th>File Size</Table.Th>
                  <Table.Td>{formatFileSize(file.file_size)}</Table.Td>
                </Table.Tr>
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
                <Table.Tr>
                  <Table.Th>Prompt</Table.Th>
                  <Table.Td>
                    <Text size="sm" style={{ wordBreak: "break-all" }}>
                      {file.generated_info?.payload?.prompt}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
          </Stack>
        </Card>
      </Stack>
    </Modal>
  );
}
