import {
  Badge,
  Box,
  Card,
  Container,
  Group,
  Stack,
  Text,
  Title,
  useMantineTheme,
  Divider,
  Table,
} from "@mantine/core";
import { RiHistoryLine, RiAddLine, RiSubtractLine } from "@remixicon/react";
import { useEffect } from "react";
import useAppStore from "~/lib/stores/appStore";
import useUsageLogStore, { type UsageLogEntry } from "~/lib/stores/usageLogStore";
import { CurrentBalance } from "~/shared/CurrentBalance";
import { AppPagination } from "~/shared/AppPagination";

export default function UsageLog() {
  const { getUser, isMobile } = useAppStore();
  const {
    logs,
    currentPage,
    totalPages,
    setLogs,
    setCurrentPage,
    setTotalPages,
    setLogsLoading,
    fetchUsageLog,
  } = useUsageLogStore();
  const theme = useMantineTheme();
  const itemsPerPage = 10;

  const user = getUser();

  useEffect(() => {
    loadUsageLog(currentPage);
  }, [currentPage, user?.user?.id]);

  const loadUsageLog = async (page: number = 1) => {
    if (!user?.user?.id) return;

    setLogsLoading(true);
    try {
      const result = await fetchUsageLog(page, itemsPerPage);

      if (result.success) {
        setLogs(result.data.logs);
        console.log("logs", result.data.logs);
        setTotalPages(Math.ceil(result.data.total / itemsPerPage));
      }
    } catch (error) {
      console.error("Error fetching usage log:", error);
    } finally {
      setLogsLoading(false);
    }
  };

  const getLogType = (entry: UsageLogEntry): string => {
    if (entry.usage_log_types?.log_type) {
      const logType = entry.usage_log_types.log_type;
      return logType.charAt(0).toUpperCase() + logType.slice(1);
    }
    return entry.usage_amount > 0 ? "Credit" : "Debit";
  };

  const getReasonCode = (entry: UsageLogEntry): string => {
    return entry.usage_log_types?.reason_code || "—";
  };

  const getDisplayAmount = (entry: UsageLogEntry): number => {
    if (entry.usage_log_types?.log_type === "credit") {
      return Math.abs(entry.usage_amount);
    } else if (entry.usage_log_types?.log_type === "debit") {
      return -Math.abs(entry.usage_amount);
    }
    return entry.usage_amount;
  };

  const getTypeColor = (entry: UsageLogEntry): string => {
    if (entry.usage_log_types?.log_type) {
      return entry.usage_log_types.log_type === "credit" ? "green" : "red";
    }
    if (entry.usage_amount > 0) {
      return "green";
    }
    return "red";
  };

  return (
    <Container
      size="lg"
      py={isMobile ? "xs" : "xl"}
      h={
        isMobile
          ? "calc(100dvh - var(--app-shell-header-height, 0px) - var(--app-shell-footer-height, 0px))"
          : undefined
      }
      style={isMobile ? { minHeight: 0 } : undefined}
    >
      <Stack
        gap="xl"
        h={isMobile ? "100%" : undefined}
        style={isMobile ? { minHeight: 0 } : undefined}
      >
        <CurrentBalance />

        <Stack
          gap="md"
          h={isMobile ? "100%" : undefined}
          style={isMobile ? { flex: 1, minHeight: 0 } : undefined}
        >
          <Group justify="space-between" mb="md">
            <Title order={3}>Usage Activity</Title>
          </Group>

          {logs.length === 0 ? (
            <Stack align="center" py="xl">
              <RiHistoryLine size={48} color={theme.colors.gray[5]} />
              <Text size="lg" c="dimmed">
                No usage activity found
              </Text>
              <Text size="sm" c="dimmed">
                Your usage debits and credits will appear here
              </Text>
            </Stack>
          ) : isMobile ? (
            <>
              <Box style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
                <Stack gap="md" pb="xs">
                  {logs.map((entry) => {
                    const displayAmount = getDisplayAmount(entry);
                    const isCredit = displayAmount > 0;
                    const logType = getLogType(entry);
                    return (
                      <Card key={entry.id} withBorder radius="md" p="md">
                        <Stack gap="sm">
                          <Group justify="space-between" align="flex-start">
                            <div>
                              <Text size="xs" c="dimmed" mb={4}>
                                {new Date(entry.created_at).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </Text>
                              <Badge color={getTypeColor(entry)} variant="light" size="sm" mb="xs">
                                {logType}
                              </Badge>
                            </div>
                            <Group gap="xs">
                              {isCredit ? (
                                <RiAddLine size={18} color={theme.colors.green[6]} />
                              ) : (
                                <RiSubtractLine size={18} color={theme.colors.red[6]} />
                              )}
                              <Text fw={700} size="lg" c={isCredit ? "green" : "red"}>
                                ${Math.abs(displayAmount).toFixed(2)}
                              </Text>
                            </Group>
                          </Group>
                          <Divider />
                          <Group justify="space-between">
                            <div>
                              <Text size="xs" c="dimmed" mb={2}>
                                Reason
                              </Text>
                              <Text size="sm" fw={500}>
                                {getReasonCode(entry)}
                              </Text>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <Text size="xs" c="dimmed" mb={2}>
                                Related
                              </Text>
                              {entry.transaction_id ? (
                                entry.transactions?.amount_dollars ? (
                                  <Text size="sm" c="dimmed" fw={500}>
                                    ${entry.transactions.amount_dollars.toFixed(2)}
                                  </Text>
                                ) : (
                                  <Text size="xs" c="dimmed" ff="monospace">
                                    Txn: {entry.transaction_id.slice(0, 8)}...
                                  </Text>
                                )
                              ) : entry.meta.model_name ? (
                                <Text size="xs" c="dimmed">
                                  {entry.meta.type}
                                </Text>
                              ) : (
                                <Text size="xs" c="dimmed">
                                  —
                                </Text>
                              )}
                            </div>
                          </Group>
                        </Stack>
                      </Card>
                    );
                  })}
                </Stack>
              </Box>
              {totalPages > 1 && (
                <Group justify="center" mt="xs">
                  <AppPagination
                    value={currentPage}
                    onChange={setCurrentPage}
                    total={totalPages}
                    size="sm"
                  />
                </Group>
              )}
            </>
          ) : (
            <>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Date</Table.Th>
                    <Table.Th>Type</Table.Th>
                    <Table.Th>Reason Code</Table.Th>
                    <Table.Th>Amount</Table.Th>
                    <Table.Th>Related ID</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {logs.map((entry) => {
                    const displayAmount = getDisplayAmount(entry);
                    const isCredit = displayAmount > 0;
                    const logType = getLogType(entry);
                    return (
                      <Table.Tr key={entry.id}>
                        <Table.Td>
                          <Text size="sm">
                            {new Date(entry.created_at).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge color={getTypeColor(entry)} variant="light" size="sm">
                            {logType}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{getReasonCode(entry)}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            {isCredit ? (
                              <RiAddLine size={16} color={theme.colors.green[6]} />
                            ) : (
                              <RiSubtractLine size={16} color={theme.colors.red[6]} />
                            )}
                            <Text fw={600} c={isCredit ? "green" : "red"}>
                              ${Math.abs(displayAmount).toFixed(2)}
                            </Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          {entry.meta?.model_name ? (
                            <Text size="sm" c="dimmed">
                              {entry.meta?.model_name}
                            </Text>
                          ) : entry.transaction_id ? (
                            entry.transactions?.amount_dollars ? (
                              <Text size="sm" c="dimmed" fw={500}>
                                ${entry.transactions.amount_dollars.toFixed(2)}
                              </Text>
                            ) : (
                              <Text size="xs" c="dimmed" ff="monospace">
                                Txn: {entry.transaction_id.slice(0, 8)}...
                              </Text>
                            )
                          ) : (
                            <Text size="xs" c="dimmed">
                              —
                            </Text>
                          )}
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>

              {totalPages > 1 && (
                <Group justify="center" mt="md">
                  <AppPagination
                    value={currentPage}
                    onChange={setCurrentPage}
                    total={totalPages}
                    size="sm"
                  />
                </Group>
              )}
            </>
          )}
        </Stack>
      </Stack>
    </Container>
  );
}
