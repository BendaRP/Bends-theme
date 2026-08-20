#!/usr/bin/env python3
"""Check the shipped colour schemes against WCAG contrast minimums.

Acceptance criterion: every preset palette must clear 4.5:1 for body text and
3:1 for large text, borders and icons.
"""
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent


def srgb_to_linear(channel):
    c = channel / 255
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def luminance(hex_colour):
    value = hex_colour.lstrip('#')
    if len(value) == 3:
        value = ''.join(ch * 2 for ch in value)
    r, g, b = (int(value[i:i + 2], 16) for i in (0, 2, 4))
    return 0.2126 * srgb_to_linear(r) + 0.7152 * srgb_to_linear(g) + 0.0722 * srgb_to_linear(b)


def contrast(a, b):
    la, lb = luminance(a), luminance(b)
    lighter, darker = max(la, lb), min(la, lb)
    return (lighter + 0.05) / (darker + 0.05)


# (foreground, background, minimum, description)
PAIRS = [
    ('text', 'background', 4.5, 'body text on background'),
    ('text_muted', 'background', 4.5, 'muted text on background'),
    ('text', 'card', 4.5, 'body text on card'),
    ('text_muted', 'card', 4.5, 'muted text on card'),
    ('accent', 'background', 4.5, 'links on background'),
    ('button_label', 'button', 4.5, 'primary button label'),
    ('secondary_button_label', 'background', 4.5, 'secondary button label'),
    ('border_control', 'background', 3.0, 'control borders on background'),
    ('border_control', 'card', 3.0, 'control borders on card'),
]


def mix(a, b, weight=50):
    """Mirror Shopify's color_mix filter: weight is the share of colour a."""
    def parts(value):
        value = value.lstrip('#')
        if len(value) == 3:
            value = ''.join(ch * 2 for ch in value)
        return [int(value[i:i + 2], 16) for i in (0, 2, 4)]

    pa, pb = parts(a), parts(b)
    blended = [round(x * weight / 100 + y * (100 - weight) / 100) for x, y in zip(pa, pb)]
    return '#' + ''.join(f'{c:02x}' for c in blended)


def main():
    data = json.loads((ROOT / 'config' / 'settings_data.json').read_text(encoding='utf-8'))
    schemes = data['current']['color_schemes']

    failures = []
    checked = 0
    for scheme_id, scheme in schemes.items():
        settings = dict(scheme['settings'])
        settings['border_control'] = mix(settings['border'], settings['text'])
        for fg, bg, minimum, label in PAIRS:
            ratio = contrast(settings[fg], settings[bg])
            checked += 1
            status = 'ok ' if ratio >= minimum else 'FAIL'
            if ratio < minimum:
                failures.append(f'{scheme_id}: {label} is {ratio:.2f}:1, needs {minimum}:1 '
                                f'({settings[fg]} on {settings[bg]})')
            print(f'  {status} {scheme_id:<10} {label:<32} {ratio:5.2f}:1')

    # Dark mode overrides
    current = data['current']
    dark_pairs = [
        ('dark_text', 'dark_background', 4.5, 'dark body text'),
        ('dark_text_muted', 'dark_background', 4.5, 'dark muted text'),
        ('dark_text', 'dark_card', 4.5, 'dark text on card'),
        ('dark_accent', 'dark_background', 4.5, 'dark links'),
        ('dark_border_control', 'dark_background', 3.0, 'dark control borders'),
    ]
    current = dict(current)
    current['dark_border_control'] = mix(current['dark_border'], current['dark_text'])
    for fg, bg, minimum, label in dark_pairs:
        ratio = contrast(current[fg], current[bg])
        checked += 1
        status = 'ok ' if ratio >= minimum else 'FAIL'
        if ratio < minimum:
            failures.append(f'dark mode: {label} is {ratio:.2f}:1, needs {minimum}:1 '
                            f'({current[fg]} on {current[bg]})')
        print(f'  {status} {"dark":<10} {label:<32} {ratio:5.2f}:1')

    print(f'\n{checked} pairs checked, {len(failures)} below the minimum')
    for failure in failures:
        print(f'  - {failure}')
    return 1 if failures else 0


if __name__ == '__main__':
    sys.exit(main())
