import { Pagination, type PaginationProps } from "@mantine/core";
import { RiMoreLine } from "@remixicon/react";

const MAX_PAGE_BUTTONS = 4;

function siblingsForPageButtonCount(pageButtonCount: number): number {
  // Mantine shows `2 * siblings + 1` page numbers in the sliding window.
  return Math.max(1, Math.floor((pageButtonCount - 1) / 2));
}

const defaultSiblings = siblingsForPageButtonCount(MAX_PAGE_BUTTONS);

export function AppPagination({
  siblings = defaultSiblings,
  boundaries = 0,
  withEdges = true,
  withControls = false,
  ...props
}: PaginationProps) {
  return (
    <Pagination
      {...props}
      siblings={siblings}
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
