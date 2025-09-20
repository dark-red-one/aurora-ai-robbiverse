#!/bin/bash
# EMERGENCY BACKUP - Simple and direct

echo "🚨 EMERGENCY BACKUP STARTING..."

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
S3_BUCKET="bguoh9kd1g"
S3_ENDPOINT="https://s3api-eur-is-1.runpod.io"

# 1. Backup Aurora code
echo "📦 Backing up Aurora codebase..."
cd /workspace
tar -czf /tmp/aurora-$TIMESTAMP.tar.gz aurora/
aws s3 cp /tmp/aurora-$TIMESTAMP.tar.gz s3://$S3_BUCKET/emergency/aurora-$TIMESTAMP.tar.gz --endpoint-url $S3_ENDPOINT
rm /tmp/aurora-$TIMESTAMP.tar.gz

# 2. Backup PostgreSQL  
echo "🗄️ Backing up PostgreSQL..."
pg_dumpall -U postgres -p 5432 > /tmp/postgres-$TIMESTAMP.sql
aws s3 cp /tmp/postgres-$TIMESTAMP.sql s3://$S3_BUCKET/emergency/postgres-$TIMESTAMP.sql --endpoint-url $S3_ENDPOINT
rm /tmp/postgres-$TIMESTAMP.sql

# 3. Backup SSH keys and configs
echo "🔑 Backing up configs..."
tar -czf /tmp/configs-$TIMESTAMP.tar.gz /root/.ssh /root/.gitconfig /root/.bashrc 2>/dev/null
aws s3 cp /tmp/configs-$TIMESTAMP.tar.gz s3://$S3_BUCKET/emergency/configs-$TIMESTAMP.tar.gz --endpoint-url $S3_ENDPOINT
rm /tmp/configs-$TIMESTAMP.tar.gz

# 4. Save package lists
echo "📋 Saving package lists..."
dpkg -l | grep ^ii | awk '{print $2}' > /tmp/apt-packages.txt
pip freeze > /tmp/pip-requirements.txt
aws s3 cp /tmp/apt-packages.txt s3://$S3_BUCKET/emergency/apt-packages-$TIMESTAMP.txt --endpoint-url $S3_ENDPOINT
aws s3 cp /tmp/pip-requirements.txt s3://$S3_BUCKET/emergency/pip-requirements-$TIMESTAMP.txt --endpoint-url $S3_ENDPOINT

echo ""
echo "✅ EMERGENCY BACKUP COMPLETE!"
echo "📍 Location: s3://$S3_BUCKET/emergency/*-$TIMESTAMP.*"
echo ""
echo "To restore later:"
echo "aws s3 ls s3://$S3_BUCKET/emergency/ --endpoint-url $S3_ENDPOINT"
