import { Button, Stack } from "@mantine/core";
import { RiImageLine, RiVideoLine } from "@remixicon/react";
import { TokensBadge } from "../../../shared/TokensBadge";
import useGenerateStore from "~/lib/stores/generateStore";

export function GenerateButton() {
  const { getSelectedModel, generating, tokensCost } = useGenerateStore();

  const getIcon = () => {
    return getSelectedModel().generation_type === "video" ? (
      <RiVideoLine size={16} />
    ) : (
      <RiImageLine size={16} />
    );
  };

  const getButtonText = () => {
    if (generating) {
      return "Generating...";
    }
    return `Generate ${getSelectedModel().name.split(" ")[0]}`;
  };

  return (
    <Stack justify="center" align="center" p="md" gap="sm">
      <Button
        type="submit"
        loading={generating}
        leftSection={getIcon()}
        rightSection={<TokensBadge tokens={tokensCost} clickable={false} />}
        size="md"
        variant="light"
      >
        {getButtonText()}
      </Button>
    </Stack>
  );
}
