import { Pagination, type PaginationProps } from "@mantine/core";

interface AppPaginationProps extends PaginationProps {
  mobileVisibleItems?: number;
}

export function AppPagination({
  mobileVisibleItems = 6,
  siblings: _siblings,
  boundaries: _boundaries,
  withEdges: _withEdges,
  ...props
}: AppPaginationProps) {
  // Global pagination density (desktop + mobile) driven by one value.
  const visibleItems = Math.max(3, mobileVisibleItems);
  const computedSiblings = visibleItems >= 8 ? 2 : visibleItems >= 7 ? 1 : 0;
  const computedBoundaries = 1;

  return (
    <Pagination
      siblings={computedSiblings}
      boundaries={computedBoundaries}
      withEdges={false}
      {...props}
    />
  );
}
