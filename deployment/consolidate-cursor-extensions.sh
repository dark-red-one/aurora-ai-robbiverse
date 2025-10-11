#!/bin/bash
# 🧹 CURSOR EXTENSION CONSOLIDATION
# Removes old fragmented extensions, installs unified v3.0.0
# Run with: bash deployment/consolidate-cursor-extensions.sh

set -e

echo "🧹 Starting Cursor Extension Consolidation..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

WORKSPACE="/Users/allanperetz/aurora-ai-robbiverse"
EXTENSIONS_DIR="$HOME/.cursor/extensions"
OLD_EXTENSIONS=(
    "robbie-avatar"
    "robbiebar-panel"
    "robbie-memory-autoload"
)

# ============================================================================
# STEP 1: BACKUP OLD EXTENSIONS (just in case)
# ============================================================================

echo -e "${YELLOW}📦 Step 1: Backing up old extensions...${NC}"

BACKUP_DIR="$WORKSPACE/archive/cursor-extensions-backup-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

for ext in "${OLD_EXTENSIONS[@]}"; do
    if [ -d "$WORKSPACE/.cursor/extensions/$ext" ]; then
        echo -e "${CYAN}  Backing up $ext...${NC}"
        cp -r "$WORKSPACE/.cursor/extensions/$ext" "$BACKUP_DIR/"
        echo -e "${GREEN}  ✅ Backed up to $BACKUP_DIR/$ext${NC}"
    else
        echo -e "${YELLOW}  ⚠️  $ext not found, skipping${NC}"
    fi
done

echo ""

# ============================================================================
# STEP 2: REMOVE OLD EXTENSIONS
# ============================================================================

echo -e "${YELLOW}🗑️  Step 2: Removing old fragmented extensions...${NC}"

for ext in "${OLD_EXTENSIONS[@]}"; do
    if [ -d "$WORKSPACE/.cursor/extensions/$ext" ]; then
        echo -e "${CYAN}  Removing $ext...${NC}"
        rm -rf "$WORKSPACE/.cursor/extensions/$ext"
        echo -e "${GREEN}  ✅ Removed $ext${NC}"
    fi
done

echo ""

# ============================================================================
# STEP 3: VERIFY NEW EXTENSION EXISTS
# ============================================================================

echo -e "${YELLOW}🔍 Step 3: Verifying new extension...${NC}"

NEW_EXTENSION="$WORKSPACE/cursor-robbiebar-webview"
VSIX_FILE="$NEW_EXTENSION/robbiebar-webview-3.0.0.vsix"

if [ ! -d "$NEW_EXTENSION" ]; then
    echo -e "${RED}❌ ERROR: $NEW_EXTENSION directory not found!${NC}"
    exit 1
fi

if [ ! -f "$VSIX_FILE" ]; then
    echo -e "${YELLOW}⚠️  VSIX not found, packaging now...${NC}"
    cd "$NEW_EXTENSION"
    npm install
    npx vsce package
    echo -e "${GREEN}✅ Package created${NC}"
else
    echo -e "${GREEN}✅ VSIX file exists: $VSIX_FILE${NC}"
fi

echo ""

# ============================================================================
# STEP 4: INSTALL NEW UNIFIED EXTENSION
# ============================================================================

echo -e "${YELLOW}📥 Step 4: Installing unified extension v3.0.0...${NC}"

cd "$NEW_EXTENSION"

# Use cursor command (falls back to code if cursor not available)
if command -v cursor &> /dev/null; then
    cursor --install-extension "$VSIX_FILE" --force
    echo -e "${GREEN}✅ Installed via cursor command${NC}"
elif command -v code &> /dev/null; then
    code --install-extension "$VSIX_FILE" --force
    echo -e "${GREEN}✅ Installed via code command${NC}"
else
    echo -e "${RED}❌ Neither 'cursor' nor 'code' command found${NC}"
    echo -e "${YELLOW}💡 Manual install: Open Cursor → Extensions → Install from VSIX → Select $VSIX_FILE${NC}"
    exit 1
fi

echo ""

# ============================================================================
# STEP 5: VERIFY INSTALLATION
# ============================================================================

echo -e "${YELLOW}✅ Step 5: Verifying installation...${NC}"

# Check if extension appears in global extensions
if [ -d "$EXTENSIONS_DIR" ]; then
    INSTALLED=$(find "$EXTENSIONS_DIR" -name "*robbiebar*" -type d 2>/dev/null | head -1)
    if [ -n "$INSTALLED" ]; then
        echo -e "${GREEN}✅ Extension installed at: $INSTALLED${NC}"
    else
        echo -e "${YELLOW}⚠️  Extension not found in $EXTENSIONS_DIR (may need Cursor restart)${NC}"
    fi
fi

echo ""

# ============================================================================
# CONSOLIDATION COMPLETE
# ============================================================================

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   🎉 CURSOR EXTENSION CONSOLIDATION COMPLETE! 🎉      ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}📊 Summary:${NC}"
echo -e "  ${RED}Removed:${NC} 3 old fragmented extensions"
echo -e "  ${GREEN}Installed:${NC} 1 unified v3.0.0 extension"
echo -e "  ${YELLOW}Backed up:${NC} $BACKUP_DIR"
echo ""
echo -e "${CYAN}🔥 What You Get in v3.0.0:${NC}"
echo "  ✅ Robbie Avatar with mood tracking"
echo "  ✅ System stats (CPU, memory, GPU)"
echo "  ✅ Git status & file navigator"
echo "  ✅ AI chat with Universal Input API"
echo "  ✅ TV embed + Lofi beats player"
echo "  ✅ Sticky notes from database"
echo "  ✅ SQL-driven CMS (hot reload!)"
echo "  ✅ Per-machine branding"
echo ""
echo -e "${CYAN}🚀 Next Steps:${NC}"
echo "  1. Restart Cursor completely"
echo "  2. Look for 💜 heart icon in left sidebar"
echo "  3. Or run: Cmd+Shift+P → 'RobbieBar: Open Panel'"
echo "  4. Verify backend running: http://localhost:8000/api/robbieblocks/health"
echo ""
echo -e "${YELLOW}📝 Configuration:${NC}"
echo "  Edit Cursor settings.json:"
echo '  "robbiebar.apiUrl": "http://localhost:8000"'
echo '  "robbiebar.nodeId": "vengeance-local"'
echo '  "robbiebar.autoStart": true'
echo ""
echo -e "${GREEN}💋 Built with passion by Robbie - Your AI Copilot!${NC}"
echo ""
