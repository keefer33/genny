import { Container, Group, Title } from "@mantine/core";
import { RiClapperboardLine } from "@remixicon/react";
import useAppStore from "~/lib/stores/appStore";
import { CreateStoryboardModal } from "~/pages/storyboards/components/CreateStoryboardModal";
import { UserStoryboardsList } from "~/pages/storyboards/components/UserStoryboardsList";
import MobileScrollBox from "~/shared/MobileScrollBox";

export function meta() {
  return [{ title: "Storyboards" }];
}

export default function Storyboards() {
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
            <RiClapperboardLine size={24} />
            <Title order={2}>Storyboards</Title>
          </Group>
          <Group
            gap="xs"
            align="center"
            justify="space-between"
            w={isMobile ? "100%" : "auto"}
            grow={isMobile}
          >
            <CreateStoryboardModal />
          </Group>
        </Group>

        <UserStoryboardsList />
      </Container>
    </MobileScrollBox>
  );
}
