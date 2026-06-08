import { Box } from "@mantine/core";
import { useCallback, useState } from "react";
import { useParams } from "react-router";
import CharacterScenesPanel from "~/pages/characters/components/CharacterScenesPanel";

export function meta() {
  return [{ title: "Character scenes" }];
}

export default function CharacterScenes() {
  const { characterId } = useParams<{ characterId: string }>();
  const [refreshSignal, setRefreshSignal] = useState(0);

  const handleSceneGenerated = useCallback(async () => {
    setRefreshSignal((n) => n + 1);
  }, []);

  return (
    <Box
      style={{
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CharacterScenesPanel
        characterId={characterId}
        refreshSignal={refreshSignal}
        onGenerated={handleSceneGenerated}
      />
    </Box>
  );
}
