#!/usr/bin/env python3
"""Generate config/settings_data.json from config/settings_schema.json.

Keeping this generated means the shipped setting values can never drift away
from the schema defaults, and the theme presets stay in sync when a setting is
added or renamed.
"""
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SCHEMA = ROOT / "config" / "settings_schema.json"
DATA = ROOT / "config" / "settings_data.json"

SIDEBAR_TYPES = {"header", "paragraph"}

# Colour schemes shipped with the theme. Keys mirror the color_scheme_group
# definition in settings_schema.json.
SCHEMES = {
    "scheme-1": {
        "background": "#FBF8F3", "background_gradient": "", "text": "#171512",
        "text_muted": "#6B655C", "accent": "#8C4A2F", "button": "#171512",
        "button_label": "#FBF8F3", "secondary_button_label": "#171512",
        "border": "#DED8CE", "card": "#F2EDE4", "shadow": "#171512",
    },
    "scheme-2": {
        "background": "#F2EDE4", "background_gradient": "", "text": "#171512",
        "text_muted": "#6B655C", "accent": "#8C4A2F", "button": "#8C4A2F",
        "button_label": "#FBF8F3", "secondary_button_label": "#171512",
        "border": "#D6CDBE", "card": "#FBF8F3", "shadow": "#171512",
    },
    "scheme-3": {
        "background": "#171512", "background_gradient": "", "text": "#F2EDE4",
        "text_muted": "#A8A093", "accent": "#D89A6A", "button": "#F2EDE4",
        "button_label": "#171512", "secondary_button_label": "#F2EDE4",
        "border": "#3A342C", "card": "#221F1A", "shadow": "#000000",
    },
    "scheme-4": {
        "background": "#8C4A2F", "background_gradient": "", "text": "#FBF8F3",
        "text_muted": "#E8D3C7", "accent": "#FBF8F3", "button": "#FBF8F3",
        "button_label": "#8C4A2F", "secondary_button_label": "#FBF8F3",
        "border": "#A8664A", "card": "#7A3E27", "shadow": "#3A1A0E",
    },
    "scheme-5": {
        "background": "#2C3A33", "background_gradient": "", "text": "#EDF2EE",
        "text_muted": "#A9BAB0", "accent": "#C9A227", "button": "#C9A227",
        "button_label": "#1B241F", "secondary_button_label": "#EDF2EE",
        "border": "#44544B", "card": "#354540", "shadow": "#0F1512",
    },
}

# Theme presets — each one is a different starting personality for the same
# theme, so two stores built on Bends do not have to look alike.
PRESETS = {
    "Atelier": {},
    "Noir": {
        "shape_signature": "square",
        "radius_base": 0, "radius_card": 0, "radius_button": 0, "radius_input": 0,
        "type_heading_transform": "uppercase",
        "type_heading_tracking": 6,
        "type_heading_weight": 400,
        "button_transform": "uppercase",
        "button_hover": "invert",
        "shadow_style": "none",
        "ink_style": "straight",
        "card_image_ratio": "tall",
        "card_style": "plain",
        "layout_spacing_scale": 125,
        "animation_style": "mask",
        "dark_mode": "auto_toggle",
    },
    "Bloom": {
        "shape_signature": "pill",
        "shape_arch_depth": 50,
        "radius_base": 16, "radius_card": 24, "radius_button": 50, "radius_input": 16,
        "shadow_style": "soft",
        "shadow_opacity": 16,
        "type_heading_stack": "",
        "type_heading_weight": 600,
        "type_heading_tracking": -2,
        "ink_style": "scribble",
        "card_style": "surface",
        "card_image_ratio": "square",
        "button_hover": "lift",
        "animation_style": "rise",
    },
    "Kinetic": {
        "shape_signature": "notch",
        "shape_notch_size": 40,
        "radius_base": 0, "radius_card": 0, "radius_button": 0, "radius_input": 0,
        "shadow_style": "hard",
        "shadow_opacity": 100,
        "border_width": 2,
        "type_heading_transform": "uppercase",
        "type_heading_weight": 800,
        "type_heading_scale": 118,
        "type_heading_tracking": -3,
        "button_transform": "uppercase",
        "button_hover": "shine",
        "button_weight": 800,
        "ink_style": "double",
        "ink_thickness": 8,
        "card_style": "bordered",
        "animation_style": "slide",
        "scroll_progress_enabled": True,
    },
}


def collect_defaults(schema):
    """Walk the schema and return {setting_id: default} plus the scheme group id."""
    values = {}
    scheme_group_id = None
    seen = {}
    for group in schema:
        if "settings" not in group:
            continue
        for setting in group["settings"]:
            stype = setting.get("type")
            if stype in SIDEBAR_TYPES:
                continue
            sid = setting.get("id")
            if sid is None:
                raise SystemExit(f"Setting without an id in group {group.get('name')}: {setting}")
            if sid in seen:
                raise SystemExit(f"Duplicate setting id '{sid}' (also in '{seen[sid]}')")
            seen[sid] = group.get("name")

            if stype == "color_scheme_group":
                scheme_group_id = sid
                validate_scheme_definition(setting)
                continue

            if "default" in setting:
                values[sid] = setting["default"]
                validate_default(setting)
            elif stype in ("checkbox",):
                values[sid] = False
    return values, scheme_group_id


