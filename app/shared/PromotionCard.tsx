import {
  Badge,
  Card,
  Group,
  Stack,
  Text,
  Title,
  useMantineTheme,
  useMantineColorScheme,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { RiGiftLine, RiCoinsLine, RiMoneyDollarBoxLine, RiCalendarLine } from "@remixicon/react";
import useAppStore from "~/lib/stores/appStore";
import { formatTokens } from "~/lib/tokenUtils";

interface Promotion {
  id: string;
  created_at: string;
  start_date: string | null;
  end_date: string | null;
  promo_code: string | null;
  title: string | null;
  description: string | null;
  token_amount: number | null;
  dollar_amount: number | null;
  meta_data: any;
}

export function PromotionCard() {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const { getApi } = useAppStore();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPromotions = async () => {
      const api = getApi();
      if (!api) {
        setLoading(false);
        return;
      }

      try {
        const now = new Date().toISOString();

        // Fetch all promotions
        const { data, error } = await api
          .from("promotions")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching promotions:", error);
          setLoading(false);
          return;
        }

        // Filter for active promotions
        // A promotion is active if:
        // 1. start_date is null OR start_date <= now
        // 2. end_date is null OR end_date >= now
        const activePromotions = (data || []).filter((promo) => {
          const startDate = promo.start_date ? new Date(promo.start_date) : null;
          const endDate = promo.end_date ? new Date(promo.end_date) : null;
          const nowDate = new Date(now);

          const isStarted = !startDate || startDate <= nowDate;
          const isNotEnded = !endDate || endDate >= nowDate;

          return isStarted && isNotEnded;
        });

        setPromotions(activePromotions);
      } catch (error) {
        console.error("Error fetching promotions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPromotions();
  }, [getApi]);

  if (loading) {
    return (
      <Card radius="md" p="lg" style={{ minWidth: "300px", maxWidth: "400px" }}>
        <Text size="sm" c="dimmed">
          Loading promotions...
        </Text>
      </Card>
    );
  }

  if (promotions.length === 0) {
    return null;
  }

  return (
    <Card radius="md" p="lg" style={{ minWidth: "300px", maxWidth: "400px" }}>
      <Stack gap="md">
        <Group gap="xs">
          <RiGiftLine size={24} color={theme.colors.blue[6]} />
          <Title order={3}>Special Promotions</Title>
        </Group>

        {promotions.map((promo) => (
          <Card
            key={promo.id}
            radius="md"
            p="md"
            withBorder
            style={{
              backgroundColor: colorScheme === "dark" ? theme.colors.dark[6] : theme.colors.gray[0],
            }}
          >
            <Stack gap="sm">
              {promo.title && (
                <Title order={4} size="h5">
                  {promo.title}
                </Title>
              )}

              {promo.description && (
                <Text size="sm" c="dimmed">
                  {promo.description}
                </Text>
              )}

              <Group gap="md" mt="xs">
                {promo.token_amount && (
                  <Badge
                    color="yellow"
                    variant="light"
                    leftSection={<RiCoinsLine size={14} />}
                    size="lg"
                  >
                    {formatTokens(promo.token_amount)} tokens
                  </Badge>
                )}

                {promo.dollar_amount && (
                  <Badge
                    color="green"
                    variant="light"
                    leftSection={<RiMoneyDollarBoxLine size={14} />}
                    size="lg"
                  >
                    ${promo.dollar_amount.toFixed(2)}
                  </Badge>
                )}
              </Group>

              {promo.promo_code && (
                <Group gap="xs" mt="xs">
                  <Text size="xs" c="dimmed">
                    Promo Code:
                  </Text>
                  <Badge
                    color="blue"
                    variant="filled"
                    style={{
                      fontFamily: "monospace",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    {promo.promo_code}
                  </Badge>
                </Group>
              )}

              {(promo.start_date || promo.end_date) && (
                <Group gap="xs" mt="xs">
                  <RiCalendarLine size={14} color={theme.colors.gray[6]} />
                  <Text size="xs" c="dimmed">
                    {promo.start_date &&
                      `Starts: ${new Date(promo.start_date).toLocaleDateString()}`}
                    {promo.start_date && promo.end_date && " • "}
                    {promo.end_date && `Ends: ${new Date(promo.end_date).toLocaleDateString()}`}
                  </Text>
                </Group>
              )}
            </Stack>
          </Card>
        ))}
      </Stack>
    </Card>
  );
}
