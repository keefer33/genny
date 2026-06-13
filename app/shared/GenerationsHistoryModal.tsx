import { Box, Modal } from "@mantine/core";
import useAppStore from "~/lib/stores/appStore";
import GenerationsHistory from "~/pages/generations/components/GenerationsHistory";

export type GenerationsHistoryModalProps = {
  title: string;
  opened: boolean;
  /** Called when the user closes the modal (Mantine `Modal` `onClose`). */
  onClose: () => void;
};

const historyModalStyles = {
  content: { display: "flex", flexDirection: "column" as const },
  body: {
    flex: 1,
    minHeight: 0,
    padding: "var(--mantine-spacing-md)",
    display: "flex",
    flexDirection: "column" as const,
    overflow: "hidden",
  },
};

export function GenerationsHistoryModal({ title, opened, onClose }: GenerationsHistoryModalProps) {
  const { isMobile } = useAppStore();

  const historyPanel = (
    <Box
      p={isMobile ? undefined : "sm"}
      style={{
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <GenerationsHistory />
    </Box>
  );

  return (
    <Modal opened={opened} onClose={onClose} title={title} fullScreen styles={historyModalStyles}>
      {historyPanel}
    </Modal>
  );
}
