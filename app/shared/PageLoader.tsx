import { Center, Loader } from "@mantine/core";

export default function PageLoader() {
  return (
    <Center>
      <Loader size="md" type="dots" mt="lg" />
    </Center>
  );
}
