import { useEffect, useMemo } from "react";
import { Box, Button, Card, Group, SimpleGrid, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { Link } from "react-router";
import {
  RiDashboardLine,
  RiFileListLine,
  RiCoinsLine,
  RiHistoryLine,
  RiToolsLine,
} from "@remixicon/react";

import Mounted from "~/shared/Mounted";

import useAppStore from "~/lib/stores/appStore";
import { useChatsStore } from "~/lib/stores/chatsStore";
import useGenerationsStore from "~/lib/stores/generateStore";
import useFilesFoldersStore from "~/lib/stores/filesFoldersStore";
import useSupportStore from "~/lib/stores/supportStore";
import useUsageLogStore, { type UsageLogEntry } from "~/lib/stores/usageLogStore";
import GenModelsProductScroller from "~/shared/GenModelsProductScroller";

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

export function meta() {
  return [{ title: "Dashboard" }];
}

export default function Dashboard() {
  const { getUser, isMobile, getCurrentUserUsageBalance } = useAppStore();
  const user = getUser();
  const userId = user?.user?.id;

  const { listChats, chats, chatsLoading } = useChatsStore();

  const {
    generationsHistory,
    generationsHistoryTotal,
    generationsHistoryLoading,
    fetchGenerationsHistory,
  } = useGenerationsStore();

  const { paginationData, gridLoading: filesLoading, loadUserFiles } = useFilesFoldersStore();
  const { tickets, ticketsLoading, fetchTickets } = useSupportStore();

  const { logs, logsLoading, fetchUsageLog } = useUsageLogStore();

  useEffect(() => {
    if (!userId) return;
    void listChats();
    void fetchGenerationsHistory({ page: 1, limit: 9 });

    // Dashboard file count should match Files page semantics: uploads only.
    void loadUserFiles(1, userId, undefined, "upload", undefined);
    void fetchTickets();
    void fetchUsageLog(1, 8);
  }, [userId]);

  const stats = useMemo(() => {
    const generationTotal = generationsHistoryTotal ?? 0;
    const filesTotal = paginationData?.data?.length ?? 0;

    const mostRecentGenerationAt =
      generationsHistory.reduce<string | null>((acc, gen) => {
        const t = gen.created_at ?? null;
        if (!t) return acc;
        if (!acc) return t;
        return new Date(t).getTime() > new Date(acc).getTime() ? t : acc;
      }, null) ?? null;

    return { generationTotal, filesTotal, mostRecentGenerationAt };
  }, [generationsHistoryTotal, paginationData?.total, generationsHistory]);

  const recentGenerations = useMemo(() => generationsHistory.slice(0, 4), [generationsHistory]);
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
  const openTicketsCount = tickets.filter(
    (t) => t.status === "opened" || t.status === "pending"
  ).length;
  const isLoading =
    generationsHistoryLoading || filesLoading || logsLoading || chatsLoading || ticketsLoading;

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
        </Group>

        {/* Stats */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
          <Card radius="md" p="md">
            <Stack gap="xs" align="center">
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
              <Group gap="xs">
                <Button component={Link} to="/account/billing" variant="light" size="compact-xs">
                  Billing
                </Button>
                <Button component={Link} to="/account/usage-log" variant="light" size="compact-xs">
                  Usage
                </Button>
              </Group>
            </Stack>
          </Card>
          <Card radius="md" p="md">
            <Stack gap={6} align="center">
              <Group gap="sm">
                <ThemeIcon size={34} radius="md" variant="light" color="indigo">
                  <RiHistoryLine size={18} />
                </ThemeIcon>
                <Text fw={700}>Generations</Text>
              </Group>
              <Group gap="xs">
                <Text size="xl" fw={900}>
                  {isLoading && !hasGenerations ? "-" : stats.generationTotal.toLocaleString()}
                </Text>
                <Button component={Link} to="/generations" variant="light" size="compact-xs">
                  View
                </Button>
              </Group>
              <Text size="sm" c="dimmed">
                {hasGenerations ? "Total results generated" : "Your first generation appears here"}
              </Text>
            </Stack>
          </Card>

          <Card radius="md" p="md">
            <Stack gap={6} align="center">
              <Group gap="sm">
                <ThemeIcon size={34} radius="md" variant="light" color="grape">
                  <RiFileListLine size={18} />
                </ThemeIcon>
                <Text fw={700}>Files / Assets</Text>
              </Group>
              <Group gap="xs">
                <Text size="xl" fw={900}>
                  {isLoading && !hasFiles ? "-" : stats.filesTotal.toLocaleString()}
                </Text>
                <Button component={Link} to="/files" variant="light" size="compact-xs">
                  View
                </Button>
              </Group>
              <Text size="sm" c="dimmed">
                {hasFiles ? "Uploaded files in your library" : "Upload your first file"}
              </Text>
            </Stack>
          </Card>

          <Card radius="md" p="md">
            <Stack gap={6} align="center">
              <Group gap="sm">
                <ThemeIcon size={34} radius="md" variant="light" color="yellow">
                  <RiToolsLine size={18} />
                </ThemeIcon>
                <Text fw={700}>Support</Text>
              </Group>
              <Group gap="xs">
                <Text size="xl" fw={900}>
                  {isLoading ? "-" : openTicketsCount.toLocaleString()}
                </Text>
                <Button component={Link} to="/account/support" variant="light" size="compact-xs">
                  Support
                </Button>
              </Group>
              <Text size="sm" c="dimmed">
                {openTicketsCount > 0
                  ? `${openTicketsCount} open support ticket${openTicketsCount === 1 ? "" : "s"}`
                  : "No open support tickets"}
              </Text>
            </Stack>
          </Card>
        </SimpleGrid>
        <Stack gap="md">
          <GenModelsProductScroller title="Video Models" generationType="video" />
          <GenModelsProductScroller title="Image Models" generationType="image" />
        </Stack>
      </Stack>
    </Mounted>
  );
}
