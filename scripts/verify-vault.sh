#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VAULT="$(mktemp -d "${TMPDIR:-/tmp}/notes-vault-XXXX")"
cleanup() { rm -rf "$VAULT"; }
trap cleanup EXIT

ts="$(date +%Y-%m-%d-%H%M%S)"
name="note-${ts}.md"
path="$VAULT/$name"

echo "Vault: $VAULT"
touch "$path"
echo "hello from verify" > "$path"

if [[ ! -f "$path" ]]; then
  echo "FAIL: note file not created"
  exit 1
fi

content="$(cat "$path")"
if [[ "$content" != "hello from verify" ]]; then
  echo "FAIL: content mismatch"
  exit 1
fi

count="$(find "$VAULT" -maxdepth 1 -name '*.md' | wc -l | tr -d ' ')"
if [[ "$count" != "1" ]]; then
  echo "FAIL: expected 1 md file, got $count"
  exit 1
fi

echo "OK: create, write, and list conventions verified"
echo "Run 'npm run tauri dev' (requires Rust) for full app test."
