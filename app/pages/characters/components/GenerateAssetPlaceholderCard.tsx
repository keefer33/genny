import { Box, Card, Center, Loader, Stack, Text, UnstyledButton } from "@mantine/core";
import { RiAddLine } from "@remixicon/react";

type GenerateAssetPlaceholderCardProps = {
  label: string;
  description?: string;
  onClick: () => void;
  loading?: boolean;
};

export function GenerateAssetPlaceholderCard({
  label,
  description,
  onClick,
  loading = false,
}: GenerateAssetPlaceholderCardProps) {
  return (
    <Card
      padding={0}
      radius="md"
      withBorder
      style={{
        borderStyle: "dashed",
        borderColor: "var(--mantine-color-default-border)",
        background: "var(--mantine-color-default-hover)",
        overflow: "hidden",
      }}
    >
      <UnstyledButton
        onClick={() => {
          if (!loading) onClick();
        }}
        aria-label={label}
        style={{ display: "block", width: "100%", cursor: loading ? "wait" : "pointer" }}
      >
        <Center h={{ base: 80, sm: 200 }}>
          {loading ? (
            <Loader size="sm" />
          ) : (
            <Stack align="center" gap="xs" px={{ base: "xs", sm: 0 }}>
              <Box hiddenFrom="sm">
                <RiAddLine size={22} style={{ opacity: 0.5 }} />
              </Box>
              <Box visibleFrom="sm">
                <RiAddLine size={32} style={{ opacity: 0.5 }} />
              </Box>
              <Text fw={600} size="xs" ta="center" hiddenFrom="sm">
                {label}
              </Text>
              <Text fw={600} size="sm" ta="center" visibleFrom="sm">
                {label}
              </Text>
              {description ? (
                <Text size="xs" c="dimmed" ta="center" px="md" visibleFrom="sm">
                  {description}
                </Text>
              ) : null}
            </Stack>
          )}
        </Center>
        <Box p={{ base: "xs", sm: "sm" }} visibleFrom="sm">
          <Text size="xs" c="dimmed" ta="center">
            Click to create
          </Text>
        </Box>
      </UnstyledButton>
    </Card>
  );
}
