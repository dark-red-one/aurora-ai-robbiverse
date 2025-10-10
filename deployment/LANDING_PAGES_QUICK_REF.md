# 🚀 Landing Pages - Quick Reference

**One-page cheat sheet for GroceryShop landing page**

---

## 📍 URLs

**Landing Page**: https://testpilot.ai/landing/groceryshop/  
**With Params**: https://testpilot.ai/landing/groceryshop/?name=Sarah&company=Mars  
**HubSpot Token**: https://testpilot.ai/landing/groceryshop/?name={{contact.firstname}}&company={{company.name}}

---

## 🎯 Quick Commands

### Local Testing
```bash
# Start everything
cd /Users/allanperetz/aurora-ai-robbiverse
bash deployment/setup-landing-pages-local.sh

# Just web server
cd web-deploy && python3 -m http.server 8080

# Just API
cd packages/@robbieverse/api && uvicorn main:app --reload --port 8000
```

### Production Deploy
```bash
sudo bash deployment/deploy-landing-pages.sh
```

### Check Status
```bash
# API health
curl http://localhost:8000/health

# Tracking stats
curl http://localhost:8000/api/tracking/stats?page_filter=groceryshop

# Recent visitors
curl http://localhost:8000/api/tracking/recent?limit=10
```

---

## 📊 Database Queries

### Quick Stats
```sql
SELECT COUNT(*), AVG(time_on_page_seconds), SUM(CASE WHEN converted THEN 1 ELSE 0 END)
FROM website_activity WHERE page_url LIKE '%groceryshop%';
```

### Recent Visitors
```sql
SELECT session_id, time_on_page_seconds, scroll_depth_percent, converted, visited_at
FROM website_activity WHERE page_url LIKE '%groceryshop%'
ORDER BY visited_at DESC LIMIT 20;
```

### Hot Leads
```sql
SELECT * FROM website_activity 
WHERE page_url LIKE '%groceryshop%'
    AND (time_on_page_seconds > 60 OR converted = TRUE)
ORDER BY visited_at DESC;
```

---

## 📧 Email Templates

### Subject Lines
```
Following up from GroceryShop - Quick TestPilot Overview
[{{contact.firstname}}] Your GroceryShop Follow-Up
```

### Body (Plain)
```
Hi {{contact.firstname}},

I put together a TestPilot overview just for you:
→ https://testpilot.ai/landing/groceryshop/?name={{contact.firstname}}&company={{company.name}}

72-hour product testing, $49/shopper, real purchase behavior.

Worth a look?

Best, Allan
```

---

## 🔧 Troubleshooting

### Page Not Loading
```bash
sudo nginx -t
sudo systemctl status nginx
sudo tail -f /var/log/nginx/testpilot-error.log
```

### Tracking Not Working
```bash
# Check API
curl http://localhost:8000/health

# Check database
psql -h localhost -U postgres -d aurora_unified -c "SELECT 1;"

# Check logs
tail -f /var/log/nginx/testpilot-access.log
```

### Database Issues
```bash
# Apply migration
psql -h localhost -U postgres -d aurora_unified \
  -f database/migrations/add-session-id-unique-constraint.sql

# Verify table
psql -h localhost -U postgres -d aurora_unified \
  -c "SELECT * FROM website_activity LIMIT 1;"
```

---

## 📈 KPIs to Watch

**Email**: 40% open, 10% click  
**Landing**: <40% bounce, >90s time, >15% conversion  
**Campaign**: 10% meeting rate, $150K pipeline

---

## 📁 Key Files

```
web-deploy/landing/groceryshop/index.html
packages/@robbieverse/api/src/routes/tracking.py
deployment/nginx-testpilot.conf
deployment/deploy-landing-pages.sh
```

---

## 📚 Full Docs

- **Technical**: deployment/LANDING_PAGES_GUIDE.md
- **HubSpot**: deployment/HUBSPOT_INTEGRATION_GUIDE.md
- **Summary**: GROCERYSHOP_LANDING_PAGE_COMPLETE.md

---

**Ship it!** 🚀

