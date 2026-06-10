import { Box } from "@mantine/core";
import { useParams } from "react-router";
import CharacterVideosPanel from "~/pages/characters/components/CharacterVideosPanel";

export function meta() {
  return [{ title: "Character videos" }];
}

export default function CharacterVideos() {
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
      <CharacterVideosPanel characterId={characterId} />
    </Box>
  );
}
