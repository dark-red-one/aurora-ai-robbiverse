# 🏗️ Network Volume Setup Guide

## ✅ Emergency Backup Complete!
- **Aurora Code**: `aurora-20250919-214819.tar.gz` → S3 ✅
- **PostgreSQL**: `postgres-20250919-214827.sql` → S3 ✅  
- **Configs**: `configs-20250919-214835.tar.gz` → S3 ✅

## 🎯 Next Steps: Create Network Volumes

### 1. PostgreSQL Persistent Volume (URGENT)
**Go to RunPod → Storage → Create Volume:**
- **Name**: `aurora-postgres`
- **Size**: 500GB
- **Region**: EUR-IS-1 (Iceland)
- **Cost**: $25/month
- **Mount Point**: `/persistent/postgres`

### 2. System Configuration Volume
**Go to RunPod → Storage → Create Volume:**
- **Name**: `aurora-system` 
- **Size**: 100GB
- **Region**: EUR-IS-1 (Iceland)
- **Cost**: $5/month
- **Mount Point**: `/persistent/system`

### 3. Workspace Volume (Optional)
**Go to RunPod → Storage → Create Volume:**
- **Name**: `aurora-workspace`
- **Size**: 1TB
- **Region**: EUR-IS-1 (Iceland)  
- **Cost**: $50/month
- **Mount Point**: `/persistent/workspace`

## 🚀 After Creating Volumes

Run this script to migrate everything to persistent storage:

```bash
/persistent/system/aurora-migrate-to-persistent.sh
```

## 💰 Total Cost: $80/month
- PostgreSQL: $25
- System: $5  
- Workspace: $50
- Current 4TB: $200
- **Total**: $280/month for bulletproof persistence

## 🔄 Auto-Backup Setup
Once volumes are mounted, we'll set up hourly backups so you NEVER lose data again!
