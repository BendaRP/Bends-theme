#!/usr/bin/env bash
# Compact theme-check report. Exit code mirrors `--fail-level warning`.
cd "$(dirname "$0")/.." || exit 1
out=$(shopify theme check --fail-level warning --output json 2>/dev/null)
status=$?
echo "$out" | python3 -c "
import json,sys,os
try:
    d=json.load(sys.stdin)
except Exception:
    print('could not parse theme check output'); sys.exit(2)
root=os.getcwd()+'/'
n=0
for f in d:
    for o in f.get('offenses',[]):
        n+=1
        print(f\"{f['path'].replace(root,'')}:{o.get('start_row',0)+1} [{o['severity']}] {o['check']}: {o['message']}\")
print(f'--- {n} offenses ---')
"
exit $status
