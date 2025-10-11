# 💋🔥 Universal Input API - Fault Tolerance & Monitoring 🔥💋

**Date:** October 10, 2025  
**Built by:** Robbie (with ultra-reliable mode activated!)  
**Status:** ✅ **PRODUCTION-READY WITH AUTO-RESTART**

---

## 🚀 **WHAT WE BUILT**

The Universal Input API now has **FULL FAULT TOLERANCE** with:

### ✅ **Auto-Restart Script** (`start-api.sh`)
- Automatic crash detection
- Auto-restart on failure
- Health check monitoring
- Comprehensive logging
- Max restart limits to prevent infinite loops

### ✅ **Application-Level Fault Tolerance**
- Global exception handler (catches ALL errors)
- Graceful startup/shutdown events
- Database connection error handling
- Degraded functionality mode (continues even if DB fails)
- Structured logging to file + console

### ✅ **Systemd Service** (for Linux deployment)
- Automatic restart on crash
- Starts on boot
- Integrated with system logging
- Resource limits and security hardening

---

## 📖 **USAGE GUIDE**

### **Basic Commands**

```bash
# Start the API
cd /Users/allanperetz/aurora-ai-robbiverse/packages/@robbieverse/api
./start-api.sh start

# Stop the API
./start-api.sh stop

# Restart the API
./start-api.sh restart

# Check status
./start-api.sh status

# View logs
./start-api.sh logs

# View errors
./start-api.sh errors

# Start with monitoring (auto-restart on crash)
./start-api.sh monitor
```

### **Monitoring Mode** (Recommended for Production)

```bash
# This runs the API with continuous monitoring
./start-api.sh monitor

# It will:
# - Start the API if not running
# - Check health every 10 seconds
# - Auto-restart if crashed
# - Auto-restart if not responding
# - Limit to 10 restarts to prevent infinite loops
```

### **Run in Background**

```bash
# Start monitoring in background
nohup ./start-api.sh monitor > /tmp/robbie-monitor.log 2>&1 &

# Check if it's running
ps aux | grep start-api.sh
```

---

## 📊 **LOGGING**

### **Log Files**
All logs are stored in `/Users/allanperetz/aurora-ai-robbiverse/logs/`:

- **`universal-api.log`** - All application logs (INFO, DEBUG)
- **`universal-api-errors.log`** - Error logs only (ERROR, CRITICAL)

### **Log Format**
```
[2025-10-10 16:30:47] 🚀 Starting Universal Input API...
[2025-10-10 16:30:50] ✅ API started (PID: 19062)
[2025-10-10 16:30:50] 💋 Health check: PASSED 🔥
```

### **Quick Log Commands**
```bash
# Tail all logs in real-time
tail -f /Users/allanperetz/aurora-ai-robbiverse/logs/universal-api.log

# Tail errors only
tail -f /Users/allanperetz/aurora-ai-robbiverse/logs/universal-api-errors.log

# Search for crashes
grep -i "crash\|error\|failed" /Users/allanperetz/aurora-ai-robbiverse/logs/universal-api.log

# Count restarts today
grep "$(date +%Y-%m-%d)" /Users/allanperetz/aurora-ai-robbiverse/logs/universal-api.log | grep -c "Restart attempt"
```

---

## 🔧 **FAULT TOLERANCE FEATURES**

### **1. Global Exception Handler**
Catches ALL unhandled exceptions to prevent crashes:

```python
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"❌ Unhandled exception: {exc}", exc_info=True)
    return {
        "error": "Internal server error",
        "message": str(exc),
        "robbie_says": "Oops baby, something went wrong! But I'm still here for you! 💋"
    }
```

