import { Avatar, Box, Center, Stack, Text } from "@mantine/core";
import { useEffect, useMemo, useState } from "react";
import { endpoint } from "~/lib/utils";
import useAppStore from "~/lib/stores/appStore";
import { ContinuousScroller } from "./ContinuousScroller";

const BRANDS = [
  {
    idx: 0,
    id: "0390cee1-70b6-4ecc-8c45-3b432d8b906a",
    name: "Google",
    slug: "google",
    config: null,
    description: null,
    logo: "https://aifile.link/Zwgl8A.avif",
  },
  {
    idx: 1,
    id: "0513b1bd-8c4b-42ea-842c-c4cba0955ea3",
    name: "Flux",
    slug: "flux",
    config: null,
    description: null,
    logo: "https://aifile.link/3EUcK3.avif",
  },
  {
    idx: 2,
    id: "23357337-fd9e-484b-9519-58c263f8397d",
    name: "Alibaba",
    slug: "alibaba",
    config: null,
    description: null,
    logo: "https://aifile.link/cWz7Ux.avif",
  },
  {
    idx: 3,
    id: "2a99ce90-1fa1-4124-abf0-8a20877e075f",
    name: "Xai",
    slug: "grok",
    config: null,
    description: null,
    logo: "https://aifile.link/d4NE0Q.avif",
  },
  {
    idx: 4,
    id: "3279d141-f724-4f63-bf76-23ac1b6f27de",
    name: "Kling",
    slug: "kling",
    config: null,
    description: null,
    logo: "https://aifile.link/U9VDXi.jpg",
  },
  {
    idx: 5,
    id: "45f2b57b-d291-4917-ab2b-b4f62c605cef",
    name: "Anthropic",
    slug: "anthropic",
    config: null,
    description: null,
    logo: "https://aifile.link/CxDwzL.avif",
  },
  {
    idx: 6,
    id: "464610e9-aa17-4018-971c-972e15b6b588",
    name: "Minimax",
    slug: "minimax",
    config: null,
    description: null,
    logo: "https://aifile.link/xeOAmW.avif",
  },
  {
    idx: 7,
    id: "5b637fe1-7a49-4666-9ca3-c9f7f71cf88d",
    name: "Vidu",
    slug: "vidu",
    config: null,
    description: null,
    logo: "https://aifile.link/eLiyoy.jpg",
  },
  {
    idx: 8,
    id: "80eed009-fa49-46a0-8118-a9fa2165c6fa",
    name: "ByteDance",
    slug: "bytedance",
    config: null,
    description: null,
    logo: "https://aifile.link/bws8xQ.png",
  },
  {
    idx: 9,
    id: "9b7da209-c8a0-46b7-b971-715aa3d5673b",
    name: "Zai",
    slug: "zai",
    config: null,
    description: null,
    logo: "https://aifile.link/QC3ovh.avif",
  },
  {
    idx: 10,
    id: "d3f30ab0-37fb-42b3-9cf4-167cda76ac94",
    name: "LTX",
    slug: "ltx",
    config: null,
    description: null,
    logo: "https://aifile.link/4FRXtG.png",
  },
  {
    idx: 11,
    id: "db7f5704-251f-4557-acaf-f2ab7ae34cdb",
    name: "Moonshot",
    slug: "moonshot",
    config: null,
    description: null,
    logo: "https://aifile.link/WN3rJd.avif",
  },
  {
    idx: 12,
    id: "dffa14c3-beba-44e0-845f-1b0a8a84a889",
    name: "OpenAI",
    slug: "openai",
    config: null,
    description: null,
    logo: "https://aifile.link/7HRmoD.avif",
  },
  {
    idx: 14,
    id: "f0b139ae-fc4d-4d16-ad79-2ab878726771",
    name: "DeepSeek",
    slug: "deepseek",
    config: null,
    description: null,
    logo: "https://aifile.link/wOz5Cs.avif",
  },
];

type Brand = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
};

const FALLBACK_BRANDS: Brand[] = BRANDS.map((b) => ({
  id: b.id,
  name: b.name,
  slug: b.slug,
  logo: b.logo,
}));

export function BrandsSlider() {
  const [brands, setBrands] = useState<Brand[]>(FALLBACK_BRANDS);
  const { isMobile } = useAppStore();

  const cards = useMemo(() => brands, [brands]);
  const itemWidth = isMobile ? 80 : 100;
  const itemGap = isMobile ? 10 : 24;

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const response = await fetch(`${endpoint}/brands`);
        const result = await response.json();

        if (!cancelled && result?.success && Array.isArray(result.data)) {
          setBrands(result.data as Brand[]);
        }
      } catch (e) {
        // Keep fallback if request fails.
        console.error("Failed to load brands:", e);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Box mt="xl">
      <ContinuousScroller
        items={cards}
        durationSeconds={20}
        getItemKey={(brand) => brand.id}
        renderItem={(brand) => (
          <Box px={itemGap / 2}>
            <Center w={itemWidth}>
              <Stack gap={6}>
                <Avatar src={brand.logo ?? undefined} alt={brand.name} size="lg" />
                <Text size="xs" c="dimmed" ta="center" lineClamp={1}>
                  {brand.name}
                </Text>
              </Stack>
            </Center>
          </Box>
        )}
      />
    </Box>
  );
}
