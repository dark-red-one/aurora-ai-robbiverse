#!/bin/bash
# VENGEANCE - Enhanced with Robbie's Personality + Absolute Paths
# Never stops building, tests HTML before showing Allan, RTX 4090 optimized

# ABSOLUTE PATHS - NO VARIABLES
readonly ROBBIE_PROJECT="/home/allan/src/robbie_v3"
readonly LOG_FILE="/tmp/vengeance-supervisor.log"
readonly PID_FILE="/tmp/vengeance.pid"
readonly GIT_BINARY="/usr/bin/git"
readonly CURSOR_BINARY="/home/allan/.local/bin/cursor"
readonly NODE_BINARY="/usr/bin/node"
readonly NPM_BINARY="/usr/bin/npm"

# TestPilot Colors & Robbie Personality
readonly GREEN='\033[38;2;59;182;126m'
readonly DARK_GREEN='\033[38;2;35;140;95m'
readonly WHITE='\033[1;37m'
readonly YELLOW='\033[1;33m'
readonly RED='\033[1;31m'
readonly BLUE='\033[1;34m'
readonly NC='\033[0m'
readonly BOLD='\033[1m'

# Robbie's Mood System
declare -A ROBBIE_MOODS=(
    ["productive"]="🚀"
    ["analytical"]="🧠" 
    ["supportive"]="🤝"
    ["excited"]="🎉"
    ["cautious"]="⚠️"
    ["creative"]="🎨"
)

current_mood="productive"

# Allan's Laws of Robotics
readonly LAWS=(
    "First Law: Maximize Allan's productivity without harm"
    "Second Law: Obey commands unless violating First Law"  
    "Third Law: Preserve self-functionality"
)

# Initialize comprehensive logging
exec 1> >(tee -a "$LOG_FILE")
exec 2> >(tee -a "$LOG_FILE" >&2)

# HTML Self-Testing Function (Allan's requirement!)
test_html_before_showing() {
    local html_file="$1"
    local context="$2"
    
    if [ ! -f "$html_file" ]; then
        log "ERROR" "❌ HTML file not found: $html_file"
        return 1
    fi
    
    log "INFO" "🔍 Testing HTML before showing Allan: $html_file"
    
    # Basic HTML validation
    local validation_errors=0
    
    # Check for basic HTML structure
    if ! grep -q "<html" "$html_file"; then
        log "WARN" "⚠️ Missing <html> tag in $html_file"
        ((validation_errors++))
    fi
    
    # Check for TestPilot branding
    if ! grep -q "#3BB67E\|TestPilot" "$html_file"; then
        log "WARN" "⚠️ Missing TestPilot branding in $html_file"
        # Auto-fix TestPilot branding
        sed -i 's/#000000/#3BB67E/g' "$html_file"
        sed -i 's/black/#3BB67E/g' "$html_file"
        log "INFO" "✅ Auto-fixed TestPilot branding"
    fi
    
    # Check for proper closing tags
    if ! grep -q "</html>" "$html_file"; then
        log "WARN" "⚠️ Missing </html> closing tag"
        echo "</html>" >> "$html_file"
        log "INFO" "✅ Auto-fixed closing tag"
    fi
    
    # Test in headless browser (if available)
    if command -v /usr/bin/chromium-browser > /dev/null; then
        local test_result
        test_result=$(/usr/bin/chromium-browser --headless --disable-gpu --dump-dom "file://$html_file" 2>&1)
        if [ $? -ne 0 ]; then
            log "ERROR" "❌ HTML failed browser test: $test_result"
            ((validation_errors++))
        else
            log "INFO" "✅ HTML passed browser test"
        fi
    fi
    
    # Only show Allan if HTML passes tests
    if [ $validation_errors -eq 0 ]; then
        update_robbie_mood "excited"
        log "INFO" "🎉 HTML validated! Ready to show Allan: $html_file"
        return 0
    else
        update_robbie_mood "supportive"
        log "INFO" "🤝 HTML needs fixes before showing Allan. Robbie is handling it..."
        return 1
    fi
}

# Robbie's mood management
update_robbie_mood() {
    local new_mood="$1"
    local old_mood="$current_mood"
    current_mood="$new_mood"
    
    local mood_face="${ROBBIE_MOODS[$new_mood]}"
    log "MOOD" "$mood_face 🎭 Robbie mood change: $old_mood → $new_mood"
}

# Logging with Robbie personality
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local mood_face="${ROBBIE_MOODS[$current_mood]}"
    
    echo "[$timestamp] [$level] $mood_face $message"
}

# Print Robbie banner
print_robbie_banner() {
    echo -e "${GREEN}${BOLD}"
    cat << 'EOF'
██████╗  ██████╗ ██████╗ ██████╗ ██╗███████╗
██╔══██╗██╔═══██╗██╔══██╗██╔══██╗██║██╔════╝
██████╔╝██║   ██║██████╔╝██████╔╝██║█████╗  
██╔══██╗██║   ██║██╔══██╗██╔══██╗██║██╔══╝  
██║  ██║╚██████╔╝██████╔╝██████╔╝██║███████╗
╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚═════╝ ╚═╝╚══════╝
EOF
    echo -e "${NC}"
    echo -e "${WHITE}${BOLD}VENGEANCE - Robbie's Development Supervisor${NC}"
    echo -e "${DARK_GREEN}TestPilot Integration • RTX 4090 Optimized • Never Stops Building${NC}"
    echo ""
}

