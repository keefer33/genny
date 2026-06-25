import { Select } from "@mantine/core";
import { useMemo } from "react";
import {
  getGoogleFontCatalogEntry,
  loadGoogleFontFamily,
  POPULAR_GOOGLE_FONTS,
} from "~/pages/storyboards/googleFontsCatalog";

type GoogleFontPickerProps = {
  label?: string;
  value: string;
  onChange: (importName: string, fontFamily: string) => void;
  disabled?: boolean;
};

export function GoogleFontPicker({
  label = "Font",
  value,
  onChange,
  disabled,
}: GoogleFontPickerProps) {
  const options = useMemo(
    () =>
      POPULAR_GOOGLE_FONTS.map((font) => ({
        value: font.importName,
        label: font.family,
      })),
    []
  );

  return (
    <Select
      label={label}
      data={options}
      value={value}
      searchable
      disabled={disabled}
      onChange={(importName) => {
        if (!importName) return;
        const entry = getGoogleFontCatalogEntry(importName);
        if (!entry) return;
        void loadGoogleFontFamily(importName).then((fontFamily) => {
          onChange(importName, fontFamily);
        });
      }}
    />
  );
}
