import { Box } from "@mantine/core";
import { useCallback, useState } from "react";
import { useParams } from "react-router";
import useCharactersStore from "~/lib/stores/charactersStore";
import CharacterLooksPanel from "~/pages/characters/components/CharacterLooksPanel";

export function meta() {
  return [{ title: "Character looks" }];
}

export default function CharacterLooks() {
  const { characterId } = useParams<{ characterId: string }>();
  const [refreshSignal, setRefreshSignal] = useState(0);
  const loadCharacters = useCharactersStore((s) => s.loadCharacters);

  const onLooksVisualsUpdated = useCallback(() => {
    void loadCharacters();
  }, [loadCharacters]);

  const handleLookGenerated = useCallback(async () => {
    setRefreshSignal((n) => n + 1);
    await loadCharacters();
  }, [loadCharacters]);

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
      <CharacterLooksPanel
        characterId={characterId}
        refreshSignal={refreshSignal}
        onLooksVisualsUpdated={onLooksVisualsUpdated}
        onGenerated={handleLookGenerated}
      />
    </Box>
  );
}
