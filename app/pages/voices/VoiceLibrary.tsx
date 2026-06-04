import {
  Box,
  Button,
  Container,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { RiArrowLeftLine, RiBookOpenLine } from "@remixicon/react";
import { useEffect } from "react";
import { Link } from "react-router";
import useAppStore from "~/lib/stores/appStore";
import useVoicesStore from "~/lib/stores/voicesStore";
import { VoiceCard } from "~/pages/voices/components/VoiceCard";

export function meta() {
  return [{ title: "Voice library" }];
}

export default function VoiceLibrary() {
  const isMobile = useAppStore((s) => s.isMobile);
  const { libraryVoices, libraryVoicesLoading, loadLibraryVoices } = useVoicesStore();

  useEffect(() => {
    void loadLibraryVoices();
  }, []);

  return (
    <Container size="lg" py="md" px={isMobile ? "sm" : "md"}>
      <Stack gap="xl">
        <Group justify="space-between" align="flex-end" wrap="wrap">
          <Stack gap={4}>
            <Button
              component={Link}
              to="/voices"
              variant="subtle"
              size="compact-sm"
              leftSection={<RiArrowLeftLine size={16} />}
              px={0}
            >
              Your voices
            </Button>
            <Group gap="xs">
              <RiBookOpenLine size={22} />
              <Title order={2}>Voice library</Title>
            </Group>
            <Text c="dimmed" size="sm">
              Curated system voices available for generation.
            </Text>
          </Stack>
        </Group>

        {libraryVoicesLoading && libraryVoices.length === 0 ? (
          <Group justify="center" py="xl">
            <Loader size="sm" />
          </Group>
        ) : libraryVoices.length === 0 ? (
          <Box py="md">
            <Text c="dimmed" size="sm">
              No library voices are available yet.
            </Text>
          </Box>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            {libraryVoices.map((voice) => (
              <VoiceCard key={voice.id} voice={voice} badge="Library" />
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Container>
  );
}
