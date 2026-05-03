import { Container, Modal } from "@mantine/core";
import GenerationsHistory from "~/pages/generations/components/GenerationsHistory";
import useAppStore from "~/lib/stores/appStore";

export type GenerationsHistoryModalProps = {
  title: string;
  opened: boolean;
  /** Called when the user closes the modal (Mantine `Modal` `onClose`). */
  onClose: () => void;
};

const modalStyles = {
  content: { display: "flex", flexDirection: "column" as const },
  body: {
    flex: 1,
    minHeight: 0,
    padding: 0,
    display: "flex",
    flexDirection: "column" as const,
  },
};

const bodyBoxStyle = {
  flex: 1,
  minHeight: 0,
  width: "100%",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column" as const,
};

export function GenerationsHistoryModal({ title, opened, onClose }: GenerationsHistoryModalProps) {
  const { isMobile } = useAppStore();
  return (
    <Modal opened={opened} onClose={onClose} title={title} fullScreen>
      {isMobile ? (
        <GenerationsHistory
          showFiltersModal={false}
          showBulkActions={false}
          showPagination={false}
        />
      ) : (
        <Container size="lg">
          <GenerationsHistory
            showFiltersModal={false}
            showBulkActions={false}
            showPagination={false}
          />
        </Container>
      )}
    </Modal>
  );
}
