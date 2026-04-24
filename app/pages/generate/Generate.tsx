import { Box, Stack } from "@mantine/core";
import GenModelsProductScroller from "~/shared/GenModelsProductScroller";
import Mounted from "~/shared/Mounted";

export default function Generate() {
  return (
    <Mounted size="xl" pt="md">
      <Box>
        <Stack gap="md">
          <GenModelsProductScroller title="Video Models" generationType="video" />
          <GenModelsProductScroller title="Image Models" generationType="image" />
        </Stack>
      </Box>
    </Mounted>
  );
}
