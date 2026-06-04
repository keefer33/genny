import { ActionIcon, Card, Group, Image, Stack, Text, Tooltip } from "@mantine/core";
import { RiDeleteBinLine, RiTeamLine } from "@remixicon/react";
import { Link } from "react-router";
import type { UserCharacter } from "~/lib/stores/charactersStore";
import { characterMetaLine } from "~/pages/characters/characterUtils";

type CharacterCardProps = {
  character: UserCharacter;
  onDelete?: (character: UserCharacter) => void;
};

export function CharacterCard({ character, onDelete }: CharacterCardProps) {
  const meta = characterMetaLine(character);
  const detailPath = `/characters/${encodeURIComponent(character.id)}`;

  return (
    <Card
      withBorder
      radius="md"
      padding="md"
      shadow="sm"
      component={Link}
      to={detailPath}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <Group align="flex-start" wrap="nowrap" gap="md">
        <Card
          withBorder
          radius="md"
          p={0}
          style={{
            width: 88,
            height: 88,
            flexShrink: 0,
            overflow: "hidden",
            background: "var(--mantine-color-dark-6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {character.baseLookThumbnailUrl ? (
            <Image src={character.baseLookThumbnailUrl} alt="" w={88} h={88} fit="cover" />
          ) : (
            <RiTeamLine size={32} style={{ opacity: 0.35 }} />
          )}
        </Card>

        <Stack gap="sm" style={{ flex: 1, minWidth: 0 }}>
          <Group justify="space-between" wrap="nowrap" align="flex-start">
            <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
              <Text fw={600} lineClamp={1}>
                {character.name || "Unnamed character"}
              </Text>
              {meta ? (
                <Text size="xs" c="dimmed" lineClamp={1}>
                  {meta}
                </Text>
              ) : null}
              {character.description ? (
                <Text size="sm" c="dimmed" lineClamp={2}>
                  {character.description}
                </Text>
              ) : null}
            </Stack>
            {onDelete ? (
              <Tooltip label="Delete">
                <ActionIcon
                  variant="subtle"
                  color="red"
                  aria-label="Delete character"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete(character);
                  }}
                >
                  <RiDeleteBinLine size={18} />
                </ActionIcon>
              </Tooltip>
            ) : null}
          </Group>
        </Stack>
      </Group>
    </Card>
  );
}
