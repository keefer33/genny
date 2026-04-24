import { ActionIcon, Card, Group, Text } from "@mantine/core";
import { RiCloseLine } from "@remixicon/react";

export function ManualUrlRow({ url, onRemove }: { url: string; onRemove: () => void }) {
  return (
    <Card withBorder radius="md" w="100%" p="0">
      <Group gap="xs" align="center" justify="space-between" wrap="nowrap" p="sm">
        <Text size="sm" style={{ wordBreak: "break-all", flex: 1 }} lineClamp={3}>
          {url}
        </Text>
        <ActionIcon
          size="sm"
          variant="light"
          color="red"
          aria-label="Remove URL"
          onClick={onRemove}
        >
          <RiCloseLine size={16} />
        </ActionIcon>
      </Group>
    </Card>
  );
}
