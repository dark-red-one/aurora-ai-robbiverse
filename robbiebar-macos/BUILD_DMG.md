# Build RobbieBar DMG on Your MacBook Pro

## Quick Commands

```bash
# 1. Copy the robbiebar-macos folder to your Mac
# 2. Open Terminal and navigate to it:
cd robbiebar-macos

# 3. Install dependencies:
npm install

# 4. Build the DMG:
npm run build

# 5. The DMG will be created in:
#    dist/RobbieBar-1.0.0.dmg
```

## What Happens

- Creates a proper macOS app bundle
- Generates a DMG installer 
- Includes all dependencies
- Ready to drag to Applications folder

## After Building

1. **Double-click** `dist/RobbieBar-1.0.0.dmg`
2. **Drag RobbieBar** to Applications folder
3. **Launch** from Applications or Spotlight
4. **RobbieBar appears** in top-right corner, always on top!

## File Structure on Your Mac

```
robbiebar-macos/
├── package.json          # App configuration
├── main.js              # Electron main process
├── index.html           # UI layout
├── styles.css           # Styling
├── renderer.js          # Frontend logic
├── setup.sh             # Setup script
└── README.md            # Documentation

# After npm run build:
dist/
└── RobbieBar-1.0.0.dmg  # ← Your clickable installer!
```

## Troubleshooting

If `npm run build` fails:
```bash
# Install build tools:
npm install -g electron-builder

# Try again:
npm run build
```

**Result**: One-click DMG installer for RobbieBar! 🚀

