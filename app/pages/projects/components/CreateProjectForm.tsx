import { Button, Card, Group, Stack, Text, Textarea, TextInput, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useChatsStore } from "~/lib/stores/chatsStore";
import useProjectsStore from "~/lib/stores/projectsStore";
import {
  BUILD_PROJECT_BRIEF_PROMPT,
  EMPTY_PROJECT_FORM,
  type ProjectFormValues,
} from "~/pages/projects/projectUtils";

export default function CreateProjectForm() {
  const navigate = useNavigate();
  const {
    createProject,
    createLoading,
    selectProject,
    selectedProject,
    setShowCreateForm,
  } = useProjectsStore();
  const { selectedModelName, runChat } = useChatsStore();
  const [form, setForm] = useState<ProjectFormValues>(EMPTY_PROJECT_FORM);
  const [startingBrief, setStartingBrief] = useState(false);

  useEffect(() => {
    setForm(EMPTY_PROJECT_FORM);
    setStartingBrief(false);
  }, []);

  const nameOk = form.project_name.trim().length > 0;
  const briefOk = form.project_brief.trim().length > 0;
  const canSubmit = nameOk && briefOk && !createLoading && !startingBrief && Boolean(selectedModelName);
  const canCancel = Boolean(selectedProject);

  const handleSubmit = async () => {
    if (!canSubmit || !selectedModelName) return;

    const created = await createProject({
      project_name: form.project_name.trim(),
      project_brief: form.project_brief.trim(),
    });
    if (!created?.id || !created.chat_id) return;

    await selectProject(created);
    navigate(`/projects/${encodeURIComponent(created.id)}`);

    setStartingBrief(true);
    try {
      await runChat(
        created.chat_id,
        selectedModelName,
        { systemPrompt: "" },
        BUILD_PROJECT_BRIEF_PROMPT,
        []
      );
    } finally {
      setStartingBrief(false);
    }
  };

  const handleCancel = () => {
    if (!selectedProject) return;
    setShowCreateForm(false);
    navigate(`/projects/${encodeURIComponent(selectedProject.id)}`);
  };

  return (
    <Card
      padding="md"
      radius="md"
      mx="xs"
      my="xs"
      style={{ flex: 1, minHeight: 0, overflow: "auto" }}
    >
      <Stack gap="md" maw={560} mx="auto" w="100%">
        <Stack gap={4}>
          <Title order={3}>What can I build for you today?</Title>
          <Text size="sm" c="dimmed">
            Name the project and describe your intent. We&apos;ll start by building the Project Brief.
          </Text>
        </Stack>
        <TextInput
          label="Project name"
          placeholder="Name your project"
          required
          value={form.project_name}
          onChange={(e) => setForm((prev) => ({ ...prev, project_name: e.currentTarget.value }))}
          data-autofocus
        />
        <Textarea
          label="Project brief"
          description="Describe what you want to build — intent, audience, style, and any constraints."
          placeholder="What should this project become?"
          required
          minRows={6}
          autosize
          maxRows={14}
          value={form.project_brief}
          onChange={(e) => setForm((prev) => ({ ...prev, project_brief: e.currentTarget.value }))}
        />
        {!selectedModelName ? (
          <Text size="sm" c="dimmed">
            Select a model in the sidebar to create a project.
          </Text>
        ) : (
          <Group justify="flex-end">
            {canCancel ? (
              <Button
                variant="default"
                onClick={handleCancel}
                disabled={createLoading || startingBrief}
              >
                Cancel
              </Button>
            ) : null}
            <Button
              onClick={() => void handleSubmit()}
              loading={createLoading || startingBrief}
              disabled={!canSubmit}
            >
              Create & build brief
            </Button>
          </Group>
        )}
      </Stack>
    </Card>
  );
}
