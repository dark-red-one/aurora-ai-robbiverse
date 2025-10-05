#!/bin/bash

# Aurora AI Empire - Automated Cron Job Setup
# Configures automated maintenance schedules

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

# Setup cron jobs for automated maintenance
setup_cron_jobs() {
    log "⏰ Setting up automated maintenance cron jobs..."

    # Create temporary cron file
    local cron_file="/tmp/aurora-cron"

    # Add existing cron jobs (preserve user's existing jobs)
    crontab -l > "$cron_file" 2>/dev/null || touch "$cron_file"

    # Add Aurora maintenance jobs (if not already present)
    if ! grep -q "daily-maintenance" "$cron_file"; then
        echo "# Aurora AI Empire - Daily maintenance (6:00 AM UTC)" >> "$cron_file"
        echo "0 6 * * * cd /home/allan/robbie_workspace/combined/aurora-ai-robbiverse && ./maintenance/daily-maintenance.sh >> maintenance.log 2>&1" >> "$cron_file"
        echo "" >> "$cron_file"
    fi

    if ! grep -q "weekly-backup" "$cron_file"; then
        echo "# Aurora AI Empire - Weekly backup (Sunday 2:00 AM UTC)" >> "$cron_file"
        echo "0 2 * * 0 cd /home/allan/robbie_workspace/combined/aurora-ai-robbiverse && ./maintenance/weekly-backup.sh >> maintenance.log 2>&1" >> "$cron_file"
        echo "" >> "$cron_file"
    fi

    if ! grep -q "monthly-audit" "$cron_file"; then
        echo "# Aurora AI Empire - Monthly audit (1st of month 3:00 AM UTC)" >> "$cron_file"
        echo "0 3 1 * * cd /home/allan/robbie_workspace/combined/aurora-ai-robbiverse && ./maintenance/monthly-audit.sh >> maintenance.log 2>&1" >> "$cron_file"
        echo "" >> "$cron_file"
    fi

    # Install new cron file
    crontab "$cron_file"

    # Clean up temporary file
    rm "$cron_file"

    success "Cron jobs configured successfully!"

    log "📋 Configured maintenance schedule:"
    log "  • Daily maintenance: 6:00 AM UTC"
    log "  • Weekly backup: Sunday 2:00 AM UTC"
    log "  • Monthly audit: 1st of month 3:00 AM UTC"

    log "🔍 View current cron jobs with: crontab -l"
    log "✏️ Edit cron jobs with: crontab -e"
}

# Verify cron jobs are active
verify_cron_jobs() {
    log "🔍 Verifying cron jobs are active..."

    if crontab -l | grep -q "daily-maintenance"; then
        success "Daily maintenance cron job is active"
    else
        echo "⚠️ Daily maintenance cron job not found"
    fi

    if crontab -l | grep -q "weekly-backup"; then
        success "Weekly backup cron job is active"
    else
        echo "⚠️ Weekly backup cron job not found"
    fi

    if crontab -l | grep -q "monthly-audit"; then
        success "Monthly audit cron job is active"
    else
        echo "⚠️ Monthly audit cron job not found"
    fi
}

# Show usage information
usage() {
    echo "Aurora AI Empire - Automated Cron Job Setup"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  setup     Configure automated maintenance cron jobs"
    echo "  verify    Check if cron jobs are properly configured"
    echo ""
    echo "This script sets up automated maintenance schedules:"
    echo "  • Daily maintenance (6:00 AM UTC)"
    echo "  • Weekly backup (Sunday 2:00 AM UTC)"
    echo "  • Monthly audit (1st of month 3:00 AM UTC)"
}

# Main script logic
main() {
    case "${1:-setup}" in
        "setup")
            setup_cron_jobs
            ;;
        "verify")
            verify_cron_jobs
            ;;
        "help"|"-h"|"--help")
            usage
            exit 0
            ;;
        *)
            echo "Invalid command: $1"
            usage
            exit 1
            ;;
    esac
}

main "$@"
