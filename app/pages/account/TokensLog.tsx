import {
  Badge,
  Button,
  Card,
  Container,
  Group,
  Stack,
  Text,
  Title,
  useMantineTheme,
  Divider,
} from "@mantine/core";
import { RiHistoryLine, RiAddLine, RiSubtractLine } from "@remixicon/react";
import { useEffect } from "react";
import useAppStore from "~/lib/stores/appStore";
import useTokensLogStore, { type TokensLogEntry } from "~/lib/stores/tokensLogStore";
import { Table, Pagination } from "@mantine/core";
import { formatTokens } from "~/lib/tokenUtils";
import { CurrentBalance } from "~/shared/CurrentBalance";

export default function TokensLog() {
  const { getUser, getCurrentUserTokens, isMobile } = useAppStore();
  const {
    logs,
    currentPage,
    totalPages,
    logsLoading,
    setLogs,
    setCurrentPage,
    setTotalPages,
    setLogsLoading,
    fetchTokensLog,
  } = useTokensLogStore();
  const theme = useMantineTheme();
  const itemsPerPage = 10;

  const user = getUser();
  const currentTokens = getCurrentUserTokens() || 0;

  // Load tokens log when component mounts
  useEffect(() => {
    loadTokensLog(currentPage);
  }, [currentPage, user?.user?.id]);

  const loadTokensLog = async (page: number = 1) => {
    if (!user?.user?.id) return;

    setLogsLoading(true);
    try {
      const result = await fetchTokensLog(page, itemsPerPage);

      if (result.success) {
        setLogs(result.data.logs);
        setTotalPages(Math.ceil(result.data.total / itemsPerPage));
      }
    } catch (error) {
      console.error("Error fetching tokens log:", error);
    } finally {
      setLogsLoading(false);
    }
  };

  const getLogType = (entry: TokensLogEntry): string => {
    // Use log_type from tokens_log_types if available
    if (entry.tokens_log_types?.log_type) {
      const logType = entry.tokens_log_types.log_type;
      return logType.charAt(0).toUpperCase() + logType.slice(1);
    }
    // Fallback based on token_amount sign
    return entry.token_amount > 0 ? "Credit" : "Debit";
  };

  const getReasonCode = (entry: TokensLogEntry): string => {
    return entry.tokens_log_types?.reason_code || "—";
  };

  const getDisplayAmount = (entry: TokensLogEntry): number => {
    // Credits should be positive, debits should be negative
    if (entry.tokens_log_types?.log_type === "credit") {
      return Math.abs(entry.token_amount);
    } else if (entry.tokens_log_types?.log_type === "debit") {
      return -Math.abs(entry.token_amount);
    }
    // Fallback: use token_amount as-is (should already be correct)
    return entry.token_amount;
  };

  const getTypeColor = (entry: TokensLogEntry): string => {
    // Use log_type from tokens_log_types if available
    if (entry.tokens_log_types?.log_type) {
      return entry.tokens_log_types.log_type === "credit" ? "green" : "red";
    }
    // Fallback to token_amount sign
    if (entry.token_amount > 0) {
      return "green";
    }
    return "red";
  };

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        {/* Current Balance */}

        <CurrentBalance />

        {/* Tokens Log History */}
        <Card radius="md" p="lg">
          <Group justify="space-between" mb="md">
            <div>
              <Title order={3} mb="xs">
                Token Activity
              </Title>
              <Text size="sm" c="dimmed">
                All token transactions and usage
              </Text>
            </div>
            <Button
              leftSection={<RiHistoryLine size={16} />}
              onClick={() => loadTokensLog(currentPage)}
              loading={logsLoading}
              variant="light"
              size="sm"
            >
              Refresh
            </Button>
          </Group>

          {logs.length === 0 ? (
            <Stack align="center" py="xl">
              <RiHistoryLine size={48} color={theme.colors.gray[5]} />
              <Text size="lg" c="dimmed">
                No token activity found
              </Text>
              <Text size="sm" c="dimmed">
                Your token usage and purchases will appear here
              </Text>
            </Stack>
          ) : isMobile ? (
            // Mobile: Card-based layout (pagination in footer, natural scroll)
            <Stack gap="md">
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
                            {formatTokens(Math.abs(displayAmount))}
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
                          {entry.generation_id ? (
                            entry.user_generations?.models?.name ? (
                              <Text size="sm" c="dimmed" fw={500}>
                                {entry.user_generations.models.name}
                              </Text>
                            ) : (
                              <Text size="xs" c="dimmed" ff="monospace">
                                Gen: {entry.generation_id.slice(0, 8)}...
                              </Text>
                            )
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
                        </div>
                      </Group>
                    </Stack>
                  </Card>
                );
              })}
            </Stack>
          ) : (
            // Desktop: Table layout
            <>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Date</Table.Th>
                    <Table.Th>Type</Table.Th>
                    <Table.Th>Reason Code</Table.Th>
                    <Table.Th>Tokens</Table.Th>
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
                              {formatTokens(Math.abs(displayAmount))}
                            </Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          {entry.generation_id ? (
                            entry.user_generations?.models?.name ? (
                              <Text size="sm" c="dimmed">
                                {entry.user_generations.models.name}
                              </Text>
                            ) : (
                              <Text size="xs" c="dimmed" ff="monospace">
                                Gen: {entry.generation_id.slice(0, 8)}...
                              </Text>
                            )
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

              {/* Pagination */}
              {totalPages > 1 && (
                <Group justify="center" mt="md">
                  <Pagination
                    value={currentPage}
                    onChange={setCurrentPage}
                    total={totalPages}
                    size="sm"
                  />
                </Group>
              )}
            </>
          )}
        </Card>
      </Stack>
    </Container>
  );
}
