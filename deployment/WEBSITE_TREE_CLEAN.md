# 🧹 WEBSITE TREE - PRODUCTION CLEAN

**Date**: October 8, 2025  
**Status**: ✅ CLEAN & ORGANIZED

---

## 📁 Current Production Structure

```
/var/www/
├── ARCHIVE/                          # All old/test files
│   ├── 20251008/
│   │   ├── test.html                 # JS console test (archived)
│   │   ├── status                    # Old status dashboard (archived)
│   │   ├── aurora-chat-app/          # Old chat app (port 8090 - killed)
│   │   └── html/                     # Default nginx files
│   ├── aurora.testpilot.ai.backup.20251008-041328/
│   └── aurora.testpilot.ai.backup.20251008-072425/
│
└── aurora.testpilot.ai/              # PRODUCTION (ONLY THIS MATTERS)
    ├── index.html                    # Homepage with app selector
    ├── code/                         # Robbie@Code app
    │   ├── index.html
    │   └── assets/
    ├── work/                         # Robbie@Work app [TODO]
    └── play/                         # Robbie@Play app [TODO]
```

---

## ✅ What's CLEAN Now

**Production directory** (`/var/www/aurora.testpilot.ai/`):
- ✅ Homepage (index.html) - 9.8KB
- ✅ Robbie@Code (/code/) - 9.5MB React app
- ✅ NO test files
- ✅ NO backup cruft
- ✅ NO legacy services
- ✅ Clean, simple, production-ready

**Archived** (`/var/www/ARCHIVE/`):
- 📦 test.html (JS debugging file)
- 📦 status dashboard (old HTML)
- 📦 aurora-chat-app (old service on port 8090)
- 📦 Default nginx html directory
- 📦 Two backup directories from earlier today

---

## 🎯 What Each Directory Does

### `/var/www/aurora.testpilot.ai/` - PRODUCTION
**Purpose**: Live website served by nginx on port 80

**URL Mapping**:
```
http://aurora.testpilot.ai/        → index.html (homepage)
http://aurora.testpilot.ai/code/   → Robbie@Code React app
http://aurora.testpilot.ai/work/   → Robbie@Work [TODO]
http://aurora.testpilot.ai/play/   → Robbie@Play [TODO]
```

**Owner**: `www-data:www-data` (nginx user)

### `/var/www/ARCHIVE/` - ARCHIVED
**Purpose**: Old/test files kept for reference

**Never served by nginx** - just storage

---

## 🚀 Deployment Workflow

### Adding New Apps
```bash
# 1. Build React app
cd /home/allan/aurora-ai-robbiverse/robbie-work
npm run build

# 2. Deploy to website
sudo mkdir -p /var/www/aurora.testpilot.ai/work
sudo cp -r dist/* /var/www/aurora.testpilot.ai/work/
sudo chown -R www-data:www-data /var/www/aurora.testpilot.ai/work

# 3. Nginx already configured for /work (see config)

# 4. Test
curl -I http://aurora.testpilot.ai/work/
```

### Homepage Updates
```bash
# Update homepage
sudo cp /home/allan/aurora-ai-robbiverse/robbie-home/index.html /var/www/aurora.testpilot.ai/
sudo chown www-data:www-data /var/www/aurora.testpilot.ai/index.html
```

---

## 🔍 Verification Commands

```bash
# Check website structure
sudo ls -lah /var/www/aurora.testpilot.ai/

# Check deployed apps
sudo du -sh /var/www/aurora.testpilot.ai/*

# Verify permissions
sudo find /var/www/aurora.testpilot.ai -type f -not -user www-data

# Test URLs
curl -I http://aurora.testpilot.ai/
curl -I http://aurora.testpilot.ai/code/
curl -I http://aurora.testpilot.ai/work/
curl -I http://aurora.testpilot.ai/play/
```

---

## 📝 Nginx Configuration

**File**: `/etc/nginx/sites-available/robbie-apps`

**Static Routes**:
```nginx
root /var/www/aurora.testpilot.ai;

location = / {
    try_files /index.html =404;
}

location /code {
    try_files $uri $uri/index.html =404;
}

location /work {
    try_files $uri $uri/index.html =404;
}

location /play {
    try_files $uri $uri/index.html =404;
}
```

---

## 🧹 Cleanup Rules

**NEVER put in production directory:**
- test*.html files
- *.backup files
- *.old files
- Random Python scripts
- Database files
- Credentials/secrets
- node_modules

**Archive instead:**
```bash
sudo mv /var/www/aurora.testpilot.ai/cruft.html /var/www/ARCHIVE/$(date +%Y%m%d)/
```

---

## 📊 Current State

**Production Files**: 2 (index.html + code/)  
**Archive Files**: All test/old stuff  
**Permissions**: ✅ All www-data  
**Nginx**: ✅ Serving correctly  
**Security**: ✅ Clean attack surface  

---

## 🎯 Next Deployments

When deploying Robbie@Work or Robbie@Play:

```bash
# Build
cd /home/allan/aurora-ai-robbiverse/robbie-{work|play}
npm run build

# Deploy
sudo mkdir -p /var/www/aurora.testpilot.ai/{work|play}
sudo cp -r dist/* /var/www/aurora.testpilot.ai/{work|play}/
sudo chown -R www-data:www-data /var/www/aurora.testpilot.ai/{work|play}

# Test
curl -I http://aurora.testpilot.ai/{work|play}/
```

**Nginx already configured** - no changes needed!

---

**Clean. Simple. Production-ready.** 🚀

**Last Updated**: October 8, 2025 @ 08:15 UTC



