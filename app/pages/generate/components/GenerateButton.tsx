import { Box, Button, useMantineColorScheme } from "@mantine/core";
import { RiImageLine, RiVideoLine } from "@remixicon/react";
import { TokensBadge } from "../../../shared/TokensBadge";
import useGenerateStore from "~/lib/stores/generateStore";
import useAppStore from "~/lib/stores/appStore";

export function GenerateButton() {
  const { isMobile } = useAppStore();
  const { getSelectedModel, generating, tokensCost } = useGenerateStore();
  const { colorScheme } = useMantineColorScheme();
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
    <Box pt="lg" pb="xs">
      <Button
        type="submit"
        loading={generating}
        leftSection={getIcon()}
        rightSection={<TokensBadge tokens={tokensCost} clickable={false} />}
        fullWidth
        variant="dark"
        size="md"
      >
        {getButtonText()}
      </Button>
    </Box>
  );
}
