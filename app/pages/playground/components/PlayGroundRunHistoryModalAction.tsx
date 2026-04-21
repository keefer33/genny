import { ActionIcon, Box, Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { RiHistoryLine } from "@remixicon/react";
import PlayGroundRunHistory from "../PlayGroundRunHistory";

export default function PlayGroundRunHistoryModalAction({ title }: { title: string }) {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <ActionIcon
        variant="light"
        size="md"
        aria-label={`Open run history: ${title}`}
        onClick={open}
      >
        <RiHistoryLine size={18} />
      </ActionIcon>
      <Modal
        opened={opened}
        onClose={close}
        title={title}
        fullScreen
        styles={{
          content: { display: "flex", flexDirection: "column" },
          body: { flex: 1, minHeight: 0, padding: 0, display: "flex", flexDirection: "column" },
        }}
      >
        <Box
          style={{
            flex: 1,
            minHeight: 0,
            width: "100%",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <PlayGroundRunHistory showFiltersModal={false} showBulkActions={false} />
        </Box>
      </Modal>
    </>
  );
}
