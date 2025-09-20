# 🍎 MacBook Vengeance Migration - Via Cursor

## METHOD 1: Use Cursor on Mac to Create Script

1. **Open Cursor on MacBook** (you're already connected to aurora-ai-robbiverse)

2. **Create new file** in Cursor: `vengeance-migration-mac.sh`

3. **Copy this content** into the file:

```bash
#!/bin/bash
echo "🍎 MacBook Vengeance Migration Control"
cd ~/Desktop
mkdir -p vengeance-migration
cd vengeance-migration

# Download Ubuntu ISO
echo "📥 Downloading Ubuntu 22.04 LTS..."
curl -L -o ubuntu-22.04.3-desktop-amd64.iso "https://releases.ubuntu.com/22.04/ubuntu-22.04.3-desktop-amd64.iso"

# Get Aurora migration scripts
echo "📥 Getting Aurora migration scripts..."
curl -L -o vengeance-migration-backup.sh "https://raw.githubusercontent.com/dark-red-one/aurora-ai-robbiverse/main/vengeance-migration-backup.sh"
curl -L -o vengeance-linux-setup.sh "https://raw.githubusercontent.com/dark-red-one/aurora-ai-robbiverse/main/vengeance-linux-setup.sh"
curl -L -o cursor-linux-install.sh "https://raw.githubusercontent.com/dark-red-one/aurora-ai-robbiverse/main/cursor-linux-install.sh"

chmod +x *.sh

echo "✅ Migration files ready in ~/Desktop/vengeance-migration/"
echo "🔥 Next: Create Ubuntu bootable USB"
echo "💿 Use Disk Utility or Balena Etcher"
```

4. **Save the file** on your Mac (Cursor will save it locally)

5. **Open Terminal on Mac** and run:
```bash
cd ~/Desktop
chmod +x vengeance-migration-mac.sh
./vengeance-migration-mac.sh
```

## METHOD 2: Even Simpler - Direct Terminal Commands

Just open Terminal on Mac and paste these one at a time:

```bash
cd ~/Desktop
mkdir -p vengeance-migration && cd vengeance-migration
curl -L -o ubuntu.iso "https://releases.ubuntu.com/22.04/ubuntu-22.04.3-desktop-amd64.iso"
```

Then create bootable USB and install Linux on Vengeance!
