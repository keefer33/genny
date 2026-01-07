import {
  ActionIcon,
  Button,
  Collapse,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  RiAddLine,
  RiArrowDownSLine,
  RiArrowUpSLine,
  RiDeleteBinLine,
  RiEditLine,
  RiFolderLine,
} from "@remixicon/react";
import { useState } from "react";
import useFilesFoldersStore from "~/lib/stores/filesFoldersStore";
import useAppStore from "~/lib/stores/appStore";

interface Folder {
  id: string;
  name: string;
  created_at: string;
}

interface FolderManagerProps {
  folders: Folder[];
  onFolderUpdate: () => void;
  onFolderSelect: (folderId: string | null) => void;
  selectedFolderId: string | null;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function FolderManager({
  folders,
  onFolderUpdate,
  onFolderSelect,
  selectedFolderId,
  collapsed = false,
  onToggleCollapse,
}: FolderManagerProps) {
  const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const [folderName, setFolderName] = useState("");
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<Folder | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAppStore();
  const { createFolder, updateFolder, deleteFolder } = useFilesFoldersStore();

  const handleCreateFolder = async () => {
    if (!folderName.trim() || !user?.user?.id) return;

    setLoading(true);
    try {
      const result = await createFolder(folderName.trim(), user.user.id);
      if (result.success) {
        setFolderName("");
        closeCreate();
        onFolderUpdate();
      }
    } catch (error) {
      console.error("Error creating folder:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditFolder = async () => {
    if (!editingFolder || !folderName.trim() || !user?.user?.id) return;

    setLoading(true);
    try {
      const result = await updateFolder(editingFolder.id, folderName.trim(), user.user.id);
      if (result.success) {
        setFolderName("");
        setEditingFolder(null);
        closeEdit();
        onFolderUpdate();
      }
    } catch (error) {
      console.error("Error updating folder:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFolder = async () => {
    if (!deletingFolder || !user?.user?.id) return;

    setLoading(true);
    try {
      const result = await deleteFolder(deletingFolder.id, user.user.id);
      if (result.success) {
        setDeletingFolder(null);
        closeDelete();
        onFolderUpdate();
        // If we're currently viewing this folder, switch to root
        if (selectedFolderId === deletingFolder.id) {
          onFolderSelect(null);
        }
      }
    } catch (error) {
      console.error("Error deleting folder:", error);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (folder: Folder) => {
    setEditingFolder(folder);
    setFolderName(folder.name);
    openEdit();
  };

  const openDeleteModal = (folder: Folder) => {
    setDeletingFolder(folder);
    openDelete();
  };

  return (
    <>
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={4}>Folders</Title>
          <Group gap="xs">
            {onToggleCollapse && (
              <ActionIcon variant="light" size="sm" onClick={onToggleCollapse} hiddenFrom="md">
                {collapsed ? <RiArrowDownSLine size={16} /> : <RiArrowUpSLine size={16} />}
              </ActionIcon>
            )}
            <ActionIcon variant="light" size="sm" onClick={openCreate}>
              <RiAddLine size={16} />
            </ActionIcon>
          </Group>
        </Group>

        <Stack gap="sm" hiddenFrom="md">
          <Collapse in={!collapsed}>
            <Stack gap="sm">
              <Button
                variant={selectedFolderId === null ? "filled" : "light"}
                leftSection={<RiFolderLine size={16} />}
                justify="flex-start"
                onClick={() => onFolderSelect(null)}
                size="sm"
              >
                All Files
              </Button>

              {folders.map((folder) => (
                <Group key={folder.id} justify="space-between" align="center">
                  <Button
                    variant={selectedFolderId === folder.id ? "filled" : "light"}
                    leftSection={<RiFolderLine size={16} />}
                    justify="flex-start"
                    onClick={() => onFolderSelect(folder.id)}
                    size="sm"
                    style={{ flex: 1 }}
                  >
                    {folder.name}
                  </Button>
                  <Group gap={4}>
                    <ActionIcon
                      variant="light"
                      size="sm"
                      color="blue"
                      onClick={() => openEditModal(folder)}
                    >
                      <RiEditLine size={14} />
                    </ActionIcon>
                    <ActionIcon
                      variant="light"
                      size="sm"
                      color="red"
                      onClick={() => openDeleteModal(folder)}
                    >
                      <RiDeleteBinLine size={14} />
                    </ActionIcon>
                  </Group>
                </Group>
              ))}

              {folders.length === 0 && (
                <Text size="sm" c="dimmed" ta="center">
                  No folders created yet
                </Text>
              )}
            </Stack>
          </Collapse>
        </Stack>

        <Stack gap="sm" visibleFrom="md">
          <Button
            variant={selectedFolderId === null ? "filled" : "light"}
            leftSection={<RiFolderLine size={16} />}
            justify="flex-start"
            onClick={() => onFolderSelect(null)}
            size="sm"
          >
            All Files
          </Button>

          {folders.map((folder) => (
            <Group key={folder.id} justify="space-between" align="center">
              <Button
                variant={selectedFolderId === folder.id ? "filled" : "light"}
                leftSection={<RiFolderLine size={16} />}
                justify="flex-start"
                onClick={() => onFolderSelect(folder.id)}
                size="sm"
                style={{ flex: 1 }}
              >
                {folder.name}
              </Button>
              <Group gap={4}>
                <ActionIcon
                  variant="light"
                  size="sm"
                  color="blue"
                  onClick={() => openEditModal(folder)}
                >
                  <RiEditLine size={14} />
                </ActionIcon>
                <ActionIcon
                  variant="light"
                  size="sm"
                  color="red"
                  onClick={() => openDeleteModal(folder)}
                >
                  <RiDeleteBinLine size={14} />
                </ActionIcon>
              </Group>
            </Group>
          ))}

          {folders.length === 0 && (
            <Text size="sm" c="dimmed" ta="center">
              No folders created yet
            </Text>
          )}
        </Stack>
      </Stack>

      {/* Create Folder Modal */}
      <Modal opened={createOpened} onClose={closeCreate} title="Create Folder" size="md">
        <Stack gap="md">
          <TextInput
            label="Folder Name"
            value={folderName}
            onChange={(event) => setFolderName(event.currentTarget.value)}
            placeholder="Enter folder name"
            required
            onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={closeCreate}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} loading={loading} disabled={!folderName.trim()}>
              Create
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Edit Folder Modal */}
      <Modal opened={editOpened} onClose={closeEdit} title="Edit Folder" size="md">
        <Stack gap="md">
          <TextInput
            label="Folder Name"
            value={folderName}
            onChange={(event) => setFolderName(event.currentTarget.value)}
            placeholder="Enter folder name"
            required
            onKeyDown={(e) => e.key === "Enter" && handleEditFolder()}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={closeEdit}>
              Cancel
            </Button>
            <Button onClick={handleEditFolder} loading={loading} disabled={!folderName.trim()}>
              Update
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Folder Modal */}
      <Modal opened={deleteOpened} onClose={closeDelete} title="Delete Folder" size="md">
        <Stack gap="md">
          <Text>
            Are you sure you want to delete the folder &quot;{deletingFolder?.name}&quot;? All files
            in this folder will be moved to the root directory.
          </Text>
          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={closeDelete}>
              Cancel
            </Button>
            <Button color="red" onClick={handleDeleteFolder} loading={loading}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
