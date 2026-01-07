import {
  Container,
  Stack,
  Loader,
  Alert,
  ScrollArea,
  Grid,
  Card,
  Box,
  Center,
  Text,
  useMantineColorScheme,
} from "@mantine/core";
import { useViewportSize } from "@mantine/hooks";
import { RiErrorWarningLine } from "@remixicon/react";
import { useEffect } from "react";
import { useParams } from "react-router";
import { notifications } from "@mantine/notifications";
import useAppStore from "~/lib/stores/appStore";
import useGenerateStore from "~/lib/stores/generateStore";
import { SchemaFormGenerator } from "~/pages/generate/components/SchemaFormGenerator";
import { FormProvider, useForm } from "~/lib/ContextForm";
import { GenerationResults } from "~/pages/generate/components/GenerationResults";
import { GenerateButton } from "~/pages/generate/components/GenerateButton";
import { LoginCTA } from "~/shared/LoginCTA";
import { ModelSwitcher } from "~/shared/ModelSwitcher";

export default function GenerateModel() {
  const { slug } = useParams();
  const { height: viewportHeight } = useViewportSize();
  const { getUser } = useAppStore();
  const { colorScheme } = useMantineColorScheme();
  const {
    modelLoading,
    loadModel,
    generateContent,
    setCurrentTaskId,
    calculateTokens,
    activeTab,
    setActiveTab,
    getSelectedModel,
  } = useGenerateStore();
  const { isMobile, userTokens } = useAppStore();
  const user = getUser();
  const currentTokens = userTokens || 0;

  // Define function before using it
  const getDefaultValuesFromSchema = (schema: any): Record<string, any> => {
    // Handle nested inputSchema structure (MCP format)
    const propertiesToProcess = schema.inputSchema?.properties || schema.properties;

    const processProperty = (property: any) => {
      // For read-only fields, ALWAYS include their default value in the payload
      if (property.readOnly === true) {
        return property.default;
      }

      // For editable fields, set defaults based on type
      if (property.default !== undefined) {
        return property.default;
      }

      if (property.type === "object" && property.properties) {
        // Recursively process nested object properties
        const nestedObject: Record<string, any> = {};
        Object.keys(property.properties).forEach((nestedKey) => {
          nestedObject[nestedKey] = processProperty(property.properties[nestedKey]);
        });
        return nestedObject;
      }

      if (property.type === "string") {
        return "";
      }

      if (property.type === "number" || property.type === "integer") {
        return 0;
      }

      if (property.type === "boolean") {
        return false;
      }

      if (property.type === "array") {
        return [];
      }

      return "";
    };

    const values: Record<string, any> = {};

    if (propertiesToProcess) {
      Object.keys(propertiesToProcess).forEach((key) => {
        values[key] = processProperty(propertiesToProcess[key]);
      });
    }
    return values;
  };

  const form = useForm({
    onValuesChange(values) {
      calculateTokens(values);
    },
  });

  useEffect(() => {
    // Load specific model if slug is provided
    if (slug) {
      loadModel(slug);
    }
  }, [slug]);

  // Reinitialize form when model changes
  useEffect(() => {
    if (getSelectedModel()?.api?.schema || getSelectedModel()?.schema) {
      const defaultValues = getDefaultValuesFromSchema(
        getSelectedModel().api?.schema || getSelectedModel().schema
      );
      // Reinitialize form with new defaults
      form.setInitialValues(defaultValues);
      form.reset();
      calculateTokens(defaultValues);
    }
  }, [getSelectedModel()?.id]);

  const handleSubmit = async (values: any) => {
    if (!getSelectedModel()) return;
    // Check if user has enough tokens
    const cost = getSelectedModel().config?.cost_per_generation || 100;
    if (currentTokens < cost) {
      notifications.show({
        title: "Insufficient Tokens",
        message: `You need ${cost} tokens to generate content. You have ${currentTokens} tokens.`,
        color: "red",
      });
      return;
    }

    const result = await generateContent(getSelectedModel().id, values);

    if (result.success) {
      // Switch to results tab when generation starts
      if (isMobile) {
        setActiveTab("results");
      }
      // Extract task ID from the result data
      const taskId = result.data?.task_id || result.data?.id;
      setCurrentTaskId(taskId);

      notifications.show({
        title: "Generation Started",
        message: `Your ${getSelectedModel()?.generation_type.toLowerCase()} is being generated. You'll be notified when it's ready.`,
        color: "green",
      });
    } else {
      notifications.show({
        title: "Generation Failed",
        message: result.error || "Failed to start generation",
        color: "red",
      });
    }
  };

  const LoadingComponent = () => {
    if (!modelLoading && !getSelectedModel()) {
      return (
        <Alert icon={<RiErrorWarningLine size={16} />} title="Model Not Found" color="red">
          The requested model could not be found.
        </Alert>
      );
    }
    if (modelLoading) {
      return (
        <Center h={400}>
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text>Loading model...</Text>
          </Stack>
        </Center>
      );
    }
    return null;
  };

  // Calculate available height for ScrollArea
  // Subtract: header (60px) + navbar header (60px) + padding/margins (~120px) + submit button area (~80px)
  const availableHeightForm = viewportHeight - 330;
  const availableHeightResults = viewportHeight - 170;
  // Mobile Layout
  if (isMobile) {
    return (
      <Container fluid py="md">
        <LoadingComponent />
        {getSelectedModel() && !modelLoading && (
          <>
            {activeTab === "form" ? (
              <FormProvider form={form}>
                <form onSubmit={form.onSubmit(handleSubmit)}>
                  <Stack gap="md" pb="120px">
                    <SchemaFormGenerator
                      schema={getSelectedModel().api?.schema}
                      generationType={getSelectedModel().generation_type as "image" | "video"}
                    />

                    <Box
                      pos="fixed"
                      bottom="60px"
                      left="0"
                      right="0"
                      bg={colorScheme === "dark" ? "dark.8" : "white"}
                    >
                      {/* Submit button */}
                      {user?.user?.id ? <GenerateButton /> : <LoginCTA variant="default" />}
                    </Box>
                  </Stack>
                </form>
              </FormProvider>
            ) : (
              <GenerationResults />
            )}
          </>
        )}
      </Container>
    );
  }

  // Desktop Layout
  return (
    <Container fluid py="0">
      <Grid gutter="xl">
        {/* Form Column */}
        <Grid.Col span={4}>
          <LoadingComponent />
          {getSelectedModel() && !modelLoading && (
            <Stack gap="md" pt="xs">
              <ModelSwitcher />
              <FormProvider form={form}>
                <form onSubmit={form.onSubmit(handleSubmit)}>
                  <Card radius="md" p="0">
                    <Stack gap="md">
                      {/* Scrollable form content */}
                      <ScrollArea h={availableHeightForm} p="xs">
                        <Stack gap="xs" px="xs">
                          <SchemaFormGenerator
                            schema={getSelectedModel().api?.schema}
                            generationType={getSelectedModel().generation_type as "image" | "video"}
                          />
                        </Stack>
                      </ScrollArea>

                      {/* Submit button */}
                      {user?.user?.id ? <GenerateButton /> : <LoginCTA variant="default" />}
                    </Stack>
                  </Card>
                </form>
              </FormProvider>
            </Stack>
          )}
        </Grid.Col>

        {/* Results Column */}
        <Grid.Col span={8}>
          <ScrollArea h={availableHeightResults}>
            <Box pr="md">
              <GenerationResults />
            </Box>
          </ScrollArea>
        </Grid.Col>
      </Grid>
    </Container>
  );
}
