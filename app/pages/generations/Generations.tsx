import { Box, Container, Loader } from "@mantine/core";
import GenerationsHistory from "./components/GenerationsHistory";
import useGenerateStore from "~/lib/stores/generateStore";
import { useEffect } from "react";

export default function Generations() {
  const { reset, loading, setLoading } = useGenerateStore();
  useEffect(() => {
    setLoading(true);
    reset();
    setLoading(false);
  }, []);
  if (loading) {
    return <Loader />;
  }
  return (
    <Container size="lg" p="0">
      <Box
        h="calc(100dvh - var(--app-shell-header-height, 0px) - var(--app-shell-footer-height, 0px))"
        style={{ minHeight: 0 }}
      >
        <GenerationsHistory />
      </Box>
    </Container>
  );
}
