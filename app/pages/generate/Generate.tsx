import {
  Badge,
  Button,
  Card,
  Container,
  Grid,
  Group,
  Stack,
  Text,
  Title,
  ThemeIcon,
  useMantineTheme,
} from "@mantine/core";
import { RiImageLine, RiVideoLine } from "@remixicon/react";
import { useNavigate } from "react-router";

const GENERATION_TYPES = [
  {
    id: "image",
    name: "Image Generation",
    description: "Generate stunning AI images from text prompts",
    icon: RiImageLine,
    features: ["High Quality", "Multiple Styles", "Fast Processing"],
  },
  {
    id: "video",
    name: "Video Generation",
    description: "Create AI videos from text descriptions",
    icon: RiVideoLine,
    features: ["Dynamic Content", "Smooth Motion", "Creative Control"],
  },
];

export default function Generate() {
  const navigate = useNavigate();
  const theme = useMantineTheme();
  const primaryColor = theme.primaryColor;

  const handleTypeSelect = (typeId: string) => {
    navigate(`/generate/${typeId}`);
  };

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Grid gutter="xl">
          {GENERATION_TYPES.map((type) => {
            const IconComponent = type.icon;
            return (
              <Grid.Col key={type.id} span={{ base: 12, md: 6 }}>
                <Card
                  withBorder
                  radius="md"
                  p="lg"
                  style={{
                    cursor: "pointer",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = theme.shadows.md;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  onClick={() => handleTypeSelect(type.id)}
                >
                  <Stack gap="md">
                    <Group justify="space-between" align="flex-start">
                      <ThemeIcon color={primaryColor} variant="light" size="xl">
                        <IconComponent size={24} />
                      </ThemeIcon>
                      <Badge
                        color={type.name === "Image Generation" ? "green" : "orange"}
                        size="lg"
                      >
                        {type.name}
                      </Badge>
                    </Group>

                    <div>
                      <Title order={3} mb="xs">
                        {type.name}
                      </Title>
                      <Text size="sm" c="dimmed" mb="md">
                        {type.description}
                      </Text>
                    </div>

                    <Group gap="xs" wrap="wrap">
                      {type.features.map((feature, index) => (
                        <Badge key={index} variant="light" size="sm" color={primaryColor}>
                          {feature}
                        </Badge>
                      ))}
                    </Group>

                    <Button
                      fullWidth
                      variant="light"
                      color={primaryColor}
                      leftSection={<IconComponent size={16} />}
                    >
                      Start Generating
                    </Button>
                  </Stack>
                </Card>
              </Grid.Col>
            );
          })}
        </Grid>
      </Stack>
    </Container>
  );
}
