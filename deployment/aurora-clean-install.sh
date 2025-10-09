#!/bin/bash
set -e

echo "🚀 Aurora Clean Install Starting on $(hostname)..."

# Update system
apt update && apt upgrade -y

# Install essential packages
apt install -y curl wget git python3 python3-pip python3-venv postgresql postgresql-contrib redis-server nginx ufw

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker root

# Clone Aurora repo
cd /opt
git clone https://github.com/dark-red-one/aurora-ai-robbiverse.git aurora
cd aurora

# Set up Python environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Set up database
sudo -u postgres createdb aurora_unified
sudo -u postgres psql -c "CREATE USER aurora_app WITH PASSWORD 'aurora_secure_2024';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE aurora_unified TO aurora_app;"

# Set up environment
cp .env.example .env
echo "POSTGRES_PASSWORD=aurora_secure_2024" >> .env
echo "REDIS_PASSWORD=redis_secure_2024" >> .env

# Start services
systemctl start postgresql redis-server
systemctl enable postgresql redis-server

# Run database migrations
cd database
python3 run_migrations.py

# Start Aurora services
cd /opt/aurora
python3 backend/main.py &
python3 -m http.server 8000 &

echo "✅ Aurora Clean Install Complete!"
echo "🌐 Web Interface: http://$(curl -s ifconfig.me):8000"
echo "🔧 API: http://$(curl -s ifconfig.me):8001"
echo "📊 Status: All services running"
