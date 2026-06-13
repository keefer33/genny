import { Pagination, type PaginationProps } from "@mantine/core";

const MAX_PAGE_BUTTONS = 5;

interface AppPaginationProps extends PaginationProps {
  /** @deprecated Ignored — pagination always shows at most 5 page numbers. */
  mobileVisibleItems?: number;
}

function siblingsForPageButtonCount(pageButtonCount: number): number {
  // Mantine shows `2 * siblings + 1` page numbers in the sliding window.
  return Math.max(1, Math.floor((pageButtonCount - 1) / 2));
}

const defaultSiblings = siblingsForPageButtonCount(MAX_PAGE_BUTTONS);

export function AppPagination({
  mobileVisibleItems: _mobileVisibleItems,
  siblings = defaultSiblings,
  boundaries = 0,
  withEdges = true,
  withControls = false,
  ...props
}: AppPaginationProps) {
  return (
    <Pagination
      {...props}
      siblings={siblings}
      boundaries={boundaries}
      withEdges={withEdges}
      withControls={withControls}
    />
  );
}
