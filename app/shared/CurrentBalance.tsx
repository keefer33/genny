import { Button, Card, Group, Title } from "@mantine/core";
import useAppStore from "~/lib/stores/appStore";
import { CostBadge } from "./CostBadge";
import { usePaymentModal } from "./PaymentModal";

export function CurrentBalance() {
  const { getCurrentUserUsageBalance } = useAppStore();
  const currentBalance = getCurrentUserUsageBalance() || 0;
  const { openPaymentModal } = usePaymentModal();

  return (
    <Card radius="xs" p="xs">
      <Group justify="space-between" gap="sm">
        <Group gap="sm">
          <Title order={3}>Balance</Title>
          <CostBadge cost={currentBalance} />
        </Group>
        <Button color="green" variant="light" size="xs" onClick={() => openPaymentModal(null)}>
          Add Balance
        </Button>
      </Group>
    </Card>
  );
}
