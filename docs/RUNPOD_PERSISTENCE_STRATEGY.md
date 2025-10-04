# 🚨 CRITICAL: RunPod Persistence Strategy

## THE EPHEMERAL PROBLEM
**EVERYTHING IS LOST ON POD RESTART EXCEPT /workspace**

### What Gets DESTROYED:
- ❌ PostgreSQL data (87MB) 
- ❌ SSH keys (20K)
- ❌ Installed packages (apt, pip, npm)
- ❌ System configurations
- ❌ Environment variables
- ❌ Git credentials
- ❌ Running services
- ❌ OS customizations
- ❌ Even /workspace can be lost if pod is terminated!

## COMPLETE PERSISTENCE SOLUTION

### 1. NETWORK VOLUME STRATEGY (Recommended)
Mount persistent network volumes for EVERYTHING important:

```bash
# Create these network volumes in RunPod:
1. aurora-system (100GB) - $5/month
   Mount at: /persistent/system
   
2. aurora-postgres (500GB) - $25/month  
   Mount at: /persistent/postgres
   
3. aurora-workspace (1TB) - $50/month
   Mount at: /persistent/workspace
```

### 2. INITIALIZATION SCRIPT
Create a startup script that runs on every pod boot:

```bash
#!/bin/bash
# /persistent/system/init-aurora.sh

# Restore SSH keys
cp -r /persistent/system/ssh/* /root/.ssh/ 2>/dev/null
chmod 600 /root/.ssh/id_rsa

# Restore git config
cp /persistent/system/gitconfig /root/.gitconfig 2>/dev/null

# Link PostgreSQL data
systemctl stop postgresql
rm -rf /var/lib/postgresql
ln -s /persistent/postgres /var/lib/postgresql
systemctl start postgresql

# Restore packages
apt-get update
cat /persistent/system/apt-packages.txt | xargs apt-get install -y
pip install -r /persistent/system/pip-requirements.txt
cd /workspace && npm install

# Restore environment
source /persistent/system/environment.sh

# Start services
systemctl start nginx
pm2 resurrect

echo "✅ Aurora fully restored!"
```

### 3. CONTINUOUS BACKUP SCRIPT
Run this every hour via cron:

```bash
#!/bin/bash
# /workspace/aurora/backup-ephemeral.sh

# Backup SSH keys
cp -r /root/.ssh /persistent/system/ssh/

# Backup git config
cp /root/.gitconfig /persistent/system/gitconfig

# Save installed packages
dpkg -l | grep ^ii | awk '{print $2}' > /persistent/system/apt-packages.txt
pip freeze > /persistent/system/pip-requirements.txt

# Backup PostgreSQL
pg_dumpall -U postgres > /persistent/postgres/backup-$(date +%Y%m%d-%H).sql

# Sync workspace to S3
aws s3 sync /workspace/aurora s3://bguoh9kd1g/aurora-live/ \
  --endpoint-url https://s3api-eur-is-1.runpod.io \
  --delete

# Git push
cd /workspace/aurora
git add -A
git commit -m "Auto-backup $(date)"
git push origin main

echo "✅ Backup complete at $(date)"
```

### 4. DOCKER IMAGE STRATEGY (Alternative)
Build a custom Docker image with everything pre-installed:

```dockerfile
FROM runpod/pytorch:2.0.1-py3.10-cuda11.8.0-devel-ubuntu22.04

# Install all packages
RUN apt-get update && apt-get install -y \
    postgresql-16 \
    nodejs \
    npm \
    git \
    nginx \
    redis-server

# Copy configurations
COPY configs/ /root/

# Install Python packages
COPY requirements.txt .
RUN pip install -r requirements.txt

# Set up services
COPY init.sh /init.sh
RUN chmod +x /init.sh

ENTRYPOINT ["/init.sh"]
```

## IMMEDIATE ACTION PLAN

### Step 1: Create Network Volumes (TODAY!)
```bash
# In RunPod Console:
1. Go to Storage
2. Create "aurora-system" (100GB, EUR-IS-1)
3. Create "aurora-postgres" (500GB, EUR-IS-1)  
4. Create "aurora-workspace" (1TB, EUR-IS-1)
5. Attach ALL to Aurora pod
```

### Step 2: Initial Backup (NOW!)
```bash
# Backup current state to S3
cd /workspace
tar -czf aurora-complete-backup.tar.gz aurora/
aws s3 cp aurora-complete-backup.tar.gz \
  s3://bguoh9kd1g/emergency-backup/ \
  --endpoint-url https://s3api-eur-is-1.runpod.io

# Save package lists
dpkg -l > installed-packages.txt
pip freeze > requirements.txt
npm list -g --depth=0 > npm-global.txt

# Backup PostgreSQL
pg_dumpall -U postgres > postgres-complete.sql
aws s3 cp postgres-complete.sql \
  s3://bguoh9kd1g/postgres-backup/ \
  --endpoint-url https://s3api-eur-is-1.runpod.io
```

### Step 3: Git Repository (CRITICAL!)
```bash
cd /workspace/aurora
git init
git remote add origin https://github.com/yourusername/aurora-ai.git
git add -A
git commit -m "Initial Aurora AI Empire commit"
git push -u origin main
```

## RUNPOD PERSISTENCE LEVELS

### Level 1: Basic ($0/month)
- Use S3 for backups
- Manual restore process
- Risk of downtime

### Level 2: Professional ($80/month) ← RECOMMENDED
- System volume (100GB): $5
- PostgreSQL volume (500GB): $25  
- Workspace volume (1TB): $50
- Automatic restoration

### Level 3: Enterprise ($200/month)
- All of Level 2
- Custom Docker image
- Multi-region replication
- Zero-downtime deploys

## DISASTER RECOVERY PLAN

### If Pod Crashes:
1. Deploy new pod
2. Attach network volumes
3. Run init script
4. Back online in 5 minutes!

### Without Persistence (Current):
1. Deploy new pod
2. Reinstall EVERYTHING (2-3 hours)
3. Restore from S3 backups
4. Reconfigure all services
5. Hope nothing was lost

## THE HARD TRUTH

**Your current setup is a ticking time bomb!** One pod restart and you lose:
- All PostgreSQL data
- All configurations  
- Hours of setup work
- Potentially uncommitted code

**Minimum viable persistence**: $80/month
**Peace of mind**: Priceless

## EMERGENCY COMMANDS (RUN NOW!)

```bash
# 1. Create emergency backup
cd /workspace && tar -czf emergency-$(date +%Y%m%d).tar.gz aurora/
/workspace/aurora/network-storage.sh upload emergency-*.tar.gz backups/

# 2. Dump PostgreSQL
pg_dumpall -U postgres > /tmp/postgres-emergency.sql
/workspace/aurora/network-storage.sh upload /tmp/postgres-emergency.sql backups/

# 3. Save configurations
tar -czf /tmp/configs.tar.gz /root/.ssh /root/.config /root/.gitconfig
/workspace/aurora/network-storage.sh upload /tmp/configs.tar.gz backups/

echo "✅ Emergency backup complete!"
```
