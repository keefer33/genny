import {
  ActionIcon,
  Button,
  Card,
  Group,
  Modal,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { RiEditLine, RiMailLine, RiPhoneLine, RiUserLine } from "@remixicon/react";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "~/lib/ContextForm";
import { showNotification } from "~/lib/notificationUtils";
import useAppStore from "~/lib/stores/appStore";

export default function ProfileInformation() {
  const [loading, setLoading] = useState(false);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

  const { api, user } = useAppStore();

  const form = useForm({
    initialValues: {
      first_name: "",
      last_name: "",
      bio: "",
      username: "",
    },
  });

  useEffect(() => {
    if (user) {
      form.setValues({
        first_name: user.profile?.first_name || "",
        last_name: user.profile?.last_name || "",
        bio: user.profile?.bio || "",
        username: user.profile?.username || "",
      });
    }
  }, [user]);

  const handleSave = async () => {
    const values = form.getValues();

    if (!values.username.trim()) {
      showNotification({ title: "Error", message: "Username is required", type: "error" });
      return;
    }

    try {
      setLoading(true);

      // Check username uniqueness if changed
      if (values.username !== (user.profile?.username || "")) {
        const { count, error: countError } = await api
          .from("user_profiles")
          .select("id", { count: "exact", head: true })
          .eq("username", values.username)
          .neq("user_id", user?.user?.id || "");

        if (countError) {
          showNotification({
            title: "Error",
            message: "Failed to validate username",
            type: "error",
          });
          return;
        }

        if ((count || 0) > 0) {
          showNotification({ title: "Error", message: "Username is already taken", type: "error" });
          return;
        }
      }

      const result = await useAppStore.getState().updateUserProfile({
        first_name: values.first_name,
        last_name: values.last_name,
        bio: values.bio,
        username: values.username,
      });
      if (!result.success) {
        showNotification({
          title: "Error",
          message: result.error || "Failed to update profile",
          type: "error",
        });
        return;
      }

      showNotification({
        title: "Success",
        message: "Profile updated successfully",
        type: "success",
      });
      // Store is updated within the store action
      closeModal();
    } catch (error) {
      console.error("Error updating profile:", error);
      showNotification({ title: "Error", message: "Failed to update profile", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <Text size="lg" fw={600}>
            Profile Information
          </Text>
          <ActionIcon
            variant="light"
            color="blue"
            size="lg"
            onClick={openModal}
            title="Edit Profile"
          >
            <RiEditLine size={16} />
          </ActionIcon>
        </Group>

        <Card padding="sm" radius="xs">
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
            <Stack gap="xs">
              <Group gap="xs">
                <RiUserLine size={16} color="var(--mantine-color-gray-6)" />
                <Text size="sm" fw={500} c="dimmed">
                  Username
                </Text>
              </Group>
              <Text>{user.profile?.username || "Not set"}</Text>
            </Stack>
            <Stack gap="xs">
              <Group gap="xs">
                <RiMailLine size={16} color="var(--mantine-color-gray-6)" />
                <Text size="sm" fw={500} c="dimmed">
                  Email
                </Text>
              </Group>
              <Text>{user?.user?.email}</Text>
            </Stack>

            <Stack gap="xs">
              <Group gap="xs">
                <RiPhoneLine size={16} color="var(--mantine-color-gray-6)" />
                <Text size="sm" fw={500} c="dimmed">
                  Phone
                </Text>
              </Group>
              <Text>{user?.profile?.phone || "Not set"}</Text>
            </Stack>

            <Stack gap="xs">
              <Group gap="xs">
                <RiUserLine size={16} color="var(--mantine-color-gray-6)" />
                <Text size="sm" fw={500} c="dimmed">
                  First Name
                </Text>
              </Group>
              <Text>{user.profile?.first_name || "Not set"}</Text>
            </Stack>

            <Stack gap="xs">
              <Group gap="xs">
                <RiUserLine size={16} color="var(--mantine-color-gray-6)" />
                <Text size="sm" fw={500} c="dimmed">
                  Last Name
                </Text>
              </Group>
              <Text>{user.profile?.last_name || "Not set"}</Text>
            </Stack>

            <Stack gap="xs" style={{ gridColumn: "1 / -1" }}>
              <Group gap="xs">
                <RiUserLine size={16} color="var(--mantine-color-gray-6)" />
                <Text size="sm" fw={500} c="dimmed">
                  Bio
                </Text>
              </Group>
              <Text>{user.profile?.bio || "No bio added"}</Text>
            </Stack>
          </SimpleGrid>
        </Card>
      </Stack>

      {/* Edit Profile Modal */}
      <Modal opened={modalOpened} onClose={closeModal} title="Edit Profile" size="md">
        <FormProvider form={form}>
          <Stack gap="md">
            <TextInput
              label="Username"
              placeholder="Enter a unique username"
              required
              leftSection={<RiUserLine size={16} />}
              {...form.getInputProps("username")}
            />
            {/* Email and phone are managed by auth; not editable here */}

            <TextInput
              label="First Name"
              placeholder="Enter your first name"
              leftSection={<RiUserLine size={16} />}
              {...form.getInputProps("first_name")}
            />

            <TextInput
              label="Last Name"
              placeholder="Enter your last name"
              leftSection={<RiUserLine size={16} />}
              {...form.getInputProps("last_name")}
            />

            <Textarea
              label="Bio"
              placeholder="Tell us about yourself"
              rows={3}
              {...form.getInputProps("bio")}
            />

            <Group justify="flex-end" gap="md">
              <Button variant="light" onClick={closeModal}>
                Cancel
              </Button>
              <Button onClick={handleSave} loading={loading}>
                Save Changes
              </Button>
            </Group>
          </Stack>
        </FormProvider>
      </Modal>
    </>
  );
}

export { useDisclosure };
