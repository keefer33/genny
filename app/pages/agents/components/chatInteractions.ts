import type { ChatUIMessage } from "~/lib/stores/chatsStore";

export type ChatInteraction = {
  user: ChatUIMessage;
  assistant?: ChatUIMessage;
};

export function buildChatInteractions(messages: ChatUIMessage[]): ChatInteraction[] {
  const interactions: ChatInteraction[] = [];
  let current: ChatInteraction | null = null;

  for (const message of messages) {
    if (message.role === "user") {
      current = { user: message };
      interactions.push(current);
      continue;
    }

    if (message.role === "assistant" && current && !current.assistant) {
      current.assistant = message;
    }
  }

  return interactions;
}

export function latestInteractionIndex(messages: ChatUIMessage[]): number {
  return Math.max(0, buildChatInteractions(messages).length - 1);
}
