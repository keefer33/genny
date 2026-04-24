import { ActionIcon } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { RiHistoryLine } from "@remixicon/react";
import { GenerationsHistoryModal } from "~/shared/GenerationsHistoryModal";

export default function PlayGroundRunHistoryModalAction({ title }: { title: string }) {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <ActionIcon
        variant="light"
        size="lg"
        aria-label={`Open run history: ${title}`}
        onClick={open}
      >
        <RiHistoryLine size={30} />
      </ActionIcon>
      <GenerationsHistoryModal title={title} opened={opened} onClose={close} />
    </>
  );
}
