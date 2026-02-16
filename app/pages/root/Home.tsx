import { Stack } from "@mantine/core";
import { HomeCTA } from "~/shared/HomeCTA";

export function meta() {
  return [{ title: "Genny.bot" }, { name: "description", content: "Welcome to Genny.bot!" }];
}

export default function Home() {
  return (
    <Stack gap={0}>
      <video
        src="https://aifile.link/ETVryC.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        style={{
          width: "100%",
          display: "block",
          verticalAlign: "top",
          maxHeight: "70vh",
          objectFit: "cover",
        }}
      />
      <HomeCTA />
    </Stack>
  );
}
