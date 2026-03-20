import { Container, Title, Text, Stack, Divider, Group, Button } from "@mantine/core";
import { Link } from "react-router";

export default function Contact() {
  return (
    <Container size="md" py={40}>
      <Stack gap="md">
        <Title order={2}>Contact</Title>
        <Text c="dimmed">
          Need help or have questions? Use the in-app support page for the fastest response.
        </Text>
        <Divider />

        <Group>
          <Button component={Link} to="/account/support" variant="filled">
            Go to Support
          </Button>
        </Group>
      </Stack>
    </Container>
  );
}

