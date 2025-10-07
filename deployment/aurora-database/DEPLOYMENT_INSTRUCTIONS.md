# Aurora Database Deployment Instructions

## Prerequisites
- Aurora Town server (45.32.194.172) must be online
- PostgreSQL 16+ with pgvector extension
- Database: aurora_unified
- User: postgres
- Password: fun2Gus!!!

## Deployment Steps

### 1. Connect to Aurora Town
```bash
ssh root@45.32.194.172
```

### 2. Install PostgreSQL (if not already installed)
```bash
apt update
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql
```

### 3. Install pgvector extension
```bash
apt install -y postgresql-16-pgvector
```

### 4. Create database and user
```bash
sudo -u postgres psql << 'SQL'
CREATE DATABASE aurora_unified;
CREATE USER aurora_user WITH PASSWORD 'aurora_password';
GRANT ALL PRIVILEGES ON DATABASE aurora_unified TO aurora_user;
\c aurora_unified;
GRANT ALL ON SCHEMA public TO aurora_user;
\q
SQL
```

### 5. Deploy schema
```bash
psql -h localhost -U postgres -d aurora_unified -f create-aurora-database.sql
```

### 6. Test connection
```bash
python3 connect-to-aurora-db.py
```

## Verification
- 15 tables created
- 12 indexes created
- 3 views created
- Initial data loaded
- Vector search enabled

## Files Included
- create-aurora-database.sql - Complete schema
- connect-to-aurora-db.py - Connection test
- init-aurora-database.sh - Automated deployment
