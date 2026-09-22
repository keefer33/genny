import { Pagination, type PaginationProps } from "@mantine/core";
import { RiMoreLine } from "@remixicon/react";

const DEFAULT_VISIBLE_ITEMS = 4;

function siblingsForPageButtonCount(pageButtonCount: number): number {
  // Mantine shows `2 * siblings + 1` page numbers in the sliding window.
  return Math.max(1, Math.floor((pageButtonCount - 1) / 2));
}

type AppPaginationProps = PaginationProps & {
  /** How many numbered page buttons to aim for (not a DOM attribute). */
  mobileVisibleItems?: number;
};

export function AppPagination({
  mobileVisibleItems = DEFAULT_VISIBLE_ITEMS,
  siblings,
  boundaries = 0,
  withEdges = true,
  withControls = false,
  ...props
}: AppPaginationProps) {
  const resolvedSiblings = siblings ?? siblingsForPageButtonCount(mobileVisibleItems);

  return (
    <Pagination
      {...props}
      siblings={resolvedSiblings}
      boundaries={boundaries}
      withEdges={withEdges}
      withControls={withControls}
      dotsIcon={() => <RiMoreLine />}
      styles={{
        dots: {
          width: 5,
          minWidth: 5,
        },
      }}
    />
  );
}
