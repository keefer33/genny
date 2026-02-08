import {
  ActionIcon,
  Button,
  Group,
  NumberInput,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
  Textarea,
  useMantineTheme,
  useMantineColorScheme,
  Box,
  Image,
  Card,
  Center,
  Loader,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useEffect, useRef, useState } from "react";
import { useFormContext } from "~/lib/ContextForm";
import { RiFileCopyLine, RiCheckLine, RiCloseLine } from "@remixicon/react";
import { FilePickerModal } from "../../../shared/FilePickerModal";
import { RandomPromptButton } from "./RandomPromptButton";
import { EnhancePromptButton } from "./EnhancePromptButton";
import { UserGenerationsPicker } from "./UserGenerationsPicker";
import type { GenerationFile } from "~/lib/stores/generateStore";
import useAppStore from "~/lib/stores/appStore";
import useFilesFoldersStore from "~/lib/stores/filesFoldersStore";
import { FilePreviewModal } from "~/pages/files/components/FilePreviewModal";

interface ToolSchema {
  description?: string;
  order?: string[];
  inputSchema?: {
    properties: Record<string, any>;
    required?: string[];
  };
  properties?: Record<string, any>;
  required?: string[];
}

interface SchemaFormGeneratorProps {
  schema: ToolSchema | string | null | undefined;
  showNoSchemaMessage?: boolean;
  showNoFieldsMessage?: boolean;
  fieldPrefix?: string;
  generationType?: "image" | "video";
}

interface NestedFieldRendererProps {
  properties: Record<string, any>;
  required: string[];
  fieldPrefix?: string;
  generationType?: "image" | "video";
}

interface ObjectArrayRendererProps {
  fieldName: string;
  fieldSchema: any;
  isRequired?: boolean;
  fieldPrefix?: string;
}

interface StringArrayRendererProps {
  fieldName: string;
  fieldSchema: any;
  isRequired?: boolean;
  fieldPrefix?: string;
}

// Component for rendering selectable boxes for string enums
function SelectableBoxesRenderer({
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
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const fullFieldName = fieldPrefix ? `${fieldPrefix}.${fieldName}` : fieldName;

  const enumData = fieldSchema.enum || [];

  // Helper function to get nested value safely
  const getNestedValue = (obj: any, path: string) => {
    return path.split(".").reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  };

  const currentValue = getNestedValue(form.values, fullFieldName) || "";

  const handleBoxClick = (value: string) => {
    // Helper function to set nested value properly
    const setNestedValue = (obj: any, path: string, value: any) => {
      const keys = path.split(".");
      let current = obj;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]] || typeof current[keys[i]] !== "object") {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
    };

    // Create a deep copy of form values and set the nested value
    const updatedValues = JSON.parse(JSON.stringify(form.values));
    setNestedValue(updatedValues, fullFieldName, value);
    form.setValues(updatedValues);
  };

  return (
    <Stack key={form.key(fullFieldName)} gap="xs">
      <Text size="sm" fw={500}>
        {fieldSchema.title || fieldName}
        {isRequired && <span style={{ color: "red" }}> *</span>}
      </Text>

      <Group gap="sm">
        {enumData.map((option: any) => {
          const value = typeof option === "object" ? option.value : option;
          const label = typeof option === "object" ? option.label : option;
          const isSelected = currentValue === value;
          return (
            <Box
              key={value}
              py="4"
              px="md"
              style={{
                cursor: "pointer",
                border: isSelected
                  ? `2px solid ${theme.colors[theme.primaryColor][6]}`
                  : `1px solid ${colorScheme === "dark" ? theme.colors.dark[4] : theme.colors.gray[3]}`,
                //backgroundColor: isSelected ? theme.colors[theme.primaryColor][0] : "transparent",
                borderRadius: "8px",
                transition: "all 0.2s ease",
                minWidth: "40px",
                textAlign: "center",
              }}
              onClick={() => handleBoxClick(value)}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor =
                    colorScheme === "dark" ? theme.colors.dark[5] : theme.colors.gray[1];
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              <Text size="sm" fw={isSelected ? 600 : 400}>
                {label}
              </Text>
            </Box>
          );
        })}
      </Group>
    </Stack>
  );
}

