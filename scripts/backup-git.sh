#!/bin/bash
set -euo pipefail
BUCKET="bguoh9kd1g"
ENDPOINT="https://s3api-eur-is-1.runpod.io"
TS=$(date -u +%Y%m%dT%H%M%SZ)
BUNDLE="/tmp/aurora-repo-$TS.bundle"
cd /workspace/aurora
# Ensure repo initialized
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git init
  git add -A
  git commit -m "initial snapshot $TS" >/dev/null 2>&1 || true
fi
# Create bundle and upload
git bundle create "$BUNDLE" --all
aws s3 cp "$BUNDLE" s3://$BUCKET/backups/git/ --endpoint-url $ENDPOINT
rm -f "$BUNDLE"
# Keep only last 30 bundles
aws s3 ls s3://$BUCKET/backups/git/ --endpoint-url $ENDPOINT | awk '{print $4}' | sort | head -n -30 | while read f; do 
  [ -n "$f" ] && aws s3 rm s3://$BUCKET/backups/git/$f --endpoint-url $ENDPOINT || true
done