def validate_default(setting):
    stype = setting["type"]
    default = setting["default"]
    sid = setting["id"]
    if stype == "select":
        allowed = [o["value"] for o in setting["options"]]
        if default not in allowed:
            raise SystemExit(f"'{sid}': default '{default}' is not one of {allowed}")
    if stype == "range":
        lo, hi, step = setting["min"], setting["max"], setting["step"]
        if not (lo <= default <= hi):
            raise SystemExit(f"'{sid}': default {default} outside {lo}..{hi}")
        if (default - lo) % step != 0:
            raise SystemExit(f"'{sid}': default {default} not reachable from {lo} in steps of {step}")
        if (hi - lo) / step > 101:
            raise SystemExit(f"'{sid}': more than 101 steps ({lo}..{hi} by {step})")


def validate_scheme_definition(setting):
    ids = {d["id"] for d in setting["definition"]}
    for scheme_id, scheme in SCHEMES.items():
        missing = ids - set(scheme)
        extra = set(scheme) - ids
        if missing or extra:
            raise SystemExit(
                f"Colour scheme '{scheme_id}' mismatch. Missing: {sorted(missing)} Extra: {sorted(extra)}"
            )
    for role_value in setting["role"].values():
        targets = role_value.values() if isinstance(role_value, dict) else [role_value]
        for target in targets:
            if target not in ids:
                raise SystemExit(f"Colour role points at unknown setting '{target}'")



def write_color_defaults(schema):
    """Emit snippets/color-defaults.liquid — the palette as plain CSS.

    settings.color_schemes can come back empty on a store: an unresolved group,
    or a section pointing at a scheme id that no longer exists. Every token then
    goes undefined and `rgb(var(--x))` becomes an invalid declaration the browser
    drops, leaving the storefront with no backgrounds, no button fills and no
    borders. These rules sit before the Liquid loop at the same specificity, so
    merchant values win when they resolve and this catches the fall when they
    do not.
    """
    definition = None
    for group in schema:
        for setting in group.get("settings", []):
            if setting.get("type") == "color_scheme_group":
                definition = setting["definition"]
    if definition is None:
        raise SystemExit("No color_scheme_group to build defaults from")

    def triplet(hex_colour):
        v = hex_colour.lstrip("#")
        if len(v) == 3:
            v = "".join(c * 2 for c in v)
        return " ".join(str(int(v[i:i + 2], 16)) for i in (0, 2, 4))

    def blend(a, b, weight=50):
        def parts(x):
            x = x.lstrip("#")
            if len(x) == 3:
                x = "".join(c * 2 for c in x)
            return [int(x[i:i + 2], 16) for i in (0, 2, 4)]
        pa, pb = parts(a), parts(b)
        return " ".join(str(round(x * weight / 100 + y * (100 - weight) / 100))
                        for x, y in zip(pa, pb))

    lines = [
        "{%- comment -%}",
        "  The theme palette as plain CSS. Generated by .dev/build_settings_data.py",
        "  from the same table that fills settings_data.json — never edit by hand.",
        "",
        "  Rendered before the colour scheme loop in css-variables.liquid, at the",
        "  same specificity, so merchant edits override it and the storefront still",
        "  has a complete palette if the loop ever resolves to nothing.",
        "{%- endcomment -%}",
    ]
    for scheme_id, values in SCHEMES.items():
        lines.append(f".color-{scheme_id} {{")
        lines.append(f"  --color-background: {triplet(values['background'])};")
        lines.append(f"  --color-text: {triplet(values['text'])};")
        lines.append(f"  --color-text-muted: {triplet(values['text_muted'])};")
        lines.append(f"  --color-accent: {triplet(values['accent'])};")
        lines.append(f"  --color-button: {triplet(values['button'])};")
        lines.append(f"  --color-button-text: {triplet(values['button_label'])};")
        lines.append(f"  --color-button-secondary-text: {triplet(values['secondary_button_label'])};")
        lines.append(f"  --color-border: {triplet(values['border'])};")
        lines.append(f"  --color-border-control: {blend(values['border'], values['text'])};")
        lines.append(f"  --color-card: {triplet(values['card'])};")
        lines.append(f"  --color-shadow: {triplet(values['shadow'])};")
        lines.append("  --gradient-background: none;")
        lines.append("}")

    path = ROOT / "snippets" / "color-defaults.liquid"
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return len(SCHEMES)


def main():
    schema = json.loads(SCHEMA.read_text(encoding="utf-8"))
    defaults, scheme_group_id = collect_defaults(schema)
    if scheme_group_id is None:
        raise SystemExit("No color_scheme_group found in settings_schema.json")

    scheme_block = {sid: {"settings": vals} for sid, vals in SCHEMES.items()}

    current = dict(defaults)
    current[scheme_group_id] = scheme_block

    presets = {}
    for name, overrides in PRESETS.items():
        unknown = set(overrides) - set(defaults)
        if unknown:
            raise SystemExit(f"Preset '{name}' sets unknown settings: {sorted(unknown)}")
        preset = dict(defaults)
        preset.update(overrides)
        preset[scheme_group_id] = scheme_block
        presets[name] = preset

    DATA.write_text(
        json.dumps({"current": current, "presets": presets}, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    written = write_color_defaults(schema)
    print(f"settings_data.json written: {len(defaults)} settings, {len(presets)} presets, {len(SCHEMES)} colour schemes")
    print(f"color-defaults.liquid written: {written} schemes")


if __name__ == "__main__":
    sys.exit(main())
