# 🔥 VENGEANCE LINUX MIGRATION - STEP BY STEP

## WHAT I'VE PREPARED FOR YOU:
✅ `vengeance-migration-backup.sh` - Minimal backup (bookmarks/passwords)
✅ `vengeance-linux-setup.sh` - Complete Linux dev environment setup
✅ `cursor-linux-install.sh` - Cursor installation for Linux
✅ Aurora cloud workspace stays untouched

## WHAT YOU NEED TO DO (I CAN'T DO THESE):

### STEP 1: DOWNLOAD SCRIPTS TO VENGEANCE
Copy these files from Aurora to your Windows machine:
- `vengeance-migration-backup.sh`
- `vengeance-linux-setup.sh` 
- `cursor-linux-install.sh`

### STEP 2: BACKUP (Run in WSL/Git Bash on Windows)
```bash
./vengeance-migration-backup.sh
```

### STEP 3: INSTALL UBUNTU 22.04 LTS
- Download: https://ubuntu.com/download/desktop
- Create bootable USB
- Boot from USB, install Ubuntu (format drive)

### STEP 4: RUN SETUP ON NEW LINUX SYSTEM
```bash
./vengeance-linux-setup.sh
```

### STEP 5: INSTALL CURSOR
```bash
./cursor-linux-install.sh
```

### STEP 6: RESTORE BOOKMARKS
```bash
cd /tmp/vengeance-essentials
./restore-bookmarks-linux.sh
```

### STEP 7: RECONNECT TO AURORA
- Launch Cursor
- Connect to SSH: `runpod-robbie`
- Open workspace: `/workspace/aurora`

## 🎯 RESULT:
Vengeance becomes Linux AI development beast, Aurora continues in cloud!
