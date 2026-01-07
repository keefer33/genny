import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Badge, Button, Card, Group, Modal, Stack, Text, useMantineTheme } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { RiVisaLine, RiCoinsLine } from "@remixicon/react";
import React, { useState } from "react";
import useAppStore from "~/lib/stores/appStore";
import useBillingStore from "~/lib/stores/billingStore";
import { TOKEN_PACKAGES, formatPrice, formatTokens } from "~/lib/tokenUtils";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Payment Form Component using Stripe Elements
function PaymentForm({
  clientSecret,
  onSuccess,
  onCancel,
  packageInfo,
}: {
  clientSecret: string | null;
  onSuccess: () => void;
  onCancel: () => void;
  packageInfo: (typeof TOKEN_PACKAGES)[0];
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { getUser, updateUserTokens } = useAppStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required", // Only redirect if 3D Secure is required
      });

      if (error) {
        notifications.show({
          title: "Payment Error",
          message: error.message,
          color: "red",
        });
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        // Payment succeeded - update tokens immediately
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
      const session = getUser();
      // Call API to update user tokens
      const response = await fetch(
        `${import.meta.env.VITE_NODE_ENV === "development" ? import.meta.env.VITE_LOCAL_API_URL : import.meta.env.VITE_API_URL}/stripe/confirm-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token || ""}`,
          },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        // Update the user's token balance in the app store
        const currentUser = getUser();
        if (currentUser?.profile) {
          const newTokenBalance = (currentUser.profile.tokens || 0) + result.tokensAdded;
          await updateUserTokens(newTokenBalance);
        }

        notifications.show({
          title: "Payment Successful",
          message: `Successfully added ${result.tokensAdded} tokens to your account!`,
          color: "green",
        });
      } else {
        notifications.show({
          title: "Error",
          message: "Payment succeeded but failed to add tokens. Please contact support.",
          color: "orange",
        });
      }
    } catch (error) {
      console.error("Error updating tokens:", error);
      notifications.show({
        title: "Warning",
        message:
          "Payment succeeded but there was an issue updating your tokens. Please contact support.",
        color: "orange",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        <PaymentElement />
        <Stack gap="sm">
          <Button
            type="submit"
            fullWidth
            loading={isProcessing}
            disabled={!stripe || !elements || !clientSecret}
            leftSection={<RiVisaLine size={16} />}
          >
            {isProcessing
              ? "Processing..."
              : `Complete Payment - ${formatPrice(packageInfo.price)}`}
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
  packageInfo?: (typeof TOKEN_PACKAGES)[0];
  title?: string;
  description?: string;
  autoOpen?: boolean;
  showPackageSelection?: boolean;
}

export default function PaymentModal({
  opened,
  onClose,
  onSuccess,
  packageInfo,
  title,
  description,
  autoOpen = false,
  showPackageSelection = false,
}: PaymentModalProps) {
  const {
    selectedPackage,
    clientSecret,
    paymentLoading,
    setSelectedPackage,
    setClientSecret,
    setPaymentLoading,
    createPaymentIntent,
  } = useBillingStore();
  const theme = useMantineTheme();

  // Auto-create payment intent when modal opens
  const handleModalOpen = async () => {
    const pkg = selectedPackage || packageInfo;
    if (!pkg) {
      return;
    }

    setPaymentLoading(true);
    try {
      const result = await createPaymentIntent(pkg.amount);

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
  };

  // Reset client secret when modal closes
  const handleClose = () => {
    setClientSecret(null);
    onClose();
  };

  const handleSuccess = () => {
    setClientSecret(null);
    onSuccess?.();
    onClose();
  };

  // Auto-open effect
  React.useEffect(() => {
    if (opened && (packageInfo || selectedPackage)) {
      handleModalOpen();
    }
  }, [opened, packageInfo, selectedPackage]);

  const modalTitle =
    title || (showPackageSelection ? "Purchase Tokens" : `Purchase ${packageInfo?.tokens} tokens`);
  const modalDescription =
    description ||
    (showPackageSelection
      ? "Choose a token package and complete your payment"
      : `Complete your payment to receive ${packageInfo?.tokens} tokens for $${packageInfo?.amount}.`);

  const currentPackage = selectedPackage || packageInfo;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={modalTitle}
      size={showPackageSelection ? "lg" : "md"}
      closeOnClickOutside={!paymentLoading}
      closeOnEscape={!paymentLoading}
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          {modalDescription}
        </Text>

        {showPackageSelection && !currentPackage && (
          <Stack gap="md">
            <Text fw={600} size="lg">
              Choose a Token Package
            </Text>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "1rem",
              }}
            >
              {TOKEN_PACKAGES.map((pkg) => (
                <Card
                  key={pkg.id}
                  withBorder
                  radius="md"
                  p="md"
                  style={{
                    cursor: "pointer",
                    border:
                      selectedPackage?.id === pkg.id
                        ? `2px solid ${theme.colors.blue[6]}`
                        : undefined,
                    backgroundColor:
                      selectedPackage?.id === pkg.id ? theme.colors.blue[0] : undefined,
                  }}
                  onClick={() => setSelectedPackage(pkg)}
                >
                  <Stack gap="sm" align="center">
                    <Group gap="xs">
                      <Text size="xl" fw={700}>
                        {formatPrice(pkg.price)}
                      </Text>
                      <RiCoinsLine size={20} color={theme.colors.blue[6]} />
                    </Group>
                    <Text fw={600} c="blue">
                      {formatTokens(pkg.tokens)} tokens
                    </Text>
                    {pkg.bonus > 0 && (
                      <Badge color="green" variant="light" size="sm">
                        +{formatTokens(pkg.bonus)} bonus
                      </Badge>
                    )}
                  </Stack>
                </Card>
              ))}
            </div>
            <Button
              fullWidth
              disabled={!selectedPackage}
              onClick={() => {
                if (selectedPackage) {
                  setPaymentLoading(true);
                  handleModalOpen();
                }
              }}
              leftSection={<RiVisaLine size={16} />}
            >
              Continue to Payment
            </Button>
          </Stack>
        )}

        {paymentLoading ? (
          <Stack align="center" py="xl">
            <Text>Setting up payment...</Text>
          </Stack>
        ) : clientSecret && currentPackage ? (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "stripe",
              },
            }}
          >
            <PaymentForm
              clientSecret={clientSecret}
              onSuccess={handleSuccess}
              onCancel={handleClose}
              packageInfo={currentPackage}
            />
          </Elements>
        ) : (
          !showPackageSelection && (
            <Stack align="center" py="xl">
              <Text c="dimmed">Unable to process payment</Text>
              <Text size="xs" c="dimmed">
                Debug: loading={paymentLoading.toString()}, clientSecret=
                {clientSecret ? "yes" : "no"}, packageInfo={currentPackage ? "yes" : "no"}
              </Text>
            </Stack>
          )
        )}
      </Stack>
    </Modal>
  );
}

// Hook for easy programmatic usage
export function usePaymentModal() {
  const {
    paymentModalOpen,
    selectedPackage,
    openPaymentModal: openModal,
    closePaymentModal: closeModal,
    setSelectedPackage,
  } = useBillingStore();

  const openPaymentModal = (packageInfo?: (typeof TOKEN_PACKAGES)[0] | null) => {
    if (packageInfo) {
      setSelectedPackage(packageInfo);
    } else {
      setSelectedPackage(null);
    }
    openModal();
  };

  return {
    isOpen: paymentModalOpen,
    selectedPackage,
    openPaymentModal,
    closePaymentModal: closeModal,
    PaymentModalComponent: (
      props: Omit<PaymentModalProps, "opened" | "onClose" | "packageInfo">
    ) => (
      <PaymentModal
        {...props}
        opened={paymentModalOpen}
        onClose={closeModal}
        packageInfo={selectedPackage || undefined}
        autoOpen={true}
      />
    ),
  };
}
