"use client";

/* ఫాంట్ ఎంపిక — ప్రతి పేరు ఆ ఫాంట్‌లోనే; "నా ఫాంట్లు" (సొంత / కంప్యూటర్ ఫాంట్లు) కూడా */

import { useMemo, useState } from "react";
import { Box, Button, ListSubheader, MenuItem, Select, Stack, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import MyFontsDialog from "@/app/components/MyFontsDialog";
import { fontStack, loadTeluguFont, useTeluguFonts } from "@/lib/teluguFonts";

export const DOC_FONT = "__doc__";
const SITE = "__site__";

type Props = {
  /** CSS family; "" = site font; null = "same as the document" (only when allowDoc) */
  value: string | null;
  onChange: (v: string | null) => void;
  allowDoc?: boolean;
  label?: string;
  compact?: boolean;
};

export const cssStack = (v: string) => (v ? fontStack(v) : "var(--telugu-font-family)");

export default function FontPicker({ value, onChange, allowDoc, label = "ఫాంట్", compact }: Props) {
  const { fonts, loading, failed, retry } = useTeluguFonts();
  const [mine, setMine] = useState(false);

  const { own, site } = useMemo(() => {
    const own = fonts.filter((f) => f.kind === "upload" || f.kind === "device");
    const site = fonts.filter((f) => !f.kind || f.kind === "site").sort((a, b) => a.label.localeCompare(b.label, "te-IN"));
    return { own, site };
  }, [fonts]);

  const known = value === null || value === "" || fonts.some((f) => f.value === value);
  const selectValue = value === null ? DOC_FONT : value === "" ? SITE : known ? value : SITE;

  const pick = (v: string) => {
    if (v === DOC_FONT) return onChange(null);
    if (v === SITE) return onChange("");
    void loadTeluguFont(v);
    onChange(v);
  };

  const item = (v: string, text: string, family: string) => (
    <MenuItem
      key={v}
      value={v}
      data-telugu-font=""
      onMouseEnter={() => v !== SITE && v !== DOC_FONT && void loadTeluguFont(v)}
      onFocus={() => v !== SITE && v !== DOC_FONT && void loadTeluguFont(v)}
      sx={{ minHeight: 48 }}
    >
      <span style={{ fontSize: 19, lineHeight: 1.6, fontFamily: family }}>{text}</span>
    </MenuItem>
  );

  return (
    <Box>
      {!compact && (
        <Typography component="label" sx={{ display: "block", fontWeight: 700, mb: 0.5 }}>
          {label}{" "}
          <Typography component="span" variant="body2" sx={{ color: "var(--muted-text)" }}>
            ({site.length + own.length})
          </Typography>
        </Typography>
      )}
      <Stack direction="row" spacing={1} alignItems="stretch">
        <Select
          fullWidth
          size={compact ? "small" : "medium"}
          value={selectValue}
          onChange={(e) => pick(String(e.target.value))}
          inputProps={{ "aria-label": label }}
          SelectDisplayProps={{ "aria-label": label } as React.HTMLAttributes<HTMLDivElement>}
          MenuProps={{ PaperProps: { sx: { maxHeight: 440 } } }}
          renderValue={(v) => {
            const f = fonts.find((x) => x.value === v);
            const text = v === DOC_FONT ? "పత్రం ఫాంట్ (అదే)" : v === SITE ? "సైట్ ఫాంట్" : f?.label ?? String(v);
            const fam = v === DOC_FONT ? "inherit" : v === SITE ? cssStack("") : cssStack(String(v));
            return (
              <span data-telugu-font="" style={{ fontFamily: fam, fontSize: compact ? 17 : 19, lineHeight: 1.5 }}>
                {text}
              </span>
            );
          }}
          sx={{ minHeight: compact ? 44 : 52, bgcolor: "var(--surface-elevated)" }}
        >
          {allowDoc && item(DOC_FONT, "పత్రం ఫాంట్ (అదే)", "inherit")}
          {item(SITE, "సైట్ ఫాంట్ (మీరు ఎంచుకున్నది)", cssStack(""))}
          {own.length > 0 && <ListSubheader sx={{ fontWeight: 800, lineHeight: "40px" }}>నా ఫాంట్లు</ListSubheader>}
          {own.map((f) => item(f.value, f.label, cssStack(f.value)))}
          {site.length > 0 && <ListSubheader sx={{ fontWeight: 800, lineHeight: "40px" }}>సైట్ ఫాంట్లు</ListSubheader>}
          {site.map((f) => item(f.value, f.label, cssStack(f.value)))}
        </Select>
        <Button
          variant="outlined"
          onClick={() => setMine(true)}
          aria-label="నా సొంత ఫాంట్ జోడించండి"
          sx={{ flexShrink: 0, minWidth: compact ? 44 : 0, px: compact ? 0 : 1.5, textTransform: "none", fontWeight: 700, whiteSpace: "nowrap" }}
        >
          <AddRoundedIcon />
          {!compact && <Box component="span" sx={{ ml: 0.5 }}>నా ఫాంట్</Box>}
        </Button>
      </Stack>
      {loading && site.length === 0 && (
        <Typography variant="body2" sx={{ mt: 0.5, color: "var(--muted-text)" }}>
          ఫాంట్ల జాబితా వస్తోంది…
        </Typography>
      )}
      {failed && (
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          ఫాంట్లు రాలేదు.{" "}
          <Button size="small" onClick={retry} sx={{ textTransform: "none", fontWeight: 700 }}>
            మళ్ళీ ప్రయత్నించండి
          </Button>
        </Typography>
      )}
      <MyFontsDialog
        open={mine}
        onClose={() => setMine(false)}
        current={value ?? undefined}
        onPick={(v) => {
          pick(v);
          setMine(false);
        }}
      />
    </Box>
  );
}
