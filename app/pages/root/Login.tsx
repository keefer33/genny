import { Container, Group, Stack } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import LoginForm from "~/shared/LoginForm";
import { PageTitle } from "~/shared/PageTitle";
import { PromotionCard } from "~/shared/PromotionCard";

// Declare Google types
declare global {
  interface Window {
    google: any;
    handleSignInWithGoogle: (response: any) => void;
  }
}

export default function Login() {
  return (
    <>
      <Notifications />
      <Container size="md" py="xl">
        <Group justify="center" gap="xl">
          <Stack>
            <PageTitle
              title="Welcome"
              text="Create or Login to your account to get started"
              settings={{ py: "xs", order: 3 }}
            />
            <LoginForm />
          </Stack>
          <PromotionCard />
        </Group>
      </Container>
    </>
  );
}
