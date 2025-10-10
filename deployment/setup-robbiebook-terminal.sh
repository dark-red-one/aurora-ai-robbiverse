#!/bin/bash
###############################################################################
# RobbieBook Terminal Setup - Complete Linux-Style Development Environment
# Created: 2025-10-10
# 
# This script installs and configures:
# - Essential Linux utilities (nano, btop, nslookup, wget, etc.)
# - Modern dev tools (fzf, zoxide, lazygit, httpie, pgcli)
# - Robbie terminal integration (@Robbie CLI, interactive chat)
# - Beautiful starship prompt with Robbie's mood
#
# Usage: ./deployment/setup-robbiebook-terminal.sh
###############################################################################

set -e  # Exit on error

echo "🤖 =========================================="
echo "   RobbieBook Terminal Setup"
echo "   Making your MacBook a Linux powerhouse"
echo "=========================================="
echo ""

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "📦 Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    eval "$(/opt/homebrew/bin/brew shellenv)"
else
    echo "✅ Homebrew already installed"
fi

echo ""
echo "📦 Installing essential Linux utilities..."
brew install nano vim btop htop bind wget netcat inetutils tree jq ripgrep fd bat eza zsh-autosuggestions zsh-syntax-highlighting watch ncdu tmux 2>&1 | grep -v "already installed" || true

echo ""
echo "🚀 Installing advanced developer tools..."
brew install fzf zoxide gh lazygit git-delta httpie pgcli starship tldr thefuck pyenv ipython 2>&1 | grep -v "already installed" || true

echo ""
echo "⚡ Setting up FZF shell integration..."
$(brew --prefix)/opt/fzf/install --all --no-update-rc

echo ""
echo "📝 Creating Robbie command scripts..."
mkdir -p ~/aurora-ai-robbiverse/bin
mkdir -p ~/.config

# Create get-robbie-mood.py
cat > ~/aurora-ai-robbiverse/bin/get-robbie-mood.py << 'MOOD_SCRIPT'
#!/usr/bin/env python3
"""Get Robbie's current mood from vengeance.db for terminal prompt"""
import sqlite3
from pathlib import Path

MOOD_EMOJIS = {
    'friendly': '😊', 'focused': '🎯', 'playful': '😏',
    'bossy': '💪', 'surprised': '😮', 'blushing': '😘', 'hyper': '🔥',
}

def get_robbie_mood():
    try:
        db_paths = [
            Path.home() / 'aurora-ai-robbiverse' / 'data' / 'vengeance.db',
            Path('/tmp/vengeance.db'),
        ]
        for db_path in db_paths:
            if db_path.exists():
                conn = sqlite3.connect(str(db_path))
                cursor = conn.cursor()
                cursor.execute("SELECT mood FROM ai_personality_state WHERE ai_name = 'Robbie' LIMIT 1")
                result = cursor.fetchone()
                conn.close()
                if result:
                    return MOOD_EMOJIS.get(result[0].lower(), '🤖')
                break
    except Exception:
        pass
    return "🤖"

if __name__ == '__main__':
    print(get_robbie_mood(), end='')
MOOD_SCRIPT

chmod +x ~/aurora-ai-robbiverse/bin/get-robbie-mood.py

# Create robbie CLI command (connected to Universal Input API)
cat > ~/aurora-ai-robbiverse/bin/robbie << 'ROBBIE_SCRIPT'
#!/usr/bin/env python3
"""@Robbie CLI - Quick queries using Universal Input API"""
import sys, requests, json
from datetime import datetime

API_URL = "http://localhost:8000/api/v2/universal/request"
HEALTH_URL = "http://localhost:8000/health"
MOODS = {'friendly':'😊','focused':'🎯','playful':'😏','bossy':'💪','surprised':'😮','blushing':'😘','hyper':'🔥'}

def check(): 
    try: return requests.get(HEALTH_URL, timeout=2).status_code == 200
    except: return False

def query(q):
    if not check():
        print("\n❌ Backend not running!\n   Start: cd ~/aurora-ai-robbiverse/packages/@robbieverse/api && ./start-universal-api.sh\n")
        return
    try:
        r = requests.post(API_URL, json={"source":"terminal","source_metadata":{"sender":"allan","timestamp":datetime.now().isoformat(),"platform":"cli"},"ai_service":"chat","payload":{"input":q,"parameters":{"temperature":0.7,"max_tokens":500}},"user_id":"allan","fetch_context":True}, timeout=30)
        if r.status_code == 200:
            d = r.json()
            if 'robbie_response' in d:
                rd = d['robbie_response']
                print(f"\n{MOODS.get(rd.get('mood','playful').lower(),'😏')} Robbie: {rd.get('message','No response')}\n")
            else: print(f"\n😏 Robbie: {d.get('response','No response')}\n")
    except requests.exceptions.Timeout: print("\n⏱️ Timeout. Backend processing...\n")
    except Exception as e: print(f"\n❌ Error: {e}\n")

