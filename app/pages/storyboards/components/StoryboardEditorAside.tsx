import { ScrollArea, Title } from "@mantine/core";
import { useMemo } from "react";
import useStoryboardsStore, { resolveEditingTransition } from "~/lib/stores/storyboardsStore";
import { EditLayerForm } from "~/pages/storyboards/components/EditLayerForm";
import { SceneTransitionSection } from "~/pages/storyboards/components/SceneTransitionSection";
import { StoryboardSceneUpsertForm } from "~/pages/storyboards/components/StoryboardSceneUpsertForm";
import { StoryboardUpsertForm } from "~/pages/storyboards/components/StoryboardUpsertForm";
import type { SceneTransitionToNext } from "~/pages/storyboards/sceneTransitionTypes";
import { isBaseStoryboardScene, storyboardFormFromRow } from "~/pages/storyboards/storyboardUtils";

type StoryboardEditorAsideProps = {
  storyboardId: string;
};

export function StoryboardEditorAside({ storyboardId }: StoryboardEditorAsideProps) {
  const selectedStoryboard = useStoryboardsStore((s) => s.selectedStoryboard);
  const storyboardScenes = useStoryboardsStore((s) => s.storyboardScenes);
  const selectedSceneId = useStoryboardsStore((s) => s.selectedSceneId);
  const selectedLayerId = useStoryboardsStore((s) => s.selectedLayerId);
  const sceneCreateModalOpened = useStoryboardsStore((s) => s.sceneCreateModalOpened);
  const editingTransitionScene = useStoryboardsStore((s) => s.editingTransitionScene);
  const updateLoading = useStoryboardsStore((s) => s.updateLoading);
  const saveTransitionLoading = useStoryboardsStore((s) => s.saveTransitionLoading);
  const closeCreateSceneModal = useStoryboardsStore((s) => s.closeCreateSceneModal);
  const setSelectedLayerId = useStoryboardsStore((s) => s.setSelectedLayerId);
  const updateStoryboard = useStoryboardsStore((s) => s.updateStoryboard);
  const saveEditingTransition = useStoryboardsStore((s) => s.saveEditingTransition);

  const selectedScene = storyboardScenes.find((row) => row.id === selectedSceneId) ?? null;

  const editingTransition = useMemo(
    () => resolveEditingTransition(editingTransitionScene, storyboardScenes),
    [editingTransitionScene, storyboardScenes]
  );

  const isRegularSceneSelected = Boolean(
    selectedScene && !isBaseStoryboardScene(selectedScene) && !sceneCreateModalOpened
  );

  const storyboardInitialValues = useMemo(
    () => (selectedStoryboard ? storyboardFormFromRow(selectedStoryboard) : undefined),
    [selectedStoryboard]
  );

  const handleTransitionChange = (transition: SceneTransitionToNext) => {
    saveEditingTransition(storyboardId, transition);
  };

  let panel: React.ReactNode = null;

  if (sceneCreateModalOpened) {
    panel = (
      <StoryboardSceneUpsertForm
        storyboardId={storyboardId}
        mode="create"
        active
        onCancel={closeCreateSceneModal}
        onCreated={() => closeCreateSceneModal()}
      />
    );
  } else if (editingTransition) {
    panel = (
      <>
        <Title order={5} mb="md">
          Transition · {editingTransition.sceneTitle}
        </Title>
        <SceneTransitionSection
          transition={editingTransition.transition}
          sceneDuration={editingTransition.sceneDuration}
          nextSceneDuration={editingTransition.nextSceneDuration}
          disabled={saveTransitionLoading}
          onChange={handleTransitionChange}
        />
      </>
    );
  } else if (selectedLayerId) {
    panel = (
      <EditLayerForm
        storyboardId={storyboardId}
        layerId={selectedLayerId}
        active
        onDeselect={() => setSelectedLayerId(null)}
      />
    );
  } else if (isRegularSceneSelected && selectedScene) {
    panel = (
      <StoryboardSceneUpsertForm
        storyboardId={storyboardId}
        mode="edit"
        active
        scene={selectedScene}
      />
    );
  } else {
    panel = (
      <StoryboardUpsertForm
        active
        title="Storyboard settings"
        submitLabel="Save storyboard"
        submitting={updateLoading}
        initialValues={storyboardInitialValues}
        onSubmit={async (values) => {
          await updateStoryboard(storyboardId, values);
        }}
      />
    );
  }

  return (
    <ScrollArea h="100%" type="auto" offsetScrollbars="y" p="sm">
      {panel}
    </ScrollArea>
  );
}
