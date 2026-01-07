import { Box, Group, Pagination } from "@mantine/core";
import useFilesFoldersStore from "~/lib/stores/filesFoldersStore";

export const MobileFooterFiles = () => {
  const { paginationData, handleFilesPageChange } = useFilesFoldersStore();
  return (
    <Box p="sm">
      {paginationData.totalPages > 1 && (
        <Group justify="center" mt="md">
          <Pagination
            total={paginationData.totalPages}
            value={paginationData.currentPage}
            onChange={handleFilesPageChange}
            size="sm"
            withEdges
          />
        </Group>
      )}
    </Box>
  );
};
