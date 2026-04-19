import { useEffect, useMemo } from "react";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Group,
  Loader,
  Progress,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { Link } from "react-router";
import {
  RiDashboardLine,
  RiArrowRightLine,
  RiImageLine,
  RiVideoLine,
  RiFileListLine,
  RiCoinsLine,
  RiHistoryLine,
  RiToolsLine,
  RiCheckLine,
  RiCloseLine,
} from "@remixicon/react";

import Mounted from "~/shared/Mounted";
import {
  genModelDisplayEmbedFromRunRow,
  runHistoryModelLabel,
} from "~/lib/playgroundRunHistoryUtils";
import useAppStore from "~/lib/stores/appStore";
import { useChatsStore } from "~/lib/stores/chatsStore";
import usePlaygroundStore from "~/lib/stores/playgroundStore";
import useFilesFoldersStore from "~/lib/stores/filesFoldersStore";
import useUsageLogStore, { type UsageLogEntry } from "~/lib/stores/usageLogStore";

function formatMoney(value: number) {
  if (!Number.isFinite(value)) return "$0.00";
  return `$${value.toFixed(2)}`;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function statusToBadgeColor(status: string | null | undefined) {
  const s = (status ?? "").toLowerCase();
  if (s === "completed") return "green";
  if (s === "failed" || s === "error") return "red";
  if (s === "processing") return "yellow";
  if (s === "pending") return "blue";
  return "gray";
}

export function meta() {
  return [{ title: "Dashboard" }];
}

export default function Dashboard() {
  const { getUser, isMobile, getCurrentUserUsageBalance } = useAppStore();
  const user = getUser();
  const userId = user?.user?.id;

  const { listChats, chats, chatsLoading } = useChatsStore();

  const { runHistory, runHistoryTotal, runHistoryLoading, fetchPlaygroundRunHistory } =
    usePlaygroundStore();

  const { paginationData, gridLoading: filesLoading, loadUserFiles } = useFilesFoldersStore();

  const { logs, logsLoading, fetchUsageLog } = useUsageLogStore();

  useEffect(() => {
    if (!userId) return;
    void listChats();
    void fetchPlaygroundRunHistory({ page: 1, limit: 9 });

    // Limit list preview to 4 rows; `runHistoryTotal` is full count from API.
    void loadUserFiles(1, 4, userId, undefined, undefined, "all");
    void fetchUsageLog(1, 8);
  }, [userId]);

  const stats = useMemo(() => {
    const generationTotal = runHistoryTotal ?? 0;
    const filesTotal = paginationData?.total ?? 0;

    const mostRecentGenerationAt =
      runHistory.reduce<string | null>((acc, gen) => {
        const t = gen.created_at ?? null;
        if (!t) return acc;
        if (!acc) return t;
        return new Date(t).getTime() > new Date(acc).getTime() ? t : acc;
      }, null) ?? null;

    return { generationTotal, filesTotal, mostRecentGenerationAt };
  }, [runHistoryTotal, paginationData?.total, runHistory]);

  const recentGenerations = useMemo(() => runHistory.slice(0, 4), [runHistory]);
  const recentFiles = useMemo(
    () => paginationData?.data?.slice(0, 4) ?? [],
    [paginationData?.data]
  );
  const recentChats = useMemo(() => chats.slice(0, 4), [chats]);

  const welcomeName =
    user?.profile?.first_name ?? user?.profile?.username ?? user?.user?.email ?? "there";

  const getLogType = (entry: UsageLogEntry): string => {
    if (entry.usage_log_types?.log_type) {
      const logType = entry.usage_log_types.log_type;
      return logType.charAt(0).toUpperCase() + logType.slice(1);
    }
    return entry.usage_amount > 0 ? "Credit" : "Debit";
  };

  const getLogTypeColor = (entry: UsageLogEntry): string => {
    const t = entry.usage_log_types?.log_type;
    if (t === "credit") return "green";
    if (t === "debit") return "red";
    return entry.usage_amount > 0 ? "green" : "red";
  };

  const getLogDisplayAmount = (entry: UsageLogEntry): number => {
    const t = entry.usage_log_types?.log_type;
    if (t === "credit") return Math.abs(entry.usage_amount);
    if (t === "debit") return -Math.abs(entry.usage_amount);
    return entry.usage_amount;
  };

  const hasGenerations = stats.generationTotal > 0;
  const hasFiles = stats.filesTotal > 0;

  const setupProgress = [hasGenerations, hasFiles].filter(Boolean).length;

  const setupPercent = (setupProgress / 3) * 100;

  const isLoading = runHistoryLoading || filesLoading || logsLoading || chatsLoading;

  const quickButtons = [
    {
      to: "/files",
      icon: RiFileListLine,
      label: "Files",
      description: hasFiles ? "Upload / manage files" : "Upload your first file",
    },
    {
      to: "/generations",
      icon: RiHistoryLine,
      label: "History",
      description: hasGenerations ? "View your generation results" : "See everything you generate",
    },
    {
      to: "/tools",
      icon: RiToolsLine,
      label: "Tools",
      description: "Connect toolkits (optional)",
    },
  ];

  return (
    <Mounted size="xl" pt="md">
      <Stack gap="xl">
        <Card radius="lg" p="xl" withBorder={false}>
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <Stack gap={4}>
              <Group gap="sm">
                <ThemeIcon size={40} radius="md" color="cyan" variant="light">
                  <RiDashboardLine size={20} />
                </ThemeIcon>
                <Title order={2}>Dashboard</Title>
              </Group>
              <Text c="dimmed" size="sm">
                Welcome back, {welcomeName}. Here's your latest activity and what you can do next.
              </Text>
            </Stack>

            <Stack align={isMobile ? "stretch" : "flex-end"} gap="xs">
              <Group gap="sm" wrap="nowrap">
                <ThemeIcon size={34} radius="md" color="yellow" variant="light">
                  <RiCoinsLine size={18} />
                </ThemeIcon>
                <Box>
                  <Text size="xs" c="dimmed">
                    Balance
                  </Text>
                  <Text fw={800}>{formatMoney(getCurrentUserUsageBalance())}</Text>
                </Box>
              </Group>
              <Text size="xs" c="dimmed">
                Latest generation: {formatDateTime(stats.mostRecentGenerationAt)}
              </Text>
            </Stack>
          </Group>
        </Card>

        {/* Stats */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
          <Card withBorder radius="md" p="md">
            <Stack gap={6}>
              <Group gap="sm">
                <ThemeIcon size={34} radius="md" variant="light" color="indigo">
                  <RiImageLine size={18} />
                </ThemeIcon>
                <Text fw={700}>Generations</Text>
              </Group>
              <Text size="xl" fw={900}>
                {isLoading && !hasGenerations ? "-" : stats.generationTotal.toLocaleString()}
              </Text>
              <Text size="sm" c="dimmed">
                {hasGenerations ? "Total results generated" : "Your first generation appears here"}
              </Text>
            </Stack>
          </Card>

          <Card withBorder radius="md" p="md">
            <Stack gap={6}>
              <Group gap="sm">
                <ThemeIcon size={34} radius="md" variant="light" color="grape">
                  <RiFileListLine size={18} />
                </ThemeIcon>
                <Text fw={700}>Files</Text>
              </Group>
              <Text size="xl" fw={900}>
                {isLoading && !hasFiles ? "-" : stats.filesTotal.toLocaleString()}
              </Text>
              <Text size="sm" c="dimmed">
                {hasFiles ? "Uploads and generated assets" : "Upload a file or generate content"}
              </Text>
            </Stack>
          </Card>

          <Card withBorder radius="md" p="md">
            <Stack gap={6}>
              <Group gap="sm">
                <ThemeIcon size={34} radius="md" variant="light" color="yellow">
                  <RiCoinsLine size={18} />
                </ThemeIcon>
                <Text fw={700}>Setup Progress</Text>
              </Group>
              <Text size="xl" fw={900}>
                {setupProgress}/3
              </Text>
              <Progress value={setupPercent} size="md" radius="xl" color="cyan" />
              <Text size="sm" c="dimmed">
                {setupProgress === 3
                  ? "You're fully set up."
                  : setupProgress === 2
                    ? "Almost there."
                    : setupProgress === 1
                      ? "Good start - finish onboarding."
                      : "Let's get you started."}
              </Text>
            </Stack>
          </Card>
        </SimpleGrid>

        {/* Get started */}
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <Card withBorder radius="lg" p="lg">
            <Stack gap="md">
              <Group justify="space-between" align="flex-start">
                <Stack gap={2}>
                  <Title order={3}>Get started</Title>
                  <Text size="sm" c="dimmed">
                    A quick checklist based on your activity so far.
                  </Text>
                </Stack>
                <ActionIcon component={Link} to="/tools" variant="default" aria-label="Tools">
                  <RiArrowRightLine size={18} />
                </ActionIcon>
              </Group>

              <Divider />

              <Stack gap="sm">
                <Group justify="space-between">
                  <Group gap="sm">
                    {hasGenerations ? (
                      <ThemeIcon size={26} radius="xl" color="green" variant="light">
                        <RiCheckLine size={14} />
                      </ThemeIcon>
                    ) : (
                      <ThemeIcon size={26} radius="xl" color="gray" variant="light">
                        <RiCloseLine size={14} />
                      </ThemeIcon>
                    )}
                    <Box>
                      <Text fw={700}>Run your first generation</Text>
                      <Text size="xs" c="dimmed">
                        Generate results from an image/video model.
                      </Text>
                    </Box>
                  </Group>
                  <Button
                    component={Link}
                    to="/agents"
                    size="xs"
                    variant={hasGenerations ? "light" : "filled"}
                    disabled={hasGenerations}
                  >
                    {hasGenerations ? "Done" : "Start"}
                  </Button>
                </Group>

                <Group justify="space-between">
                  <Group gap="sm">
                    {hasGenerations ? (
                      <ThemeIcon size={26} radius="xl" color="green" variant="light">
                        <RiCheckLine size={14} />
                      </ThemeIcon>
                    ) : (
                      <ThemeIcon size={26} radius="xl" color="gray" variant="light">
                        <RiCloseLine size={14} />
                      </ThemeIcon>
                    )}
                    <Box>
                      <Text fw={700}>Run your first generation</Text>
                      <Text size="xs" c="dimmed">
                        Generate results from an image/video model.
                      </Text>
                    </Box>
                  </Group>
                  <Button
                    component={Link}
                    to="/playground"
                    size="xs"
                    variant={hasGenerations ? "light" : "filled"}
                    disabled={hasGenerations}
                  >
                    {hasGenerations ? "Done" : "Generate"}
                  </Button>
                </Group>

                <Group justify="space-between">
                  <Group gap="sm">
                    {hasFiles ? (
                      <ThemeIcon size={26} radius="xl" color="green" variant="light">
                        <RiCheckLine size={14} />
                      </ThemeIcon>
                    ) : (
                      <ThemeIcon size={26} radius="xl" color="gray" variant="light">
                        <RiCloseLine size={14} />
                      </ThemeIcon>
                    )}
                    <Box>
                      <Text fw={700}>Save files</Text>
                      <Text size="xs" c="dimmed">
                        Upload inputs and keep outputs in one place.
                      </Text>
                    </Box>
                  </Group>
                  <Button
                    component={Link}
                    to="/files"
                    size="xs"
                    variant={hasFiles ? "light" : "filled"}
                    disabled={hasFiles}
                  >
                    {hasFiles ? "Done" : "Upload"}
                  </Button>
                </Group>
              </Stack>
            </Stack>
          </Card>

          <Card withBorder radius="lg" p="lg">
            <Stack gap="md">
              <Group justify="space-between" align="flex-start">
                <Stack gap={2}>
                  <Title order={3}>Quick links</Title>
                  <Text size="sm" c="dimmed">
                    Jump straight to the places you'll use most.
                  </Text>
                </Stack>
              </Group>

              <Divider />

              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                {quickButtons.map((b) => {
                  const Icon = b.icon;
                  return (
                    <Card
                      key={b.to}
                      radius="md"
                      p="sm"
                      withBorder={false}
                      style={{
                        background: "transparent",
                        border: "1px solid var(--mantine-color-gray-3)",
                      }}
                    >
                      <Stack gap={6}>
                        <Group justify="space-between" align="flex-start">
                          <Group gap="sm">
                            <ThemeIcon size={30} radius="md" variant="light" color="cyan">
                              <Icon size={16} />
                            </ThemeIcon>
                            <Text fw={800}>{b.label}</Text>
                          </Group>
                          <ActionIcon
                            component={Link}
                            to={b.to}
                            variant="subtle"
                            aria-label={`Go to ${b.label}`}
                          >
                            <RiArrowRightLine size={16} />
                          </ActionIcon>
                        </Group>
                        <Text size="xs" c="dimmed">
                          {b.description}
                        </Text>
                      </Stack>
                    </Card>
                  );
                })}
              </SimpleGrid>
            </Stack>
          </Card>
        </SimpleGrid>

        {/* Activity */}
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <Card withBorder radius="lg" p="lg">
            <Stack gap="md">
              <Group justify="space-between" align="flex-start">
                <Stack gap={2}>
                  <Title order={3}>Recent generations</Title>
                  <Text size="sm" c="dimmed">
                    The latest outputs from your account.
                  </Text>
                </Stack>
                <Button component={Link} to="/generations" variant="light" size="xs">
                  View all
                </Button>
              </Group>

              {runHistoryLoading && runHistory.length === 0 ? (
                <Stack align="center" py="xl">
                  <Loader />
                  <Text size="sm" c="dimmed">
                    Loading generations...
                  </Text>
                </Stack>
              ) : recentGenerations.length === 0 ? (
                <Stack align="center" py="xl">
                  <ThemeIcon size={46} color="gray" variant="light" radius="xl">
                    <RiImageLine size={22} />
                  </ThemeIcon>
                  <Text size="lg" c="dimmed">
                    No generations yet
                  </Text>
                  <Text size="sm" c="dimmed" ta="center">
                    Generate an image or video to start building your history.
                  </Text>
                  <Button component={Link} to="/playground" mt="md">
                    Start generating
                  </Button>
                </Stack>
              ) : (
                <Stack gap="sm">
                  {recentGenerations.map((gen) => (
                    <Group key={gen.id} justify="space-between" align="center">
                      <Group gap="sm" align="center" wrap="nowrap">
                        <ThemeIcon size={34} radius="md" variant="light" color="cyan">
                          {genModelDisplayEmbedFromRunRow(gen)?.generation_type === "video" ? (
                            <RiVideoLine size={30} />
                          ) : (
                            <RiImageLine size={18} />
                          )}
                        </ThemeIcon>
                        <Box>
                          <Text fw={800} size="sm">
                            {runHistoryModelLabel(gen)}
                          </Text>
                          <Group gap="xs">
                            <Badge size="sm" color={statusToBadgeColor(gen.status)} variant="light">
                              {gen.status ?? "-"}
                            </Badge>
                            {gen.cost != null && (
                              <Badge size="sm" color="yellow" variant="light">
                                {formatMoney(gen.cost ?? 0)}
                              </Badge>
                            )}
                          </Group>
                        </Box>
                      </Group>
                      <Text size="xs" c="dimmed">
                        {formatDateTime(gen.created_at)}
                      </Text>
                    </Group>
                  ))}
                </Stack>
              )}
            </Stack>
          </Card>

          <Card withBorder radius="lg" p="lg">
            <Stack gap="md">
              <Group justify="space-between" align="flex-start">
                <Stack gap={2}>
                  <Title order={3}>Latest activity</Title>
                  <Text size="sm" c="dimmed">
                    Token credits/debits and recent chats.
                  </Text>
                </Stack>
                <Button component={Link} to="/account/usage-log" variant="light" size="xs">
                  Usage
                </Button>
              </Group>

              <Divider />

              {logsLoading && logs.length === 0 ? (
                <Stack align="center" py="xl">
                  <Loader />
                  <Text size="sm" c="dimmed">
                    Loading usage...
                  </Text>
                </Stack>
              ) : logs.length === 0 ? (
                <Stack align="center" py="xl">
                  <ThemeIcon size={46} color="gray" variant="light" radius="xl">
                    <RiHistoryLine size={22} />
                  </ThemeIcon>
                  <Text size="lg" c="dimmed">
                    No usage events yet
                  </Text>
                  <Text size="sm" c="dimmed" ta="center">
                    When you generate or run agents, activity will show up here.
                  </Text>
                </Stack>
              ) : (
                <Stack gap="sm">
                  {logs.slice(0, 4).map((entry) => {
                    const displayAmount = getLogDisplayAmount(entry);
                    const typeColor = getLogTypeColor(entry);
                    const logType = getLogType(entry);
                    return (
                      <Group key={entry.id} justify="space-between" align="center" wrap="nowrap">
                        <Group gap="sm" align="center">
                          <Badge color={typeColor} variant="light" size="sm">
                            {logType}
                          </Badge>
                          <Text size="sm" fw={700} c={typeColor}>
                            {formatMoney(Math.abs(displayAmount))}
                          </Text>
                        </Group>
                        <Text size="xs" c="dimmed">
                          {formatDateTime(entry.created_at)}
                        </Text>
                      </Group>
                    );
                  })}
                </Stack>
              )}

              <Divider />

              <Stack gap="sm">
                <Group justify="space-between" align="center">
                  <Text fw={800} size="sm">
                    Recent chats
                  </Text>
                  <Button component={Link} to="/agents" variant="light" size="xs">
                    Open agents
                  </Button>
                </Group>

                {chatsLoading && chats.length === 0 ? (
                  <Stack align="center" py="sm">
                    <Loader size="sm" />
                    <Text size="xs" c="dimmed">
                      Loading chats...
                    </Text>
                  </Stack>
                ) : recentChats.length === 0 ? (
                  <Text size="sm" c="dimmed">
                    No chats yet. Start chatting from your Agents page.
                  </Text>
                ) : (
                  <Stack gap="xs">
                    {recentChats.map((c) => (
                      <Group key={c.id} justify="space-between" align="center">
                        <Text size="sm" fw={700}>
                          Chat {c.id.slice(0, 8)}...
                        </Text>
                        <Text size="xs" c="dimmed">
                          {formatDateTime(c.created_at)}
                        </Text>
                      </Group>
                    ))}
                  </Stack>
                )}
              </Stack>
            </Stack>
          </Card>
        </SimpleGrid>

        {/* Files preview */}
        <Card withBorder radius="lg" p="lg">
          <Stack gap="md">
            <Group justify="space-between" align="flex-start">
              <Stack gap={2}>
                <Title order={3}>Your files</Title>
                <Text size="sm" c="dimmed">
                  Recent uploads and outputs saved under your account.
                </Text>
              </Stack>
              <Button component={Link} to="/files" variant="light" size="xs">
                Manage files
              </Button>
            </Group>

            <Divider />

            {filesLoading && recentFiles.length === 0 ? (
              <Stack align="center" py="xl">
                <Loader />
                <Text size="sm" c="dimmed">
                  Loading files...
                </Text>
              </Stack>
            ) : recentFiles.length === 0 ? (
              <Stack align="center" py="xl">
                <ThemeIcon size={46} color="gray" variant="light" radius="xl">
                  <RiFileListLine size={22} />
                </ThemeIcon>
                <Text size="lg" c="dimmed">
                  No files found
                </Text>
                <Text size="sm" c="dimmed" ta="center">
                  Upload something to use with your tools and generations.
                </Text>
                <Button component={Link} to="/files" mt="md">
                  Upload a file
                </Button>
              </Stack>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="sm">
                {recentFiles.map((file) => {
                  const fileName = file.file_name ?? "File";
                  const createdAt = formatDateTime(file.created_at);
                  const sizeBytes: number | undefined =
                    typeof file.file_size === "number" ? file.file_size : undefined;
                  const sizeLabel =
                    sizeBytes != null ? `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB` : "-";

                  return (
                    <Card
                      key={file.id}
                      radius="md"
                      p="sm"
                      withBorder={false}
                      style={{ border: "1px solid var(--mantine-color-gray-3)" }}
                    >
                      <Stack gap={6}>
                        <Group justify="space-between" align="flex-start">
                          <ThemeIcon size={30} radius="md" variant="light" color="cyan">
                            <RiFileListLine size={16} />
                          </ThemeIcon>
                          <Badge size="sm" variant="light" color="gray">
                            {file.file_type?.split("/")?.[0] ?? "file"}
                          </Badge>
                        </Group>
                        <Text fw={800} size="sm" lineClamp={2}>
                          {fileName}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {createdAt} - {sizeLabel}
                        </Text>
                      </Stack>
                    </Card>
                  );
                })}
              </SimpleGrid>
            )}
          </Stack>
        </Card>
      </Stack>
    </Mounted>
  );
}
