import {
  Card,
  Container,
  Grid,
  Stack,
  Text,
  Title,
  ThemeIcon,
  useMantineTheme,
  Center,
} from "@mantine/core";
import { RiImageLine, RiVideoLine, RiToolsLine } from "@remixicon/react";
import { useParams, useNavigate } from "react-router";
import useGenerateStore from "~/lib/stores/generateStore";
import { ModelCard } from "~/shared/ModelCard";
import { PageTitle } from "~/shared/PageTitle";

const GENERATION_TYPE_INFO = {
  image: {
    name: "Image Generation",
    icon: RiImageLine,
    color: "blue",
    description: "Choose from our collection of AI image generation models",
  },
  video: {
    name: "Video Generation",
    icon: RiVideoLine,
    color: "purple",
    description: "Choose from our collection of AI video generation models",
  },
  tools: {
    name: "Tools",
    icon: RiToolsLine,
    color: "orange",
    description: "Choose from our collection of AI tools and utilities",
  },
};

export default function GenerateType() {
  const { generation_type } = useParams();
  const navigate = useNavigate();
  const theme = useMantineTheme();
  const { models } = useGenerateStore();

  const typeInfo = GENERATION_TYPE_INFO[generation_type as keyof typeof GENERATION_TYPE_INFO];
  const IconComponent = typeInfo?.icon || RiImageLine;

  // Models are preloaded, no need to load them
  // useEffect removed since models are already available

  const handleModelSelect = (model: any) => {
    navigate(`/generate/${generation_type}/${model.slug}`);
  };

  if (!typeInfo) {
    return (
      <Container size="lg" py="xl">
        <Text>Invalid generation type</Text>
      </Container>
    );
  }

  // Filter models by generation type since all models are preloaded
  const filteredModels = models.filter((model) => model.generation_type === generation_type);
  if (filteredModels.length === 0) {
    return (
      <Container size="lg" py="xl">
        <Center py="xl">
          <Stack align="center" gap="md">
            <IconComponent size={48} />
            <Title order={2}>No models available</Title>
            <Text c="dimmed">No models found for {generation_type} generation.</Text>
          </Stack>
        </Center>
      </Container>
    );
  }

  return (
    <Container size="lg">
      <Stack gap="xl">
        {/* Header */}
        <PageTitle title={typeInfo.name} text={typeInfo.description} settings={{ py: "xs" }} />

        {/* Models Grid */}
        {filteredModels.length === 0 ? (
          <Card withBorder radius="md" p="xl">
            <Stack align="center" gap="md">
              <ThemeIcon color="gray" variant="light" size="xl">
                <IconComponent size={32} />
              </ThemeIcon>
              <Text size="lg" c="dimmed">
                No {typeInfo.name.toLowerCase()} models available
              </Text>
              <Text size="sm" c="dimmed">
                Check back later for new models
              </Text>
            </Stack>
          </Card>
        ) : (
          <Grid>
            {filteredModels.map((model) => (
              <Grid.Col key={model.id} span={{ base: 12, md: 6, lg: 6 }}>
                <ModelCard model={model} onSelect={handleModelSelect} />
              </Grid.Col>
            ))}
          </Grid>
        )}
      </Stack>
    </Container>
  );
}