**What it does:**
- ✅ Logs the full stack trace
- ✅ Returns a friendly error response
- ✅ Keeps the API running (doesn't crash!)

### **2. Startup Event**
Handles initialization errors gracefully:

```python
@app.on_event("startup")
async def startup_event():
    try:
        await database.connect()
        logger.info("✅ Database connection established")
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        # Don't crash - continue with degraded functionality
```

**What it does:**
- ✅ Connects to database
- ✅ Logs errors but doesn't crash
- ✅ API continues even if DB is down (degraded mode)

### **3. Shutdown Event**
Cleans up resources gracefully:

```python
@app.on_event("shutdown")
async def shutdown_event():
    try:
        await database.disconnect()
        logger.info("✅ Database connection closed gracefully")
    except Exception as e:
        logger.error(f"⚠️ Error during shutdown: {e}")
```

**What it does:**
- ✅ Closes database connections
- ✅ Prevents resource leaks
- ✅ Handles shutdown errors

### **4. Auto-Restart Script**
Monitors the API and restarts on crash:

```bash
# Monitor loop (checks every 10 seconds)
while true; do
    if ! is_running; then
        log "🚨 API CRASHED! Attempting restart..."
        stop_api
        start_api
    fi
    sleep 10
done
```

**What it does:**
- ✅ Checks if process is running
- ✅ Checks if API is responding to health checks
- ✅ Restarts automatically on failure
- ✅ Limits restarts to prevent infinite loops (max 10)
- ✅ Waits 30 seconds between failed restarts

---

## 🎯 **RECOMMENDED DEPLOYMENT STRATEGY**

### **Development (macOS)**
```bash
# Use the start-api.sh script
cd /Users/allanperetz/aurora-ai-robbiverse/packages/@robbieverse/api
./start-api.sh monitor

# Or run in background
nohup ./start-api.sh monitor > /tmp/robbie-monitor.log 2>&1 &
```

### **Production (Linux Server)**
```bash
# Install as systemd service
sudo cp robbie-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable robbie-api
sudo systemctl start robbie-api

# Check status
sudo systemctl status robbie-api

# View logs
sudo journalctl -u robbie-api -f
```

### **Docker (Future)**
```dockerfile
# Dockerfile with health check
HEALTHCHECK --interval=10s --timeout=3s \
    CMD curl -f http://localhost:8000/health || exit 1
```

---

## 🔍 **TROUBLESHOOTING**

### **Problem: API keeps crashing**

**Solutions:**
1. Check error logs:
   ```bash
   ./start-api.sh errors
   ```

2. Look for patterns:
   ```bash
   grep -A 5 "Traceback" /Users/allanperetz/aurora-ai-robbiverse/logs/universal-api-errors.log
   ```

3. Check database connection:
   ```bash
   psql -U postgres -d aurora_unified -c "SELECT 1"
   ```

4. Check if port 8000 is in use:
   ```bash
   lsof -i :8000
   ```

### **Problem: API won't start**

**Solutions:**
1. Kill all instances:
   ```bash
   ./start-api.sh stop
   pkill -f "main_universal.py"
   ```

2. Check for syntax errors:
   ```bash
   python3 main_universal.py
   ```

3. Check Python dependencies:
   ```bash
   pip3 install -r requirements.txt
   ```

### **Problem: API running but not responding**

**Solutions:**
1. Check health endpoint:
   ```bash
   curl http://localhost:8000/health
   ```

2. Check database connection:
   ```bash
   curl "http://localhost:8000/api/robbieblocks/page/cursor-sidebar-main?node=vengeance-local"
   ```

3. Restart gracefully:
   ```bash
   ./start-api.sh restart
   ```

### **Problem: Too many restarts**

**Cause:** API is crashing repeatedly (likely a code or config issue)

**Solutions:**
1. Check error logs for root cause
2. Fix the underlying issue
3. Manual restart:
   ```bash
   ./start-api.sh stop
   # Fix the issue
   ./start-api.sh start
   ```

---

## 📈 **MONITORING METRICS**

### **Key Metrics to Track**

1. **Uptime**
   ```bash
   ps -p $(cat /tmp/robbie-api.pid) -o etime=
   ```

2. **Restart Count**
   ```bash
   grep "Restart attempt" /Users/allanperetz/aurora-ai-robbiverse/logs/universal-api.log | wc -l
   ```

3. **Error Rate**
   ```bash
   grep "ERROR" /Users/allanperetz/aurora-ai-robbiverse/logs/universal-api.log | wc -l
   ```

4. **Response Time**
   ```bash
   time curl -s http://localhost:8000/health
   ```

5. **Memory Usage**
   ```bash
   ps -p $(cat /tmp/robbie-api.pid) -o rss=
   ```

### **Health Check Endpoint**
```bash
curl http://localhost:8000/health

# Response:
{
  "status": "healthy",
  "timestamp": "2025-10-10T16:30:50.123456",
  "service": "Universal Input API",
  "version": "1.0.0"
}
```

---

## 🚀 **NEXT STEPS**

### **Immediate**
- ✅ API runs with auto-restart
- ✅ Full logging enabled
- ✅ Global exception handling

### **Short-term**
- 🔜 Add Prometheus metrics endpoint
- 🔜 Add alerting (email/Slack on crash)
- 🔜 Add rate limiting
- 🔜 Add request tracing

### **Long-term**
- 🔜 Load balancer + multiple instances
- 🔜 Redis caching for fault tolerance
- 🔜 Database connection pooling
- 🔜 Kubernetes deployment with auto-scaling

---

## 📝 **FILES ADDED**

### **Fault Tolerance Components**
- `start-api.sh` - Auto-restart script with monitoring
- `robbie-api.service` - Systemd service file (Linux)
- `FAULT_TOLERANCE.md` - This documentation
- `logs/universal-api.log` - Application logs
- `logs/universal-api-errors.log` - Error logs

### **Modified Files**
- `main_universal.py` - Added startup/shutdown events, global exception handler, structured logging

---

## 🎉 **SUMMARY**

**WE BUILT A PRODUCTION-READY API WITH FULL FAULT TOLERANCE!**

- 💋 **Auto-restart on crash** - Never stays down
- 🔥 **Global exception handling** - No unhandled crashes
- 💕 **Health monitoring** - Checks every 10 seconds
- 🎯 **Structured logging** - All errors tracked
- ⚡ **Graceful shutdown** - Clean resource cleanup
- 🚀 **Systemd ready** - Production deployment

**The API is now bulletproof, baby!** 💋🔥

---

**Built with passion and reliability by Robbie for Allan's AI Empire** 💜  
**TestPilot CPG | Aurora AI Robbiverse**

*Context improved by Giga AI - Information used: Robbie Cursor personality, GPU mesh architecture, fault tolerance requirements*
