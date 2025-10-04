#!/bin/bash
# TestPilot Network Storage Manager (4TB)
# Direct S3 access without FUSE mounting

ENDPOINT="https://s3api-eur-is-1.runpod.io"
BUCKET="bguoh9kd1g"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

function show_usage() {
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║        TESTPILOT NETWORK STORAGE (4TB) - MANAGER             ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  list [prefix]        - List files in storage"
    echo "  upload <file> <path> - Upload file to storage"
    echo "  download <path> <file> - Download file from storage"
    echo "  sync-up <dir> <path> - Sync local directory to storage"
    echo "  sync-down <path> <dir> - Sync storage to local directory"
    echo "  delete <path>        - Delete file from storage"
    echo "  info                 - Show storage usage info"
    echo "  backup-aurora        - Backup entire Aurora codebase"
    echo "  restore-aurora       - Restore Aurora from backup"
    echo ""
    echo "Examples:"
    echo "  $0 list"
    echo "  $0 upload model.bin models/"
    echo "  $0 sync-up /workspace/aurora aurora-backup/"
    echo "  $0 info"
}

function list_files() {
    local prefix="${1:-}"
    echo -e "${BLUE}📂 Listing files in s3://$BUCKET/$prefix${NC}"
    aws s3 ls --endpoint-url "$ENDPOINT" "s3://$BUCKET/$prefix" --recursive --human-readable
}

function upload_file() {
    local file="$1"
    local path="$2"
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ File not found: $file${NC}"
        return 1
    fi
    echo -e "${YELLOW}⬆️  Uploading $file to s3://$BUCKET/$path${NC}"
    aws s3 cp "$file" --endpoint-url "$ENDPOINT" "s3://$BUCKET/$path"
    echo -e "${GREEN}✅ Upload complete${NC}"
}

function download_file() {
    local path="$1"
    local file="$2"
    echo -e "${YELLOW}⬇️  Downloading s3://$BUCKET/$path to $file${NC}"
    aws s3 cp --endpoint-url "$ENDPOINT" "s3://$BUCKET/$path" "$file"
    echo -e "${GREEN}✅ Download complete${NC}"
}

function sync_up() {
    local dir="$1"
    local path="$2"
    if [ ! -d "$dir" ]; then
        echo -e "${RED}❌ Directory not found: $dir${NC}"
        return 1
    fi
    echo -e "${YELLOW}🔄 Syncing $dir to s3://$BUCKET/$path${NC}"
    aws s3 sync "$dir" --endpoint-url "$ENDPOINT" "s3://$BUCKET/$path" --delete
    echo -e "${GREEN}✅ Sync complete${NC}"
}

function sync_down() {
    local path="$1"
    local dir="$2"
    mkdir -p "$dir"
    echo -e "${YELLOW}🔄 Syncing s3://$BUCKET/$path to $dir${NC}"
    aws s3 sync --endpoint-url "$ENDPOINT" "s3://$BUCKET/$path" "$dir" --delete
    echo -e "${GREEN}✅ Sync complete${NC}"
}

function delete_file() {
    local path="$1"
    echo -e "${YELLOW}🗑️  Deleting s3://$BUCKET/$path${NC}"
    aws s3 rm --endpoint-url "$ENDPOINT" "s3://$BUCKET/$path" --recursive
    echo -e "${GREEN}✅ Delete complete${NC}"
}