// Component for rendering file picker input
function FilePickerInput({
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
  const [_opened, { open }] = useDisclosure(false);
  const fullFieldName = fieldPrefix ? `${fieldPrefix}.${fieldName}` : fieldName;

  const currentValue = form.getInputProps(fullFieldName).value;

  const handleFileSelect = (fileUrl: string, _file?: any) => {
    form.setFieldValue(fullFieldName, fileUrl);
  };

  const handleClear = () => {
    form.setFieldValue(fullFieldName, "");
  };

  // Get allowed types from fieldSchema.types, default to "all"
  const allowedTypes =
    fieldSchema.types === "images" || fieldSchema.types === "videos" ? fieldSchema.types : "all";

  return (
    <>
      <Stack key={form.key(fullFieldName)} gap="sm">
        <Text size="sm" fw={500}>
          {fieldSchema.title || fieldName}
          {isRequired && <span style={{ color: "red" }}> *</span>}
        </Text>

        <FilePickerPreview
          fileUrl={currentValue || ""}
          placeholder={`Select ${fieldSchema.title || fieldName}`}
          onSelect={open}
          onClear={handleClear}
          onFileSelect={handleFileSelect}
          allowedTypes={allowedTypes}
          title={`Select ${fieldSchema.title || fieldName}`}
        />
      </Stack>
    </>
  );
}

// Component for rendering user generations picker input
function UserGenerationsPickerInput({
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
  const { getUser, getApi } = useAppStore();
  const [opened, { open, close }] = useDisclosure(false);
  const [previewOpened, { open: openPreview, close: closePreview }] = useDisclosure(false);
  const [selectedGeneration, setSelectedGeneration] = useState<GenerationFile | null>(null);
  const [loadingGeneration, setLoadingGeneration] = useState(false);
  const fullFieldName = fieldPrefix ? `${fieldPrefix}.${fieldName}` : fieldName;

  const currentValue = form.getInputProps(fullFieldName).value;

  // Fetch generation data when value changes
  useEffect(() => {
    const fetchGeneration = async () => {
      if (!currentValue || !fieldSchema.displayFieldValue) {
        setSelectedGeneration(null);
        return;
      }

      const user = getUser();
      const userId = user?.user?.id;
      const supabase = getApi();
      if (!userId || !supabase) return;

      setLoadingGeneration(true);
      try {
        const { data, error } = await supabase
          .from("user_generations")
          .select(
            `
            *,
            models(*),
            user_generation_files(
              file_id,
              user_files(
                *,
                user_file_tags(
                  tag_id,
                  created_at,
                  user_tags(*)
                )
              )
            )
          `
          )
          .eq("user_id", userId)
          .eq(fieldSchema.displayFieldValue, currentValue)
          .eq("status", "completed")
          .single();

        if (error) {
          console.error("Error fetching generation:", error);
          setSelectedGeneration(null);
          return;
        }

        setSelectedGeneration(data);
      } catch (err: any) {
        console.error("Error fetching generation:", err);
        setSelectedGeneration(null);
      } finally {
        setLoadingGeneration(false);
      }
    };

    fetchGeneration();
  }, [currentValue, fieldSchema.displayFieldValue, getUser, getApi]);

  const handleSelect = (value: string, generation: GenerationFile) => {
    form.setFieldValue(fullFieldName, value);
    setSelectedGeneration(generation);
    close();
  };

  const handleClear = () => {
    form.setFieldValue(fullFieldName, "");
    setSelectedGeneration(null);
  };

  // Get thumbnail URL from selected generation
  const getThumbnailUrl = (): string | null => {
    if (
      selectedGeneration?.user_generation_files &&
      selectedGeneration.user_generation_files.length > 0
    ) {
      const firstFile = selectedGeneration.user_generation_files[0].user_files;
      if (firstFile) {
        // Use thumbnail_url first, fallback to file_path
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

  // Validate displayFilter and displayFieldValue
  if (!fieldSchema.displayFilter || !fieldSchema.displayFieldValue) {
    console.error("UserGenerationsPickerInput: displayFilter and displayFieldValue are required");
    return null;
  }

  const thumbnailUrl = getThumbnailUrl();
  const fileType = thumbnailUrl ? getFileType(thumbnailUrl) : null;

  // Convert generation file to FileData format for the modal
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
                    // For videos, use thumbnail_url if available, otherwise use file_path
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

// Reusable component for displaying file picker preview with preview modal
function FilePickerPreview({
  fileUrl,
  placeholder,
  onSelect,
  onClear,
  onFileSelect,
  allowedTypes = "all",
  title,
  autoOpen = false,
}: {
  fileUrl: string;
  placeholder: string;
  onSelect: () => void;
  onClear: () => void;
  onFileSelect: (fileUrl: string, file?: any) => void;
  allowedTypes?: "images" | "videos" | "all";
  title?: string;
  autoOpen?: boolean;
}) {
  const { getUser, getApi } = useAppStore();
  const [opened, { open, close }] = useDisclosure(false);

  // Auto-open modal when autoOpen prop is true
  useEffect(() => {
    if (autoOpen && !fileUrl) {
      open();
    }
  }, [autoOpen, fileUrl, open]);

  // Update file type filter when allowedTypes changes (even if modal is already open)
  useEffect(() => {
    if (allowedTypes === "images" || allowedTypes === "videos") {
      useFilesFoldersStore.getState().setFileTypeFilter(allowedTypes);
    } else {
      // Only reset to "all" if currently showing a locked filter
      const currentFilter = useFilesFoldersStore.getState().fileTypeFilter;
      if (currentFilter === "images" || currentFilter === "videos") {
        useFilesFoldersStore.getState().setFileTypeFilter("all");
      }
    }
  }, [allowedTypes]);
  const [previewOpened, { open: openPreview, close: closePreview }] = useDisclosure(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [loadingFile, setLoadingFile] = useState(false);

  // Fetch file data when fileUrl changes
  useEffect(() => {
    const fetchFile = async () => {
      if (!fileUrl) {
        setSelectedFile(null);
        return;
      }

      const user = getUser();
      const userId = user?.user?.id;
      const supabase = getApi();
      if (!userId || !supabase) return;

      setLoadingFile(true);
      try {
        const { data, error } = await supabase
          .from("user_files")
          .select(
            `
            *,
            user_file_tags(
              tag_id,
              created_at,
              user_tags(*)
            )
          `
          )
          .eq("user_id", userId)
          .eq("file_path", fileUrl)
          .eq("status", "active")
          .single();

        if (error) {
          console.error("Error fetching file:", error);
          setSelectedFile(null);
          return;
        }

        setSelectedFile(data);
      } catch (err: any) {
        console.error("Error fetching file:", err);
        setSelectedFile(null);
      } finally {
        setLoadingFile(false);
      }
    };

    fetchFile();
  }, [fileUrl, getUser, getApi]);

  const handleFileSelect = (url: string, file?: any) => {
    onFileSelect(url, file);
    if (file) {
      setSelectedFile(file);
    }
    close();
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

  const handlePreviewClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!fileUrl) return;

    // If we don't have file data yet, try to fetch it
    if (!selectedFile) {
      const user = getUser();
      const userId = user?.user?.id;
      const supabase = getApi();
      if (userId && supabase) {
        setLoadingFile(true);
        try {
          const { data, error } = await supabase
            .from("user_files")
            .select(
              `
            *,
            user_file_tags(
              tag_id,
              created_at,
              user_tags(*)
            )
          `
            )
            .eq("user_id", userId)
            .eq("file_path", fileUrl)
            .eq("status", "active")
            .single();

          if (!error && data) {
            setSelectedFile(data);
            openPreview();
          } else {
            // If file not found, create a minimal file object for preview
            const fileType = getFileType(fileUrl);
            const minimalFile = {
              id: "",
              file_name: fileUrl.split("/").pop() || "File",
              file_path: fileUrl,
              file_type:
                fileType === "image"
                  ? "image/jpeg"
                  : fileType === "video"
                    ? "video/mp4"
                    : "application/octet-stream",
            };
            setSelectedFile(minimalFile);
            openPreview();
          }
        } catch (err: any) {
          console.error("Error fetching file:", err);
          // Still open preview with minimal data
          const fileType = getFileType(fileUrl);
          const minimalFile = {
            id: "",
            file_name: fileUrl.split("/").pop() || "File",
            file_path: fileUrl,
            file_type:
              fileType === "image"
                ? "image/jpeg"
                : fileType === "video"
                  ? "video/mp4"
                  : "application/octet-stream",
          };
          setSelectedFile(minimalFile);
          openPreview();
        } finally {
          setLoadingFile(false);
        }
      } else {
        // No user/supabase, create minimal file object
        const fileType = getFileType(fileUrl);
        const minimalFile = {
          id: "",
          file_name: fileUrl.split("/").pop() || "File",
          file_path: fileUrl,
          file_type:
            fileType === "image"
              ? "image/jpeg"
              : fileType === "video"
                ? "video/mp4"
                : "application/octet-stream",
        };
        setSelectedFile(minimalFile);
        openPreview();
      }
    } else {
      // We have file data, just open the preview
      openPreview();
    }
  };

  const fileType = fileUrl ? getFileType(fileUrl) : null;

  return (
    <>
      {fileUrl ? (
        <Card
          withBorder
          radius="md"
          w="100%"
          p="0"
          onClick={(e) => {
            // Prevent card clicks from doing anything - only specific elements should be clickable
            e.stopPropagation();
          }}
        >
          {loadingFile ? (
            <Center p="md">
              <Loader size="sm" />
            </Center>
          ) : (
            <Group gap="xs" align="center" p="sm">
              <Box style={{ cursor: fileUrl ? "pointer" : "default" }} onClick={handlePreviewClick}>
                {fileType === "image" ? (
                  <Image
                    src={selectedFile?.thumbnail_url || fileUrl}
                    alt="Selected file"
                    style={{
                      width: "100px",
                      height: "100px",
                      objectFit: "cover",
                      borderRadius: "4px",
                    }}
                  />
                ) : fileType === "video" ? (
                  // For videos, use thumbnail_url if available, otherwise use file_path
                  selectedFile?.thumbnail_url ? (
                    <Image
                      src={selectedFile.thumbnail_url}
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
                      src={fileUrl}
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
                <Button
                  size="xs"
                  variant="light"
                  onClick={(e) => {
                    e.stopPropagation();
                    open();
                    onSelect();
                  }}
                >
                  Change
                </Button>
                <ActionIcon
                  size="sm"
                  variant="light"
                  color="red"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClear();
                  }}
                >
                  <RiCloseLine size={16} />
                </ActionIcon>
              </Group>
            </Group>
          )}
        </Card>
      ) : (
        <Button
          variant="light"
          onClick={() => {
            open();
            onSelect();
          }}
          fullWidth
        >
          {placeholder}
        </Button>
      )}

      <FilePickerModal
        opened={opened}
        onClose={close}
        onSelect={handleFileSelect}
        title={title || "Select File"}
        allowedTypes={allowedTypes}
      />

      {previewOpened && selectedFile && (
        <FilePreviewModal
          opened={previewOpened}
          onClose={closePreview}
          file={selectedFile}
          showActions={true}
          onDelete={() => {
            onClear();
            closePreview();
          }}
        />
      )}
    </>
  );
}

// Component for rendering selectable boxes for integer enums
function SelectableIntegerBoxesRenderer({
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
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const fullFieldName = fieldPrefix ? `${fieldPrefix}.${fieldName}` : fieldName;

  const enumData = fieldSchema.enum || [];

  // Helper function to get nested value safely
  const getNestedValue = (obj: any, path: string) => {
    return path.split(".").reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  };

  const currentValue = getNestedValue(form.values, fullFieldName);

  const handleBoxClick = (value: number) => {
    // Helper function to set nested value properly
    const setNestedValue = (obj: any, path: string, value: any) => {
      const keys = path.split(".");
      let current = obj;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]] || typeof current[keys[i]] !== "object") {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
    };

    // Create a deep copy of form values and set the nested value
    const updatedValues = JSON.parse(JSON.stringify(form.values));
    setNestedValue(updatedValues, fullFieldName, value);
    form.setValues(updatedValues);
  };

  return (
    <Stack key={form.key(fullFieldName)} gap="sm">
      <Text size="sm" fw={500}>
        {fieldSchema.title || fieldName}
        {isRequired && <span style={{ color: "red" }}> *</span>}
      </Text>

      {/*
        {fieldSchema.description && (
          <Text size="xs" c="dimmed">
            {fieldSchema.description}
          </Text>
        )}
        */}

      <Group gap="sm">
        {enumData.map((option: any) => {
          const value = typeof option === "object" ? option.value : option;
          const label = typeof option === "object" ? option.label : option;
          const numericValue = typeof value === "string" ? parseInt(value, 10) : value;
          const isSelected = currentValue === numericValue;
          return (
            <Box
              key={numericValue}
              py="4"
              px="md"
              style={{
                cursor: "pointer",
                border: isSelected
                  ? `2px solid ${theme.colors[theme.primaryColor][6]}`
                  : `1px solid ${colorScheme === "dark" ? theme.colors.dark[4] : theme.colors.gray[3]}`,
                //backgroundColor: isSelected ? theme.colors[theme.primaryColor][0] : "transparent",
                borderRadius: "8px",
                transition: "all 0.2s ease",
                minWidth: "40px",
                textAlign: "center",
              }}
              onClick={() => handleBoxClick(numericValue)}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor =
                    colorScheme === "dark" ? theme.colors.dark[5] : theme.colors.gray[1];
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              <Text size="sm" fw={isSelected ? 600 : 400}>
                {label}
              </Text>
            </Box>
          );
        })}
      </Group>
    </Stack>
  );
}

// Component for rendering object arrays
function ObjectArrayRenderer({
  fieldName,
  fieldSchema,
  fieldPrefix = "",
}: ObjectArrayRendererProps) {
  const form = useFormContext();
  const fullFieldName = fieldPrefix ? `${fieldPrefix}.${fieldName}` : fieldName;

  // Helper function to get nested value safely
  const getNestedValue = (obj: any, path: string) => {
    return path.split(".").reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  };

  // Helper function to set nested value
  const setNestedValue = (obj: any, path: string, value: any) => {
    const keys = path.split(".");
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]] || typeof current[keys[i]] !== "object") {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
  };

  // Get current array value or initialize empty array
  const currentArray = getNestedValue(form.values, fullFieldName) || [];

  const addItem = () => {
    const newItem = {};
    // Initialize nested object properties with default values
    if (fieldSchema.items && fieldSchema.items.properties) {
      Object.entries(fieldSchema.items.properties).forEach(
        ([propName, propSchema]: [string, any]) => {
          switch (propSchema.type) {
            case "string":
              newItem[propName] = "";
              break;
            case "number":
            case "integer":
              newItem[propName] = propSchema.minimum || 0;
              break;
            case "boolean":
              newItem[propName] = false;
              break;
            case "array":
              newItem[propName] = [];
              break;
            case "object":
              newItem[propName] = {};
              break;
            default:
              newItem[propName] = "";
          }
        }
      );
    }

    const newArray = [...currentArray, newItem];

    // Create a deep copy of form values and set the nested value
    const updatedValues = JSON.parse(JSON.stringify(form.values));
    setNestedValue(updatedValues, fullFieldName, newArray);
    form.setValues(updatedValues);
  };

  const removeItem = (index: number) => {
    const newArray = currentArray.filter((_: any, i: number) => i !== index);

    // Create a deep copy of form values and set the nested value
    const updatedValues = JSON.parse(JSON.stringify(form.values));
    setNestedValue(updatedValues, fullFieldName, newArray);
    form.setValues(updatedValues);
  };

  return (
    <Stack key={form.key(fullFieldName)} gap="sm">
      <Group justify="space-between" align="center">
        <Text size="sm" fw={500}>
          {fieldSchema.title || fieldName}
        </Text>
        <Button size="xs" variant="light" onClick={addItem}>
          + Add Item
        </Button>
      </Group>

      {/*
        {fieldSchema.description && (
          <Text size="xs" c="dimmed">
            {fieldSchema.description}
          </Text>
        )}
        */}

      {currentArray.map((item: any, index: number) => (
        <Stack
          key={index}
          gap="sm"
          p="md"
          style={{ border: "1px solid #e9ecef", borderRadius: "4px" }}
        >
          <Group justify="space-between" align="center">
            <Text size="xs" fw={500} c="dimmed">
              Item {index + 1}
            </Text>
            <ActionIcon size="sm" variant="light" color="red" onClick={() => removeItem(index)}>
              ×
            </ActionIcon>
          </Group>

          {fieldSchema.items && fieldSchema.items.properties && (
            <NestedFieldRenderer
              properties={fieldSchema.items.properties}
              required={fieldSchema.items.required || []}
              fieldPrefix={`${fullFieldName}.${index}`}
            />
          )}
        </Stack>
      ))}

      {currentArray.length === 0 && (
        <Text size="xs" c="dimmed" ta="center" py="md">
          No items added yet. Click &quot;Add Item&quot; to start.
        </Text>
      )}
    </Stack>
  );
}

// Component for rendering individual string array items
function StringArrayItem({
  item,
  index,
  fieldName,
  fieldSchema,
  updateItem,
  removeItem,
  autoOpen = false,
}: {
  item: string;
  index: number;
  fieldName: string;
  fieldSchema: any;
  updateItem: (index: number, value: string) => void;
  removeItem: (index: number) => void;
  autoOpen?: boolean;
}) {
  if (fieldSchema.display === "filePicker") {
    // Get allowed types from fieldSchema.types, default to "all"
    const allowedTypes =
      fieldSchema.types === "images" || fieldSchema.types === "videos" ? fieldSchema.types : "all";

    const handleFileSelect = (fileUrl: string, _file?: any) => {
      updateItem(index, fileUrl);
    };

    const handleClear = () => {
      removeItem(index);
    };

    return (
      <FilePickerPreview
        fileUrl={item || ""}
        placeholder={`Select ${fieldSchema.title || fieldName} ${index + 1}`}
        onSelect={() => {}}
        onClear={handleClear}
        onFileSelect={handleFileSelect}
        allowedTypes={allowedTypes}
        title={`Select ${fieldSchema.title || fieldName} ${index + 1}`}
        autoOpen={autoOpen}
      />
    );
  }

  // Fallback to text input for non-file-picker fields
  return (
    <Group gap="sm" align="flex-end">
      <TextInput
        placeholder={fieldSchema.placeholder || `Enter ${fieldName} ${index + 1}`}
        value={item}
        onChange={(event) => updateItem(index, event.currentTarget.value)}
        style={{ flex: 1 }}
      />
      <ActionIcon size="sm" variant="light" color="red" onClick={() => removeItem(index)}>
        ×
      </ActionIcon>
    </Group>
  );
}

// Component for rendering string arrays
function StringArrayRenderer({
  fieldName,
  fieldSchema,
  isRequired = false,
  fieldPrefix = "",
}: StringArrayRendererProps) {
  const form = useFormContext();
  const fullFieldName = fieldPrefix ? `${fieldPrefix}.${fieldName}` : fieldName;

  // Helper function to get nested value safely
  const getNestedValue = (obj: any, path: string) => {
    return path.split(".").reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  };

  // Helper function to set nested value
  const setNestedValue = (obj: any, path: string, value: any) => {
    const keys = path.split(".");
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]] || typeof current[keys[i]] !== "object") {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
  };

  // Get current array value or initialize empty array
  const currentArray = getNestedValue(form.values, fullFieldName) || [];

  // State to track which item index should auto-open its modal
  const [autoOpenIndex, setAutoOpenIndex] = useState<number | null>(null);

  // Check for maxItems in different possible locations
  const maxItems =
    fieldSchema.maxItems ||
    fieldSchema.maximum ||
    fieldSchema.maxItems ||
    (fieldSchema.items && fieldSchema.items.maxItems) ||
    null;

  // Check if this is a file picker array
  const isFilePicker =
    fieldSchema.items?.display === "filePicker" || fieldSchema.display === "filePicker";

  const addItem = () => {
    // Check if we've reached the maximum number of items
    if (maxItems && currentArray.length >= maxItems) {
      return;
    }

    const newIndex = currentArray.length;
    const newArray = [...currentArray, ""];

    // Create a deep copy of form values and set the nested value
    const updatedValues = JSON.parse(JSON.stringify(form.values));
    setNestedValue(updatedValues, fullFieldName, newArray);
    form.setValues(updatedValues);

    // If it's a file picker, set the auto-open index to trigger modal opening
    if (isFilePicker) {
      setAutoOpenIndex(newIndex);
      // Reset after a delay to allow the component to render and modal to open
      setTimeout(() => {
        setAutoOpenIndex(null);
      }, 200);
    }
  };

  const removeItem = (index: number) => {
    const newArray = currentArray.filter((_: any, i: number) => i !== index);

    // Create a deep copy of form values and set the nested value
    const updatedValues = JSON.parse(JSON.stringify(form.values));
    setNestedValue(updatedValues, fullFieldName, newArray);
    form.setValues(updatedValues);
  };

  const updateItem = (index: number, value: string) => {
    const newArray = [...currentArray];
    newArray[index] = value;

    // Create a deep copy of form values and set the nested value
    const updatedValues = JSON.parse(JSON.stringify(form.values));
    setNestedValue(updatedValues, fullFieldName, newArray);
    form.setValues(updatedValues);
  };

  return (
    <Stack key={form.key(fullFieldName)} gap="sm">
      <Group justify="space-between" align="center">
        <Text size="sm" fw={500}>
          {fieldSchema.title || fieldName}
          {isRequired && <span style={{ color: "red" }}> *</span>}
        </Text>
        <Button
          size="xs"
          variant="light"
          onClick={addItem}
          disabled={maxItems ? currentArray.length >= maxItems : false}
        >
          + Add Item
          {maxItems && currentArray.length >= maxItems && " (Max reached)"}
        </Button>
      </Group>

      {/*
        {fieldSchema.description && (
          <Text size="xs" c="dimmed">
            {fieldSchema.description}
          </Text>
        )}
        */}

      {maxItems && (
        <Text size="xs" c="dimmed">
          {currentArray.length} / {maxItems} items
        </Text>
      )}

      <Group gap="sm">
        {currentArray.map((item: string, index: number) => (
          <StringArrayItem
            key={index}
            item={item}
            index={index}
            fieldName={fieldName}
            fieldSchema={fieldSchema}
            updateItem={updateItem}
            removeItem={removeItem}
            autoOpen={autoOpenIndex === index}
          />
        ))}
      </Group>

      {currentArray.length === 0 && (
        <Text size="xs" c="dimmed" ta="center" py="md">
          No items added yet. Click &quot;Add Item&quot; to start.
        </Text>
      )}
    </Stack>
  );
}

// Component for prompt action buttons (copy and clear)
function PromptActionButtons({ fieldName, fieldValue }: { fieldName: string; fieldValue: string }) {
  const form = useFormContext();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fieldValue || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  const handleClear = () => {
    form.setFieldValue(fieldName, "");
  };

  return (
    <>
      <ActionIcon
        variant="light"
        size="sm"
        color="blue.5"
        onClick={handleCopy}
        disabled={!fieldValue}
        title={copied ? "Copied!" : "Copy to clipboard"}
      >
        {copied ? <RiCheckLine size={14} /> : <RiFileCopyLine size={14} />}
      </ActionIcon>
      <ActionIcon
        variant="light"
        size="sm"
        color="red.5"
        onClick={handleClear}
        disabled={!fieldValue}
        title="Clear prompt"
      >
        <RiCloseLine size={14} />
      </ActionIcon>
    </>
  );
}

// Recursive component for rendering nested fields
function NestedFieldRenderer({
  properties,
  required,
  fieldPrefix = "",
  generationType = "image",
}: NestedFieldRendererProps) {
  const form = useFormContext();

  // Helper function to normalize enum data for Mantine Select
  const normalizeEnumData = (enumData: any[]) => {
    if (!Array.isArray(enumData)) return [];

    // Convert all items to the format expected by Mantine Select
    const normalizedData = enumData.map((item) => {
      // If it's already an object with value/label, return as is
      if (typeof item === "object" && item !== null && "value" in item) {
        return item;
      }
      // If it's a primitive value, convert to { value, label } format
      return {
        value: String(item),
        label: String(item),
      };
    });

    // Remove duplicates based on value
    const uniqueData = normalizedData.filter(
      (item, index, self) => self.findIndex((other) => other.value === item.value) === index
    );

    return uniqueData;
  };

  // Helper function to ensure parent objects exist
  const ensureParentObjects = (fieldName: string) => {
    const keys = fieldName.split(".");
    if (keys.length <= 1) return;

    const currentValues = { ...form.values };
    let current = currentValues;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]] || typeof current[keys[i]] !== "object") {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    // Only update if we made changes
    if (JSON.stringify(currentValues) !== JSON.stringify(form.values)) {
      form.setValues(currentValues);
    }
  };

  // Ensure parent objects exist for all fields on mount (include read-only fields)
  useEffect(() => {
    Object.entries(properties).forEach(([fieldName, _fieldSchema]) => {
      const fullFieldName = fieldPrefix ? `${fieldPrefix}.${fieldName}` : fieldName;
      ensureParentObjects(fullFieldName);
    });
  }, [properties, fieldPrefix, form]);

  const renderField = (fieldName: string, fieldSchema: any, isRequired: boolean) => {
    const fullFieldName = fieldPrefix ? `${fieldPrefix}.${fieldName}` : fieldName;

    // Skip rendering if field is read-only
    if (fieldSchema.readOnly === true) {
      return null;
    }

    switch (fieldSchema.type) {
      case "object":
        return (
          <Stack
            key={form.key(fullFieldName)}
            gap="xl"
            //p="md"
            //style={{ border: "1px solid #e9ecef", borderRadius: "4px" }}
          >
            {/* hide for now 
            <Text size="sm" fw={500}>
              {fieldSchema.title || fieldName}
            </Text>
            {fieldSchema.description && (
              <Text size="xs" c="dimmed">
                {fieldSchema.description}
              </Text>
            
            )}
            */}
            {fieldSchema.properties && (
              <NestedFieldRenderer
                properties={fieldSchema.properties}
                required={fieldSchema.required || []}
                fieldPrefix={fullFieldName}
                generationType={generationType}
              />
            )}
          </Stack>
        );

      case "array":
        if (fieldSchema.items && fieldSchema.items.type === "object") {
          // Array of objects - use ObjectArrayRenderer
          return (
            <ObjectArrayRenderer
              fieldName={fieldName}
              fieldSchema={fieldSchema}
              fieldPrefix={fieldPrefix}
            />
          );
        } else if (fieldSchema.items && fieldSchema.items.enum) {
          // Array with enum items
          const selectData = Array.isArray(fieldSchema.items.enum) ? fieldSchema.items.enum : [];
          const finalData = normalizeEnumData(selectData);

          return (
            <Select
              key={form.key(fullFieldName)}
              label={fieldSchema.title || fieldName}
              //={fieldSchema.description}
              placeholder={fieldSchema.placeholder}
              required={isRequired}
              {...form.getInputProps(fullFieldName)}
              data={finalData}
              multiple
            />
          );
        } else {
          // Regular array - render as dynamic list
          return (
            <StringArrayRenderer
              fieldName={fieldName}
              fieldSchema={fieldSchema}
              isRequired={isRequired}
              fieldPrefix={fieldPrefix}
            />
          );
        }

      case "string":
        // Check if display is set to "user_generations"
        if (fieldSchema.display === "user_generations") {
          return (
            <UserGenerationsPickerInput
              fieldName={fieldName}
              fieldSchema={fieldSchema}
              isRequired={isRequired}
              fieldPrefix={fieldPrefix}
            />
          );
        }

        // Check if display is set to "filePicker"
        if (fieldSchema.display === "filePicker") {
          return (
            <FilePickerInput
              fieldName={fieldName}
              fieldSchema={fieldSchema}
              isRequired={isRequired}
              fieldPrefix={fieldPrefix}
            />
          );
        }

        if (fieldSchema.enum) {
          // Check if display is set to "boxes"
          if (fieldSchema.display === "boxes") {
            return (
              <SelectableBoxesRenderer
                fieldName={fieldName}
                fieldSchema={fieldSchema}
                isRequired={isRequired}
                fieldPrefix={fieldPrefix}
              />
            );
          }

          const selectData = Array.isArray(fieldSchema.enum) ? fieldSchema.enum : [];
          const finalData = normalizeEnumData(selectData);

          return (
            <Select
              key={form.key(fullFieldName)}
              label={fieldSchema.title || fieldName}
              //description={fieldSchema.description}
              placeholder={fieldSchema.placeholder || `Select ${fieldName}`}
              required={isRequired}
              {...form.getInputProps(fullFieldName)}
              data={finalData}
              disabled={fieldSchema.readOnly}
            />
          );
        } else {
          const inputProps = form.getInputProps(fullFieldName);
          const currentValue = inputProps.value || "";
          // Support both maxLength (JSON Schema) and max (alternative format)
          const maxLength = fieldSchema.maxLength || fieldSchema.max;
          const currentLength = currentValue.length;
          const isMaxReached = maxLength && currentLength >= maxLength;

          // Override onChange to truncate text if it exceeds maxLength
          const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
            const newValue = event.currentTarget.value;
            if (maxLength && newValue.length > maxLength) {
              // Truncate to maxLength
              const truncatedValue = newValue.slice(0, maxLength);
              form.setFieldValue(fullFieldName, truncatedValue);
            } else {
              // Call original onChange if it exists
              inputProps.onChange?.(event);
            }
          };

          return (
            <Stack key={form.key(fullFieldName)} gap="sm">
              {/* Render label separately if this is a prompt field, so we can add buttons next to it */}
              {fieldName === "prompt" && !fieldSchema.readOnly && (
                <Group align="center" justify="space-between">
                  <Box>
                    <Text size="sm" fw={500}>
                      {fieldSchema.title || fieldName}
                      {isRequired && <span style={{ color: "red" }}> *</span>}
                    </Text>
                  </Box>

                  <Group gap="xs">
                    <RandomPromptButton generationType={generationType} fieldName={fullFieldName} />
                    <EnhancePromptButton
                      generationType={generationType}
                      fieldName={fullFieldName}
                    />

                    <PromptActionButtons fieldName={fullFieldName} fieldValue={currentValue} />
                  </Group>
                </Group>
              )}
              <Textarea
                label={fieldName !== "prompt" ? fieldSchema.title || fieldName : undefined}
                //description={fieldName !== "prompt" ? fieldSchema.description : undefined}
                placeholder={
                  fieldName === "prompt" && !currentValue
                    ? "Generating your prompt..."
                    : fieldSchema.placeholder
                }
                required={isRequired}
                value={currentValue}
                onChange={handleChange}
                minRows={fieldName === "prompt" ? 4 : 1}
                autosize
                resize="vertical"
                readOnly={fieldSchema.readOnly}
                maxLength={maxLength}
                error={isMaxReached ? `Maximum character limit of ${maxLength} reached` : undefined}
                styles={
                  fieldSchema.readOnly
                    ? {
                        input: {
                          backgroundColor: "#f8f9fa",
                          color: "#6c757d",
                          cursor: "not-allowed",
                        },
                      }
                    : undefined
                }
              />
              {maxLength && !fieldSchema.readOnly && (
                <Text size="xs" c={isMaxReached ? "red" : "dimmed"} style={{ textAlign: "right" }}>
                  {currentLength}/{maxLength} characters
                  {isMaxReached && " (max reached)"}
                </Text>
              )}
            </Stack>
          );
        }

      case "number":
      case "integer":
        // Check if display is set to "boxes" and has enum values
        if (fieldSchema.display === "boxes" && fieldSchema.enum) {
          return (
            <SelectableIntegerBoxesRenderer
              fieldName={fieldName}
              fieldSchema={fieldSchema}
              isRequired={isRequired}
              fieldPrefix={fieldPrefix}
            />
          );
        }

        return (
          <NumberInput
            key={form.key(fullFieldName)}
            label={fieldSchema.title || fieldName}
            //description={fieldSchema.description}
            placeholder={fieldSchema.placeholder}
            required={isRequired}
            {...form.getInputProps(fullFieldName)}
            min={fieldSchema.minimum}
            max={fieldSchema.maximum}
            step={fieldSchema.step || fieldSchema.multipleOf || 1}
          />
        );

      case "boolean": {
        const inputProps = form.getInputProps(fullFieldName);
        return (
          <Switch
            key={form.key(fullFieldName)}
            label={fieldSchema.title || fieldName}
            //description={fieldSchema.description}
            checked={inputProps.value || false}
            onChange={inputProps.onChange}
            error={inputProps.error}
          />
        );
      }

      default:
        return (
          <TextInput
            key={form.key(fullFieldName)}
            label={fieldSchema.title || fieldName}
            //={fieldSchema.description}
            placeholder={fieldSchema.placeholder}
            required={isRequired}
            {...form.getInputProps(fullFieldName)}
          />
        );
    }
  };

  return (
    <>
      {Object.entries(properties).map(([fieldName, fieldSchema]) => {
        const field = fieldSchema as any;
        const isRequired = required.includes(fieldName);
        return <div key={fieldName}>{renderField(fieldName, field, isRequired)}</div>;
      })}
    </>
  );
}

