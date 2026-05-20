import type { UserCharacter } from "~/lib/stores/charactersStore";

export type CharacterImagePromptFields = {
  name?: string | null;
  description?: string | null;
  language?: string | null;
  gender?: string | null;
  age?: string | number | null;
  accent?: string | null;
  descriptive?: string | null;
  use_case?: string | null;
};

const IMAGE_PROMPT_SUFFIX =
  "Show person full figure on a white background with arms by their sides. No text or logos just the person with the white background.";

function formatAge(age: CharacterImagePromptFields["age"]): string | null {
  if (age === null || age === undefined) return null;
  return typeof age === "number" ? String(age) : age.trim() || null;
}

function appendPromptLine(lines: string[], label: string, value: string | null | undefined): void {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (trimmed) lines.push(`${label}: ${trimmed}`);
}

/** Default image-generation prompt from character fields (playground `prompt` input). */
export function buildCharacterImagePrompt(character: CharacterImagePromptFields): string {
  const lines: string[] = [];

  appendPromptLine(lines, "name", character.name);
  appendPromptLine(lines, "description", character.description);
  appendPromptLine(lines, "language", character.language);
  appendPromptLine(lines, "gender", character.gender);
  appendPromptLine(lines, "age", formatAge(character.age));
  appendPromptLine(lines, "accent", character.accent);
  appendPromptLine(lines, "descriptive", character.descriptive);
  appendPromptLine(lines, "use_case", character.use_case);

  const body = lines.length > 0 ? lines.join("\n") : "character portrait";
  return `${body}\n\n${IMAGE_PROMPT_SUFFIX}`;
}

export function characterImagePromptOverride(
  character: UserCharacter | null
): Record<string, unknown> | undefined {
  if (!character) return undefined;
  return { prompt: buildCharacterImagePrompt(character) };
}
