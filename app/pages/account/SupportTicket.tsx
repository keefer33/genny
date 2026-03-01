import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Group,
  Stack,
  Text,
  Textarea,
  Divider,
} from "@mantine/core";
import { RiArrowLeftLine, RiSendPlaneLine } from "@remixicon/react";
import { useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router";
import useAppStore from "~/lib/stores/appStore";
import useSupportStore, { getStatusColor } from "~/lib/stores/supportStore";
import { showNotification } from "~/lib/notificationUtils";
import Mounted from "~/shared/Mounted";

export default function SupportTicket() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { isMobile, pageLoading } = useAppStore();
  const user = useAppStore((s) => s.getUser());

  const {
    ticket,
    threads,
    ticketLoading,
    reply,
    replySubmitting,
    setReply,
    fetchTicketDetail,
    sendReply,
    resetDetail,
  } = useSupportStore();

  useEffect(() => {
    if (!ticketId) return;
    let cancelled = false;
    fetchTicketDetail(ticketId).then((result) => {
      if (cancelled) return;
      if (!result.success && result.notFound) {
        showNotification({ title: "Error", message: "Ticket not found", type: "error" });
        navigate("/account/support", { replace: true });
      }
    });
    return () => {
      cancelled = true;
      resetDetail();
    };
  }, [ticketId, fetchTicketDetail, resetDetail, navigate]);

  const handleReply = async () => {
    if (!ticketId) return;
    const result = await sendReply(ticketId);
    if (result.success) {
      showNotification({ title: "Success", message: "Reply sent", type: "success" });
    } else {
      showNotification({
        title: "Error",
        message: result.error || "Failed to send reply",
        type: "error",
      });
    }
  };

  if (ticketLoading || !ticket) {
    return (
      <Mounted pageLoading={pageLoading}>
        <Container size="lg" py="xl">
          <Text c="dimmed">Loading…</Text>
        </Container>
      </Mounted>
    );
  }

  return (
    <Mounted pageLoading={pageLoading}>
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
          <Group justify="space-between" align="center">
            <Button
              component={Link}
              to="/account/support"
              variant="subtle"
              leftSection={<RiArrowLeftLine size={16} />}
            >
              Back to support
            </Button>
            <Badge color={getStatusColor(ticket.status)} variant="light" size="sm">
              {ticket.status}
            </Badge>
          </Group>

          <Text size="sm" c="dimmed">
            Ticket #{ticket.id.slice(0, 8)} ·{" "}
            {new Date(ticket.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>

          <Box style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
            <Stack gap="md" pb="md">
              {threads.map((msg) => (
                <Card key={msg.id} withBorder radius="md" p="md" shadow="sm">
                  <Group justify="space-between" align="flex-start" mb="xs">
                    <Text size="xs" c="dimmed">
                      {new Date(msg.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                    {msg.user_id === user?.user?.id && (
                      <Badge size="xs" variant="light" color="blue">
                        You
                      </Badge>
                    )}
                  </Group>
                  <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                    {msg.message}
                  </Text>
                </Card>
              ))}
            </Stack>
          </Box>

          {ticket.status !== "closed" && (
            <>
              <Divider />
              <Stack gap="sm">
                <Textarea
                  placeholder="Type your reply…"
                  value={reply}
                  onChange={(e) => setReply(e.currentTarget.value)}
                  minRows={3}
                />
                <Group justify="flex-end">
                  <Button
                    leftSection={<RiSendPlaneLine size={16} />}
                    loading={replySubmitting}
                    onClick={handleReply}
                  >
                    Send reply
                  </Button>
                </Group>
              </Stack>
            </>
          )}

          {ticket.status === "closed" && (
            <Text size="sm" c="dimmed">
              This ticket is closed. Open a new ticket if you need further help.
            </Text>
          )}
        </Stack>
      </Container>
    </Mounted>
  );
}
