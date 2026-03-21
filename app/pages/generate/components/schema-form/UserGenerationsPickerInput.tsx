import {
  ActionIcon,
  Box,
  Button,
  Card,
  Center,
  Group,
  Image,
  Loader,
  Stack,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useEffect, useState } from "react";
import { RiCloseLine } from "@remixicon/react";
import { useFormContext } from "~/lib/ContextForm";
import type { GenerationFile } from "~/lib/stores/generateStore";
import useAppStore from "~/lib/stores/appStore";
import { assertAuthFetchOk, authFetch } from "~/lib/stores/authFetch";
import { endpoint } from "~/lib/utils";
import { FilePreviewModal } from "~/pages/files/components/FilePreviewModal";
import { UserGenerationsPicker } from "../UserGenerationsPicker";

async function fetchGenerationByField(
  field: string,
  value: string,
  status: string = "completed"
): Promise<GenerationFile | null> {
  const app = useAppStore.getState();
  if (!app.getUser()?.user?.id || !app.getAuthApiKey()) {
    return null;
  }
  const qs = new URLSearchParams({
    field,
    value: String(value),
    status,
  });
  const res = await authFetch(`${endpoint}/generations/by-field?${qs.toString()}`);
  if (res.status === 404) {
    return null;
  }
  await assertAuthFetchOk(res, "Failed to load generation");
  const json = (await res.json()) as { success?: boolean; data?: GenerationFile };
  return json.data ?? null;
}

