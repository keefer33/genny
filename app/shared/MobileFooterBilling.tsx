import { Box, Group, Pagination } from "@mantine/core";
import useBillingStore from "~/lib/stores/billingStore";

export const MobileFooterBilling = () => {
  const { currentPage, totalPages, setCurrentPage } = useBillingStore();
  return (
    <Box p="sm">
      {totalPages > 1 && (
        <Group justify="center" p="xs">
          <Pagination
            total={totalPages}
            value={currentPage}
            onChange={setCurrentPage}
            size="sm"
            withEdges
          />
        </Group>
      )}
    </Box>
  );
};
