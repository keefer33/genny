import { Box, Group } from "@mantine/core";
import { ActionIcon, Burger } from "@mantine/core";
import { RiLoginBoxLine } from "@remixicon/react";
import { Link } from "react-router";
import Logo from "./Logo";
import useAppStore from "~/lib/stores/appStore";
import { TokensBadge } from "./TokensBadge";

interface AppShellHeaderProps {
  mobileOpened: boolean;
  toggleMobile: () => void;
}

export function AppShellHeader({ mobileOpened, toggleMobile }: AppShellHeaderProps) {
  const { getCurrentUserTokens, getUser } = useAppStore();
  const isLoggedIn = !!getUser()?.user?.id;

  return (
    <Box h="100%" style={{ display: "flex", alignItems: "center" }}>
      <Group px="sm" justify="space-between" align="center" w="100%">
        <Group>
          <Logo size={40} />
        </Group>
        <Group align="center">
          {isLoggedIn ? (
            <TokensBadge tokens={getCurrentUserTokens()} />
          ) : (
            <ActionIcon component={Link} to="/login" variant="subtle" aria-label="Login" size="lg">
              <RiLoginBoxLine size={20} />
            </ActionIcon>
          )}
          <Burger opened={mobileOpened} onClick={toggleMobile} size="sm" hiddenFrom="md" />
        </Group>
      </Group>
    </Box>
  );
}
