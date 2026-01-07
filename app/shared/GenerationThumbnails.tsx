import { Box, Button, Card, Group, Image, Loader, Stack, Text, ThemeIcon } from "@mantine/core";
import { Carousel } from "@mantine/carousel";
import { RiImageLine, RiVideoLine } from "@remixicon/react";
import { useEffect, useState } from "react";
import useAppStore from "~/lib/stores/appStore";
import type { GenerationFile } from "~/lib/stores/generateStore";

interface GenerationThumbnailsProps {
  modelId: string;
  onThumbnailClick?: (file: GenerationFile) => void;
}

export function GenerationThumbnails({ modelId, onThumbnailClick }: GenerationThumbnailsProps) {
  const { getUser, getApi } = useAppStore();
  const [thumbnails, setThumbnails] = useState<GenerationFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const user = getUser();
  const userId = user?.user?.id;
  const supabase = getApi();

  const loadThumbnails = async (pageNum: number = 1, append: boolean = false) => {
    if (!userId || !supabase || !modelId) return;

    setLoading(true);
    try {
      const limit = 10;
      const from = (pageNum - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await supabase
        .from("user_generations")
        .select(
          `
          *,
          models(*),
          user_generation_files(
            file_id,
            user_files!inner(*)
          )
        `,
          { count: "exact" }
        )
        .eq("user_id", userId)
        .eq("model_id", modelId)
        .eq("status", "completed")
        .eq("user_generation_files.user_files.status", "active")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        console.error("Error loading thumbnails:", error);
        return;
      }

      const newThumbnails = data || [];
      const total = count || 0;
      const hasMoreData = pageNum * limit < total;

      if (append) {
        setThumbnails((prev) => [...prev, ...newThumbnails]);
      } else {
        setThumbnails(newThumbnails);
      }

      setHasMore(hasMoreData);
      setPage(pageNum);
    } catch (err) {
      console.error("Error loading thumbnails:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    loadThumbnails(page + 1, true);
  };

  const getThumbnailUrls = (file: GenerationFile) => {
    if (file.user_generation_files && file.user_generation_files.length > 0) {
      return file.user_generation_files
        .filter((relation) => relation.user_files.status !== "deleted")
        .map((relation) => relation.user_files.file_path);
    }
    return [];
  };

  const getFileIcon = (fileUrl: string) => {
    if (fileUrl.includes("video") || fileUrl.includes(".mp4") || fileUrl.includes(".webm")) {
      return <RiVideoLine size={16} />;
    }
    return <RiImageLine size={16} />;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString();
  };

  useEffect(() => {
    if (modelId) {
      loadThumbnails(1, false);
    }
  }, [modelId, userId, supabase]);

  if (!modelId) {
    return null;
  }

  const totalFiles = thumbnails.reduce(
    (total, file) => total + (file.user_generation_files?.length || 0),
    0
  );

  return (
    <Card radius="xs" p="xs">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Text size="sm" fw={600}>
            Previous Generations
          </Text>
          {!loading && thumbnails.length > 0 && (
            <Text size="xs" c="dimmed">
              {totalFiles} file{totalFiles !== 1 ? "s" : ""}
            </Text>
          )}
        </Group>

        {loading && thumbnails.length === 0 ? (
          <Group justify="center">
            <Loader size="sm" />
            <Text size="sm" c="dimmed">
              Loading previous generations...
            </Text>
          </Group>
        ) : thumbnails.length === 0 ? (
          <Group justify="center">
            <Text size="sm" c="dimmed">
              No previous generations found
            </Text>
          </Group>
        ) : (
          <Carousel
            withControls
            withIndicators={false}
            slideSize="120px"
            slideGap="sm"
            //height={140}
          >
            {thumbnails.flatMap((file) => {
              const fileUrls = getThumbnailUrls(file);

              // If no files, return a single placeholder slide
              if (fileUrls.length === 0) {
                return (
                  <Carousel.Slide key={`${file.id}-placeholder`}>
                    <Card
                      withBorder
                      radius="sm"
                      p="xs"
                      style={{
                        cursor: "pointer",
                        height: "120px",
                        width: "120px",
                        overflow: "hidden",
                      }}
                      onClick={() => onThumbnailClick?.(file)}
                    >
                      <Stack gap="xs" h="100%">
                        <Box
                          style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "var(--mantine-color-gray-1)",
                            borderRadius: "4px",
                            overflow: "hidden",
                          }}
                        >
                          <ThemeIcon color="gray" variant="light" size="lg">
                            <RiImageLine size={20} />
                          </ThemeIcon>
                        </Box>

                        <Group gap="xs" justify="space-between">
                          <ThemeIcon color="blue" variant="light" size="xs">
                            <RiImageLine size={16} />
                          </ThemeIcon>
                          <Text size="xs" c="dimmed" truncate>
                            {formatTime(file.created_at)}
                          </Text>
                        </Group>
                      </Stack>
                    </Card>
                  </Carousel.Slide>
                );
              }

              // Return a slide for each file
              return fileUrls.map((fileUrl, index) => {
                const isVideo =
                  fileUrl.includes("video") ||
                  fileUrl.includes(".mp4") ||
                  fileUrl.includes(".webm");

                return (
                  <Carousel.Slide key={`${file.id}-${index}`}>
                    <Card
                      withBorder
                      radius="sm"
                      p="xs"
                      style={{
                        cursor: "pointer",
                        height: "120px",
                        width: "120px",
                        overflow: "hidden",
                      }}
                      onClick={() => onThumbnailClick?.(file)}
                    >
                      <Stack gap="xs" h="100%">
                        <Box
                          style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "var(--mantine-color-gray-1)",
                            borderRadius: "4px",
                            overflow: "hidden",
                          }}
                        >
                          {isVideo ? (
                            <video
                              src={fileUrl}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                              muted
                            />
                          ) : (
                            <Image
                              src={fileUrl}
                              alt={`Generation thumbnail ${index + 1}`}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          )}
                        </Box>

                        <Group gap="xs" justify="space-between">
                          <ThemeIcon color="blue" variant="light" size="xs">
                            {getFileIcon(fileUrl)}
                          </ThemeIcon>
                          <Text size="xs" c="dimmed" truncate>
                            {formatTime(file.created_at)}
                            {fileUrls.length > 1 && ` (${index + 1})`}
                          </Text>
                        </Group>
                      </Stack>
                    </Card>
                  </Carousel.Slide>
                );
              });
            })}

            {hasMore && (
              <Carousel.Slide>
                <Card
                  withBorder
                  radius="sm"
                  p="xs"
                  style={{
                    height: "120px",
                    width: "120px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Button
                    variant="light"
                    size="sm"
                    loading={loading}
                    onClick={handleLoadMore}
                    style={{ height: "100%", width: "100%" }}
                  >
                    Load More
                  </Button>
                </Card>
              </Carousel.Slide>
            )}
          </Carousel>
        )}
      </Stack>
    </Card>
  );
}
