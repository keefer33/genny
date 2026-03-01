import {
  Badge,
  Box,
  Button,
  Card,
  Group,
  Stack,
  Text,
  useMantineTheme,
  Modal,
  Textarea,
  Divider,
} from "@mantine/core";
import { RiCustomerService2Line, RiAddLine } from "@remixicon/react";
import { useDisclosure } from "@mantine/hooks";
import { useEffect } from "react";
import { Link } from "react-router";
import useAppStore from "~/lib/stores/appStore";
import useSupportStore, { getStatusColor } from "~/lib/stores/supportStore";
import { showNotification } from "~/lib/notificationUtils";
import { PageTitle } from "~/shared/PageTitle";
import Mounted from "~/shared/Mounted";

export default function Support() {
  const theme = useMantineTheme();
  const { isMobile, pageLoading } = useAppStore();
  const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);

  const {
    tickets,
    ticketsLoading,
    newMessage,
    createSubmitting,
    setNewMessage,
    fetchTickets,
    createTicket,
  } = useSupportStore();

  const user = useAppStore((s) => s.getUser());

  useEffect(() => {
    if (user?.user?.id) fetchTickets();
  }, [user?.user?.id, fetchTickets]);

  const handleCreateTicket = async () => {
    const result = await createTicket(newMessage);
    if (result.success) {
      showNotification({ title: "Success", message: "Support ticket created", type: "success" });
      closeCreate();
    } else {
      showNotification({
        title: "Error",
        message: result.error || "Failed to create ticket",
        type: "error",
      });
    }
  };

  return (
    <Mounted pageLoading={pageLoading}>
      <PageTitle
        title={
          <Group>
            <RiCustomerService2Line size={30} /> Support
          </Group>
        }
        settings={{
          rightSection: (
            <Button leftSection={<RiAddLine size={16} />} onClick={openCreate}>
              New ticket
            </Button>
          ),
        }}
      />

      <Stack
        gap="xl"
        h={isMobile ? "100%" : undefined}
        style={isMobile ? { minHeight: 0 } : undefined}
      >
        {ticketsLoading ? (
          <Text c="dimmed">Loading tickets…</Text>
        ) : tickets.length === 0 ? (
          <Stack align="center" py="xl">
            <RiCustomerService2Line size={48} color={theme.colors.gray[5]} />
            <Text size="lg" c="dimmed">
              No support tickets yet
            </Text>
            <Text size="sm" c="dimmed">
              Open a ticket to get help from our team
            </Text>
            <Button leftSection={<RiAddLine size={16} />} onClick={openCreate} mt="md">
              New ticket
            </Button>
          </Stack>
        ) : (
          <Box style={isMobile ? { flex: 1, minHeight: 0, overflowY: "auto" } : undefined}>
            <Stack gap="md" pb="xs">
              {tickets.map((ticket) => (
                <Card
                  key={ticket.id}
                  component={Link}
                  to={`/account/support/${ticket.id}`}
                  withBorder
                  radius="md"
                  p="md"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <Group justify="space-between" align="flex-start">
                    <div>
                      <Text size="xs" c="dimmed" mb={4}>
                        {new Date(ticket.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                      <Text size="sm" fw={500}>
                        Ticket #{ticket.id.slice(0, 8)}
                      </Text>
                    </div>
                    <Badge color={getStatusColor(ticket.status)} variant="light" size="sm">
                      {ticket.status}
                    </Badge>
                  </Group>
                </Card>
              ))}
            </Stack>
          </Box>
        )}
      </Stack>

      <Modal opened={createOpened} onClose={closeCreate} title="New support ticket" size="md">
        <Stack gap="md">
          <Textarea
            label="Message"
            placeholder="Describe your issue or question…"
            value={newMessage}
            onChange={(e) => setNewMessage(e.currentTarget.value)}
            minRows={4}
            required
          />
          <Divider />
          <Group justify="flex-end" gap="sm">
            <Button variant="subtle" onClick={closeCreate}>
              Cancel
            </Button>
            <Button loading={createSubmitting} onClick={handleCreateTicket}>
              Create ticket
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Mounted>
  );
}
