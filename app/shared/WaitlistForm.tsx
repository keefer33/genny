import { Button, Paper, Stack, Text, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useState } from "react";
import { endpoint } from "~/lib/utils";

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!value) return;

    setLoading(true);
    try {
      const response = await fetch(`${endpoint}/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      const result = (await response.json().catch(() => null)) as
        | { success?: boolean; error?: { message?: string } }
        | null;
      if (!response.ok || result?.success === false) {
        throw new Error(result?.error?.message || "Unable to join the waitlist.");
      }
      setSubmitted(true);
    } catch (error) {
      notifications.show({
        title: "Waitlist",
        message: error instanceof Error ? error.message : "Unable to join the waitlist.",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper radius="lg" p="xs">
      {submitted ? (
        <Stack gap="sm" py="md">
          <Text ta="center" fw={600}>
            You’re on the list.
          </Text>
          <Text ta="center" size="sm" c="dimmed">
            We’ll email you when Genny is ready.
          </Text>
        </Stack>
      ) : (
        <form onSubmit={handleSubmit}>
          <Stack gap="lg">
            <TextInput
              label="Email Address"
              placeholder="you@example.com"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
            />
            <Button type="submit" loading={loading}>
              Join waitlist
            </Button>
          </Stack>
        </form>
      )}
    </Paper>
  );
}
