# RobbieBar macOS - Always On Top AI Companion

A sleek, always-on-top desktop app that displays Robbie's current mood, personality stats, and system information.

## Features

- **Always On Top**: Stays visible over all other apps
- **Real-time Mood Display**: Shows current mood with emoji and greeting
- **System Stats**: CPU, memory, and disk usage
- **Auto-updates**: Refreshes every 30 seconds from aurora.testpilot.ai
- **Compact Design**: 400x80px floating window
- **Click Controls**: Toggle always-on-top, close app
- **Mood Cycling**: Click emoji to cycle through moods (for testing)

## Installation

1. **Install Node.js** (if not already installed):
   ```bash
   # Using Homebrew
   brew install node
   ```

2. **Install dependencies**:
   ```bash
   cd robbiebar-macos
   npm install
   ```

3. **Run the app**:
   ```bash
   npm start
   ```

## Building for Distribution

```bash
npm run build
```

This creates a `.dmg` file in the `dist/` folder that you can distribute.

## Configuration

The app connects to `http://aurora.testpilot.ai/api/personality/status` for real-time data.

## Controls

- **📌 Toggle**: Turn always-on-top on/off
- **❌ Close**: Exit the app
- **🎯 Emoji**: Click to cycle through moods (testing)

## Window Behavior

- **Position**: Top-right corner of screen
- **Size**: 400x80 pixels
- **Always On Top**: Stays above all other windows
- **Frameless**: Clean, modern appearance
- **Transparent**: Subtle backdrop blur effect

## API Integration

Connects to Robbie's personality API for:
- Current mood (focused, playful, bossy, etc.)
- Attraction level (1-11)
- Gandhi-Genghis business mode (1-10)
- System stats (CPU, memory, disk)

Perfect for keeping Robbie's status visible while coding! 🚀
