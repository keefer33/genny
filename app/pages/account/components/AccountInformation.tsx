import { Card, Group, SimpleGrid, Stack, Text } from "@mantine/core";
import { RiTimeLine, RiUserLine } from "@remixicon/react";
import useAppStore from "~/lib/stores/appStore";
import { formatDate } from "~/lib/utils";

export default function AccountInformation() {
  const { user } = useAppStore();

  return (
    <Stack gap="lg">
      <Text size="lg" fw={600}>
        Account Information
      </Text>

      <Card padding="sm" radius="xs">
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
          <Stack gap="xs">
            <Group gap="xs">
              <RiTimeLine size={16} color="var(--mantine-color-gray-6)" />
              <Text size="sm" fw={500} c="dimmed">
                Member Since
              </Text>
            </Group>
            <Text>{formatDate(user?.created_at || "")}</Text>
          </Stack>

          <Stack gap="xs">
            <Group gap="xs">
              <RiTimeLine size={16} color="var(--mantine-color-gray-6)" />
              <Text size="sm" fw={500} c="dimmed">
                Last Sign In
              </Text>
            </Group>
            <Text>{user?.last_sign_in_at ? formatDate(user.last_sign_in_at) : "Never"}</Text>
          </Stack>

          <Stack gap="xs">
            <Group gap="xs">
              <RiTimeLine size={16} color="var(--mantine-color-gray-6)" />
              <Text size="sm" fw={500} c="dimmed">
                Email Confirmed
              </Text>
            </Group>
            <Text>
              {user?.email_confirmed_at ? formatDate(user.email_confirmed_at) : "Not confirmed"}
            </Text>
          </Stack>

          <Stack gap="xs">
            <Group gap="xs">
              <RiUserLine size={16} color="var(--mantine-color-gray-6)" />
              <Text size="sm" fw={500} c="dimmed">
                User ID
              </Text>
            </Group>
            <Text size="xs" style={{ fontFamily: "monospace" }}>
              {user?.id}
            </Text>
          </Stack>
        </SimpleGrid>
      </Card>
    </Stack>
  );
}
