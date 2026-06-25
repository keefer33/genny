import { ActionIcon, Card, Group, Stack, Text, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { RiClapperboardLine, RiDeleteBinLine, RiPencilLine } from "@remixicon/react";
import type { MouseEvent } from "react";
import { useNavigate } from "react-router";
import useStoryboardsStore from "~/lib/stores/storyboardsStore";
import {
  storyboardFormFromRow,
  storyboardMetaLine,
  type UserStoryboard,
} from "~/pages/storyboards/storyboardUtils";
import { StoryboardDeleteModal } from "~/pages/storyboards/components/StoryboardDeleteModal";
import { StoryboardUpsertModal } from "~/pages/storyboards/components/StoryboardUpsertModal";

type StoryboardCardProps = {
  storyboard: UserStoryboard;
};

export function StoryboardCard({ storyboard }: StoryboardCardProps) {
  const navigate = useNavigate();
  const updateStoryboard = useStoryboardsStore((s) => s.updateStoryboard);
  const deleteStoryboard = useStoryboardsStore((s) => s.deleteStoryboard);
  const updateLoading = useStoryboardsStore((s) => s.updateLoading);
  const deleteLoading = useStoryboardsStore((s) => s.deleteLoading);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);

  const meta = storyboardMetaLine(storyboard);
  const displayTitle = storyboard.title?.trim() || "Untitled storyboard";

  const openStoryboard = () => navigate(`/storyboards/${encodeURIComponent(storyboard.id)}`);

  const openStoryboardAction = (action: () => void) => (event: MouseEvent) => {
    event.stopPropagation();
    action();
  };

  return (
    <>
      <Card
        radius="md"
        padding="md"
        shadow="sm"
        role="button"
        tabIndex={0}
        onClick={openStoryboard}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openStoryboard();
          }
        }}
        style={{ cursor: "pointer" }}
      >
        <Stack gap="md">
          <Group align="flex-start" wrap="nowrap" gap="md">
            <Card
              radius="md"
              p={0}
              style={{
                width: 100,
                height: 100,
                flexShrink: 0,
                overflow: "hidden",
                background: "var(--mantine-color-dark-6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <RiClapperboardLine size={32} style={{ opacity: 0.35 }} />
            </Card>

            <Stack gap="sm" style={{ flex: 1, minWidth: 0 }}>
              <Group justify="space-between" wrap="nowrap" align="flex-start">
                <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                  <Text fw={600} lineClamp={1}>
                    {displayTitle}
                  </Text>
                  <Text size="xs" c="dimmed" lineClamp={1}>
                    {meta}
                  </Text>
                </Stack>
                <Group gap={4} wrap="nowrap">
                  <Tooltip label="Edit">
                    <ActionIcon
                      variant="subtle"
                      aria-label="Edit storyboard"
                      onClick={openStoryboardAction(openEdit)}
                    >
                      <RiPencilLine size={18} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Delete">
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      aria-label="Delete storyboard"
                      onClick={openStoryboardAction(openDelete)}
                    >
                      <RiDeleteBinLine size={18} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Group>
            </Stack>
          </Group>
        </Stack>
      </Card>

      <StoryboardUpsertModal
        opened={editOpened}
        onClose={closeEdit}
        title="Edit storyboard"
        submitLabel="Save changes"
        submitting={updateLoading}
        initialValues={storyboardFormFromRow(storyboard)}
        onSubmit={async (values) => {
          const ok = await updateStoryboard(storyboard.id, values);
          if (ok) closeEdit();
        }}
      />

      <StoryboardDeleteModal
        opened={deleteOpened}
        storyboardTitle={storyboard.title}
        loading={deleteLoading}
        onClose={closeDelete}
        onConfirm={async () => {
          const ok = await deleteStoryboard(storyboard.id);
          if (ok) closeDelete();
        }}
      />
    </>
  );
}