export function SchemaFormGenerator({
  schema,
  showNoSchemaMessage = true,
  showNoFieldsMessage = true,
  generationType = "image",
}: SchemaFormGeneratorProps) {
  const form = useFormContext();
  const defaultsSetRef = useRef(false);

  if (!schema) {
    return showNoSchemaMessage ? <Text c="dimmed">No schema available</Text> : null;
  }

  // Handle string schema
  let parsedSchema = schema;
  if (typeof schema === "string") {
    try {
      parsedSchema = JSON.parse(schema);
    } catch (error) {
      console.error("Error parsing schema string:", error);
      return <Text c="red">Invalid JSON schema</Text>;
    }
  }

  if (typeof parsedSchema !== "object" || !parsedSchema) {
    return <Text c="dimmed">Invalid schema format</Text>;
  }

  // Check for different schema structures
  let properties: Record<string, any> = {};
  let required: string[] = [];

  // Try inputSchema first (MCP format)
  if (parsedSchema.inputSchema && parsedSchema.inputSchema.properties) {
    properties = parsedSchema.inputSchema.properties || {};
    required = parsedSchema.inputSchema.required || [];
  }
  // Fallback to direct properties (standard JSON Schema format)
  else if (parsedSchema.properties) {
    properties = parsedSchema.properties || {};
    required = parsedSchema.required || [];
  }

  // If order prop is provided, use it to reorder properties
  // This ensures the order matches what's in the database
  if (parsedSchema.order && Array.isArray(parsedSchema.order) && parsedSchema.order.length > 0) {
    const orderedProperties: Record<string, any> = {};
    // Add properties in the order specified by the order array
    parsedSchema.order.forEach((key: string) => {
      if (properties[key]) {
        orderedProperties[key] = properties[key];
      }
    });
    // Add any remaining properties that weren't in the order array
    Object.keys(properties).forEach((key) => {
      if (!orderedProperties[key]) {
        orderedProperties[key] = properties[key];
      }
    });
    properties = orderedProperties;
  }

  // Set default values using useEffect to avoid render-time state updates
  useEffect(() => {
    // Only set defaults once per schema to prevent infinite loops
    if (defaultsSetRef.current) {
      return;
    }

    const defaultValues: Record<string, any> = {};

    // Helper function to get nested value safely
    const getNestedValue = (obj: any, path: string) => {
      return path.split(".").reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : undefined;
      }, obj);
    };

    // Recursive function to set defaults for nested objects
    const setDefaultsForField = (fieldName: string, fieldSchema: any, prefix = "") => {
      const fullFieldName = prefix ? `${prefix}.${fieldName}` : fieldName;
      const currentValue = getNestedValue(form.values, fullFieldName);

      // Check if we need to set a default value
      const needsDefault =
        currentValue === undefined ||
        currentValue === null ||
        // For booleans, if schema has explicit default and current value is the implicit default (false),
        // we should apply the schema default if it's different
        (fieldSchema.type === "boolean" &&
          fieldSchema.default !== undefined &&
          currentValue === false &&
          fieldSchema.default === true);

      if (needsDefault) {
        if (fieldSchema.default !== undefined) {
          setNestedValue(defaultValues, fullFieldName, fieldSchema.default);
        } else {
          // Set appropriate default based on field type
          switch (fieldSchema.type) {
            case "string":
              setNestedValue(defaultValues, fullFieldName, fieldSchema.default || "");
              break;
            case "number":
            case "integer":
              if (fieldSchema.enum && fieldSchema.enum.length > 0) {
                // For integer enums, use the first enum value as default
                const firstEnumValue = fieldSchema.enum[0];
                const numericValue =
                  typeof firstEnumValue === "string"
                    ? parseInt(firstEnumValue, 10)
                    : firstEnumValue;
                setNestedValue(defaultValues, fullFieldName, numericValue);
              } else {
                setNestedValue(defaultValues, fullFieldName, fieldSchema.minimum || 0);
              }
              break;
            case "boolean":
              setNestedValue(defaultValues, fullFieldName, false);
              break;
            case "array":
              if (fieldSchema.items && fieldSchema.items.type === "object") {
                setNestedValue(defaultValues, fullFieldName, []);
              } else {
                setNestedValue(defaultValues, fullFieldName, []);
              }
              break;
            case "object":
              if (fieldSchema.properties) {
                setNestedValue(defaultValues, fullFieldName, {});
                // Recursively set defaults for nested properties
                Object.entries(fieldSchema.properties).forEach(
                  ([nestedFieldName, nestedFieldSchema]) => {
                    setDefaultsForField(nestedFieldName, nestedFieldSchema, fullFieldName);
                  }
                );
              }
              break;
            default:
              setNestedValue(defaultValues, fullFieldName, "");
          }
        }
      }
    };

    // Helper function to set nested values in an object
    const setNestedValue = (obj: any, path: string, value: any) => {
      const keys = path.split(".");
      let current = obj;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
    };

    // Set defaults for all fields (include read-only fields in values but don't render them)
    for (const [fieldName, fieldSchema] of Object.entries(properties)) {
      setDefaultsForField(fieldName, fieldSchema);
    }

    if (Object.keys(defaultValues).length > 0) {
      // Only set missing values to avoid overwriting existing defaults
      Object.entries(defaultValues).forEach(([key, value]) => {
        const currentValue = form.getValues()[key];

        // For objects, check if it's empty
        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
          const isObjectEmpty = Object.keys(value).length === 0;
          const isCurrentValueEmpty =
            currentValue === undefined ||
            currentValue === null ||
            currentValue === "" ||
            (typeof currentValue === "object" && Object.keys(currentValue).length === 0);

          if (isCurrentValueEmpty && !isObjectEmpty) {
            form.setFieldValue(key, value);
          }
        } else if (
          currentValue === undefined ||
          currentValue === null ||
          currentValue === "" ||
          // For booleans, if the schema default is true but current value is false (implicit default),
          // apply the schema default
          (typeof value === "boolean" && value === true && currentValue === false)
        ) {
          form.setFieldValue(key, value);
        }
      });
    }

    defaultsSetRef.current = true;
  }, [properties, form]);

  if (Object.keys(properties).length === 0) {
    return showNoFieldsMessage ? <Text c="dimmed">No form fields found in schema</Text> : null;
  }

  return (
    <Stack gap="xl">
      <NestedFieldRenderer
        properties={properties}
        required={required}
        generationType={generationType}
      />
    </Stack>
  );
}
