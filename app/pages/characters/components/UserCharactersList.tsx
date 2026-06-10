import {
  Box,
  CloseButton,
  Group,
  Loader,
  ScrollArea,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { RiSearchLine } from "@remixicon/react";
import { useEffect, useState } from "react";
import useAppStore from "~/lib/stores/appStore";
import useCharactersStore, { USER_CHARACTERS_PAGE_SIZE } from "~/lib/stores/charactersStore";
import { CharacterCard } from "~/pages/characters/components/CharacterCard";
import { AppPagination } from "~/shared/AppPagination";

export type UserCharactersListProps = {
  /** When false, parent controls initial load (e.g. modal already open). */
  autoLoad?: boolean;
};

export function UserCharactersList({ autoLoad = true }: UserCharactersListProps) {
  const isMobile = useAppStore((s) => s.isMobile);
  const {
    characters,
    charactersTotal,
    charactersPage,
    charactersSearch,
    charactersLoading,
    loadCharacters,
  } = useCharactersStore();

  const [searchInput, setSearchInput] = useState(charactersSearch);
  const [debouncedSearch] = useDebouncedValue(searchInput, 300);

  useEffect(() => {
    if (!autoLoad) return;
    void loadCharacters({ page: 1, search: "", paginate: true });
  }, [autoLoad, loadCharacters]);

  useEffect(() => {
    if (!autoLoad) return;
    if (debouncedSearch === charactersSearch) return;
    void loadCharacters({ page: 1, search: debouncedSearch, paginate: true });
  }, [autoLoad, debouncedSearch, charactersSearch, loadCharacters]);

  const totalPages = Math.max(1, Math.ceil(charactersTotal / USER_CHARACTERS_PAGE_SIZE));
  const hasSearch = Boolean(charactersSearch.trim());
  const isEmptyLibrary = charactersTotal === 0 && !hasSearch;

  return (
    <Stack
      style={{
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
      gap={4}
    >
      <Group gap="xs" align="center" justify="space-between" wrap="wrap" grow={!isMobile} p="xs">
        <TextInput
          w={isMobile ? "100%" : "auto"}
          placeholder="Search by name or description"
          value={searchInput}
          onChange={(event) => setSearchInput(event.currentTarget.value)}
          leftSection={<RiSearchLine size={16} />}
          rightSection={
            searchInput ? (
              <CloseButton
                size="sm"
                aria-label="Clear search"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setSearchInput("")}
              />
            ) : null
          }
          rightSectionPointerEvents="auto"
          aria-label="Search characters"
        />
      </Group>

      <Box style={{ flex: 1, minHeight: 0, minWidth: 0 }}>
        <ScrollArea h="100%" type="auto" offsetScrollbars="y">
          {charactersLoading && characters.length === 0 ? (
            <Group justify="center" py="xl">
              <Loader size="sm" />
            </Group>
          ) : isEmptyLibrary ? (
            <Box py="md" px="xs">
              <Text c="dimmed" size="sm">
                You have not created any characters yet. Use New character or From library to add
                one.
              </Text>
            </Box>
          ) : characters.length === 0 ? (
            <Box py="md" px="xs">
              <Text c="dimmed" size="sm">
                No characters match your search.
              </Text>
            </Box>
          ) : (
            <Box pb="md">
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md" p="xs">
                {characters.map((character) => (
                  <CharacterCard key={character.id} characterId={character.id} listMode />
                ))}
              </SimpleGrid>
            </Box>
          )}
        </ScrollArea>
      </Box>

      {totalPages > 1 ? (
        <Group justify="center">
          <AppPagination
            mobileVisibleItems={isMobile ? 4 : 7}
            total={totalPages}
            value={charactersPage}
            onChange={(page) => void loadCharacters({ page, paginate: true })}
            size="md"
            disabled={charactersLoading}
            p="xs"
          />
        </Group>
      ) : null}
    </Stack>
  );
}
