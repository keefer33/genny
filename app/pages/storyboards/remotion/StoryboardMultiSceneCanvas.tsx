import { Series } from "remotion";
import type { StoryboardRenderScene } from "./sceneLayerTypes";
import { StoryboardSceneCanvas } from "./StoryboardSceneCanvas";

const noop = () => undefined;

const renderEditorProps = {
  selectedLayerId: null,
  setSelectedLayerId: noop,
  changeLayer: noop,
  onLayersPersist: noop,
};

export function StoryboardMultiSceneCanvas({ scenes }: { scenes: StoryboardRenderScene[] }) {
  return (
    <Series>
      {scenes.map((scene, index) => (
        <Series.Sequence key={index} durationInFrames={scene.durationInFrames}>
          <StoryboardSceneCanvas
            background={scene.background}
            layers={scene.layers}
            {...renderEditorProps}
          />
        </Series.Sequence>
      ))}
    </Series>
  );
}
