#!/bin/bash
# Aurora-Town Bootstrap Script (Ubuntu 24.04 Noble Compatible)
# Run this on the Elestio aurora-town VM

set -euo pipefail

echo "🚀 AURORA-TOWN BOOTSTRAP DEPLOYMENT (Ubuntu 24.04)"
echo "=================================================="

# Configuration
AURORA_DB_HOST="aurora-postgres-u44170.vm.elestio.app"
AURORA_DB_PORT="25432"
AURORA_DB_NAME="aurora_unified"
AURORA_DB_USER="aurora_app"
AURORA_DB_PASSWORD="TestPilot2025_Aurora!"
S3_BUCKET="bguoh9kd1g"
S3_ENDPOINT="https://s3api-eur-is-1.runpod.io"

echo "✅ Starting Aurora-Town bootstrap deployment..."
echo ""

# 1. Update system and install available packages
echo "📦 Installing base packages..."
apt-get update -y
apt-get install -y \
    curl wget git vim htop unzip \
    nginx docker.io \
    postgresql-client \
    python3 python3-pip python3-venv \
    nodejs npm \
    cron rsync jq \
    build-essential \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release

# 2. Install UFW (if not available, use iptables)
echo "🔥 Configuring firewall..."
if apt-get install -y ufw 2>/dev/null; then
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 3000/tcp
    ufw allow 9090/tcp
    ufw allow 3001/tcp
    ufw --force enable
    echo "✅ UFW firewall configured"
else
    echo "⚠️ UFW not available, using iptables..."
    # Basic iptables rules
    iptables -F
    iptables -P INPUT DROP
    iptables -P FORWARD DROP
    iptables -P OUTPUT ACCEPT
    iptables -A INPUT -i lo -j ACCEPT
    iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
    iptables -A INPUT -p tcp --dport 22 -j ACCEPT
    iptables -A INPUT -p tcp --dport 80 -j ACCEPT
    iptables -A INPUT -p tcp --dport 443 -j ACCEPT
    iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
    iptables -A INPUT -p tcp --dport 9090 -j ACCEPT
    iptables -A INPUT -p tcp --dport 3001 -j ACCEPT
    echo "✅ iptables firewall configured"
fi

# 3. Install fail2ban (if available)
echo "🛡️ Installing fail2ban..."
if apt-get install -y fail2ban 2>/dev/null; then
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
    echo "✅ fail2ban configured"
else
    echo "⚠️ fail2ban not available, skipping..."
fi

# 4. Install Prometheus manually
echo "📊 Installing Prometheus..."
PROM_VERSION="2.47.2"
cd /tmp
wget https://github.com/prometheus/prometheus/releases/download/v${PROM_VERSION}/prometheus-${PROM_VERSION}.linux-amd64.tar.gz
tar xvf prometheus-${PROM_VERSION}.linux-amd64.tar.gz
cp prometheus-${PROM_VERSION}.linux-amd64/prometheus /usr/local/bin/
cp prometheus-${PROM_VERSION}.linux-amd64/promtool /usr/local/bin/
mkdir -p /etc/prometheus /var/lib/prometheus
chown -R nobody:nogroup /etc/prometheus /var/lib/prometheus

# 5. Install Node Exporter manually
echo "📊 Installing Node Exporter..."
NODE_EXP_VERSION="1.6.1"
cd /tmp
wget https://github.com/prometheus/node_exporter/releases/download/v${NODE_EXP_VERSION}/node_exporter-${NODE_EXP_VERSION}.linux-amd64.tar.gz
tar xvf node_exporter-${NODE_EXP_VERSION}.linux-amd64.tar.gz
cp node_exporter-${NODE_EXP_VERSION}.linux-amd64/node_exporter /usr/local/bin/

# 6. Install Grafana
echo "📈 Installing Grafana..."
wget -q -O - https://packages.grafana.com/gpg.key | gpg --dearmor > /usr/share/keyrings/grafana.gpg
echo "deb [signed-by=/usr/share/keyrings/grafana.gpg] https://packages.grafana.com/oss/deb stable main" > /etc/apt/sources.list.d/grafana.list
apt-get update
apt-get install -y grafana

# 7. Configure Prometheus
echo "⚙️ Configuring Prometheus..."
cat > /etc/prometheus/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'aurora-town'
    static_configs:
      - targets: ['localhost:3000']

  - job_name: 'aurora-backend'
    static_configs:
      - targets: ['localhost:8000']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']

  - job_name: 'nginx'
    static_configs:
      - targets: ['localhost:80']
EOF

# 8. Create systemd services
echo "🔧 Creating systemd services..."

