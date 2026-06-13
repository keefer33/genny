import { useChatsStore } from "~/lib/stores/chatsStore";
import useGenerationsStore from "~/lib/stores/generateStore";
import PlayGroundRunHistoryModalAction from "~/pages/generations/components/PlayGroundRunHistoryModalAction";

export default function ChatGenerationsHistoryAction() {
  const { chats, selectedChat } = useChatsStore();
  const { setGenerationsHistoryGenerationIdsFilter } = useGenerationsStore();
  const selectedChatRow = selectedChat ? chats.find((chat) => chat.id === selectedChat) : null;
  const generationIds =
    selectedChatRow?.metadata?.generations
      ?.map((generation) => generation.generation_id?.trim())
      .filter(Boolean) ?? [];

  if (!selectedChat || generationIds.length === 0) return null;

  return (
    <PlayGroundRunHistoryModalAction
      title="Chat generations"
      onOpen={() => setGenerationsHistoryGenerationIdsFilter(generationIds)}
    />
  );
}