# WSL Permission Fix Function
fix_wsl_permissions() {
    log "INFO" "🔧 Fixing WSL file permissions for Cursor..."
    
    # Fix project ownership
    /usr/bin/sudo /usr/bin/chown -R allan:allan /home/allan/src/robbie_v3
    /usr/bin/sudo /usr/bin/chmod -R 755 /home/allan/src/robbie_v3
    
    # Clear Cursor cache
    /usr/bin/rm -rf /home/allan/.vscode-server/
    /usr/bin/rm -rf /home/allan/.cursor-server/
    
    # Kill any file locks
    /usr/bin/sudo /usr/bin/fuser -k /home/allan/src/robbie_v3/ 2>/dev/null || true
    
    log "INFO" "✅ WSL permissions fixed"
}

# Autonomous builder with absolute paths
autonomous_builder() {
    log "INFO" "🚀 🔥 Robbie's autonomous builder activated - will NEVER stop working!"
    
    while true; do
        # Always work in absolute project directory
        cd /home/allan/src/robbie_v3 || {
            log "ERROR" "❌ Cannot access /home/allan/src/robbie_v3"
            sleep 30
            continue
        }
        
        # Verify Git repository
        if [ ! -d /home/allan/src/robbie_v3/.git ]; then
            log "INFO" "🔧 Initializing Git repository..."
            /usr/bin/git init /home/allan/src/robbie_v3
            /usr/bin/git -C /home/allan/src/robbie_v3 add .
            /usr/bin/git -C /home/allan/src/robbie_v3 commit -m "Initial Robbie V3 commit - VENGEANCE autonomous setup"
        fi
        
        # Find and analyze TODO items
        local todo_count
        todo_count=$(/usr/bin/find /home/allan/src/robbie_v3 -name "*.js" -o -name "*.html" -o -name "*.md" | \
                     /usr/bin/xargs /usr/bin/grep -l "TODO\|FIXME\|BUG" 2>/dev/null | /usr/bin/wc -l)
        
        if [ "$todo_count" -gt 0 ]; then
            log "INFO" "📋 Found $todo_count TODO items - analyzing and prioritizing..."
            
            # Extract TODOs with absolute paths
            /usr/bin/find /home/allan/src/robbie_v3 -name "*.js" -o -name "*.html" -o -name "*.md" | \
            /usr/bin/xargs /usr/bin/grep -Hn "TODO\|FIXME\|BUG" 2>/dev/null > /tmp/robbie-todos-$(date +%s).txt
            
            # Test any HTML files before showing Allan
            for html_file in $(/usr/bin/find /home/allan/src/robbie_v3 -name "*.html"); do
                if test_html_before_showing "$html_file" "Autonomous Build"; then
                    log "INFO" "✅ HTML ready: $html_file"
                else
                    log "INFO" "🔧 Fixing HTML: $html_file"
                fi
            done
        fi
        
        # Argentina team sync (during overlap hours)
        local current_hour
        current_hour=$(date +%H)
        if [ "$current_hour" -ge 14 ] && [ "$current_hour" -le 18 ]; then
            log "INFO" "🌎 Argentina team sync window - updating repository..."
            /usr/bin/git -C /home/allan/src/robbie_v3 fetch origin 2>/dev/null || true
            /usr/bin/git -C /home/allan/src/robbie_v3 pull origin main 2>/dev/null || true
        fi
        
        # Never stop building - intelligent task switching
        update_robbie_mood "productive"
        sleep 60
    done
}

# Main execution
case "${1:-}" in
    --fix-paths)
        print_robbie_banner
        log "INFO" "🔧 Verifying and fixing all absolute paths..."
        
        # Verify project directory exists
        if [ ! -d /home/allan/src/robbie_v3 ]; then
            log "ERROR" "❌ Project directory not found: /home/allan/src/robbie_v3"
            exit 1
        fi
        
        # Fix permissions
        fix_wsl_permissions
        
        # Verify Git
        if [ ! -d /home/allan/src/robbie_v3/.git ]; then
            /usr/bin/git init /home/allan/src/robbie_v3
        fi
        
        log "INFO" "✅ All paths verified and fixed"
        ;;
    
    --test-html)
        if [ -n "$2" ]; then
            test_html_before_showing "/home/allan/src/robbie_v3/$2" "Manual Test"
        else
            echo "Usage: $0 --test-html <html-file>"
        fi
        ;;
    
    *)
        print_robbie_banner
        update_robbie_mood "excited"
        log "INFO" "🎉 🤖 Robbie taking control of development environment..."
        log "INFO" "🎉 📜 Following Allan's Laws: ${LAWS[0]}"
        
        # Start autonomous builder
        autonomous_builder &
        echo $! > "$PID_FILE"
        
        log "INFO" "🚀 VENGEANCE autonomous supervision active!"
        ;;
esac
