import {
  Button,
  Container,
  Group,
  Stack,
  Text,
  Title,
  useMantineColorScheme,
  useMantineTheme,
} from "@mantine/core";
import { RiSparklingLine } from "@remixicon/react";
import { Link } from "react-router";

export function HomeCTA() {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Container size="lg">
      <Stack gap="md" align="center" ta="center">
        <Group justify="center" gap="xs">
          <RiSparklingLine size={28} color={theme.colors.blue[6]} />
          <Title order={2}>Create with AI</Title>
        </Group>
        <Text size="lg" c="dimmed" maw={520} mx="auto">
          Generate images and videos with our AI models. Sign in to get started.
        </Text>
        <Button
          component={Link}
          to="/login"
          size="lg"
          variant="filled"
          leftSection={<RiSparklingLine size={20} />}
        >
          Sign in
        </Button>
      </Stack>
    </Container>
  );
}