export function UserGenerationsPickerInput({
  fieldName,
  fieldSchema,
  isRequired = false,
  fieldPrefix = "",
}: {
  fieldName: string;
  fieldSchema: any;
  isRequired?: boolean;
  fieldPrefix?: string;
}) {
  const form = useFormContext();
  const [opened, { open, close }] = useDisclosure(false);
  const [previewOpened, { open: openPreview, close: closePreview }] = useDisclosure(false);
  const [selectedGeneration, setSelectedGeneration] = useState<GenerationFile | null>(null);
  const [loadingGeneration, setLoadingGeneration] = useState(false);
  const fullFieldName = fieldPrefix ? `${fieldPrefix}.${fieldName}` : fieldName;

  const currentValue = form.getInputProps(fullFieldName).value;

  useEffect(() => {
    const fetchGeneration = async () => {
      if (!currentValue || !fieldSchema.displayFieldValue) {
        setSelectedGeneration(null);
        return;
      }

      setLoadingGeneration(true);
      try {
        const data = await fetchGenerationByField(
          fieldSchema.displayFieldValue,
          String(currentValue),
          "completed"
        );
        setSelectedGeneration(data);
      } catch (err: any) {
        console.error("Error fetching generation:", err);
        setSelectedGeneration(null);
      } finally {
        setLoadingGeneration(false);
      }
    };

    fetchGeneration();
  }, [currentValue, fieldSchema.displayFieldValue]);

  const handleSelect = (value: string, generation: GenerationFile) => {
    form.setFieldValue(fullFieldName, value);
    setSelectedGeneration(generation);
    close();
  };

  const handleClear = () => {
    form.setFieldValue(fullFieldName, "");
    setSelectedGeneration(null);
  };

  const getThumbnailUrl = (): string | null => {
    if (
      selectedGeneration?.user_generation_files &&
      selectedGeneration.user_generation_files.length > 0
    ) {
      const firstFile = selectedGeneration.user_generation_files[0].user_files;
      if (firstFile) {
        return firstFile.thumbnail_url || firstFile.file_path || null;
      }
    }
    return null;
  };

  const getFileType = (url: string) => {
    if (!url) return null;
    const extension = url.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension || "")) {
      return "image";
    }
    if (["mp4", "webm", "mov", "avi"].includes(extension || "")) {
      return "video";
    }
    return "file";
  };

  if (!fieldSchema.displayFilter || !fieldSchema.displayFieldValue) {
    console.error("UserGenerationsPickerInput: displayFilter and displayFieldValue are required");
    return null;
  }

  const thumbnailUrl = getThumbnailUrl();
  const fileType = thumbnailUrl ? getFileType(thumbnailUrl) : null;

  const getFileDataForModal = () => {
    if (!selectedGeneration || !selectedGeneration.user_generation_files?.[0]?.user_files) {
      return null;
    }

    const userFile = selectedGeneration.user_generation_files[0].user_files;
    return {
      id: userFile.id || selectedGeneration.id,
      file_name: userFile.file_name || "Generated File",
      file_path: userFile.file_path || thumbnailUrl || "",
      file_size: userFile.file_size,
      file_type:
        userFile.file_type ||
        selectedGeneration.user_generation_files[0].user_files?.file_type ||
        "image/jpeg",
      created_at: userFile.created_at || selectedGeneration.created_at,
      user_file_tags: userFile.user_file_tags,
    };
  };

  const fileDataForModal = getFileDataForModal();

  return (
    <>
      <Stack key={form.key(fullFieldName)} gap="sm">
        <Text size="sm" fw={500}>
          {fieldSchema.title || fieldName}
          {isRequired && <span style={{ color: "red" }}> *</span>}
        </Text>

        {currentValue ? (
          <Card withBorder radius="md" p="0">
            {loadingGeneration ? (
              <Center p="md">
                <Loader size="sm" />
              </Center>
            ) : thumbnailUrl ? (
              <Group gap="xs" align="center" p="sm">
                <Box
                  style={{ cursor: fileDataForModal ? "pointer" : "default" }}
                  onClick={() => fileDataForModal && openPreview()}
                >
                  {fileType === "image" ? (
                    <Image
                      src={thumbnailUrl}
                      alt="Selected generation"
                      style={{
                        width: "100px",
                        height: "100px",
                        objectFit: "cover",
                        borderRadius: "4px",
                      }}
                    />
                  ) : fileType === "video" ? (
                    selectedGeneration?.user_generation_files?.[0]?.user_files?.thumbnail_url ? (
                      <Image
                        src={selectedGeneration.user_generation_files[0].user_files.thumbnail_url}
                        alt="Video thumbnail"
                        style={{
                          width: "100px",
                          height: "100px",
                          objectFit: "cover",
                          borderRadius: "4px",
                        }}
                      />
                    ) : (
                      <video
                        src={thumbnailUrl}
                        style={{
                          maxWidth: "200px",
                          maxHeight: "100px",
                          objectFit: "contain",
                          borderRadius: "4px",
                        }}
                        muted
                        preload="metadata"
                      />
                    )
                  ) : (
                    <Box>
                      <Text size="sm" c="dimmed">
                        📄
                      </Text>
                    </Box>
                  )}
                </Box>
                <Group gap="xs" ml="auto">
                  <Button size="xs" variant="light" onClick={open}>
                    Change
                  </Button>
                  <ActionIcon size="sm" variant="light" color="red" onClick={handleClear}>
                    <RiCloseLine size={16} />
                  </ActionIcon>
                </Group>
              </Group>
            ) : (
              <Group justify="space-between" align="center" p="sm">
                <Text size="sm" c="dimmed">
                  Selected: {currentValue}
                </Text>
                <Group gap="xs">
                  <Button size="xs" variant="light" onClick={open}>
                    Change
                  </Button>
                  <ActionIcon size="sm" variant="light" color="red" onClick={handleClear}>
                    <RiCloseLine size={16} />
                  </ActionIcon>
                </Group>
              </Group>
            )}
          </Card>
        ) : (
          <Button variant="light" onClick={open} fullWidth>
            Select {fieldSchema.title || fieldName}
          </Button>
        )}
      </Stack>

      <UserGenerationsPicker
        opened={opened}
        onClose={close}
        onSelect={handleSelect}
        title={`Select ${fieldSchema.title || fieldName}`}
        displayFilter={fieldSchema.displayFilter}
        displayFieldValue={fieldSchema.displayFieldValue}
      />

      {fileDataForModal && (
        <FilePreviewModal
          opened={previewOpened}
          onClose={closePreview}
          file={fileDataForModal}
          showActions={false}
        />
      )}
    </>
  );
}