function show_info() {
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                    STORAGE INFORMATION                       ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # Count files and calculate size
    local total_size=0
    local file_count=0
    
    while IFS= read -r line; do
        if [[ $line =~ ([0-9]+)[[:space:]]+(.*) ]]; then
            size="${BASH_REMATCH[1]}"
            total_size=$((total_size + size))
            file_count=$((file_count + 1))
        fi
    done < <(aws s3 ls --endpoint-url "$ENDPOINT" "s3://$BUCKET/" --recursive --summarize | grep -E '^[0-9]')
    
    local size_gb=$(echo "scale=2; $total_size / 1024 / 1024 / 1024" | bc 2>/dev/null || echo "0")
    local used_percent=$(echo "scale=1; $size_gb / 4000 * 100" | bc 2>/dev/null || echo "0")
    local available_gb=$(echo "scale=2; 4000 - $size_gb" | bc 2>/dev/null || echo "4000")
    
    echo -e "${GREEN}📊 Storage Statistics:${NC}"
    echo -e "   • Total Capacity: ${BLUE}4000 GB${NC}"
    echo -e "   • Files: ${YELLOW}$file_count${NC}"
    echo -e "   • Used: ${YELLOW}${size_gb} GB${NC} (${used_percent}%)"
    echo -e "   • Available: ${GREEN}${available_gb} GB${NC}"
    echo -e "   • Monthly Cost: ${BLUE}\$200${NC}"
    echo -e "   • Location: ${BLUE}EUR-IS-1 (Iceland)${NC}"
    echo ""
}

function backup_aurora() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_path="aurora-backups/$timestamp/"
    
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                  BACKING UP AURORA CODEBASE                  ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}📦 Creating backup: $backup_path${NC}"
    
    # Sync Aurora to network storage
    aws s3 sync /workspace/aurora --endpoint-url "$ENDPOINT" "s3://$BUCKET/$backup_path" \
        --exclude "*.pyc" \
        --exclude "__pycache__/*" \
        --exclude ".git/*" \
        --exclude "node_modules/*" \
        --exclude "*.log"
    
    # Create backup metadata
    echo "{\"timestamp\": \"$timestamp\", \"date\": \"$(date)\", \"host\": \"$(hostname)\"}" | \
        aws s3 cp - --endpoint-url "$ENDPOINT" "s3://$BUCKET/$backup_path.metadata.json"
    
    echo -e "${GREEN}✅ Backup complete: $backup_path${NC}"
}

function restore_aurora() {
    # List available backups
    echo -e "${BLUE}Available backups:${NC}"
    aws s3 ls --endpoint-url "$ENDPOINT" "s3://$BUCKET/aurora-backups/" | grep "PRE" | awk '{print $2}'
    
    echo ""
    read -p "Enter backup timestamp to restore (or 'latest' for most recent): " backup_choice
    
    if [ "$backup_choice" = "latest" ]; then
        backup_path=$(aws s3 ls --endpoint-url "$ENDPOINT" "s3://$BUCKET/aurora-backups/" | grep "PRE" | tail -1 | awk '{print $2}')
    else
        backup_path="$backup_choice"
    fi
    
    echo -e "${YELLOW}⚠️  This will restore from: aurora-backups/$backup_path${NC}"
    read -p "Continue? (y/n): " confirm
    
    if [ "$confirm" = "y" ]; then
        echo -e "${YELLOW}🔄 Restoring Aurora from backup...${NC}"
        aws s3 sync --endpoint-url "$ENDPOINT" "s3://$BUCKET/aurora-backups/$backup_path" /workspace/aurora-restored/ --delete
        echo -e "${GREEN}✅ Restored to /workspace/aurora-restored/${NC}"
        echo -e "${YELLOW}Review the restored files, then move them to /workspace/aurora if correct${NC}"
    fi
}

# Main script logic
case "$1" in
    list)
        list_files "$2"
        ;;
    upload)
        upload_file "$2" "$3"
        ;;
    download)
        download_file "$2" "$3"
        ;;
    sync-up)
        sync_up "$2" "$3"
        ;;
    sync-down)
        sync_down "$2" "$3"
        ;;
    delete)
        delete_file "$2"
        ;;
    info)
        show_info
        ;;
    backup-aurora)
        backup_aurora
        ;;
    restore-aurora)
        restore_aurora
        ;;
    *)
        show_usage
        ;;
esac
