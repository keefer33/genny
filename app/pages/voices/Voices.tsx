import { Container, Group, Title } from "@mantine/core";
import { RiMicLine } from "@remixicon/react";
import useAppStore from "~/lib/stores/appStore";
import { ModalVoiceDesign } from "~/pages/voices/components/ModalVoiceDesign";
import { ModalVoiceLibrary } from "~/pages/voices/components/ModalVoiceLibrary";
import { ModalVoiceClone } from "~/pages/voices/components/ModalVoiceClone";
import { UserVoicesList } from "~/pages/voices/components/UserVoicesList";
import { VoiceActionModals } from "~/pages/voices/components/VoiceActionModals";
import MobileScrollBox from "~/shared/MobileScrollBox";

export function meta() {
  return [{ title: "Voices" }];
}

export default function Voices() {
  const isMobile = useAppStore((s) => s.isMobile);

  return (
    <MobileScrollBox>
      <Container
        size="lg"
        p="0"
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Group gap="xs" justify="space-between" align="center" p="xs">
          <Group gap={4} align="center">
            <RiMicLine size={24} />
            <Title order={2}>Voices</Title>
          </Group>
          <Group
            gap="xs"
            align="center"
            justify="space-between"
            w={isMobile ? "100%" : "auto"}
            grow={isMobile}
          >
            <ModalVoiceDesign />
            <ModalVoiceClone />
            <ModalVoiceLibrary />
          </Group>
        </Group>

        <UserVoicesList />
      </Container>

      <VoiceActionModals />
    </MobileScrollBox>
  );
}
