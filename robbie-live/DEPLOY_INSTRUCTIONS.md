# Deploy Instructions - Robbie Live

## 🚀 One-Command Deploy

```bash
cd /home/allan/aurora-ai-robbiverse/robbie-live
./deploy.sh
```

That's it! Robbie Live will be at: **https://aurora.testpilot.ai/robbie-live/**

---

## What Gets Deployed

All files in `robbie-live/` folder:
- `index.html` - Main app
- `styles.css` - All styling
- `face-animation.js` - Animated face
- `node-router.js` - Smart backend routing
- `chat.js` - Chat + voice input
- `app.js` - Main controller
- `manifest.json` - PWA config
- `sw.js` - Service worker (offline)
- `icons/` - PWA icons

## Deploy Steps (What the Script Does)

1. **Creates remote directory** on aurora server
2. **Uploads all files** via SCP
3. **Sets permissions** (www-data:www-data)
4. **Tests nginx** configuration
5. **Reloads nginx** to serve new files

## Testing After Deploy

### Quick Test (from command line):
```bash
curl -I https://aurora.testpilot.ai/robbie-live/
# Should see: HTTP/2 200
```

### Full Test (in browser):
1. Open **https://aurora.testpilot.ai/robbie-live/**
2. Should see Robbie's animated face
3. Eyes should follow your cursor
4. Click 📊 Stats to see node status
5. Click 💬 Chat to test messaging
6. Try voice input (🎤 button in chat)

## Troubleshooting

### Deploy script fails
```bash
# Check SSH access
ssh root@aurora.testpilot.ai

# Check if directory exists
ssh root@aurora.testpilot.ai "ls -la /var/www/aurora.testpilot.ai/"
```

### 404 Not Found after deploy
```bash
# Check files were uploaded
ssh root@aurora.testpilot.ai "ls -la /var/www/aurora.testpilot.ai/robbie-live/"

# Check nginx config
ssh root@aurora.testpilot.ai "nginx -t"

# Check nginx is running
ssh root@aurora.testpilot.ai "systemctl status nginx"
```

### Nginx config needed
Add to `/etc/nginx/sites-available/robbie-apps`:

```nginx
server {
    listen 80;
    server_name aurora.testpilot.ai 155.138.194.222;
    
    root /var/www/aurora.testpilot.ai;
    index index.html;
    
    # Robbie Live
    location /robbie-live {
        alias /var/www/aurora.testpilot.ai/robbie-live;
        try_files $uri $uri/ /robbie-live/index.html =404;
        
        # Never cache index.html
        location = /robbie-live/index.html {
            add_header Cache-Control "no-cache, no-store, must-revalidate";
        }
    }
    
    # Other locations...
}
```

Then:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Testing Locally First

Before deploying, test locally:

```bash
cd /home/allan/aurora-ai-robbiverse/robbie-live
python3 -m http.server 8000

# Open: http://localhost:8000/
```

Make sure everything works locally before deploying to aurora.

## Update Deployment

To update after making changes:
```bash
# Just run deploy script again
./deploy.sh

# Files will be overwritten
# No need to restart anything (nginx auto-serves new files)
```

## Rollback

If something breaks:
```bash
# Remove the deployed version
ssh root@aurora.testpilot.ai "rm -rf /var/www/aurora.testpilot.ai/robbie-live"

# Redeploy from backup or previous version
./deploy.sh
```

---

**Ready?** Run `./deploy.sh` and Robbie goes live! 🎉


