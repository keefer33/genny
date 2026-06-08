import { Box, Button, Group, Image, Loader, Menu, ScrollArea, Stack, Text } from "@mantine/core";
import { RiArrowDownSLine, RiCheckLine, RiTeamLine } from "@remixicon/react";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import useCharactersStore from "~/lib/stores/charactersStore";
import { characterMetaLine } from "~/pages/characters/characterUtils";

type CharacterPickerProps = {
  selectedCharacterId?: string;
};

export default function CharacterPicker({ selectedCharacterId }: CharacterPickerProps) {
  const navigate = useNavigate();
  const characters = useCharactersStore((s) => s.characters);
  const charactersLoading = useCharactersStore((s) => s.charactersLoading);
  const loadCharacters = useCharactersStore((s) => s.loadCharacters);
  const selectedCharacter = characters.find((c) => c.id === selectedCharacterId) ?? null;

  useEffect(() => {
    if (characters.length > 0) return;
    void loadCharacters();
  }, [characters.length, loadCharacters]);

  return (
    <Stack gap="sm">
      <Box>
        <Menu position="bottom-start" withinPortal shadow="md" width="target">
          <Menu.Target>
            <Button
              variant="default"
              fullWidth
              rightSection={<RiArrowDownSLine size={26} />}
              aria-label="Select character"
              styles={{ label: { width: "100%" } }}
              px={0}
              h={100}
            >
              {selectedCharacter ? (
                <Group gap="sm" wrap="nowrap" align="center" style={{ minWidth: 0 }}>
                  <Box
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: 6,
                      overflow: "hidden",
                      flexShrink: 0,
                      //background: "var(--mantine-color-dark-6)",
                      display: "flex",
                      //alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {selectedCharacter.baseLookThumbnailUrl ? (
                      <Image
                        src={selectedCharacter.baseLookThumbnailUrl}
                        alt=""
                        style={{ objectFit: "cover", objectPosition: "top" }}
                      />
                    ) : (
                      <RiTeamLine size={14} style={{ opacity: 0.5 }} />
                    )}
                  </Box>
                  <Stack gap={0} style={{ minWidth: 0, flex: 1 }}>
                    <Text size="sm" fw={600} truncate>
                      {selectedCharacter.name || "Unnamed character"}
                    </Text>
                    <Text size="xs" c="dimmed" truncate>
                      {characterMetaLine(selectedCharacter) || "No details"}
                    </Text>
                  </Stack>
                </Group>
              ) : (
                "Select character"
              )}
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            {charactersLoading && characters.length === 0 ? (
              <Group justify="center" py="sm">
                <Loader size="sm" />
              </Group>
            ) : characters.length === 0 ? (
              <Menu.Item disabled>No characters yet.</Menu.Item>
            ) : (
              <ScrollArea.Autosize mah={280} type="auto" offsetScrollbars="y">
                <Stack gap={0}>
                  {characters.map((character) => {
                    const selected = character.id === selectedCharacterId;
                    return (
                      <Menu.Item
                        key={character.id}
                        onClick={() =>
                          navigate(`/characters/${encodeURIComponent(character.id)}/looks`)
                        }
                        leftSection={
                          <Box
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 6,
                              overflow: "hidden",
                              flexShrink: 0,
                              background: "var(--mantine-color-dark-6)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {character.baseLookThumbnailUrl ? (
                              <Image
                                src={character.baseLookThumbnailUrl}
                                alt=""
                                w={40}
                                h={40}
                                fit="cover"
                              />
                            ) : (
                              <RiTeamLine size={14} style={{ opacity: 0.5 }} />
                            )}
                          </Box>
                        }
                        rightSection={selected ? <RiCheckLine size={16} aria-hidden /> : undefined}
                      >
                        <Stack gap={0}>
                          <Text size="sm" fw={600} lineClamp={1}>
                            {character.name || "Unnamed character"}
                          </Text>
                          <Text size="xs" c="dimmed" lineClamp={1}>
                            {characterMetaLine(character) || "No details"}
                          </Text>
                        </Stack>
                      </Menu.Item>
                    );
                  })}
                </Stack>
              </ScrollArea.Autosize>
            )}
          </Menu.Dropdown>
        </Menu>
      </Box>
    </Stack>
  );
}
