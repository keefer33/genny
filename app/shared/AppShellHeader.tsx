import { Box, Burger, Button, Group } from "@mantine/core";
import { RiLoginBoxLine } from "@remixicon/react";
import { Link } from "react-router";
import { useUserProfileUsageBalanceRealtime } from "~/lib/hooks/useUserRealtimeChannels";
import Logo from "./Logo";
import useAppStore from "~/lib/stores/appStore";
import { CostBadge } from "./CostBadge";

interface AppShellHeaderProps {
  mobileOpened: boolean;
  toggleMobile: () => void;
}

export function AppShellHeader({ mobileOpened, toggleMobile }: AppShellHeaderProps) {
  const { getCurrentUserUsageBalance, getUser } = useAppStore();
  const isLoggedIn = !!getUser()?.user?.id;
  const userId = getUser()?.user?.id;
  useUserProfileUsageBalanceRealtime(userId);

  return (
    <Box h="100%" style={{ display: "flex", alignItems: "center" }}>
      <Group px="sm" justify="space-between" align="center" w="100%">
        <Group>
          <Logo />
        </Group>
        <Group align="center">
          {isLoggedIn ? (
            <>
              <CostBadge cost={getCurrentUserUsageBalance()} />
            </>
          ) : (
            <Button
              component={Link}
              to="/login"
              variant="subtle"
              size="sm"
              leftSection={<RiLoginBoxLine size={18} />}
              aria-label="Login / Register"
            >
              Login
            </Button>
          )}

          <Burger opened={mobileOpened} onClick={toggleMobile} size="sm" hiddenFrom="md" />
        </Group>
      </Group>
    </Box>
  );
}
