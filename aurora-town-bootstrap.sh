#!/bin/bash
# Aurora-Town Bootstrap Script
# Run this on the Elestio aurora-town VM to set up everything

set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           AURORA-TOWN BOOTSTRAP DEPLOYMENT                   ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Configuration
AURORA_DB_HOST="aurora-postgres-u44170.vm.elestio.app"
AURORA_DB_PORT="25432"
AURORA_DB_NAME="aurora_unified"
AURORA_DB_USER="aurora_app"
AURORA_DB_PASSWORD="TestPilot2025_Aurora!"
S3_BUCKET="bguoh9kd1g"
S3_ENDPOINT="https://s3api-eur-is-1.runpod.io"

echo -e "${GREEN}✅ Starting Aurora-Town bootstrap deployment...${NC}"
echo ""

# 1. Update system and install base packages
echo -e "${YELLOW}📦 Installing base packages...${NC}"
apt-get update -y
apt-get install -y \
    curl wget git vim htop unzip \
    nginx docker.io docker-compose \
    postgresql-client redis-tools \
    python3 python3-pip python3-venv \
    nodejs npm \
    awscli \
    ufw fail2ban \
    prometheus node-exporter \
    cron rsync jq

# 2. Configure firewall
echo -e "${YELLOW}🔥 Configuring firewall...${NC}"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp  # Aurora app
ufw allow 9090/tcp  # Prometheus
ufw allow 3001/tcp  # Grafana
ufw --force enable

# 3. Configure fail2ban
echo -e "${YELLOW}🛡️ Configuring fail2ban...${NC}"
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
EOF

systemctl enable fail2ban
systemctl start fail2ban

# 4. Download and restore Aurora repository
echo -e "${YELLOW}📦 Restoring Aurora repository...${NC}"
mkdir -p /opt/aurora
cd /opt/aurora

# Configure AWS CLI (using RunPod credentials)
aws configure set aws_access_key_id user_32czBlDhal2Uzv3eMjp0V1dOGKT
aws configure set aws_secret_access_key rps_SNXUUDNJZY1O1NSRFQDSA7SG4E3A185HSS4NGJBA1grih9
aws configure set region eur-is-1

