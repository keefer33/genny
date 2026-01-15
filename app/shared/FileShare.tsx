import {
  Button,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
  ActionIcon,
  CopyButton,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  RiShareLine,
  RiTwitterXFill,
  RiFacebookFill,
  RiLinkedinFill,
  RiWhatsappFill,
  RiTelegramFill,
  RiMailLine,
  RiLinksLine,
  RiShareForwardLine,
} from "@remixicon/react";

interface FileShareProps {
  fileUrl: string;
  fileName: string;
  fileType?: "image" | "video" | "other";
  variant?: "button" | "icon";
  size?: "sm" | "md" | "lg";
}

export default function FileShare({
  fileUrl,
  fileName,
  fileType = "other",
  variant = "button",
  size = "lg",
}: FileShareProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const shareText = `Check out this ${fileType === "image" ? "image" : fileType === "video" ? "video" : "file"}: ${fileName}`;

  // Check if Web Share API is available
  const canUseNativeShare = typeof navigator !== "undefined" && "share" in navigator;

  const handleNativeShare = async () => {
    if (!canUseNativeShare) {
      open();
      return;
    }

    try {
      const shareData: ShareData = {
        title: fileName,
        text: shareText,
        url: fileUrl,
      };

      // For images/videos, try to share the file itself if possible
      if (fileType === "image" || fileType === "video") {
        try {
          const response = await fetch(fileUrl);
          const blob = await response.blob();
          const file = new File([blob], fileName, { type: blob.type });

          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: fileName,
              text: shareText,
              files: [file],
            });
            // Native share dialog provides its own feedback, no need for notification
            return; // Exit early on success
          }
        } catch (error: any) {
          // If file sharing fails, fall through to URL sharing
          if (error.name === "AbortError") {
            // User cancelled, don't show modal
            return;
          }
          console.log("File sharing not supported, falling back to URL");
        }
      }

      // Share URL
      await navigator.share(shareData);
      // Native share dialog provides its own feedback, no need for notification
      return; // Don't open modal after successful share
    } catch (error: any) {
      // User cancelled or error occurred
      if (error.name === "AbortError") {
        // User cancelled native share, don't open modal
        return;
      }
      console.error("Error sharing:", error);
      // Only open modal if there was an actual error (not cancellation)
      open();
    }
  };

  const handleSocialShare = (platform: string) => {
    const encodedUrl = encodeURIComponent(fileUrl);
    const encodedText = encodeURIComponent(shareText);
    let shareUrl = "";

    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
        break;
      case "telegram":
        shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
        break;
      case "email":
        shareUrl = `mailto:?subject=${encodeURIComponent(fileName)}&body=${encodedText}%20${encodedUrl}`;
        break;
      default:
        return;
    }

    window.open(shareUrl, "_blank", "width=600,height=400");
    close();
  };

  const shareButton =
    variant === "icon" ? (
      <Tooltip label="Share">
        <ActionIcon variant="transparent" size={size} onClick={handleNativeShare}>
          <RiShareLine size={24} />
        </ActionIcon>
      </Tooltip>
    ) : (
      <Button
        leftSection={<RiShareLine size={16} />}
        variant="light"
        size={size}
        onClick={handleNativeShare}
      >
        Share
      </Button>
    );

  return (
    <>
      {shareButton}

      <Modal opened={opened} onClose={close} title="Share File" size="md">
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Share this {fileType === "image" ? "image" : fileType === "video" ? "video" : "file"} on
            social media or copy the link
          </Text>

          {/* Social Media Buttons */}
          <Group gap="sm" grow>
            <Button
              leftSection={<RiTwitterXFill size={18} />}
              variant="light"
              color="dark"
              onClick={() => handleSocialShare("twitter")}
              fullWidth
            >
              Twitter/X
            </Button>
            <Button
              leftSection={<RiFacebookFill size={18} />}
              variant="light"
              color="blue"
              onClick={() => handleSocialShare("facebook")}
              fullWidth
            >
              Facebook
            </Button>
          </Group>

          <Group gap="sm" grow>
            <Button
              leftSection={<RiLinkedinFill size={18} />}
              variant="light"
              color="blue"
              onClick={() => handleSocialShare("linkedin")}
              fullWidth
            >
              LinkedIn
            </Button>
            <Button
              leftSection={<RiWhatsappFill size={18} />}
              variant="light"
              color="green"
              onClick={() => handleSocialShare("whatsapp")}
              fullWidth
            >
              WhatsApp
            </Button>
          </Group>

          <Group gap="sm" grow>
            <Button
              leftSection={<RiTelegramFill size={18} />}
              variant="light"
              color="blue"
              onClick={() => handleSocialShare("telegram")}
              fullWidth
            >
              Telegram
            </Button>
            <Button
              leftSection={<RiMailLine size={18} />}
              variant="light"
              onClick={() => handleSocialShare("email")}
              fullWidth
            >
              Email
            </Button>
          </Group>

          {/* Copy Link Section */}
          <Stack gap="xs">
            <Text size="sm" fw={500}>
              Copy Link
            </Text>
            <Group gap="xs">
              <TextInput
                value={fileUrl}
                readOnly
                style={{ flex: 1 }}
                size="sm"
                rightSection={
                  <CopyButton value={fileUrl}>
                    {({ copied, copy }) => (
                      <Tooltip label={copied ? "Copied" : "Copy"} withArrow position="right">
                        <ActionIcon color={copied ? "teal" : "gray"} onClick={copy}>
                          <RiLinksLine size={16} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </CopyButton>
                }
              />
            </Group>
          </Stack>

          {/* Native Share Button (if available) */}
          {canUseNativeShare && (
            <Button
              leftSection={<RiShareForwardLine size={18} />}
              variant="filled"
              onClick={handleNativeShare}
              fullWidth
            >
              Share via...
            </Button>
          )}
        </Stack>
      </Modal>
    </>
  );
}
