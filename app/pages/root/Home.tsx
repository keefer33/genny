import { Container, Space, Stack, Title } from "@mantine/core";
import { PromotionCard } from "~/shared/PromotionCard";
import { BrandsSlider } from "./BrandsSlider";
import { ToolsSlider } from "./ToolsSlider";
import { FeaturesList } from "~/shared/FeaturesList";
import useAppStore from "~/lib/stores/appStore";

export function meta() {
  return [{ title: "Genny.bot" }, { name: "description", content: "Welcome to Genny.bot!" }];
}

export default function Home() {
  const { isMobile } = useAppStore();
  return (
    <Container fluid>
      <Container size="lg">
        <Stack gap="xs" py={60} align="center">
          {!isMobile ? (
            <>
              <Title order={1} fw={900} ta="center" w={600} mb={10}>
                Genny.bot builds AI agents and generates images, videos, and files.
              </Title>
              <Title order={2} fw={800} ta="center">
                Go from idea to output fast.
              </Title>
            </>
          ) : (
            <>
              <Title order={2} fw={900} ta="center" mb={10}>
                Genny.bot builds AI agents and generates images, videos, and files.
              </Title>
              <Title order={3} fw={800} ta="center">
                Go from idea to output fast.
              </Title>
            </>
          )}
        </Stack>
      </Container>
      <Container size="md">
        <BrandsSlider />
      </Container>
      <Space h={80} />
      <Container size="md">
        <PromotionCard />
      </Container>
      <Space h={80} />
      <Container size="md">
        <FeaturesList />
      </Container>
      <Space h={80} />
      <Container size="md">
        <ToolsSlider />
      </Container>
    </Container>
  );
}
