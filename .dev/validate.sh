#!/usr/bin/env bash
# Full acceptance run for the Bends theme.
cd "$(dirname "$0")/.." || exit 1
fail=0

echo "== JSON validity =="
for f in config/*.json locales/*.json templates/*.json templates/customers/*.json sections/*.json; do
  python3 -c "import json,sys; json.load(open('$f'))" 2>/dev/null || { echo "  INVALID: $f"; fail=1; }
done
echo "  all JSON parsed"

echo
echo "== Settings and locales regenerate cleanly =="
python3 .dev/build_settings_data.py || fail=1
python3 .dev/build_locales.py || fail=1
git diff --quiet config/settings_data.json locales/ || { echo "  generated files are out of date — commit the regenerated versions"; fail=1; }

echo
echo "== Colour contrast =="
python3 .dev/check_contrast.py > /dev/null || { python3 .dev/check_contrast.py | tail -8; fail=1; }
echo "  every shipped palette clears WCAG minimums"

echo
echo "== JavaScript syntax =="
for f in assets/*.js; do node --check "$f" || fail=1; done
echo "  all bundles parse"

echo
echo "== Liquid parses for real =="
ruby -E UTF-8 .dev/parse_liquid.rb || fail=1

echo
echo "== Theme check (--fail-level warning) =="
.dev/check.sh || fail=1

echo
if [ $fail -eq 0 ]; then echo "PASS"; else echo "FAIL"; fi
exit $fail
