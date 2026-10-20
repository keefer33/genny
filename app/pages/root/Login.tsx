import { Container, Group, Stack } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import LoginForm from "~/shared/LoginForm";
import WaitlistForm from "~/shared/WaitlistForm";
import { PageTitle } from "~/shared/PageTitle";
import { PromotionCard } from "~/shared/PromotionCard";
import { isWaitlistMode } from "~/lib/utils";

export default function Login() {
  return (
    <>
      <Notifications />
      <Container size="md" py="xl">
        <Group justify="center" gap="xl">
          <Stack>
            <PageTitle
              title={isWaitlistMode ? "Join the waitlist" : "Welcome"}
              text={
                isWaitlistMode
                  ? "Genny is in private build. Leave your email and we’ll invite you when we’re ready."
                  : "Create or Login to your account to get started"
              }
              settings={{ py: "xs", order: 3 }}
            />
            {isWaitlistMode ? <WaitlistForm /> : <LoginForm />}
          </Stack>
          {!isWaitlistMode ? <PromotionCard /> : null}
        </Group>
      </Container>
    </>
  );
}
