import { Button, Card, Group, Title } from "@mantine/core";
import useAppStore from "~/lib/stores/appStore";
import { TokensBadge } from "./TokensBadge";
import { usePaymentModal } from "./PaymentModal";

export function CurrentBalance() {
  const { getCurrentUserTokens } = useAppStore();
  const currentTokens = getCurrentUserTokens() || 0;
  const { openPaymentModal } = usePaymentModal();

  return (
    <Card radius="xs" p="xs">
      <Group justify="space-between" gap="sm">
        <Group gap="sm">
          <Title order={3}>Tokens</Title>
          <TokensBadge tokens={currentTokens} />
        </Group>
        <Button color="green" variant="light" size="xs" onClick={() => openPaymentModal(null)}>
          Purchase Tokens
        </Button>
      </Group>
    </Card>
  );
}
