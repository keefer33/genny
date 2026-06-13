import {
  Box,
  Button,
  Collapse,
  Group,
  Input,
  List,
  Menu,
  Modal,
  NumberInput,
  ScrollArea,
  Stack,
  Text,
  Textarea,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { RiArrowDownSLine, RiBookOpenLine, RiCloseLine, RiMicLine } from "@remixicon/react";
import { useCallback, useRef, useState } from "react";
import {
  clearOpeningDelivery,
  DELIVERY_PRESET_GROUPS,
  formatDeliveryTag,
  formatPauseTag,
  getSteeringWarnings,
  insertAtSelection,
  MAX_PAUSE_DURATION_MS,
  SPEECH_SCRIPT_GUIDE,
  NON_VERBAL_TAGS,
  normalizeDeliveryInstruction,
  PAUSE_PRESETS,
  parseOpeningDelivery,
  setOpeningDelivery,
} from "~/shared/speechSteering";

export type SpeechScriptEditorProps = {
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
};

export function SpeechScriptEditor({
  value,
  onChange,
  maxLength,
  disabled = false,
  label = "Text to speak",
  placeholder = "Write what the voice should say. Add delivery at the start, then your script…",
}: SpeechScriptEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [tipsOpened, { toggle: toggleTips }] = useDisclosure(false);
  const [customOpened, { open: openCustom, close: closeCustom }] = useDisclosure(false);
  const [pauseCustomOpened, { open: openPauseCustom, close: closePauseCustom }] =
    useDisclosure(false);
  const [customInstruction, setCustomInstruction] = useState("");
  const [customPauseSeconds, setCustomPauseSeconds] = useState<number | string>(1);

  const charCount = value.length;
  const opening = parseOpeningDelivery(value);
  const warnings = getSteeringWarnings(value);

  const focusAndSetSelection = useCallback((start: number, end: number) => {
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(start, end);
    });
  }, []);

  const applyValue = useCallback(
    (next: string, selectionStart: number, selectionEnd: number) => {
      const clipped = next.slice(0, maxLength);
      const trimSel = Math.min(selectionStart, clipped.length);
      const trimEnd = Math.min(selectionEnd, clipped.length);
      onChange(clipped);
      focusAndSetSelection(trimSel, trimEnd);
    },
    [focusAndSetSelection, maxLength, onChange]
  );

  const insertAtCaret = useCallback(
    (snippet: string) => {
      const el = textareaRef.current;
      const start = el?.selectionStart ?? value.length;
      const end = el?.selectionEnd ?? value.length;
      const {
        value: next,
        selectionStart,
        selectionEnd,
      } = insertAtSelection(value, start, end, snippet);
      applyValue(next, selectionStart, selectionEnd);
    },
    [applyValue, value]
  );

  const applyOpeningDelivery = useCallback(
    (instruction: string) => {
      const next = setOpeningDelivery(value, instruction);
      applyValue(next, next.length, next.length);
    },
    [applyValue, value]
  );

  const handleCustomDelivery = () => {
    const instruction = normalizeDeliveryInstruction(customInstruction);
    if (!instruction) return;
    applyOpeningDelivery(instruction);
    setCustomInstruction("");
    closeCustom();
  };

  const handleClearDelivery = () => {
    const next = clearOpeningDelivery(value);
    onChange(next);
    focusAndSetSelection(0, 0);
  };

  const handleCustomPause = () => {
    const seconds =
      typeof customPauseSeconds === "number"
        ? customPauseSeconds
        : Number.parseFloat(String(customPauseSeconds));
    if (!Number.isFinite(seconds) || seconds <= 0) return;
    const tag = formatPauseTag(Math.round(seconds * 1000));
    if (!tag) return;
    insertAtCaret(tag);
    setCustomPauseSeconds(1);
    closePauseCustom();
  };

  return (
    <Stack gap="xs">
      <Input.Wrapper label={label}>
        <Stack gap="xs" mt={4}>
          <Group gap="xs" wrap="wrap">
            <Menu withinPortal position="bottom-start" disabled={disabled}>
              <Menu.Target>
                <Button
                  size="xs"
                  variant="light"
                  rightSection={<RiArrowDownSLine size={14} />}
                  disabled={disabled}
                >
                  Delivery
                </Button>
              </Menu.Target>
              <Menu.Dropdown p={0}>
                <ScrollArea.Autosize mah={320} type="auto" offsetScrollbars="y" scrollbars="y">
                  <Box py={4}>
                    {DELIVERY_PRESET_GROUPS.map((group) => (
                      <div key={group.id}>
                        <Menu.Label>{group.label}</Menu.Label>
                        {group.presets.map((preset) => (
                          <Menu.Item
                            key={preset.id}
                            onClick={() => applyOpeningDelivery(preset.instruction)}
                          >
                            <Stack gap={0}>
                              <Text size="sm">{preset.label}</Text>
                              <Text size="xs" c="dimmed" lineClamp={1}>
                                {formatDeliveryTag(preset.instruction)}
                              </Text>
                            </Stack>
                          </Menu.Item>
                        ))}
                      </div>
                    ))}
                  </Box>
                </ScrollArea.Autosize>
                <Menu.Divider />
                <Box py={4}>
                  <Menu.Item onClick={openCustom}>Custom delivery…</Menu.Item>
                  {opening ? (
                    <Menu.Item
                      color="red"
                      leftSection={<RiCloseLine size={14} />}
                      onClick={handleClearDelivery}
                    >
                      Clear delivery
                    </Menu.Item>
                  ) : null}
                </Box>
              </Menu.Dropdown>
            </Menu>

            <Menu withinPortal position="bottom-start" disabled={disabled}>
              <Menu.Target>
                <Button
                  size="xs"
                  variant="default"
                  rightSection={<RiArrowDownSLine size={14} />}
                  disabled={disabled}
                >
                  Non-verbal
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                {NON_VERBAL_TAGS.map((item) => (
                  <Menu.Item key={item.id} onClick={() => insertAtCaret(item.tag)}>
                    {item.label}{" "}
                    <Text span size="xs" c="dimmed">
                      {item.tag}
                    </Text>
                  </Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>

            <Menu withinPortal position="bottom-start" disabled={disabled}>
              <Menu.Target>
                <Button
                  size="xs"
                  variant="default"
                  rightSection={<RiArrowDownSLine size={14} />}
                  disabled={disabled}
                >
                  Pause
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                {PAUSE_PRESETS.map((item) => (
                  <Menu.Item key={item.id} onClick={() => insertAtCaret(item.tag)}>
                    {item.label}{" "}
                    <Text span size="xs" c="dimmed" ff="monospace">
                      {item.tag}
                    </Text>
                  </Menu.Item>
                ))}
                <Menu.Divider />
                <Menu.Item onClick={openPauseCustom}>Custom duration…</Menu.Item>
              </Menu.Dropdown>
            </Menu>

            {opening ? (
              <Text size="xs" c="dimmed" style={{ flex: 1, minWidth: 120 }} lineClamp={1}>
                Opening: {opening.tag}
              </Text>
            ) : null}
          </Group>

          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => onChange(event.currentTarget.value.slice(0, maxLength))}
            placeholder={placeholder}
            minRows={5}
            autosize
            maxLength={maxLength}
            disabled={disabled}
            styles={{
              input: {
                fontFamily: "var(--mantine-font-family-monospace)",
                fontSize: "var(--mantine-font-size-sm)",
              },
            }}
          />

          <Group justify="space-between" gap="xs" wrap="wrap">
            <Text size="xs" c={charCount > maxLength ? "red" : "dimmed"}>
              {charCount} / {maxLength}
            </Text>
            <UnstyledButton onClick={toggleTips} disabled={disabled}>
              <Group gap={4} wrap="nowrap">
                <RiBookOpenLine size={14} />
                <Text size="xs" c="dimmed">
                  Script guide
                </Text>
                <RiArrowDownSLine
                  size={14}
                  style={{ transform: tipsOpened ? "rotate(180deg)" : undefined }}
                />
              </Group>
            </UnstyledButton>
          </Group>

          {warnings.length > 0 ? (
            <Stack gap={4}>
              {warnings.map((w) => (
                <Text key={w.id} size="xs" c="orange">
                  {w.message}
                </Text>
              ))}
            </Stack>
          ) : null}

          <Collapse expanded={tipsOpened}>
            <Box p="sm" bg="var(--mantine-color-default-hover)" style={{ borderRadius: 8 }}>
              <Stack gap="sm">
                <Group gap="xs" wrap="nowrap">
                  <RiMicLine size={16} />
                  <Text size="sm" fw={500}>
                    {SPEECH_SCRIPT_GUIDE.title}
                  </Text>
                </Group>
                <Text size="xs" c="dimmed">
                  {SPEECH_SCRIPT_GUIDE.intro}
                </Text>
                <List size="xs" spacing="sm" withPadding>
                  {SPEECH_SCRIPT_GUIDE.sections.map((section) => (
                    <List.Item key={section.title}>
                      <Text size="xs" fw={600}>
                        {section.title}
                      </Text>
                      <Text size="xs" c="dimmed" mt={2}>
                        {section.description}
                      </Text>
                      {section.example ? (
                        <Text size="xs" ff="monospace" mt={4} c="dimmed">
                          {section.example}
                        </Text>
                      ) : null}
                    </List.Item>
                  ))}
                </List>
              </Stack>
            </Box>
          </Collapse>
        </Stack>
      </Input.Wrapper>

      <Modal opened={customOpened} onClose={closeCustom} title="Custom delivery" centered size="sm">
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Describe how the voice should perform (English, no caps). This replaces any opening
            delivery tag.
          </Text>
          <Textarea
            placeholder="e.g. say sadly with deliberate pauses in a low voice"
            value={customInstruction}
            onChange={(e) => setCustomInstruction(e.currentTarget.value)}
            minRows={2}
            autosize
          />
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={closeCustom}>
              Cancel
            </Button>
            <Button onClick={handleCustomDelivery} disabled={!customInstruction.trim()}>
              Apply
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={pauseCustomOpened}
        onClose={closePauseCustom}
        title="Custom pause"
        centered
        size="sm"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Inserts an SSML break at the cursor. Maximum {MAX_PAUSE_DURATION_MS / 1000} seconds.
          </Text>
          <NumberInput
            label="Duration (seconds)"
            value={customPauseSeconds}
            onChange={setCustomPauseSeconds}
            min={0.25}
            max={MAX_PAUSE_DURATION_MS / 1000}
            step={0.25}
            decimalScale={2}
            suffix=" s"
          />
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={closePauseCustom}>
              Cancel
            </Button>
            <Button
              onClick={handleCustomPause}
              disabled={
                !Number.isFinite(
                  typeof customPauseSeconds === "number"
                    ? customPauseSeconds
                    : Number.parseFloat(String(customPauseSeconds))
                )
              }
            >
              Insert pause
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
