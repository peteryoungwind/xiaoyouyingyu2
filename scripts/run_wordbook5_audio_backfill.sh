#!/usr/bin/env bash
set -euo pipefail

cd /Users/admin/code/github/xiaoyouyingyu2

JAVA_BIN="/Users/admin/Library/Java/JavaVirtualMachines/graalvm-jdk-21.0.5-1/Contents/Home/bin/java"
CLASSPATH="/private/tmp:$(cat /private/tmp/xiaoyou_cp.txt)"
BOOK_ID="${1:-5}"
LIMIT="${2:-50}"
SLEEP_MS="${3:-2000}"

exec "$JAVA_BIN" -cp "$CLASSPATH" backfill_wordbook_audio "$BOOK_ID" "$LIMIT" "$SLEEP_MS"