# Download latest git bundle
LATEST_BUNDLE=$(aws s3 ls s3://$S3_BUCKET/backups/git/ --endpoint-url $S3_ENDPOINT | tail -1 | awk '{print $4}')
if [ -n "$LATEST_BUNDLE" ]; then
    aws s3 cp s3://$S3_BUCKET/backups/git/$LATEST_BUNDLE . --endpoint-url $S3_ENDPOINT
    git clone $LATEST_BUNDLE aurora
    cd aurora
    echo -e "${GREEN}✅ Aurora repository restored${NC}"
else
    echo -e "${RED}❌ No git bundle found${NC}"
    exit 1
fi

# 5. Install Python dependencies
echo -e "${YELLOW}🐍 Installing Python dependencies...${NC}"
cd /opt/aurora/aurora
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r api-connectors/requirements.txt
pip install fastapi uvicorn psycopg2-binary prometheus-client

# 6. Install Node.js dependencies
echo -e "${YELLOW}📦 Installing Node.js dependencies...${NC}"
npm install

# 7. Configure environment
echo -e "${YELLOW}⚙️ Configuring environment...${NC}"
cat > .env << EOF
NODE_ENV=production
CITY=aurora
REGION=austin
AURORA_DB_HOST=$AURORA_DB_HOST
AURORA_DB_PORT=$AURORA_DB_PORT
AURORA_DB_NAME=$AURORA_DB_NAME
AURORA_DB_USER=$AURORA_DB_USER
AURORA_DB_PASSWORD=$AURORA_DB_PASSWORD
AURORA_DB_SSLMODE=require
S3_ENDPOINT=$S3_ENDPOINT
S3_BUCKET=$S3_BUCKET
EOF

# 8. Configure Prometheus
echo -e "${YELLOW}📊 Configuring Prometheus...${NC}"
mkdir -p /etc/prometheus
cat > /etc/prometheus/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'aurora-town'
    static_configs:
      - targets: ['localhost:3000']

  - job_name: 'aurora-postgres'
    static_configs:
      - targets: ['aurora-postgres-u44170.vm.elestio.app:9187']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']

  - job_name: 'aurora-backend'
    static_configs:
      - targets: ['localhost:8000']
EOF

# 9. Install and configure Grafana
echo -e "${YELLOW}📈 Installing Grafana...${NC}"
curl -fsSL https://packages.grafana.com/gpg.key | gpg --dearmor -o /usr/share/keyrings/grafana.gpg
echo "deb [signed-by=/usr/share/keyrings/grafana.gpg] https://packages.grafana.com/oss/deb stable main" | tee /etc/apt/sources.list.d/grafana.list
apt-get update
apt-get install -y grafana

# Configure Grafana
cat > /etc/grafana/grafana.ini << 'EOF'
[server]
http_port = 3001
domain = aurora-town.testpilot.ai

[security]
admin_user = allan
admin_password = TestPilot2025_Grafana!

[auth.anonymous]
enabled = false
EOF

# 10. Configure Nginx reverse proxy
echo -e "${YELLOW}🌐 Configuring Nginx...${NC}"
cat > /etc/nginx/sites-available/aurora-town << 'EOF'
server {
    listen 80;
    server_name aurora-town.testpilot.ai;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /prometheus/ {
        proxy_pass http://localhost:9090/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /grafana/ {
        proxy_pass http://localhost:3001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

ln -sf /etc/nginx/sites-available/aurora-town /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t

# 11. Create systemd services
echo -e "${YELLOW}🔧 Creating systemd services...${NC}"

# Aurora backend service
cat > /etc/systemd/system/aurora-backend.service << 'EOF'
[Unit]
Description=Aurora Backend API
After=network.target

[Service]
Type=exec
User=root
WorkingDirectory=/opt/aurora/aurora
Environment=PATH=/opt/aurora/aurora/venv/bin
ExecStart=/opt/aurora/aurora/venv/bin/python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Aurora frontend service
cat > /etc/systemd/system/aurora-frontend.service << 'EOF'
[Unit]
Description=Aurora Frontend
After=network.target aurora-backend.service

[Service]
Type=exec
User=root
WorkingDirectory=/opt/aurora/aurora
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 12. Enable and start services
echo -e "${YELLOW}🚀 Starting services...${NC}"
systemctl daemon-reload

# Start infrastructure services
systemctl enable --now prometheus
systemctl enable --now node-exporter
systemctl enable --now grafana-server
systemctl enable --now nginx

# Start Aurora services
systemctl enable --now aurora-backend
systemctl enable --now aurora-frontend

# 13. Test database connectivity
echo -e "${YELLOW}🔍 Testing database connectivity...${NC}"
PGPASSWORD="$AURORA_DB_PASSWORD" psql -h $AURORA_DB_HOST -p $AURORA_DB_PORT -U $AURORA_DB_USER -d $AURORA_DB_NAME -c "SELECT 'Aurora-Town connected to database!' as status;"

# 14. Create backup scripts
echo -e "${YELLOW}💾 Setting up backups...${NC}"
cat > /opt/aurora/backup-aurora-town.sh << 'EOF'
#!/bin/bash
set -euo pipefail
TS=$(date -u +%Y%m%dT%H%M%SZ)
BUCKET="bguoh9kd1g"
ENDPOINT="https://s3api-eur-is-1.runpod.io"

# Backup Aurora code
cd /opt/aurora
tar -czf /tmp/aurora-town-$TS.tar.gz aurora/
aws s3 cp /tmp/aurora-town-$TS.tar.gz s3://$BUCKET/backups/aurora-town/ --endpoint-url $ENDPOINT
rm -f /tmp/aurora-town-$TS.tar.gz

# Backup system configs
tar -czf /tmp/aurora-town-configs-$TS.tar.gz /etc/nginx/ /etc/prometheus/ /etc/grafana/ /opt/aurora/
aws s3 cp /tmp/aurora-town-configs-$TS.tar.gz s3://$BUCKET/backups/aurora-town/ --endpoint-url $ENDPOINT
rm -f /tmp/aurora-town-configs-$TS.tar.gz

echo "$(date): Aurora-Town backup completed" >> /var/log/aurora-backup.log
EOF

chmod +x /opt/aurora/backup-aurora-town.sh

# Add to crontab
(crontab -l 2>/dev/null; echo "0 4 * * * /opt/aurora/backup-aurora-town.sh") | crontab -

# 15. Final status check
echo ""
echo -e "${GREEN}✅ AURORA-TOWN BOOTSTRAP COMPLETE!${NC}"
echo ""
echo -e "${BLUE}📊 Services Status:${NC}"
systemctl is-active prometheus node-exporter grafana-server nginx aurora-backend aurora-frontend | while read status; do
    if [ "$status" = "active" ]; then
        echo -e "  ✅ Service active"
    else
        echo -e "  ❌ Service $status"
    fi
done

echo ""
echo -e "${BLUE}🌐 Access Points:${NC}"
echo "• Aurora-Town: http://aurora-town.testpilot.ai"
echo "• Prometheus: http://aurora-town.testpilot.ai/prometheus/"
echo "• Grafana: http://aurora-town.testpilot.ai/grafana/"
echo "• Admin UI: https://aurora-town-u44170.vm.elestio.app:443/"
echo ""
echo -e "${GREEN}🎉 TestPilot Simulations Aurora-Town is operational!${NC}"
