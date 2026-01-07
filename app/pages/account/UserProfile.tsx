import { Avatar, Badge, Button, Group, Stack, Text, useMantineTheme } from "@mantine/core";
import { RiCoinsLine } from "@remixicon/react";
import { useEffect } from "react";
import { Link } from "react-router";
import useAppStore from "~/lib/stores/appStore";
import { getInitials } from "~/lib/utils";
import { formatTokens } from "~/lib/tokenUtils";
import Mounted from "~/shared/Mounted";
import { PageTitle } from "~/shared/PageTitle";
import AccountInformation from "./components/AccountInformation";
import ProfileInformation from "./components/ProfileInformation";
import ThemeSettings from "./components/ThemeSettings";
import { CurrentBalance } from "~/shared/CurrentBalance";

export default function UserProfile() {
  const theme = useMantineTheme();
  const { user, pageLoading, api } = useAppStore();

  // Optional: fetch zipline user if needed, the internal route uses server session
  const getZiplineUser = async () => {
    try {
      // No-op for now; keep for future use if needed
    } catch {
      // ignore
    }
  };

  const getProviderBadge = () => {
    const provider = user?.user?.app_metadata?.provider;
    if (provider === "email") return { label: "Email", color: "blue" };
    return { label: provider || "Unknown", color: "gray" };
  };

  const providerBadge = getProviderBadge();

  // Fetch user profile data
  useEffect(() => {
    getZiplineUser();
  }, [user?.user?.id, api]);

  const getDisplayName = () => {
    if (user?.profile?.first_name && user?.profile?.last_name) {
      return `${user.profile.first_name} ${user.profile.last_name}`;
    }
    return user?.user?.user_metadata?.full_name || user?.user?.email || "User";
  };

  return (
    <Mounted pageLoading={pageLoading}>
      <PageTitle title="User Profile" />

      <Stack gap="xl">
        {/* Header Section */}
        <Group justify="space-between" align="flex-start">
          <Group gap="lg">
            <Avatar
              size={80}
              radius={80}
              src={user?.user?.user_metadata?.avatar_url}
              color={theme.primaryColor}
              onError={() =>
                console.log("Profile Avatar failed to load:", user?.user?.user_metadata?.avatar_url)
              }
              onLoad={() => console.log("Profile Avatar loaded successfully")}
            >
              {getInitials(user?.user?.email || "")}
            </Avatar>
            <Stack gap="xs">
              <Text size="xl" fw={700}>
                {getDisplayName()}
              </Text>
              <Group gap="xs">
                <Badge color={providerBadge.color} variant="light">
                  {providerBadge.label}
                </Badge>
                {user?.user?.email_confirmed_at && (
                  <Badge color="green" variant="light">
                    Verified
                  </Badge>
                )}
              </Group>
              <Group gap="xs">
                {user?.profile?.username && (
                  <Badge color="cyan" variant="light">
                    @{user.profile.username}
                  </Badge>
                )}
                {typeof user?.profile?.tokens === "number" && (
                  <Badge color="blue" variant="light" leftSection={<RiCoinsLine size={12} />}>
                    {formatTokens(user.profile.tokens)} tokens
                  </Badge>
                )}
              </Group>
              <Text size="sm" c="dimmed">
                {user?.user?.email}
              </Text>
            </Stack>
          </Group>
          <Group gap="sm">
            <Button component={Link} to="/account/billing" variant="light">
              Transactions
            </Button>
            <Button
              component={Link}
              to="/account/tokens-log"
              leftSection={<RiCoinsLine size={16} />}
              variant="light"
            >
              View Tokens log
            </Button>
          </Group>
        </Group>
        <CurrentBalance />
        {/* Profile Information */}
        <ProfileInformation />

        {/* Account Information */}
        <AccountInformation />

        {/* Theme Settings */}
        <ThemeSettings />
      </Stack>
    </Mounted>
  );
}
