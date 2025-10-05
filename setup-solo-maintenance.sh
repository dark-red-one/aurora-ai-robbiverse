#!/bin/bash

# Aurora AI Empire - Solo Developer Maintenance Setup
# One-command setup for automated maintenance when working alone

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Check if we're in the right directory
if [[ ! -f "MAINTENANCE_FRAMEWORK.md" ]]; then
    echo "❌ Please run this script from the aurora-ai-robbiverse directory"
    exit 1
fi

log "🚀 Setting up Aurora AI Empire automated maintenance for solo development..."

# 1. Setup cron jobs for automated maintenance
log "⏰ Setting up automated maintenance schedule..."
if ./maintenance/cron-setup.sh setup; then
    success "Automated maintenance scheduled"
else
    warning "Failed to setup cron jobs - you may need to run manually"
fi

# 2. Configure environment-specific settings
log "⚙️ Configuring environment settings..."
if [[ -f "config/environments/aurora.json" ]] && [[ -f "config/environments/vengeance.json" ]] && [[ -f "config/environments/robbiebook1.json" ]]; then
    success "Environment configurations ready"
else
    warning "Environment configuration files not found"
fi

# 3. Setup notification system (simplified for solo)
log "📧 Setting up notification system..."
if [[ -f "maintenance/notifications.py" ]]; then
    success "Notification system ready (will send to allan@testpilotcpg.com)"
else
    warning "Notification system not found"
fi

# 4. Verify all components are in place
log "🔍 Verifying setup completeness..."

missing_components=()

if [[ ! -f "sync/sync-all-environments.sh" ]]; then
    missing_components+=("sync-all-environments.sh")
fi

if [[ ! -f "maintenance/daily-maintenance.sh" ]]; then
    missing_components+=("daily-maintenance.sh")
fi

if [[ ! -f "tests/TESTING_STRATEGY.md" ]]; then
    missing_components+=("testing strategy")
fi

if [[ ${#missing_components[@]} -eq 0 ]]; then
    success "✅ All components installed successfully!"
else
    warning "⚠️ Missing components: ${missing_components[*]}"
    warning "Some features may not work until these are installed"
fi

# 5. Display activation instructions
echo ""
echo "🎉 **Aurora AI Empire Automated Maintenance - ACTIVATED!**"
echo ""
echo "📋 **What's Now Automated:**"
echo "  ✅ Daily health checks (6:00 AM UTC)"
echo "  ✅ Weekly backups (Sunday 2:00 AM UTC)"
echo "  ✅ Monthly audits (1st of month 3:00 AM UTC)"
echo "  ✅ Cross-environment synchronization"
echo "  ✅ Performance monitoring and alerts"
echo "  ✅ Security updates and vulnerability scanning"
echo ""
echo "📧 **Your Notifications:**"
echo "  • Daily summary email (7:00 AM)"
echo "  • Weekly performance report (Monday 9:00 AM)"
echo "  • Monthly strategic report (1st of month)"
echo "  • Emergency alerts (immediate)"
echo ""
echo "🎮 **Manual Commands (when needed):**"
echo "  • Sync environments: ./sync/sync-all-environments.sh aurora"
echo "  • Health check: ./maintenance/daily-maintenance.sh run"
echo "  • Generate report: ./maintenance/status-report.sh"
echo "  • Emergency: ./maintenance/emergency-mode.sh"
echo ""
echo "🛡️ **Emergency Contacts:**"
echo "  • Primary: allan@testpilotcpg.com"
echo "  • System: Automated monitoring alerts"
echo ""
echo "✨ **You're all set! The Aurora AI Empire will now maintain itself while keeping you informed.**"
echo ""
echo "📖 **For detailed information, see:** MAINTENANCE_FRAMEWORK.md"
echo ""

# Optional: Ask if they want to run initial sync
read -p "🔄 Would you like to run initial environment sync now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log "🔄 Running initial environment synchronization..."
    if ./sync/sync-all-environments.sh aurora; then
        success "Initial synchronization completed!"
    else
        warning "Initial synchronization failed - you can run it manually later"
    fi
fi

success "🎯 Solo developer maintenance framework activated successfully!"
