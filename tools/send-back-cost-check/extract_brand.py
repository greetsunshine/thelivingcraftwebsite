#!/usr/bin/env python3
"""Write brand.json from the production design tokens.

Why this exists rather than a hand-typed brand.json: the design skill says
`src/styles/ds/theme.css` is the copy that has been measured, so when the skill
bundle and production disagree, production wins. Reading the file means the
sheet cannot drift from the site, and a renamed token fails here instead of
shipping a wrong colour.

Run:  python3 tools/send-back-cost-check/extract_brand.py
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
THEME = REPO / "src" / "styles" / "ds" / "theme.css"
OUT = Path(__file__).resolve().parent / "brand.json"

# --- read the tokens ------------------------------------------------------


def read_tokens(css: str) -> dict[str, str]:
    """Every `--name: value;` on :root, in source order."""
    root = css.split(":root {", 1)[1].split("\n}", 1)[0]
    root = re.sub(r"/\*.*?\*/", "", root, flags=re.S)
    out: dict[str, str] = {}
    for name, value in re.findall(r"(--[a-z0-9-]+)\s*:\s*([^;]+);", root):
        out[name] = value.strip()
    return out


def resolve(tokens: dict[str, str], name: str, seen: tuple[str, ...] = ()) -> str:
    """Follow var() aliases down to a literal. Refuses a cycle."""
    if name in seen:
        raise SystemExit(f"token cycle: {' -> '.join(seen + (name,))}")
    if name not in tokens:
        raise SystemExit(f"token {name} is not in {THEME.relative_to(REPO)}")
    value = tokens[name]
    alias = re.fullmatch(r"var\((--[a-z0-9-]+)\)", value)
    if alias:
        return resolve(tokens, alias.group(1), seen + (name,))
    return value


def hex_of(tokens: dict[str, str], name: str) -> str:
    value = resolve(tokens, name)
    if not re.fullmatch(r"#[0-9a-fA-F]{6}", value):
        raise SystemExit(f"token {name} resolved to {value!r}, which is not a 6-digit hex")
    return value.lower()


def family_of(tokens: dict[str, str], name: str) -> str:
    """The first family in a font stack, unquoted."""
    value = resolve(tokens, name)
    first = value.split(",")[0].strip()
    return first.strip('"').strip("'")


# --- contrast ------------------------------------------------------------


def luminance(hex_colour: str) -> float:
    r, g, b = (int(hex_colour[i : i + 2], 16) / 255 for i in (1, 3, 5))

    def lin(c: float) -> float:
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)


def contrast(a: str, b: str) -> float:
    la, lb = luminance(a), luminance(b)
    hi, lo = max(la, lb), min(la, lb)
    return round((hi + 0.05) / (lo + 0.05), 2)


def main() -> int:
    if not THEME.exists():
        raise SystemExit(f"missing {THEME}")
    tokens = read_tokens(THEME.read_text(encoding="utf-8"))

    # Every colour below is a token that exists in production. The one
    # exception is `success`, and it is labelled as derived — see the note.
    palette = {
        "noir": hex_of(tokens, "--noir"),
        "ember": hex_of(tokens, "--ember"),
        "sun": hex_of(tokens, "--sun"),
        "mist": hex_of(tokens, "--mist"),
        "berry": hex_of(tokens, "--berry"),
        "background": hex_of(tokens, "--surface-sunken"),
        "surface": hex_of(tokens, "--surface-panel"),
        "surface_hover": hex_of(tokens, "--surface-hover"),
        "text_loud": hex_of(tokens, "--text-loud"),
        "text_body": hex_of(tokens, "--text-body"),
        "text_quiet": hex_of(tokens, "--text-quiet"),
        "text_faint": hex_of(tokens, "--text-faint"),
        "text_on_invert": hex_of(tokens, "--text-on-invert"),
        "text_on_accent": hex_of(tokens, "--text-on-accent"),
        "accent": hex_of(tokens, "--accent"),
        "accent_quiet": hex_of(tokens, "--accent-quiet"),
        "accent_ink": hex_of(tokens, "--accent-ink"),
        "accent_ink_strong": hex_of(tokens, "--accent-ink-strong"),
        "border_hair": hex_of(tokens, "--border-hair"),
        "border_field": hex_of(tokens, "--border-field"),
        "danger": hex_of(tokens, "--danger"),
        "danger_quiet": hex_of(tokens, "--danger-quiet"),
        # THE THREE STATUS PAIRS, ALL REAL TOKENS NOW.
        #
        # An earlier version of this file derived a success colour, because the
        # previous design system had none. The system delivered on 18 September
        # has `--success` and `--info` as named status families, so nothing here
        # is invented any more.
        #
        # Warning takes the accent pair rather than `--agent-uncertain`, which
        # in this system is INFO BLUE. Colour is language on this site: blue
        # means "not sure", and "Fix first" is not an uncertainty. The warm
        # accent pair is the warning family, and deep gold on warning-soft was
        # computed at 5.62:1 in theme.css.
        "success": hex_of(tokens, "--success"),
        "success_quiet": hex_of(tokens, "--success-quiet"),
        "warning": hex_of(tokens, "--accent-ink"),
        "warning_quiet": hex_of(tokens, "--accent-quiet"),
        "info": hex_of(tokens, "--info"),
        "info_quiet": hex_of(tokens, "--info-quiet"),
    }

    checks = {
        "text_body on surface": contrast(palette["text_body"], palette["surface"]),
        "text_body on background": contrast(palette["text_body"], palette["background"]),
        "text_quiet on surface": contrast(palette["text_quiet"], palette["surface"]),
        "text_on_invert on noir": contrast(palette["text_on_invert"], palette["noir"]),
        "text_body on sun": contrast(palette["text_body"], palette["sun"]),
        "accent_ink_strong on surface": contrast(palette["accent_ink_strong"], palette["surface"]),
        "success on surface": contrast(palette["success"], palette["surface"]),
        "success on success_quiet": contrast(palette["success"], palette["success_quiet"]),
        "warning on surface": contrast(palette["warning"], palette["surface"]),
        "warning on warning_quiet": contrast(palette["warning"], palette["warning_quiet"]),
        "info on info_quiet": contrast(palette["info"], palette["info_quiet"]),
        "text_on_accent on sun": contrast(palette["text_on_invert"], palette["sun"]),
        "danger on surface": contrast(palette["danger"], palette["surface"]),
        "danger on danger_quiet": contrast(palette["danger"], palette["danger_quiet"]),
    }

    # The three status colours are read as normal text, so each must clear 4.5
    # on the fill it sits on. Fail the extract rather than the sheet build.
    must_pass_aa = [
        "success on surface",
        "success on success_quiet",
        "warning on surface",
        "warning on warning_quiet",
        "danger on surface",
        "danger on danger_quiet",
        "text_body on surface",
        "text_on_invert on noir",
    ]
    failures = [k for k in must_pass_aa if checks[k] < 4.5]
    if failures:
        for k in failures:
            print(f"AA FAIL  {k}: {checks[k]}:1", file=sys.stderr)
        return 1

    brand = {
        "_source": "src/styles/ds/theme.css",
        "_generated_by": "tools/send-back-cost-check/extract_brand.py",
        "_note": (
            "Do not hand-edit. Every colour and every family here is a "
            "production token read out of theme.css. Nothing is invented."
        ),
        "derived": [],
        "colors": palette,
        "fonts": {
            # Read from the theme rather than chosen here. Both are real Google
            # Fonts, so Google Sheets can render them after the .xlsx is
            # converted.
            #
            # THERE IS NO MONO FACE ANY MORE. The 18 September system dropped
            # it from the public pages: "labels, prices and stats that used it
            # are Figtree, and --font-features keeps their digits fixed-width".
            # So figures in the sheet are Figtree, and the workbook sets the
            # tabular-figures feature the same way the site does.
            "display": {"family": family_of(tokens, "--font-display"), "google_font": True},
            "body": {"family": family_of(tokens, "--font-body"), "google_font": True},
            "figures": {"family": family_of(tokens, "--font-mono"), "google_font": True},
        },
        "contrast": checks,
    }
    OUT.write_text(json.dumps(brand, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {OUT.relative_to(REPO)}")
    for k, v in checks.items():
        print(f"  {v:>6}:1  {k}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