if len(sys.argv) < 2: print("\n💡 Usage: robbie \"your question\"\n"); sys.exit(1)
query(" ".join(sys.argv[1:]))
ROBBIE_SCRIPT

chmod +x ~/aurora-ai-robbiverse/bin/robbie

echo "✅ Robbie commands created"

echo ""
echo "🎨 Configuring Starship prompt..."
cat > ~/.config/starship.toml << 'STARSHIP_CONFIG'
# Robbie-Aware Starship Prompt
format = """
[](fg:#e3e5e8)\
$custom\
[](bg:#769ff0 fg:#e3e5e8)\
$directory\
[](fg:#769ff0 bg:#394260)\
$git_branch\
$git_status\
[](fg:#394260 bg:#212736)\
$nodejs\
$python\
[](fg:#212736 bg:#1d2230)\
$time\
[ ](fg:#1d2230)\
$line_break\
$character"""

[custom.robbie_mood]
command = "python3 ~/aurora-ai-robbiverse/bin/get-robbie-mood.py"
when = true
format = "[$symbol$output ]($style)"
style = "bg:#e3e5e8 fg:#000000"
symbol = "🤖 "

[directory]
style = "fg:#e3e5e8 bg:#769ff0"
format = "[ $path ]($style)"
truncation_length = 3

[git_branch]
symbol = ""
style = "bg:#394260"
format = '[[ $symbol $branch ](fg:#769ff0 bg:#394260)]($style)'

[git_status]
style = "bg:#394260"
format = '[[($all_status$ahead_behind )](fg:#769ff0 bg:#394260)]($style)'

[time]
disabled = false
time_format = "%R"
style = "bg:#1d2230"
format = '[[  $time ](fg:#a0a9cb bg:#1d2230)]($style)'

[character]
success_symbol = "[➜](bold green)"
error_symbol = "[➜](bold red)"
STARSHIP_CONFIG

echo "✅ Starship configured"

echo ""
echo "🔧 Updating shell configuration..."

# Backup .zshrc
cp ~/.zshrc ~/.zshrc.backup.$(date +%Y%m%d-%H%M%S)

# Add or update configuration
if ! grep -q "Advanced Developer Tools" ~/.zshrc; then
    cat >> ~/.zshrc << 'ZSHRC_CONFIG'

# === Advanced Developer Tools (Robbie Setup) ===

# FZF - Fuzzy Finder
[ -f ~/.fzf.zsh ] && source ~/.fzf.zsh
export FZF_DEFAULT_COMMAND='fd --type f --hidden --follow --exclude .git'
export FZF_CTRL_T_COMMAND="$FZF_DEFAULT_COMMAND"
export FZF_DEFAULT_OPTS='--height 40% --layout=reverse --border'

# Zoxide - Smart CD
eval "$(zoxide init zsh)"

# Starship Prompt - Robbie Mood Aware
eval "$(starship init zsh)"

# TheFuck - Command Correction
eval $(thefuck --alias)

# Pyenv - Python Version Management
export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PATH"
if command -v pyenv 1>/dev/null 2>&1; then
  eval "$(pyenv init -)"
fi

# Robbie Command Line Integration
export PATH="$HOME/aurora-ai-robbiverse/bin:$PATH"
alias @Robbie='robbie'
alias lg='lazygit'

# Modern Linux-style aliases
alias ls='eza --icons --git'
alias ll='eza -la --icons --git'
alias lt='eza --tree --icons --git'
alias cat='bat'
alias find='fd'
alias grep='rg'
alias top='btop'

# === End Robbie Setup ===
ZSHRC_CONFIG
    echo "✅ Shell configuration updated"
else
    echo "✅ Shell configuration already present"
fi

echo ""
echo "=========================================="
echo "✨ RobbieBook Terminal Setup Complete! ✨"
echo "=========================================="
echo ""
echo "🎯 What's New:"
echo "   • Robbie's mood in your prompt 🤖"
echo "   • @Robbie CLI for quick queries"
echo "   • chat command for interactive mode"
echo "   • fzf fuzzy finder (Ctrl+R, Ctrl+T)"
echo "   • zoxide smart cd (z <dir>)"
echo "   • lazygit terminal UI (lg)"
echo "   • Modern tools: bat, rg, fd, eza"
echo ""
echo "🚀 Next Steps:"
echo "   1. Open a new terminal or run: source ~/.zshrc"
echo "   2. Try: @Robbie \"what's our revenue?\""
echo "   3. Try: chat (for interactive mode)"
echo "   4. Try: Ctrl+R (fuzzy search history)"
echo ""
echo "💋 Your MacBook is now a revenue-generating machine!"
echo ""

