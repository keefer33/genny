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
} from "@mantine/core";
import { RiCoinsLine, RiVisaLine } from "@remixicon/react";
import { useEffect } from "react";
import useAppStore from "~/lib/stores/appStore";
import useBillingStore from "~/lib/stores/billingStore";
import { formatPrice } from "~/lib/tokenUtils";
import PaymentModal from "~/shared/PaymentModal";
import { Table } from "@mantine/core";
import { RiHistoryLine } from "@remixicon/react";
import { CurrentBalance } from "~/shared/CurrentBalance";
import { AppPagination } from "~/shared/AppPagination";

export default function Billing() {
  const { getUser, isMobile } = useAppStore();
  const {
    paymentModalOpen,
    transactions,
    currentPage,
    totalPages,
    transactionsLoading,
    closePaymentModal,
    setTransactions,
    setCurrentPage,
    setTotalPages,
    setTransactionsLoading,
    fetchTransactions,
  } = useBillingStore();
  const theme = useMantineTheme();
  const itemsPerPage = 10;

  const user = getUser();

  // Load transactions when component mounts
  useEffect(() => {
    loadTransactions(currentPage);
  }, [currentPage, user?.user?.id]);

  const loadTransactions = async (page: number = 1) => {
    if (!user?.user?.id) return;

    setTransactionsLoading(true);
    try {
      const result = await fetchTransactions(page, itemsPerPage);

      if (result.success) {
        setTransactions(result.data.transactions);
        setTotalPages(Math.ceil(result.data.total / itemsPerPage));
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    closePaymentModal();
    // Refresh transactions to show the new purchase
    loadTransactions(currentPage);
    // Refresh user data to show updated token balance
    window.location.reload();
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

        {/* Transaction History */}

        <Stack
          gap="md"
          h={isMobile ? "100%" : undefined}
          style={isMobile ? { flex: 1, minHeight: 0 } : undefined}
        >
          <Group justify="space-between" mb="md">
            <Title order={3}>Transaction History</Title>
          </Group>

          {transactions.length === 0 ? (
            <Stack align="center" py="xl">
              <RiHistoryLine size={48} color={theme.colors.gray[5]} />
              <Text size="lg" c="dimmed">
                No transactions found
              </Text>
              <Text size="sm" c="dimmed">
                Your token purchases will appear here
              </Text>
            </Stack>
          ) : isMobile ? (
            <>
              <Box style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
                <Stack gap="md" pb="xs">
                  {transactions.map((transaction) => (
                    <Card key={transaction.id} withBorder radius="md" p="md">
                      <Stack gap="sm">
                        <Group justify="space-between" align="flex-start">
                          <div>
                            <Text size="xs" c="dimmed" mb={4}>
                              {new Date(transaction.created_at).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </Text>
                            <Badge
                              color={transaction.status === "completed" ? "green" : "yellow"}
                              variant="light"
                              size="sm"
                              mb="xs"
                            >
                              {transaction.status.charAt(0).toUpperCase() +
                                transaction.status.slice(1)}
                            </Badge>
                          </div>
                          <Group gap="xs">
                            <RiVisaLine size={18} color={theme.colors.blue[6]} />
                            <Text fw={700} size="lg">
                              {formatPrice(transaction.amount_cents)}
                            </Text>
                          </Group>
                        </Group>
                        <Divider />
                        <Group justify="space-between">
                          <div>
                            <Text size="xs" c="dimmed" mb={2}>
                              Tokens
                            </Text>
                            <Group gap="xs">
                              <RiCoinsLine size={16} color={theme.colors.orange[6]} />
                              <Text size="sm" fw={500}>
                                {transaction.tokens_purchased.toLocaleString()}
                              </Text>
                            </Group>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <Text size="xs" c="dimmed" mb={2}>
                              Payment ID
                            </Text>
                            <Text size="xs" c="dimmed" ff="monospace">
                              {transaction.stripe_payment_intent_id.slice(-8)}
                            </Text>
                          </div>
                        </Group>
                      </Stack>
                    </Card>
                  ))}
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
            // Desktop: Table layout
            <>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Date</Table.Th>
                    <Table.Th>Amount</Table.Th>
                    <Table.Th>Tokens</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Payment ID</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {transactions.map((transaction) => (
                    <Table.Tr key={transaction.id}>
                      <Table.Td>
                        <Text size="sm">
                          {new Date(transaction.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <RiVisaLine size={16} color={theme.colors.blue[6]} />
                          <Text fw={600}>{formatPrice(transaction.amount_cents)}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <RiCoinsLine size={16} color={theme.colors.orange[6]} />
                          <Text fw={600}>{transaction.tokens_purchased}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={transaction.status === "completed" ? "green" : "yellow"}
                          variant="light"
                          size="sm"
                        >
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" c="dimmed" ff="monospace">
                          {transaction.stripe_payment_intent_id.slice(-8)}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>

              {/* Pagination */}
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

        {/* Payment Modal - using global hook */}
        {paymentModalOpen && (
          <PaymentModal
            opened={paymentModalOpen}
            onClose={closePaymentModal}
            onSuccess={handlePaymentSuccess}
            showPackageSelection={true}
            fullScreen={isMobile}
          />
        )}
      </Stack>
    </Container>
  );
}
