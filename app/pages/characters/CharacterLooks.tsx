import { Box } from "@mantine/core";
import { useParams } from "react-router";
import CharacterLooksPanel from "~/pages/characters/components/CharacterLooksPanel";

export function meta() {
  return [{ title: "Character looks" }];
}

export default function CharacterLooks() {
  const { characterId } = useParams<{ characterId: string }>();

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
      <CharacterLooksPanel characterId={characterId} />
    </Box>
  );
}
