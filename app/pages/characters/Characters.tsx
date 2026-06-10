import { Container, Group, Title } from "@mantine/core";
import { RiTeamLine } from "@remixicon/react";
import useAppStore from "~/lib/stores/appStore";
import { CreateCharacterFromLibraryModal } from "~/pages/characters/components/CreateCharacterFromLibraryModal";
import { CreateCharacterModal } from "~/pages/characters/components/CreateCharacterModal";
import { UserCharactersList } from "~/pages/characters/components/UserCharactersList";
import MobileScrollBox from "~/shared/MobileScrollBox";

export function meta() {
  return [{ title: "Characters" }];
}

export default function Characters() {
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
            <RiTeamLine size={24} />
            <Title order={2}>Characters</Title>
          </Group>
          <Group
            gap="xs"
            align="center"
            justify="space-between"
            w={isMobile ? "100%" : "auto"}
            grow={isMobile}
          >
            <CreateCharacterModal />
            <CreateCharacterFromLibraryModal />
          </Group>
        </Group>

        <UserCharactersList />
      </Container>
    </MobileScrollBox>
  );
}
