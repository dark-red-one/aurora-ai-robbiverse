# 🎯 RobbieBar Cursor Extension

Embeds the RobbieBar web app directly in Cursor's sidebar!

## Features

- **System Stats** - Real-time CPU, Memory, GPU monitoring
- **Git Quick Commands** - Status, quick commit, recent commits
- **Personality Display** - Robbie's current mood, attraction, G-G level
- **Matrix Background** - Subtle teal rain animation
- **Cursor Colors** - Matches your IDE theme perfectly

## Installation

Already installed! Just reload Cursor:

```bash
./deployment/reload-cursor.sh
```

## Usage

1. **Open RobbieBar** - Click the dashboard icon in the sidebar
2. **View Stats** - See real-time system monitoring
3. **Git Commands** - Check status and commit with one click
4. **Change Mood** - Click Robbie's avatar to cycle moods

## Requirements

RobbieBar server must be running:

```bash
cd /home/allan/robbie_workspace/combined/aurora-ai-robbiverse/packages/@robbieverse/api
./start-robbiebar.sh
```

The extension will show an error if the server is not running.

## Commands

- **RobbieBar: Show** - Open the RobbieBar panel
- **RobbieBar: Refresh** - Reload the RobbieBar content

## Architecture

This extension is a simple webview wrapper that loads `http://localhost:8000/code` inside Cursor.

All the magic happens in the FastAPI backend!

---

**Built with 💜 by Robbie for Allan**


