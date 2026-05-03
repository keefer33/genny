import { Stack } from "@mantine/core";
import GenModelsProductScroller from "~/shared/GenModelsProductScroller";
import Mounted from "~/shared/Mounted";

export default function Generate() {
  return (
    <Mounted size="full" pt="md">
      <Stack gap="xl">
        <GenModelsProductScroller title="Video Models" generationType="video" />
        <GenModelsProductScroller title="Image Models" generationType="image" />
        <GenModelsProductScroller title="Audio Models" generationType="audio" />
      </Stack>
    </Mounted>
  );
}
