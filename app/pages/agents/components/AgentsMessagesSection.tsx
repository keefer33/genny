import { Box } from "@mantine/core";
import useAppStore from "~/lib/stores/appStore";
import ChatComposer from "~/pages/agents/components/ChatComposer";
import MessagesContent from "~/pages/agents/components/MessagesContent";
import SelectedChatBar from "~/pages/agents/components/SelectedChatBar";

export default function AgentsMessagesSection() {
  const { isMobile } = useAppStore();

  return (
    <>
      <MessagesContent />
      {isMobile && (
        <Box px="xs" style={{ flexShrink: 0 }}>
          <SelectedChatBar />
        </Box>
      )}
      <ChatComposer />
    </>
  );
}
