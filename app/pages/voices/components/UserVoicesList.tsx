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
import useVoicesStore, { type UserVoice, USER_VOICES_PAGE_SIZE } from "~/lib/stores/voicesStore";
import { AppPagination } from "~/shared/AppPagination";
import { VoiceCard } from "~/pages/voices/components/VoiceCard";

export type UserVoicesListProps = {
  mode?: "manage" | "pick";
  selectedVoiceId?: string | null;
  onSelectVoice?: (voice: UserVoice) => void;
  selectLoading?: boolean;
  fillContainer?: boolean;
  /** When false, parent controls initial load (e.g. modal already open). */
  autoLoad?: boolean;
};

export function UserVoicesList({
  mode = "manage",
  selectedVoiceId = null,
  onSelectVoice,
  selectLoading = false,
  fillContainer = false,
  autoLoad = true,
}: UserVoicesListProps) {
  const isMobile = useAppStore((s) => s.isMobile);
  const {
    userVoices,
    userVoicesTotal,
    userVoicesPage,
    userVoicesSearch,
    userVoicesLoading,
    loadUserVoices,
  } = useVoicesStore();

  const [searchInput, setSearchInput] = useState(userVoicesSearch);
  const [debouncedSearch] = useDebouncedValue(searchInput, 300);
  const pickMode = mode === "pick";

  useEffect(() => {
    if (!autoLoad) return;
    void loadUserVoices({ page: 1, search: "", paginate: true });
  }, [autoLoad, loadUserVoices]);

  useEffect(() => {
    if (!autoLoad) return;
    if (debouncedSearch === userVoicesSearch) return;
    void loadUserVoices({ page: 1, search: debouncedSearch, paginate: true });
  }, [autoLoad, debouncedSearch, userVoicesSearch, loadUserVoices]);

  const totalPages = Math.max(1, Math.ceil(userVoicesTotal / USER_VOICES_PAGE_SIZE));
  const hasSearch = Boolean(userVoicesSearch.trim());
  const isEmptyLibrary = userVoicesTotal === 0 && !hasSearch;

  const rootStyle = fillContainer
    ? {
        flex: 1,
        minHeight: 0,
        overflow: "hidden" as const,
        display: "flex",
        flexDirection: "column" as const,
      }
    : {
        flex: 1,
        minHeight: 0,
        overflow: "hidden" as const,
        display: "flex",
        flexDirection: "column" as const,
      };

  return (
    <Stack style={rootStyle} gap={4}>
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
          aria-label="Search voices"
        />
      </Group>
      <Box style={{ flex: 1, minHeight: 0, minWidth: 0 }}>
        <ScrollArea h="100%" type="auto" offsetScrollbars="y">
          {userVoicesLoading && userVoices.length === 0 ? (
            <Group justify="center" py="xl">
              <Loader size="sm" />
            </Group>
          ) : isEmptyLibrary ? (
            <Box py="md" px="xs">
              <Text c="dimmed" size="sm">
                You have not saved any voices yet. Use Design to create one from a text description,
                Clone to create one from an audio sample, or Library to browse shared voices.
              </Text>
            </Box>
          ) : userVoices.length === 0 ? (
            <Box py="md" px="xs">
              <Text c="dimmed" size="sm">
                No voices match your search.
              </Text>
            </Box>
          ) : (
            <Box pb="md">
              <SimpleGrid cols={{ base: 1, sm: 2, md: pickMode ? 2 : 3 }} spacing="md" p="xs">
                {userVoices.map((voice) =>
                  pickMode ? (
                    <VoiceCard
                      key={voice.id}
                      voice={voice}
                      pickMode
                      isSelected={voice.id === selectedVoiceId}
                      selectLoading={selectLoading}
                      onSelect={onSelectVoice}
                    />
                  ) : (
                    <VoiceCard key={voice.id} voice={voice} isEditable />
                  )
                )}
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
            value={userVoicesPage}
            onChange={(page) => void loadUserVoices({ page, paginate: true })}
            size="md"
            disabled={userVoicesLoading}
            p="xs"
          />
        </Group>
      ) : null}
    </Stack>
  );
}
