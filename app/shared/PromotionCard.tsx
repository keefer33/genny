import { Card, Stack, Text, Title, Box, Button } from "@mantine/core";
import { useEffect, useState } from "react";
import { RiSparklingLine } from "@remixicon/react";
import { Link } from "react-router";
import { endpoint } from "~/lib/utils";

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
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchPromotions = async () => {
      try {
        const response = await fetch(`${endpoint}/promotions`);
        if (!response.ok) {
          if (!cancelled) setPromotions([]);
          return;
        }
        const result = await response.json();

        if (cancelled) return;

        if (result?.success && Array.isArray(result.data?.promotions)) {
          setPromotions(result.data.promotions as Promotion[]);
        } else {
          setPromotions([]);
        }
      } catch (error) {
        console.error("Error fetching promotions:", error);
        if (!cancelled) {
          setPromotions([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchPromotions();

    return () => {
      cancelled = true;
    };
  }, []);

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
