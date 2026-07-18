import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Badge, Button, Card, Group, Modal, Stack, Text, useMantineTheme } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { RiVisaLine, RiMoneyDollarCircleLine } from "@remixicon/react";
import React, { useState, useCallback, useRef, useMemo } from "react";
import useAppStore from "~/lib/stores/appStore";
import useBillingStore from "~/lib/stores/billingStore";
import {
  CREDIT_TOP_UP_OPTIONS,
  formatPrice,
  formatCredits,
  type CreditTopUpOption,
} from "~/lib/tokenUtils";
import { endpoint } from "~/lib/utils";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function PaymentForm({
  clientSecret,
  onSuccess,
  onCancel,
  topUp,
}: {
  clientSecret: string | null;
  onSuccess: () => void;
  onCancel: () => void;
  topUp: CreditTopUpOption;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentElementReady, setPaymentElementReady] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret || !paymentElementReady) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (error) {
        notifications.show({
          title: "Payment Error",
          message: error.message,
          color: "red",
        });
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        await handlePaymentSuccess(paymentIntent);
        onSuccess();
      }
    } catch (err) {
      console.error("Payment error:", err);
      notifications.show({
        title: "Error",
        message: "An unexpected error occurred",
        color: "red",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntent: any) => {
    try {
      const apiKey = useAppStore.getState().getAuthApiKey();
      const response = await fetch(`${endpoint}/stripe/confirm-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey || ""}`,
        },
        body: JSON.stringify({
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const credited =
          typeof result.usageCredited === "number"
            ? formatCredits(result.usageCredited)
            : formatCredits(topUp.dollars);
        notifications.show({
          title: "Payment Successful",
          message: `Added ${credited} to your balance.`,
          color: "green",
        });
      } else {
        notifications.show({
          title: "Error",
          message: "Payment succeeded but failed to update balance. Please contact support.",
          color: "orange",
        });
      }
    } catch (error) {
      console.error("Error confirming payment:", error);
      notifications.show({
        title: "Warning",
        message:
          "Payment succeeded but there was an issue updating your balance. Please contact support.",
        color: "orange",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        <PaymentElement onReady={() => setPaymentElementReady(true)} />
        <Stack gap="sm">
          <Button
            type="submit"
            fullWidth
            loading={isProcessing}
            disabled={!stripe || !elements || !clientSecret || !paymentElementReady}
            leftSection={<RiVisaLine size={16} />}
          >
            {isProcessing ? "Processing..." : `Pay ${formatPrice(topUp.price)}`}
          </Button>
          <Button
            type="button"
            variant="light"
            fullWidth
            onClick={onCancel}
            disabled={isProcessing}
          >
            Cancel
          </Button>
        </Stack>
      </Stack>
    </form>
  );
}

interface PaymentModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  topUpOption?: CreditTopUpOption;
  title?: string;
  description?: string;
  autoOpen?: boolean;
  showPackageSelection?: boolean;
  fullScreen?: boolean;
}

export default function PaymentModal({
  opened,
  onClose,
  onSuccess,
  topUpOption,
  title,
  description,
  autoOpen: _autoOpen = false,
  showPackageSelection = false,
  fullScreen: fullScreenProp,
}: PaymentModalProps) {
  const isMobile = useAppStore((s) => s.isMobile);
  const fullScreen = fullScreenProp ?? isMobile;
  const {
    selectedTopUp,
    clientSecret,
    paymentLoading,
    setSelectedTopUp,
    setClientSecret,
    setPaymentLoading,
    createPaymentIntent,
  } = useBillingStore();
  const theme = useMantineTheme();
  const hasInitiatedPaymentRef = useRef(false);

  const handleModalOpen = useCallback(async () => {
    const option = selectedTopUp || topUpOption;
    if (!option || paymentLoading || clientSecret || hasInitiatedPaymentRef.current) {
      return;
    }

    hasInitiatedPaymentRef.current = true;
    setPaymentLoading(true);
    try {
      const result = await createPaymentIntent(option.dollars);

      if (!result.success) {
        console.error("Payment intent creation failed:", result.error);
        notifications.show({
          title: "Error",
          message: result.error || "Failed to create payment",
          color: "red",
        });
        onClose();
        return;
      }

      setClientSecret(result.data.clientSecret);
    } catch (error) {
      console.error("Payment error:", error);
      notifications.show({
        title: "Error",
        message: "An unexpected error occurred",
        color: "red",
      });
      onClose();
    } finally {
      setPaymentLoading(false);
    }
  }, [
    selectedTopUp,
    topUpOption,
    paymentLoading,
    clientSecret,
    createPaymentIntent,
    onClose,
    setPaymentLoading,
    setClientSecret,
  ]);

  const handleClose = useCallback(() => {
    hasInitiatedPaymentRef.current = false;
    setClientSecret(null);
    onClose();
  }, [onClose, setClientSecret]);

  const handleSuccess = useCallback(() => {
    hasInitiatedPaymentRef.current = false;
    setClientSecret(null);
    onSuccess?.();
    onClose();
  }, [onSuccess, onClose, setClientSecret]);

  React.useEffect(() => {
    const current = selectedTopUp || topUpOption;
    const optionId = current?.id;

    if (opened && optionId && !clientSecret && !paymentLoading && !hasInitiatedPaymentRef.current) {
      handleModalOpen();
    }
    if (!opened) {
      hasInitiatedPaymentRef.current = false;
    }
  }, [opened, selectedTopUp?.id, topUpOption?.id, handleModalOpen, clientSecret, paymentLoading]);

  const modalTitle =
    title ||
    (showPackageSelection ? "Add balance" : `Add ${formatCredits(topUpOption?.dollars ?? 0)}`);
  const modalDescription =
    description ||
    (showPackageSelection
      ? "Choose an amount to add to your usage balance"
      : `Pay ${topUpOption ? formatPrice(topUpOption.price) : ""} to top up your balance.`);

  const currentTopUp = selectedTopUp || topUpOption;

  const elementsOptions = useMemo(
    () =>
      clientSecret
        ? {
            clientSecret,
            appearance: { theme: "stripe" as const },
          }
        : null,
    [clientSecret]
  );

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={modalTitle}
      fullScreen={fullScreen}
      size="lg"
      radius={fullScreen ? 0 : undefined}
      transitionProps={fullScreen ? { transition: "fade", duration: 200 } : undefined}
      closeOnClickOutside={!paymentLoading}
      closeOnEscape={!paymentLoading}
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          {modalDescription}
        </Text>

        {showPackageSelection && !currentTopUp && (
          <Stack gap="md">
            <Text fw={600} size="lg">
              Choose amount
            </Text>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "1rem",
              }}
            >
              {CREDIT_TOP_UP_OPTIONS.map((opt) => (
                <Card
                  key={opt.id}
                  withBorder
                  radius="md"
                  p="md"
                  style={{
                    cursor: "pointer",
                    border:
                      selectedTopUp?.id === opt.id
                        ? `2px solid ${theme.colors.blue[6]}`
                        : undefined,
                    backgroundColor:
                      selectedTopUp?.id === opt.id ? theme.colors.blue[0] : undefined,
                  }}
                  onClick={() => setSelectedTopUp(opt)}
                >
                  <Stack gap="sm" align="center">
                    <Group gap="xs">
                      <Text size="xl" fw={700}>
                        {formatPrice(opt.price)}
                      </Text>
                      <RiMoneyDollarCircleLine size={20} color={theme.colors.blue[6]} />
                    </Group>
                    <Text fw={600} c="blue">
                      +{formatCredits(opt.dollars)} balance
                    </Text>
                    {opt.popular && (
                      <Badge color="green" variant="light" size="sm">
                        Popular
                      </Badge>
                    )}
                  </Stack>
                </Card>
              ))}
            </div>
            <Button
              fullWidth
              disabled={!selectedTopUp}
              onClick={() => {
                if (selectedTopUp) {
                  handleModalOpen();
                }
              }}
              leftSection={<RiVisaLine size={16} />}
            >
              Continue to payment
            </Button>
          </Stack>
        )}

        {paymentLoading ? (
          <Stack align="center" py="xl">
            <Text>Setting up payment...</Text>
          </Stack>
        ) : clientSecret && currentTopUp && elementsOptions ? (
          <Elements key={clientSecret} stripe={stripePromise} options={elementsOptions}>
            <PaymentForm
              clientSecret={clientSecret}
              onSuccess={handleSuccess}
              onCancel={handleClose}
              topUp={currentTopUp}
            />
          </Elements>
        ) : (
          !showPackageSelection && (
            <Stack align="center" py="xl">
              <Text c="dimmed">Unable to process payment</Text>
              <Text size="xs" c="dimmed">
                Debug: loading={paymentLoading.toString()}, clientSecret=
                {clientSecret ? "yes" : "no"}, topUp={currentTopUp ? "yes" : "no"}
              </Text>
            </Stack>
          )
        )}
      </Stack>
    </Modal>
  );
}

/** Stable shell for AuthedLayout — avoids remounting Stripe Elements on unrelated store updates. */
export function GlobalPaymentModal(
  props: Omit<PaymentModalProps, "opened" | "onClose" | "topUpOption">
) {
  const paymentModalOpen = useBillingStore((s) => s.paymentModalOpen);
  const selectedTopUp = useBillingStore((s) => s.selectedTopUp);
  const closePaymentModal = useBillingStore((s) => s.closePaymentModal);

  return (
    <PaymentModal
      {...props}
      opened={paymentModalOpen}
      onClose={closePaymentModal}
      topUpOption={selectedTopUp ?? undefined}
    />
  );
}

export function usePaymentModal() {
  const paymentModalOpen = useBillingStore((s) => s.paymentModalOpen);
  const selectedTopUp = useBillingStore((s) => s.selectedTopUp);
  const openModal = useBillingStore((s) => s.openPaymentModal);
  const closeModal = useBillingStore((s) => s.closePaymentModal);
  const setSelectedTopUp = useBillingStore((s) => s.setSelectedTopUp);

  const openPaymentModal = useCallback(
    (option?: CreditTopUpOption | null) => {
      setSelectedTopUp(option ?? null);
      openModal();
    },
    [setSelectedTopUp, openModal]
  );

  return {
    isOpen: paymentModalOpen,
    selectedTopUp,
    openPaymentModal,
    closePaymentModal: closeModal,
  };
}
