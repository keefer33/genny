import { Modal } from "@mantine/core";
import { useMemo } from "react";
import useAppStore from "~/lib/stores/appStore";
import useStoryboardsStore, { resolveEditingTransition } from "~/lib/stores/storyboardsStore";
import { SceneTransitionSection } from "~/pages/storyboards/components/SceneTransitionSection";
import type { SceneTransitionToNext } from "~/pages/storyboards/sceneTransitionTypes";

type SceneTransitionModalProps = {
  storyboardId: string;
};

export function SceneTransitionModal({ storyboardId }: SceneTransitionModalProps) {
  const isMobile = useAppStore((s) => s.isMobile);
  const editingTransitionScene = useStoryboardsStore((s) => s.editingTransitionScene);
  const storyboardScenes = useStoryboardsStore((s) => s.storyboardScenes);
  const saveTransitionLoading = useStoryboardsStore((s) => s.saveTransitionLoading);
  const closeTransitionModal = useStoryboardsStore((s) => s.closeTransitionModal);
  const saveEditingTransition = useStoryboardsStore((s) => s.saveEditingTransition);

  const editingTransition = useMemo(
    () => resolveEditingTransition(editingTransitionScene, storyboardScenes),
    [editingTransitionScene, storyboardScenes]
  );

  if (!editingTransition) return null;

  const handleChange = (transition: SceneTransitionToNext) => {
    saveEditingTransition(storyboardId, transition);
  };

  return (
    <Modal
      opened={Boolean(editingTransitionScene)}
      onClose={closeTransitionModal}
      title={`Transition · ${editingTransition.sceneTitle}`}
      centered
      size={isMobile ? "100%" : "md"}
    >
      <SceneTransitionSection
        transition={editingTransition.transition}
        sceneDuration={editingTransition.sceneDuration}
        nextSceneDuration={editingTransition.nextSceneDuration}
        disabled={saveTransitionLoading}
        onChange={handleChange}
        inModal
      />
    </Modal>
  );
}
