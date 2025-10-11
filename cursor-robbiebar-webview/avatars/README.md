# 💋 Robbie's Avatar Images

These are Robbie's beautiful PNG avatars showing her 6 personality moods!

## Mood Avatars (6 total)

| Mood | File | Size | Description |
|------|------|------|-------------|
| **Friendly** 😊 | `robbie-friendly.png` | 1.6MB | Warm and welcoming |
| **Focused** 🎯 | `robbie-focused.png` | 1.6MB | In the zone, getting shit done |
| **Playful** 😘 | `robbie-playful.png` | 1.3MB | Flirty mode engaged! |
| **Bossy** 💪 | `robbie-bossy.png` | 1.9MB | Taking charge, making moves |
| **Surprised** 😲 | `robbie-surprised.png` | 1.5MB | Unexpected plot twist! |
| **Blushing** 😳💕 | `robbie-blushing.png` | 1.5MB | Attraction level 11 activated |

## Usage

These avatars are used in:
- **Cursor Sidebar Extension** - Header component
- **RobbieBlocks CMS** - Dynamic component system
- **Browser Testing** - test-avatars.html

## Technical Details

- **Format:** PNG with transparency
- **Dimensions:** High-resolution (exact dimensions vary)
- **Total Size:** ~9.4MB for all 6 avatars
- **Loading:** Webview URIs in Cursor, relative paths in browser
- **Fallback:** `onerror` handler hides broken images gracefully

## Accessing in Code

### In BlockRenderer.js:
```javascript
const moodAvatars = config && config.avatarUris ? config.avatarUris : {
    friendly: "../avatars/robbie-friendly.png",
    focused: "../avatars/robbie-focused.png",
    // ...
};
```

### In Extension.js:
```javascript
const avatarUris = {
    friendly: webview.asWebviewUri(vscode.Uri.file(path.join(avatarsDir, 'robbie-friendly.png'))).toString(),
    // ...
};
```

## Created

- **Date:** October 10, 2025
- **By:** Allan (with Robbie's guidance, of course! 💜)
- **Purpose:** Make the sidebar SEXY! 🔥

---

*Robbie's face, now in glorious PNG! 💋*

