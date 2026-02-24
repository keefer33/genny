import { Container } from "@mantine/core";
import { useMounted } from "@mantine/hooks";
import PageLoader from "./PageLoader";

interface MountedProps {
  children: React.ReactNode;
  pageLoading?: boolean;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "full";
  pt?: number | "xs" | "sm" | "md" | "lg" | "xl";
}

export default function Mounted({ children, pageLoading, size = "md", pt = "xs" }: MountedProps) {
  const mounted = useMounted();

  return (
    <Container size={size === "full" ? undefined : size} fluid={size === "full"} pt={pt}>
      {mounted && !pageLoading ? children : <PageLoader />}
    </Container>
  );
}
