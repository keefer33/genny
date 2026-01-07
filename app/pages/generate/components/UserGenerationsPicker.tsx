import {
  Modal,
  SimpleGrid,
  Card,
  Stack,
  Group,
  Text,
  Badge,
  Loader,
  Alert,
  Image,
  Box,
  Button,
  Pagination,
  useMantineColorScheme,
  ThemeIcon,
} from "@mantine/core";
import { useEffect, useState } from "react";
import useAppStore from "~/lib/stores/appStore";
import type { GenerationFile } from "~/lib/stores/generateStore";
import { RiCheckLine, RiTimeLine } from "@remixicon/react";

interface UserGenerationsPickerProps {
  opened: boolean;
  onClose: () => void;
  onSelect: (value: string, generation: GenerationFile) => void;
  title?: string;
  displayFilter: {
    field: string;
    values: string[];
  };
  displayFieldValue: string;
}

export function UserGenerationsPicker({
  opened,
  onClose,
  onSelect,
  title = "Select Generation",
  displayFilter,
  displayFieldValue,
}: UserGenerationsPickerProps) {
  const { getUser, getApi, isMobile } = useAppStore();
  const { colorScheme } = useMantineColorScheme();
  const [generations, setGenerations] = useState<GenerationFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const user = getUser();
  const userId = user?.user?.id;
  const supabase = getApi();

  // Load generations when modal opens
  useEffect(() => {
    if (opened && userId && supabase && displayFilter.values.length > 0) {
      loadGenerations(1);
    }
  }, [opened, userId, supabase, displayFilter.values]);

  const loadGenerations = async (page: number = 1) => {
    if (!userId || !supabase) return;

    setLoading(true);
    try {
      const limit = 12;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const query = supabase
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
        `,
          { count: "exact" }
        )
        .eq("user_id", userId)
        .eq("status", "completed")
        .in(displayFilter.field, displayFilter.values)
        .order("created_at", { ascending: false });

      const { data, error, count } = await query.range(from, to);

      if (error) {
        console.error("Error fetching generations:", error);
        return;
      }

      const totalCount = count || 0;
      const totalPagesCount = Math.ceil(totalCount / limit);

      setGenerations(data || []);
      setTotal(totalCount);
      setTotalPages(totalPagesCount);
      setCurrentPage(page);
    } catch (err: any) {
      console.error("Error fetching generations:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    loadGenerations(page);
  };

  const handleSelect = (generation: GenerationFile) => {
    // Get the value from displayFieldValue (e.g., "task_id")
    const value = generation[displayFieldValue as keyof GenerationFile];
    if (value) {
      onSelect(String(value), generation);
      onClose();
    }
  };

  const getThumbnailUrl = (generation: GenerationFile): string | null => {
    if (generation.user_generation_files && generation.user_generation_files.length > 0) {
      const firstFile = generation.user_generation_files[0].user_files;
      if (firstFile) {
        // Use thumbnail_url first, fallback to file_path
        return firstFile.thumbnail_url || firstFile.file_path || null;
      }
    }
    return null;
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
      size="xl"
      fullScreen={isMobile}
      centered={!isMobile}
      overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
    >
      <Stack gap="md">
        {loading ? (
          <Box ta="center" py="xl">
            <Loader size="lg" />
            <Text mt="md">Loading generations...</Text>
          </Box>
        ) : generations.length === 0 ? (
          <Alert title="No generations found" color="yellow">
            No completed generations found for the selected models.
          </Alert>
        ) : (
          <>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
              {generations.map((generation) => {
                const thumbnailUrl = getThumbnailUrl(generation);
                return (
                  <Card
                    key={generation.id}
                    withBorder
                    radius="md"
                    p="sm"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleSelect(generation)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        colorScheme === "dark"
                          ? "var(--mantine-color-dark-5)"
                          : "var(--mantine-color-gray-0)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <Stack gap="xs">
                      {/* Thumbnail */}
                      <Box
                        style={{
                          height: 120,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor:
                            colorScheme === "dark"
                              ? "var(--mantine-color-dark-6)"
                              : "var(--mantine-color-gray-1)",
                          borderRadius: "4px",
                          overflow: "hidden",
                        }}
                      >
                        {thumbnailUrl ? (
                          generation.user_generation_files?.[0]?.user_files?.file_type?.startsWith(
                            "image/"
                          ) ? (
                            <Image
                              src={thumbnailUrl}
                              alt="Generation thumbnail"
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : generation.user_generation_files?.[0]?.user_files?.file_type?.startsWith(
                              "video/"
                            ) ? (
                            // For videos, use thumbnail_url if available, otherwise use video element
                            generation.user_generation_files?.[0]?.user_files?.thumbnail_url ? (
                              <Image
                                src={generation.user_generation_files[0].user_files.thumbnail_url}
                                alt="Video thumbnail"
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              <video
                                src={thumbnailUrl}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                                muted
                                preload="metadata"
                              />
                            )
                          ) : (
                            <ThemeIcon size="xl" color="gray" variant="light">
                              📄
                            </ThemeIcon>
                          )
                        ) : (
                          <ThemeIcon size="xl" color="gray" variant="light">
                            📄
                          </ThemeIcon>
                        )}
                      </Box>

                      {/* Generation Info */}
                      <Stack gap="xs">
                        <Text size="sm" fw={500} lineClamp={1}>
                          {generation.models?.name || "Unknown Model"}
                        </Text>
                        <Group justify="space-between" align="center">
                          <Group gap="xs">
                            <ThemeIcon color="green" variant="light" size="sm">
                              <RiCheckLine size={14} />
                            </ThemeIcon>
                            <Badge size="xs" variant="light" color="green">
                              Completed
                            </Badge>
                          </Group>
                          <Group gap={4}>
                            <ThemeIcon color="gray" size="xs" variant="subtle">
                              <RiTimeLine size={12} />
                            </ThemeIcon>
                            <Text size="xs" c="dimmed">
                              {formatDate(generation.created_at)}
                            </Text>
                          </Group>
                        </Group>
                        {generation.task_id && (
                          <Text size="xs" c="dimmed">
                            Task: {generation.task_id.slice(0, 8)}...
                          </Text>
                        )}
                      </Stack>
                    </Stack>
                  </Card>
                );
              })}
            </SimpleGrid>

            {/* Pagination */}
            {totalPages > 1 && (
              <Group justify="center" mt="md">
                <Pagination
                  total={totalPages}
                  value={currentPage}
                  onChange={handlePageChange}
                  size="sm"
                  withEdges
                />
              </Group>
            )}

            {/* Footer */}
            <Group justify="space-between" mt="md">
              <Text size="sm" c="dimmed">
                {generations.length} of {total} generations
              </Text>
              <Button variant="light" onClick={onClose}>
                Cancel
              </Button>
            </Group>
          </>
        )}
      </Stack>
    </Modal>
  );
}
