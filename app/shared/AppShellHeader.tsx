import { Group } from "@mantine/core";
import { Burger } from "@mantine/core";
import Logo from "./Logo";
import useAppStore from "~/lib/stores/appStore";
import { TokensBadge } from "./TokensBadge";
import { mobileUI } from "~/lib/mobileUi";

interface AppShellHeaderProps {
  mobileOpened: boolean;
  toggleMobile: () => void;
}

export function AppShellHeader({ mobileOpened, toggleMobile }: AppShellHeaderProps) {
  const { isMobile, page, getCurrentUserTokens } = useAppStore();

  return (
    <>
      <Group p="sm" justify="space-between" align="center">
        <Group>
          <Burger opened={mobileOpened} onClick={toggleMobile} size="sm" hiddenFrom="md" />
          <Logo size={48} />
        </Group>
        <Group align="center">
          <TokensBadge tokens={getCurrentUserTokens()} />
        </Group>
      </Group>
      {isMobile && mobileUI.pages[page ?? ""]?.header?.component}
    </>
  );
}
