import {
  Box,
  Button,
  Group,
  Input,
  Loader,
  Modal,
  ScrollArea,
  Select,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { FormProvider } from "~/lib/ContextForm";
import useAppStore from "~/lib/stores/appStore";
import { MAX_CHARACTER_NAME_LENGTH } from "~/pages/characters/characterUtils";
import { CharacterAudioPicker } from "~/pages/characters/components/CharacterAudioPicker";
import { CharacterBaseLookPicker } from "~/pages/characters/components/CharacterBaseLookPicker";
import { CharacterLookModelFields } from "~/pages/characters/components/CharacterLookModelFields";
import type { GenerateLookModalDialogProps } from "~/pages/characters/components/generateLookModalTypes";
import { useGenerateLookModalDialog } from "~/pages/characters/components/useGenerateLookModalDialog";
import { SchemaNestedFields } from "~/pages/generate/components/SchemaNestedFields";
import { CostBadge } from "~/shared/CostBadge";

export default function GenerateLookModalDialog({
  opened,
  onClose,
  submitting,
  kind = "look",
  title,
  submitLabel,
  ...dialogProps
}: GenerateLookModalDialogProps) {
  const resolvedTitle =
    title ??
    (kind === "video" ? "Generate video" : kind === "scene" ? "Generate scene" : "Generate look");
  const resolvedSubmitLabel = submitLabel ?? "Generate";
  const descriptionText =
    kind === "video"
      ? "Videos animate your character. Select a base look and speech clip, then describe the video you want."
      : kind === "scene"
        ? "Scenes place your character in a setting. You can add optional images or describe the scene in detail."
        : "Looks generate a front, back, right, and left view of the character. You can add optional images of outfits and accessories.";
  const { isMobile } = useAppStore();

  const {
    form,
    nameLabel,
    namePlaceholder,
    modelId,
    lookName,
    lookNameError,
    setLookName,
    setLookNameError,
    lookModelPayload,
    lookModelSelectData,
    lookModelOptionsLoading,
    lookModelUiFields,
    selectedLookModelOption,
    selectedModel,
    modelLoading,
    functionSchema,
    showBaseLookPicker,
    showAudioPicker,
    audioOptions,
    conditionState,
    generateCost,
    generateCostLoading,
    hasFormContent,
    handleLookModelChange,
    handleLookModelFieldChange,
    handleSubmit,
  } = useGenerateLookModalDialog({
    opened,
    onClose,
    submitting,
    kind,
    title,
    submitLabel,
    ...dialogProps,
  });

  const canSubmit =
    !submitting &&
    !modelLoading &&
    !lookModelOptionsLoading &&
    Boolean(modelId.trim() && selectedLookModelOption) &&
    hasFormContent &&
    lookName.trim().length > 0;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={resolvedTitle}
      centered
      size="md"
      fullScreen={isMobile}
      styles={{
        content: {
          display: "flex",
          flexDirection: "column",
          height: "100%",
        },
        body: {
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
        },
      }}
      padding={2}
    >
      <FormProvider form={form}>
        <form
          onSubmit={handleSubmit}
          style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
        >
          <Box p="xs">
            <Text size="sm" c="dimmed">
              {descriptionText}
            </Text>
          </Box>
          <Box style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            {lookModelOptionsLoading || modelLoading ? (
              <Group justify="center" p="md">
                <Loader size="sm" />
              </Group>
            ) : !selectedModel ? (
              <Text size="sm" c="dimmed" p="md">
                Could not load model settings.
              </Text>
            ) : !hasFormContent ? (
              <Text size="sm" c="dimmed" p="md">
                This model has no configurable inputs.
              </Text>
            ) : (
              <ScrollArea h="100%" type="auto">
                <Stack gap="lg" p="xs">
                  <Select
                    label="Model"
                    placeholder="Choose a model"
                    data={lookModelSelectData}
                    value={modelId || null}
                    onChange={(value) =>
                      handleLookModelChange(typeof value === "string" ? value : null)
                    }
                    allowDeselect={false}
                    disabled={
                      submitting || lookModelOptionsLoading || lookModelSelectData.length === 0
                    }
                  />
                  {showBaseLookPicker ? (
                    <CharacterBaseLookPicker
                      options={dialogProps.baseLookOptions}
                      disabled={submitting}
                    />
                  ) : null}

                  {showAudioPicker ? (
                    <CharacterAudioPicker options={audioOptions} disabled={submitting} />
                  ) : null}

                  {functionSchema?.properties ? (
                    <SchemaNestedFields
                      key={selectedModel.id}
                      pathPrefix=""
                      objectSchema={
                        functionSchema as typeof functionSchema & {
                          properties: NonNullable<typeof functionSchema.properties>;
                        }
                      }
                      readOnly={false}
                      generationType="image"
                      conditionDisabledFields={conditionState.disabledFields}
                    />
                  ) : null}

                  {selectedLookModelOption ? (
                    <CharacterLookModelFields
                      ui={lookModelUiFields}
                      values={lookModelPayload}
                      disabled={submitting}
                      onChange={handleLookModelFieldChange}
                    />
                  ) : null}
                </Stack>
              </ScrollArea>
            )}
          </Box>

          <Group wrap="nowrap" gap="xs" p="xs" align="flex-start">
            <TextInput
              label={nameLabel}
              placeholder={namePlaceholder}
              value={lookName}
              onChange={(event) => {
                setLookName(event.currentTarget.value);
                if (lookNameError) setLookNameError(null);
              }}
              maxLength={MAX_CHARACTER_NAME_LENGTH}
              required
              disabled={submitting}
              error={lookNameError}
              style={{ flex: 1, minWidth: 0 }}
            />
            <Stack gap={4} style={{ flexShrink: 0 }}>
              <Input.Label style={{ visibility: "hidden" }} aria-hidden>
                {nameLabel}
              </Input.Label>
              <Button
                type="submit"
                loading={submitting}
                disabled={!canSubmit}
                rightSection={
                  generateCostLoading ? (
                    <Loader type="dots" color="gray.4" size="sm" />
                  ) : generateCost != null ? (
                    <CostBadge cost={generateCost} size="sm" clickable={false} />
                  ) : null
                }
              >
                {resolvedSubmitLabel}
              </Button>
            </Stack>
          </Group>
        </form>
      </FormProvider>
    </Modal>
  );
}
