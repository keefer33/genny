/** Display name for character- or voice-linked history files (from API enrichment). */
export function historyFileEntityName(file: {
  character_id?: string | null;
  voice_id?: string | null;
  character_name?: string | null;
  voice_name?: string | null;
}): string | null {
  const charName = file.character_name?.trim();
  if (charName) return charName;
  const voiceName = file.voice_name?.trim();
  if (voiceName) return voiceName;
  return null;
}
