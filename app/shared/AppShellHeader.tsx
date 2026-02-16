import { Group } from "@mantine/core";
import { ActionIcon, Burger } from "@mantine/core";
import { RiLoginBoxLine } from "@remixicon/react";
import { Link } from "react-router";
import Logo from "./Logo";
import useAppStore from "~/lib/stores/appStore";
import { TokensBadge } from "./TokensBadge";
import { mobileUI } from "~/lib/mobileUi";

interface AppShellHeaderProps {
  mobileOpened: boolean;
  toggleMobile: () => void;
}

export function AppShellHeader({ mobileOpened, toggleMobile }: AppShellHeaderProps) {
  const { isMobile, page, getCurrentUserTokens, getUser } = useAppStore();
  const isLoggedIn = !!getUser()?.user?.id;

  return (
    <>
      <Group p="sm" justify="space-between" align="center">
        <Group>
          <Burger opened={mobileOpened} onClick={toggleMobile} size="sm" hiddenFrom="md" />
          <Logo size={48} />
        </Group>
        <Group align="center">
          {isLoggedIn ? (
            <TokensBadge tokens={getCurrentUserTokens()} />
          ) : (
            <ActionIcon component={Link} to="/login" variant="subtle" aria-label="Login" size="lg">
              <RiLoginBoxLine size={20} />
            </ActionIcon>
          )}
        </Group>
      </Group>
      {isMobile && mobileUI.pages[page ?? ""]?.header?.component}
    </>
  );
}
