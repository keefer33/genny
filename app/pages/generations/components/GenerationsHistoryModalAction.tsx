import { ActionIcon } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { RiHistoryLine } from "@remixicon/react";
import { GenerationsHistoryModal } from "~/shared/GenerationsHistoryModal";

export default function PlayGroundRunHistoryModalAction({
  title,
  disabled = false,
  onOpen,
}: {
  title: string;
  disabled?: boolean;
  onOpen?: () => void;
}) {
  const [opened, { open, close }] = useDisclosure(false);
  const handleOpen = () => {
    onOpen?.();
    open();
  };

  return (
    <>
      <ActionIcon
        variant="transparent"
        size="md"
        aria-label={`Open run history: ${title}`}
        onClick={handleOpen}
        disabled={disabled}
      >
        <RiHistoryLine size={26} />
      </ActionIcon>
      <GenerationsHistoryModal title={title} opened={opened} onClose={close} />
    </>
  );
}
