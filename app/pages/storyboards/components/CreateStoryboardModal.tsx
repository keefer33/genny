import { Button } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { RiAddLine } from "@remixicon/react";
import { useNavigate } from "react-router";
import useStoryboardsStore from "~/lib/stores/storyboardsStore";
import type { StoryboardFormValues } from "~/pages/storyboards/storyboardUtils";
import { StoryboardUpsertModal } from "~/pages/storyboards/components/StoryboardUpsertModal";

export function CreateStoryboardModal() {
  const [opened, { open, close }] = useDisclosure(false);
  const createStoryboard = useStoryboardsStore((s) => s.createStoryboard);
  const createLoading = useStoryboardsStore((s) => s.createLoading);
  const navigate = useNavigate();

  const handleCreate = async (values: StoryboardFormValues) => {
    const created = await createStoryboard(values);
    if (!created?.id) return;
    close();
    navigate(`/storyboards/${encodeURIComponent(created.id)}`);
  };

  return (
    <>
      <Button size="compact-sm" leftSection={<RiAddLine size={18} />} onClick={open}>
        New
      </Button>
      <StoryboardUpsertModal
        opened={opened}
        onClose={close}
        title="Create storyboard"
        submitLabel="Create storyboard"
        submitting={createLoading}
        onSubmit={handleCreate}
      />
    </>
  );
}
