#!/usr/bin/env bash
set -euo pipefail

lock_file="$(dirname "$0")/../SAFETY_LOCK.json"

if [[ ! -f "$lock_file" ]]; then
  echo "Safeguard: SAFETY_LOCK.json is missing."
  exit 1
fi

if grep -q '"allowChanges"[[:space:]]*:[[:space:]]*true' "$lock_file"; then
  echo "Safeguard: allowChanges=true. Proceeding is permitted."
  exit 0
fi

echo "Safeguard: allowChanges=false. Update SAFETY_LOCK.json after completing checkpoints."
exit 2
