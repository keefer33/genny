import { useMemo } from "react";
import { Sequence } from "remotion";
import type { SceneLayer } from "../storyboardUtils";
import { SelectionOutline } from "./SelectionOutline";

function displaySelectedLayerOnTop(layers: SceneLayer[], selectedLayerId: string | null) {
  const selected = layers.filter((layer) => layer.id === selectedLayerId);
  const unselected = layers.filter((layer) => layer.id !== selectedLayerId);
  return [...unselected, ...selected];
}

export function SortedOutlines({
  layers,
  selectedLayerId,
  changeLayer,
  setSelectedLayerId,
  onLayersPersist,
}: {
  layers: SceneLayer[];
  selectedLayerId: string | null;
  changeLayer: (layerId: string, updater: (item: SceneLayer) => SceneLayer) => void;
  setSelectedLayerId: (id: string | null) => void;
  onLayersPersist: () => void;
}) {
  const layersToDisplay = useMemo(
    () => displaySelectedLayerOnTop(layers, selectedLayerId),
    [layers, selectedLayerId]
  );

  const isDragging = useMemo(() => layers.some((layer) => layer.isDragging), [layers]);

  return layersToDisplay.map((layer) => (
    <Sequence
      key={`outline-${layer.id}`}
      from={layer.from}
      durationInFrames={layer.durationInFrames}
      layout="none"
    >
      <SelectionOutline
        layer={layer}
        changeLayer={changeLayer}
        setSelectedLayerId={setSelectedLayerId}
        selectedLayerId={selectedLayerId}
        isDragging={isDragging}
        onLayersPersist={onLayersPersist}
      />
    </Sequence>
  ));
}