# Prometheus service
cat > /etc/systemd/system/prometheus.service << 'EOF'
[Unit]
Description=Prometheus
Wants=network-online.target
After=network-online.target

[Service]
User=nobody
Group=nogroup
Type=simple
ExecStart=/usr/local/bin/prometheus \
    --config.file /etc/prometheus/prometheus.yml \
    --storage.tsdb.path /var/lib/prometheus/ \
    --web.console.templates=/etc/prometheus/consoles \
    --web.console.libraries=/etc/prometheus/console_libraries \
    --web.listen-address=0.0.0.0:9090 \
    --web.enable-lifecycle

[Install]
WantedBy=multi-user.target
EOF

# Node Exporter service
cat > /etc/systemd/system/node_exporter.service << 'EOF'
[Unit]
Description=Node Exporter
Wants=network-online.target
After=network-online.target

[Service]
User=nobody
Group=nogroup
Type=simple
ExecStart=/usr/local/bin/node_exporter

[Install]
WantedBy=multi-user.target
EOF

# 9. Download and restore Aurora repository
echo "📦 Restoring Aurora repository..."
mkdir -p /opt/aurora
cd /opt/aurora

# Download latest git bundle
LATEST_BUNDLE=$(aws s3 ls s3://$S3_BUCKET/backups/git/ --endpoint-url $S3_ENDPOINT | tail -1 | awk '{print $4}')
if [ -n "$LATEST_BUNDLE" ]; then
    aws s3 cp s3://$S3_BUCKET/backups/git/$LATEST_BUNDLE . --endpoint-url $S3_ENDPOINT
    git clone $LATEST_BUNDLE aurora
    cd aurora
    echo "✅ Aurora repository restored"
else
    echo "❌ No git bundle found"
    exit 1
fi

# 10. Install Python dependencies
echo "🐍 Installing Python dependencies..."
cd /opt/aurora/aurora
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install fastapi uvicorn psycopg2-binary prometheus-client requests aiohttp

# 11. Install Node.js dependencies (if package.json exists)
echo "📦 Installing Node.js dependencies..."
if [ -f package.json ]; then
    npm install
fi

# 12. Configure environment
echo "⚙️ Configuring environment..."
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

# 13. Test database connectivity
echo "🔍 Testing database connectivity..."
source venv/bin/activate
python3 -c "import psycopg2; conn=psycopg2.connect(host='$AURORA_DB_HOST', port=$AURORA_DB_PORT, dbname='$AURORA_DB_NAME', user='$AURORA_DB_USER', password='$AURORA_DB_PASSWORD', sslmode='require'); print('✅ Database connected'); conn.close()"

# 14. Configure Nginx reverse proxy
echo "🌐 Configuring Nginx..."
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

# 15. Create Aurora backend service
echo "🔧 Creating Aurora backend service..."
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
EnvironmentFile=/opt/aurora/aurora/.env

[Install]
WantedBy=multi-user.target
EOF

# 16. Configure Grafana
echo "📈 Configuring Grafana..."
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

# 17. Enable and start all services
echo "🚀 Starting services..."
systemctl daemon-reload

# Start infrastructure services
systemctl enable --now prometheus
systemctl enable --now node_exporter
systemctl enable --now grafana-server
systemctl enable --now nginx

# Start Aurora services
systemctl enable --now aurora-backend

# 18. Create backup script
echo "💾 Setting up backups..."
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

echo "$(date): Aurora-Town backup completed" >> /var/log/aurora-backup.log
EOF

chmod +x /opt/aurora/backup-aurora-town.sh
(crontab -l 2>/dev/null; echo "0 4 * * * /opt/aurora/backup-aurora-town.sh") | crontab -

# 19. Final status check
echo ""
echo "✅ AURORA-TOWN BOOTSTRAP COMPLETE!"
echo ""
echo "📊 Services Status:"
for service in prometheus node_exporter grafana-server nginx aurora-backend; do
    if systemctl is-active --quiet $service; then
        echo "  ✅ $service: active"
    else
        echo "  ❌ $service: inactive"
    fi
done

echo ""
echo "🌐 Access Points:"
echo "• Aurora-Town: http://$(curl -s ifconfig.me)"
echo "• Prometheus: http://$(curl -s ifconfig.me):9090"
echo "• Grafana: http://$(curl -s ifconfig.me):3001"
echo "• Aurora Backend: http://$(curl -s ifconfig.me):8000"
echo ""
echo "🔗 Database Connection:"
echo "• Host: $AURORA_DB_HOST:$AURORA_DB_PORT"
echo "• Database: $AURORA_DB_NAME"
echo "• Status: Connected"
echo ""
echo "🎉 TestPilot Simulations Aurora-Town is operational!"
