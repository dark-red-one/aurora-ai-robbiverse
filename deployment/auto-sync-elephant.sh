#!/bin/bash
set -euo pipefail

# Rsync local data directory to remote "elephant" host
# Requires ssh config entry:
#   Host elephant
#     HostName <elephant-ip-or-dns>
#     User allan
#     IdentityFile ~/.ssh/id_ed25519

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT_DIR/data/"
DEST="elephant:/opt/aurora-dev/aurora/data/"

echo "[robby] Syncing $SRC -> $DEST"
rsync -avz --delete --mkpath "$SRC" "$DEST"
echo "[robby] ✅ Elephant sync complete"




