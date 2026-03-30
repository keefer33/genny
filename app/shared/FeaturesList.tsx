import { Badge, Card, Group, SimpleGrid, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import React from "react";
import {
  RiFileListLine,
  RiImageLine,
  RiMoneyDollarCircleLine,
  RiRobotLine,
  RiServerLine,
  RiToolsLine,
} from "@remixicon/react";

const FEATURES = [
  {
    title: "Agent-first workflows",
    description: "Use agents and run multi-step tasks end-to-end.",
    icon: RiRobotLine,
  },
  {
    title: "Connect 1,000+ tools",
    description: "Choose tools per connected toolkit for your agent.",
    icon: RiToolsLine,
  },
  {
    title: "Video generation",
    description: "Generate videos from your agents or prompts.",
    icon: RiServerLine,
  },
  {
    title: "Image  generation",
    description: "Generate images from your agents or prompts.",
    icon: RiImageLine,
  },
  {
    title: "Store every generated file",
    description: "Your generated outputs are saved so you can reuse, download, and manage them.",
    icon: RiFileListLine,
  },
  {
    title: "Track usage & cost",
    description: "Pricing shown per 1M tokens, plus usage accounting.",
    icon: RiMoneyDollarCircleLine,
  },
];

export function FeaturesList() {
  return (
    <Stack gap="xl" mt="xl">
      <Stack gap="sm" align="center" ta="center">
        <Badge variant="light" radius="xl" size="lg">
          Platform highlights
        </Badge>
        <Title order={2}>Everything you need to build with AI</Title>
        <Text c="dimmed" size="sm" ta="center" maw={520}>
          Text, images, videos, tools, and agent automation in one workspace.
        </Text>
      </Stack>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md" verticalSpacing="md">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <Card
              key={f.title}
              withBorder
              radius="lg"
              p="lg"
              h="100%"
              style={{
                background:
                  "linear-gradient(145deg, var(--mantine-color-body) 0%, color-mix(in srgb, var(--mantine-color-body) 88%, var(--mantine-color-blue-6) 12%) 100%)",
              }}
            >
              <Stack gap="sm">
                <Group justify="space-between" align="flex-start">
                  <ThemeIcon size={48} radius="md" variant="light">
                    <Icon size={22} />
                  </ThemeIcon>
                  <Badge variant="dot" size="sm">
                    Feature
                  </Badge>
                </Group>
                <Text fw={700} size="lg" lh={1.25}>
                  {f.title}
                </Text>
                <Text c="dimmed" size="sm" lh={1.5}>
                  {f.description}
                </Text>
              </Stack>
            </Card>
          );
        })}
      </SimpleGrid>
    </Stack>
  );
}
