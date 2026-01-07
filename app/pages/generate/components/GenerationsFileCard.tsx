import {
  Alert,
  Badge,
  Card,
  Group,
  Loader,
  Progress,
  Stack,
  Text,
  ThemeIcon,
  Button,
  useMantineColorScheme,
} from "@mantine/core";
import { RiCheckLine, RiErrorWarningLine, RiTimeLine, RiDeleteBinLine } from "@remixicon/react";
import { useEffect } from "react";
import useAppStore from "~/lib/stores/appStore";
import useGenerateStore, { type GenerationFile } from "~/lib/stores/generateStore";
import MemberFilesCard from "~/pages/files/MemberFilesCard";
import { TokensBadge } from "~/shared/TokensBadge";

interface GenerationsFileCardProps {
  file: GenerationFile;
  onFileUpdate?: () => void;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
}

export function GenerationsFileCard({
  file,
  onFileUpdate,
  selected = false,
  onSelect,
}: GenerationsFileCardProps) {
  const { getUser, getApi } = useAppStore();
  const { refreshGeneration, deleteGeneration } = useGenerateStore();
  const { colorScheme } = useMantineColorScheme();
  const user = getUser();
  const userId = user?.user?.id;
  const supabase = getApi();
  // Check if file is in a processing state (pending or processing)
  const isProcessing = file.status === "pending" || file.status === "processing";
  const isFailed = file.status === "failed" || file.status === "error";

  const handleDelete = async () => {
    const success = await deleteGeneration(file.id);
    if (success && onFileUpdate) {
      onFileUpdate();
    }
  };

  const getStatusColor = (status: string) => {
    if (isProcessing) return "yellow";
    if (status === "completed") return "green";
    if (status === "failed") return "red";
    return "gray";
  };

  const getStatusIcon = (status: string) => {
    if (isProcessing) return <Loader size={16} />;
    if (status === "completed") return <RiCheckLine size={16} />;
    return <RiErrorWarningLine size={16} />;
  };

  const getStatusLabel = (status: string) => {
    if (isProcessing) return "Processing";
    if (status === "completed") return "Completed";
    return "Failed";
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  // Poll for updates if status is pending or processing
  useEffect(() => {
    if (!userId || !supabase || !isProcessing) {
      return;
    }

    const interval = setInterval(() => {
      refreshGeneration(file.id, userId, supabase);
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [file.id, isProcessing, userId, supabase, refreshGeneration]);

  return (
    <Card
      radius="sm"
      padding={0}
      pos="relative"
      bg={colorScheme === "dark" ? "dark.6" : "gray.0"}
      style={{
        border: selected ? "2px solid var(--mantine-color-blue-6)" : undefined,
        cursor: onSelect ? "pointer" : undefined,
      }}
    >
      {file.status === "completed" &&
        file.user_generation_files &&
        file.user_generation_files.length > 0 &&
        file.user_generation_files.map((fileRelation) => {
          const fileData = fileRelation.user_files;
          if (fileData.status !== "deleted") {
            return (
              <div key={fileData.id} data-member-files-card>
                <MemberFilesCard
                  file={fileData}
                  onFileUpdate={onFileUpdate}
                  selected={selected}
                  onSelect={onSelect}
                />
              </div>
            );
          }
        })}
      <Stack p="md">
        <Group gap="sm">
          <Text size="sm" fw={500}>
            {file.models?.name || "Unknown Model"}
          </Text>
        </Group>
        <Group gap="sm">
          <Group gap="xs" justify="space-between">
            <Group>
              <Badge color={getStatusColor(file.status)} variant="light">
                {getStatusLabel(file.status)}
              </Badge>
            </Group>

            <Group>
              {file.cost && (
                <Group gap={4}>
                  <Text size="xs" c="dimmed">
                    <TokensBadge size="xs" tokens={file.cost} />
                  </Text>
                </Group>
              )}
            </Group>
          </Group>
          <Group gap={4}>
            <ThemeIcon color="gray" size="xs" variant="subtle">
              <RiTimeLine size={12} />
            </ThemeIcon>
            <Text size="xs" c="dimmed">
              {formatTime(file.created_at)} ({file.duration}s)
            </Text>
          </Group>
        </Group>

        {file.status !== "completed" && (
          <Progress
            value={100}
            size="sm"
            color={getStatusColor(file.status)}
            animated={isProcessing}
            striped={isProcessing}
          />
        )}

        {isProcessing && (
          <Text size="xs" c="dimmed" ta="center">
            Processing... This may take a few minutes
          </Text>
        )}

        {isFailed && (
          <Stack gap="sm">
            <Alert icon={<RiErrorWarningLine size={16} />} title="Generation Failed" color="red">
              <Text size="xs">
                {file.payload?.callback_data?.failMsg ||
                  file.polling_response?.msg ||
                  "Generation failed. Please try again."}
              </Text>
            </Alert>
            <Button
              leftSection={<RiDeleteBinLine size={16} />}
              variant="light"
              color="red"
              size="xs"
              onClick={handleDelete}
              fullWidth
            >
              Delete Generation
            </Button>
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
