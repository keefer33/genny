import { SimpleGrid, Stack, Text, ThemeIcon, Title } from "@mantine/core";
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
    description: "Create agents and run multi-step tasks end-to-end.",
    icon: RiRobotLine,
  },
  {
    title: "Connect 1,000+ tools",
    description: "Choose tools per connected toolkit for your agent.",
    icon: RiToolsLine,
  },
  {
    title: "MCP & model services",
    description: "Bring your servers and models into one control plane.",
    icon: RiServerLine,
  },
  {
    title: "Track usage & cost",
    description: "Pricing shown per 1M tokens, plus usage accounting.",
    icon: RiMoneyDollarCircleLine,
  },
  {
    title: "Image & video generation",
    description: "Generate images and videos from your agents or prompts.",
    icon: RiImageLine,
  },
  {
    title: "Store every generated file",
    description: "Your generated outputs are saved so you can reuse, download, and manage them.",
    icon: RiFileListLine,
  },
];

export function FeaturesList() {
  return (
    <Stack gap="xl" mt="xl" align="center">
      <Stack gap="sm" align="center">
        <Title order={3}>Generative AI</Title>
        <Text c="dimmed" size="sm" ta="center" maw={520}>
          Text, images, videos, and more. All in one place.
        </Text>
      </Stack>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <Stack key={f.title} gap={6} align="center" ta="center" pb="xl">
              <ThemeIcon size={56} variant="light" radius="md">
                <Icon size={26} />
              </ThemeIcon>
              <Text fw={700} ta="center">
                {f.title}
              </Text>
              <Text c="dimmed" size="sm" ta="center">
                {f.description}
              </Text>
            </Stack>
          );
        })}
      </SimpleGrid>
    </Stack>
  );
}
