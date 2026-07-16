import { Modal } from "@mantine/core";
import useAppStore from "~/lib/stores/appStore";
import useStoryboardsStore from "~/lib/stores/storyboardsStore";
import { StoryboardSceneUpsertForm } from "~/pages/storyboards/components/StoryboardSceneUpsertForm";

type StoryboardSceneUpsertModalProps = {
  mode: "create" | "edit";
  storyboardId: string;
};

export function StoryboardSceneUpsertModal({
  mode,
  storyboardId,
}: StoryboardSceneUpsertModalProps) {
  const isMobile = useAppStore((s) => s.isMobile);
  const isEdit = mode === "edit";
  const sceneCreateModalOpened = useStoryboardsStore((s) => s.sceneCreateModalOpened);
  const editingScene = useStoryboardsStore((s) => s.editingScene);
  const closeCreateSceneModal = useStoryboardsStore((s) => s.closeCreateSceneModal);
  const closeEditSceneModal = useStoryboardsStore((s) => s.closeEditSceneModal);

  const scene = isEdit ? editingScene : null;
  const opened = isEdit ? Boolean(editingScene) : sceneCreateModalOpened;
  const onClose = isEdit ? closeEditSceneModal : closeCreateSceneModal;

  return (
    <Modal opened={opened} onClose={onClose} centered size={isMobile ? "100%" : "md"}>
      <StoryboardSceneUpsertForm
        storyboardId={storyboardId}
        mode={mode}
        active={opened}
        scene={scene}
        onCancel={onClose}
        onCreated={() => onClose()}
      />
    </Modal>
  );
}
