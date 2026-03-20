import { Card, Stack, Text, Title, Box, Button } from "@mantine/core";
import { useEffect, useState } from "react";
import { RiSparklingLine } from "@remixicon/react";
import useAppStore from "~/lib/stores/appStore";
import { Link } from "react-router";

interface Promotion {
  id: string;
  created_at: string;
  start_date: string | null;
  end_date: string | null;
  promo_code: string | null;
  title: string | null;
  description: string | null;
  dollar_amount: string | number | null;
  meta_data: any;
}

export function PromotionCard() {
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
    <Box>
      {promotions.map((promo) => {
        return (
          <Card key={promo.id} radius="md" p="xl">
            <Stack gap="sm" align="center" ta="center">
              {promo.title && <Title order={1}>{promo.title}</Title>}

              {promo.description && (
                <Text size="lg" c="dimmed">
                  {promo.description}
                </Text>
              )}

              <Button
                component={Link}
                to="/login"
                size="lg"
                variant="filled"
                leftSection={<RiSparklingLine size={20} />}
              >
                Create For Free!
              </Button>
            </Stack>
          </Card>
        );
      })}
    </Box>
  );
}
