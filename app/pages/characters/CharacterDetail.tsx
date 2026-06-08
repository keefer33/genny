import { Navigate, useParams } from "react-router";

export default function CharacterDetail() {
  const { characterId } = useParams<{ characterId: string }>();
  const id = characterId?.trim();
  if (!id) return <Navigate to="/characters" replace />;
  return <Navigate to={`/characters/${encodeURIComponent(id)}/looks`} replace />;
}
