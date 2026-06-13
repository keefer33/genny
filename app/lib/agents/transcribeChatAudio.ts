import { authFetchJson } from "~/lib/stores/authFetch";
import { endpoint } from "~/lib/utils";

export type TranscribeChatAudioResult = {
  text: string;
};

/** Upload a short dictation clip and return transcribed text. */
export async function transcribeChatAudio(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("audio", file);

  const data = await authFetchJson<TranscribeChatAudioResult>(
    `${endpoint}/agents/transcribe`,
    {
      method: "POST",
      body: formData,
    },
    { errorMessage: "Failed to transcribe audio" }
  );

  return data.text?.trim() ?? "";
}
