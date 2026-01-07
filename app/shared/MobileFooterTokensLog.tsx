import { Box, Group, Pagination } from "@mantine/core";
import useTokensLogStore from "~/lib/stores/tokensLogStore";

export const MobileFooterTokensLog = () => {
  const { currentPage, totalPages, setCurrentPage } = useTokensLogStore();
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
