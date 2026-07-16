import { Modal } from "@mantine/core";
import useAppStore from "~/lib/stores/appStore";
import useStoryboardsStore from "~/lib/stores/storyboardsStore";
import { EditLayerForm } from "~/pages/storyboards/components/EditLayerForm";

type EditLayerModalProps = {
  storyboardId: string;
};

export function EditLayerModal({ storyboardId }: EditLayerModalProps) {
  const isMobile = useAppStore((s) => s.isMobile);
  const layerEditorOpened = useStoryboardsStore((s) => s.layerEditorOpened);
  const editingLayerId = useStoryboardsStore((s) => s.editingLayerId);
  const layerItems = useStoryboardsStore((s) => s.layerItems);
  const closeLayerEditor = useStoryboardsStore((s) => s.closeLayerEditor);

  const layer = editingLayerId ? layerItems.find((row) => row.id === editingLayerId) : null;
  const opened = layerEditorOpened && Boolean(layer && editingLayerId);

  return (
    <Modal
      opened={opened}
      onClose={closeLayerEditor}
      title="Edit layer"
      centered
      size={isMobile ? "100%" : "md"}
    >
      {editingLayerId ? (
        <EditLayerForm
          storyboardId={storyboardId}
          layerId={editingLayerId}
          active={opened}
          onDeselect={closeLayerEditor}
        />
      ) : null}
    </Modal>
  );
}
