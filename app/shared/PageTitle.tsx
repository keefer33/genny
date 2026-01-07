import { Group, Stack, Text, Title } from "@mantine/core";
import type { ReactNode } from "react";

type PageTitleSettings = {
  gap?: string;
  align?: string;
  justify?: string;
  py?: string;
  order?: number | any;
  rightSection?: ReactNode;
};

type PageTitleProps = {
  title: string;
  text?: string;
  settings?: PageTitleSettings;
};

export function PageTitle({
  title,
  text,
  settings = { gap: "sm", align: "center", justify: "center", py: "xl", order: 1 },
}: PageTitleProps) {
  const defaultConfig: PageTitleSettings = {
    gap: "sm",
    align: "center",
    justify: "center",
    py: "xl",
    order: 1,
  };
  const config: PageTitleSettings = { ...defaultConfig, ...settings };

  if (config.rightSection) {
    return (
      <Group justify="space-between" align="flex-start" py={config.py}>
        <Stack gap={config.gap} align={config.align} justify={config.justify}>
          <Title order={config.order}>{title}</Title>
          {text && <Text>{text}</Text>}
        </Stack>
        {config.rightSection}
      </Group>
    );
  }

  return (
    <Stack gap={config.gap} align={config.align} justify={config.justify} py={config.py}>
      <Title order={config.order}>{title}</Title>
      {text && <Text>{text}</Text>}
    </Stack>
  );
}
