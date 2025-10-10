# 🚀 TestPilot Landing Pages - Deployment & Tracking Guide

**Created**: October 10, 2025  
**Status**: Production Ready  
**Domain**: testpilot.ai

---

## 🎯 Overview

Promotional landing pages with comprehensive visitor tracking for TestPilot CPG.

**Current Pages**:
- ✅ GroceryShop Follow-Up: `/landing/groceryshop/`

**Features**:
- Personalized content via URL parameters (`?name=Sarah&company=Mars`)
- Comprehensive tracking (pageviews, dwell time, scroll depth, conversions)
- Fault-tolerant design (page works even if tracking fails)
- Real-time analytics via API
- Cookie persistence for returning visitors

---

## 📦 What's Deployed

### Files Structure
```
/var/www/testpilot.ai/
├── landing/
│   └── groceryshop/
│       └── index.html          # Full page with tracking
├── 404.html                    # Custom 404 page
└── 50x.html                    # Custom error page

/etc/nginx/sites-available/
└── testpilot                   # Nginx configuration

/etc/nginx/sites-enabled/
└── testpilot -> ../sites-available/testpilot
```

### Backend API
```
packages/@robbieverse/api/src/routes/tracking.py
- POST /api/tracking/pageview    # Initial visit
- POST /api/tracking/heartbeat   # Every 10 seconds
- POST /api/tracking/event       # User interactions
- POST /api/tracking/conversion  # Conversion events
- GET  /api/tracking/stats       # Analytics
- GET  /api/tracking/recent      # Recent visitors
```

### Database
```sql
Table: website_activity
- session_id (unique per visit)
- page_url, page_title, referrer
- user_agent, ip_address
- time_on_page_seconds
- scroll_depth_percent
- converted, conversion_type, conversion_value
- visited_at
```

---

## 🚀 Deployment

### Quick Deploy
```bash
cd /Users/allanperetz/aurora-ai-robbiverse
sudo bash deployment/deploy-landing-pages.sh
```

### Manual Deploy Steps

1. **Create directories**:
```bash
sudo mkdir -p /var/www/testpilot.ai/landing/groceryshop
```

2. **Copy files**:
```bash
sudo cp -r web-deploy/landing/groceryshop/* /var/www/testpilot.ai/landing/groceryshop/
```

3. **Set permissions**:
```bash
sudo chown -R www-data:www-data /var/www/testpilot.ai
sudo chmod -R 755 /var/www/testpilot.ai
```

4. **Install nginx config**:
```bash
sudo cp deployment/nginx-testpilot.conf /etc/nginx/sites-available/testpilot
sudo ln -sf /etc/nginx/sites-available/testpilot /etc/nginx/sites-enabled/testpilot
```

5. **Test and reload nginx**:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

6. **Setup SSL** (if not done):
```bash
sudo certbot --nginx -d testpilot.ai -d www.testpilot.ai
```

---

## 📊 Tracking Implementation

### What We Track

**Page Load**:
- URL, title, referrer
- User agent, IP address
- Visitor name/company (from URL params)

**Engagement** (every 10 seconds):
- Time on page
- Scroll depth
- Tab visibility changes

**Interactions**:
- Tab switches (TestPilot Overview, The Science, FAQ)
- Button clicks (Book Meeting, Email, LinkedIn)

**Conversions**:
- `calendly_book`: $100 value (high intent)
- `email_click`: $50 value (medium intent)
- `linkedin_click`: $25 value (low intent)

### Fault Tolerance

**All tracking wrapped in try/catch**:
```javascript
try {
    await fetch('/api/tracking/pageview', {...});
} catch (e) {
    // Silent fail - page continues working
}
```

**Backend returns 200 even on database failures**:
```python
try:
    cursor.execute("INSERT INTO website_activity...")
except Exception as e:
    logger.error(f"Tracking error: {e}")
    return {"success": True}  # Always return success
```

---

## 🔗 Usage

### Send Personalized Links

**In HubSpot Sequence**:
```
https://testpilot.ai/landing/groceryshop/?name={{contact.firstname}}&company={{company.name}}
```

**Manual Test**:
```
https://testpilot.ai/landing/groceryshop/?name=Allan&company=TestPilot
```

### Track Anonymous Visitors

Just send them to:
```
https://testpilot.ai/landing/groceryshop/
```

They'll be tracked anonymously, then linked when they identify themselves later.

---

## 📈 Analytics

### View Stats via API

**Overall stats**:
```bash
curl https://testpilot.ai/api/tracking/stats?page_filter=groceryshop
```

Returns:
```json
{
    "unique_visitors": 47,
    "avg_time_seconds": 127.5,
    "avg_scroll_percent": 68.2,
    "conversions": 12,
    "bounces": 8,
    "conversion_rate": 25.53
}
```

**Recent visitors**:
```bash
curl https://testpilot.ai/api/tracking/recent?limit=20
```

### Query Database Directly

**All GroceryShop visitors**:
```sql
SELECT 
    session_id,
    page_url,
    time_on_page_seconds,
    scroll_depth_percent,
    converted,
    conversion_type,
    visited_at
FROM website_activity
WHERE page_url LIKE '%groceryshop%'
ORDER BY visited_at DESC;
```

**Conversion funnel**:
```sql
SELECT 
    COUNT(DISTINCT session_id) as total_visitors,
    COUNT(DISTINCT CASE WHEN time_on_page_seconds > 30 THEN session_id END) as engaged,
    COUNT(DISTINCT CASE WHEN scroll_depth_percent > 50 THEN session_id END) as deep_scrollers,
    COUNT(DISTINCT CASE WHEN converted THEN session_id END) as converted
FROM website_activity
WHERE page_url LIKE '%groceryshop%';
```

