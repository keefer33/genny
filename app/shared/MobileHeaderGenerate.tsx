import { Box } from "@mantine/core";
import { ModelSwitcher } from "./ModelSwitcher";

export const MobileHeaderGenerate = () => {
  return (
    <Box hiddenFrom="sm" w="100%" px="xs">
      <ModelSwitcher />
    </Box>
  );
};
