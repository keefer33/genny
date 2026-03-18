import { Stack, Group, TextInput, ActionIcon, Select } from "@mantine/core";
import { RiSearchLine, RiToolsLine, RiCloseLine } from "@remixicon/react";

export type ConnectedFilterValue = "all" | "connected" | "not_connected";

interface ToolsFiltersProps {
  isMobile: boolean;
  searchInput: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  connectedFilter: ConnectedFilterValue;
  onConnectedFilterChange: (value: ConnectedFilterValue) => void;
  displayConnectedCount: number;
  sortBy: "usage" | "alphabetically";
  onSortByChange: (value: "usage" | "alphabetically") => void;
  showCategoryFilter?: boolean;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  categoryOptions: { value: string; label: string }[];
}

export default function ToolsFilters({
  isMobile,
  searchInput,
  onSearchChange,
  onClearSearch,
  connectedFilter,
  onConnectedFilterChange,
  displayConnectedCount,
  sortBy,
  onSortByChange,
  showCategoryFilter = false,
  categoryFilter,
  onCategoryFilterChange,
  categoryOptions,
}: ToolsFiltersProps) {
  const searchStyle = isMobile ? { width: "100%" as const } : { maxWidth: 280 };
  const selectStyle = isMobile ? { minWidth: 140, flex: 1 as const } : { minWidth: 160 };
  const categorySelectStyle = isMobile ? { minWidth: 140, flex: 1 as const } : { minWidth: 180 };

  const searchInputEl = (
    <TextInput
      placeholder="Search toolkits..."
      leftSection={<RiSearchLine size={16} />}
      rightSection={
        searchInput ? (
          <ActionIcon
            variant="subtle"
            color="gray"
            size="sm"
            onClick={onClearSearch}
            aria-label="Clear search"
          >
            <RiCloseLine size={18} />
          </ActionIcon>
        ) : null
      }
      value={searchInput}
      onChange={(e) => onSearchChange(e.currentTarget.value)}
      style={searchStyle}
    />
  );

  const filtersEl = (
    <Group gap="sm" wrap="wrap">
      <Select
        placeholder="Filter"
        data={[
          { value: "all", label: "All" },
          { value: "connected", label: `Connected (${displayConnectedCount})` },
          { value: "not_connected", label: "Not connected" },
        ]}
        value={connectedFilter}
        onChange={(v) => onConnectedFilterChange((v as ConnectedFilterValue) ?? "all")}
        style={selectStyle}
      />
      <Select
        placeholder="Sort by"
        data={[
          { value: "usage", label: "Usage" },
          { value: "alphabetically", label: "Alphabetically" },
        ]}
        value={sortBy}
        onChange={(v) => onSortByChange((v as "usage" | "alphabetically") ?? "usage")}
        style={selectStyle}
      />
      {showCategoryFilter && (
        <Select
          placeholder="Category"
          leftSection={<RiToolsLine size={16} />}
          data={categoryOptions}
          value={categoryFilter}
          onChange={(v) => onCategoryFilterChange(v ?? "")}
          clearable
          style={categorySelectStyle}
        />
      )}
    </Group>
  );

  if (isMobile) {
    return (
      <Stack gap="sm">
        {searchInputEl}
        {filtersEl}
      </Stack>
    );
  }

  return (
    <Group gap="sm" wrap="wrap">
      {searchInputEl}
      {filtersEl}
    </Group>
  );
}
