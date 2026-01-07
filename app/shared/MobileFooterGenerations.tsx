import { Box, Group, Pagination } from "@mantine/core";
import useGenerateStore from "~/lib/stores/generateStore";

export const MobileFooterGenerations = () => {
  const { pagination, handlePageChange } = useGenerateStore();
  return (
    <Box p="sm">
      {pagination.totalPages > 1 && (
        <Group justify="center" p="xs">
          <Pagination
            total={pagination.totalPages}
            value={pagination.currentPage}
            onChange={handlePageChange}
            size="sm"
            withEdges
          />
        </Group>
      )}
    </Box>
  );
};
