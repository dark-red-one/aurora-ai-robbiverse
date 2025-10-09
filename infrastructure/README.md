# Infrastructure - Keep It Simple

**One docker-compose. One nginx config. No VPN chaos. No complex routing.**

## What's Here

### `docker/docker-compose.yml`

**THE ONLY docker config you need.**

Services:

- **Postgres** (with pgvector) on `127.0.0.1:5432`
- **Redis** (for caching) on `127.0.0.1:6379`

Both bound to localhost only - secure by default.

```bash
# Start everything
cd infrastructure/docker
docker-compose up -d

# Check status
docker-compose ps

# Watch logs
docker-compose logs -f postgres

# Stop everything
docker-compose down

# Fresh start (wipes data!)
docker-compose down -v
docker-compose up -d
```

### `nginx/nginx.conf.template`

**Simple reverse proxy template.**

- TestPilot CPG → `127.0.0.1:8000` (FastAPI)
- LeadershipQuotes → `127.0.0.1:8001` (FastAPI)
- SSL via Let's Encrypt
- WebSocket support for chat
- Security headers included

Install:

```bash
# Copy to nginx
sudo cp nginx/nginx.conf.template /etc/nginx/sites-available/robbieverse
sudo ln -s /etc/nginx/sites-available/robbieverse /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## No More

❌ **No VPN setup** - Use SSH tunneling for remote access  
❌ **No complex routing** - Just proxy to localhost  
❌ **No multiple docker-compose files** - One file, period  
❌ **No 0.0.0.0 bindings** - Everything localhost except nginx  
❌ **No exposed services** - Only FastAPI via nginx  

## Remote Access (The Right Way)

Instead of VPN, use SSH tunneling:

```bash
# From your laptop, tunnel to server
ssh -L 5432:localhost:5432 -L 8000:localhost:8000 user@server

# Now access locally:
# - Postgres: localhost:5432
# - FastAPI: localhost:8000
```

Clean. Simple. Secure.

---

**Built with love (and no bullshit) by Robbie** 💜
