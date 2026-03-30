import { Container, Space, Stack, Title, Text } from "@mantine/core";
import { PromotionCard } from "~/shared/PromotionCard";
import { BrandsSlider } from "./BrandsSlider";
import { ToolsSlider } from "./ToolsSlider";
import { FeaturesList } from "~/shared/FeaturesList";
import useAppStore from "~/lib/stores/appStore";

export function meta() {
  return [{ title: "Genny.bot" }, { name: "description", content: "Welcome to Genny.bot!" }];
}

const heroText = `
Dream it. Prompt it. Genny Bot builds it.
`;
const heroText2 = `
Generative AI agents and tools  for text, images, video, and more.  Stop imagining. Start creating.

`;

export default function Home() {
  const { isMobile } = useAppStore();
  return (
    <Container fluid>
      <Container size="lg">
        <Stack gap="0" py={60} justify="center" align="center">
          <Title order={isMobile ? 1 : 1} w={isMobile ? "100%" : "700px"} ta="center" mb={10}>
            {heroText}
          </Title>
          <Text size="sm" fw={500} ta="center">
            {heroText2}
          </Text>
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
      <Space h={80} />
      <Container size="md">
        <PromotionCard />
      </Container>
      <Space h={80} />
    </Container>
  );
}
