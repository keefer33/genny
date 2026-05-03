import { Box } from "@mantine/core";
import useAppStore from "~/lib/stores/appStore";
import ChatComposer from "~/pages/agents/components/ChatComposer";
import MessagesContent from "~/pages/agents/components/MessagesContent";
import SelectedChatBar from "~/pages/agents/components/SelectedChatBar";
import AgentsMessagesToolbar from "./AgentsMessagesToolbar";

export default function AgentsMessagesSection() {
  const { isMobile } = useAppStore();

  return (
    <>
      {isMobile && (
        <Box px="xs" style={{ flexShrink: 0 }}>
          <SelectedChatBar />
        </Box>
      )}
      <MessagesContent />
      <AgentsMessagesToolbar />
      <ChatComposer />
    </>
  );
}