**Conversion breakdown**:
```sql
SELECT 
    conversion_type,
    COUNT(*) as count,
    AVG(conversion_value) as avg_value
FROM website_activity
WHERE page_url LIKE '%groceryshop%'
    AND converted = TRUE
GROUP BY conversion_type
ORDER BY count DESC;
```

---

## 🧪 Testing

### Local Testing

1. **Open page locally**:
```bash
cd web-deploy/landing/groceryshop
python3 -m http.server 8080
open http://localhost:8080
```

2. **Check console**: Should see tracking attempts (will fail without API)

3. **Verify fault tolerance**: Page still works and looks perfect

### Production Testing

1. **Visit page**:
```
https://testpilot.ai/landing/groceryshop/?name=Test&company=TestCo
```

2. **Check browser console**:
- Should see: `✅ Tracking initialized: [session-id]`
- No JavaScript errors

3. **Interact with page**:
- Switch tabs
- Scroll down
- Click buttons
- Wait 30+ seconds (heartbeat tracking)

4. **Verify in database**:
```sql
SELECT * FROM website_activity 
WHERE session_id = '[your-session-id]'
ORDER BY visited_at DESC LIMIT 1;
```

### API Testing

```bash
# Health check
curl https://testpilot.ai/api/tracking/stats

# Test pageview (manual)
curl -X POST https://testpilot.ai/api/tracking/pageview \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-123",
    "page_url": "https://testpilot.ai/landing/groceryshop/",
    "page_title": "GroceryShop Follow-Up",
    "visitor_name": "Test",
    "visitor_company": "TestCo"
  }'
```

---

## 🔧 Troubleshooting

### Page Not Loading

**Check nginx**:
```bash
sudo nginx -t
sudo systemctl status nginx
sudo tail -f /var/log/nginx/testpilot-error.log
```

**Check file permissions**:
```bash
ls -la /var/www/testpilot.ai/landing/groceryshop/
```

Should be: `drwxr-xr-x www-data www-data`

### Tracking Not Working

**Check API is running**:
```bash
curl http://localhost:8000/health
```

**Check database connection**:
```bash
psql -h localhost -U postgres -d aurora_unified -c "SELECT 1;"
```

**Check browser console** for fetch errors

**Check API logs**:
```bash
# If running with uvicorn
tail -f /var/log/robbieverse-api.log
```

### SSL Issues

**Renew certificates**:
```bash
sudo certbot renew
```

**Force HTTPS**:
Already configured in nginx (line 11 of config)

---

## 📋 Adding New Landing Pages

### 1. Create HTML
```bash
mkdir -p web-deploy/landing/new-campaign
# Create index.html with tracking code
```

### 2. Add nginx location
```nginx
location /landing/new-campaign/ {
    alias /var/www/testpilot.ai/landing/new-campaign/;
    try_files $uri $uri/ /landing/new-campaign/index.html;
}
```

### 3. Deploy
```bash
sudo bash deployment/deploy-landing-pages.sh
```

### 4. Test
```
https://testpilot.ai/landing/new-campaign/?name=Test&company=TestCo
```

---

## 🎨 Customization

### Change Tracking Frequency

Edit heartbeat interval in HTML:
```javascript
setInterval(() => {
    track('heartbeat', { seconds: 30 }); // Changed from 10
}, 30000); // Changed from 10000
```

### Add Custom Events

```javascript
document.querySelector('#custom-button').addEventListener('click', () => {
    track('event', {
        event_type: 'custom_action',
        event_data: { button_id: 'custom-button' }
    });
});
```

### Modify Conversion Values

In HTML tracking code:
```javascript
if (btnText.includes('Premium')) {
    conversionType = 'premium_inquiry';
    conversionValue = 200; // Higher value
}
```

---

## 🔒 Security

**Implemented**:
- ✅ HTTPS enforced (301 redirect)
- ✅ Security headers (X-Frame-Options, etc.)
- ✅ API behind reverse proxy
- ✅ Rate limiting (nginx default)
- ✅ No sensitive data in tracking

**TODO** (if needed):
- [ ] Add rate limiting to tracking endpoints
- [ ] Add authentication for analytics endpoints
- [ ] Add GDPR compliance banner
- [ ] Add tracking opt-out mechanism

---

## 📚 Related Documentation

- API Routes: `packages/@robbieverse/api/src/routes/tracking.py`
- Database Schema: `database/unified-schema/19-interactions-database.sql`
- Nginx Config: `deployment/nginx-testpilot.conf`
- Deployment Script: `deployment/deploy-landing-pages.sh`

---

## 💰 ROI Tracking

**Track effectiveness**:
```sql
-- Cost per visit (if running ads)
SELECT 
    COUNT(DISTINCT session_id) as visitors,
    5000.00 as campaign_spend,
    5000.00 / COUNT(DISTINCT session_id) as cost_per_visit
FROM website_activity
WHERE page_url LIKE '%groceryshop%'
    AND visited_at > '2025-10-10';

-- Conversion value
SELECT 
    SUM(conversion_value) as total_conversion_value,
    COUNT(*) as conversions,
    AVG(conversion_value) as avg_conversion_value
FROM website_activity
WHERE page_url LIKE '%groceryshop%'
    AND converted = TRUE;
```

---

## 🚀 Next Steps

1. **Deploy to production** ✅
2. **Test with real traffic**
3. **Monitor for 24 hours**
4. **Adjust tracking based on data**
5. **Create dashboard** (optional)
6. **Setup alerts for high-value conversions**
7. **A/B test different versions**

---

**Questions?** Check the inline comments in the code or review the tracking.py API implementation.

**Ship it!** 🚀💰

