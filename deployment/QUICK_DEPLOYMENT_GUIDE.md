# 🚀 QUICK DEPLOYMENT GUIDE - Robbie Apps

**Deploy all 3 Robbie apps to aurora.testpilot.ai with HTTPS & 24h sessions**

---

## ⚡ **ONE-COMMAND DEPLOYMENT**

### **Deploy Everything:**
```bash
cd /home/allan/aurora-ai-robbiverse/deployment
./deploy-all-robbie-apps.sh
```

**This single command will:**
- ✅ Set up SSL certificates
- ✅ Configure Nginx with authentication
- ✅ Deploy all 3 apps (Code, Work, Play)
- ✅ Set up 24-hour session cookies
- ✅ Create login system
- ✅ Generate documentation

---

## 🎯 **INDIVIDUAL APP DEPLOYMENT**

### **Deploy Robbie@Code:**
```bash
./deploy-robbie-code.sh
```

### **Deploy Robbie@Work:**
```bash
./deploy-robbie-work.sh
```

### **Deploy Robbie@Play:**
```bash
./deploy-robbie-play.sh
```

---

## 🔐 **LOGIN CREDENTIALS**

```
Email: allan@testpilotcpg.com
Password: go2Work!
```

---

## 🌐 **LIVE URLs** (After Deployment)

- **💻 Robbie@Code:** https://aurora.testpilot.ai/code
- **💼 Robbie@Work:** https://aurora.testpilot.ai/work
- **🎮 Robbie@Play:** https://aurora.testpilot.ai/play
- **🔐 Login:** https://aurora.testpilot.ai/login
- **📚 Docs:** https://aurora.testpilot.ai/docs

---

## 🛠️ **TROUBLESHOOTING**

### **Check Deployment Status:**
```bash
# SSH into server
ssh root@45.32.194.172

# Check nginx status
systemctl status nginx

# Check auth service
systemctl status robbie-auth

# Check SSL certificates
certbot certificates
```

### **Common Fixes:**
```bash
# Restart services
systemctl restart nginx
systemctl restart robbie-auth

# Test nginx config
nginx -t

# Check logs
tail -f /var/log/nginx/error.log
```

---

## 📋 **WHAT GETS DEPLOYED**

### **Security Features:**
- ✅ HTTPS with Let's Encrypt SSL
- ✅ 24-hour session cookies
- ✅ JWT authentication
- ✅ Security headers (HSTS, XSS protection)
- ✅ HttpOnly, Secure, SameSite cookies

### **Apps:**
- ✅ **Robbie@Code** - AI coding assistant
- ✅ **Robbie@Work** - Business productivity suite  
- ✅ **Robbie@Play** - Entertainment & games

### **Infrastructure:**
- ✅ Nginx reverse proxy
- ✅ Redis session storage
- ✅ Python authentication service
- ✅ Comprehensive logging
- ✅ Auto SSL renewal

---

## 🎉 **READY TO DEPLOY!**

**Run this command to deploy everything:**
```bash
cd /home/allan/aurora-ai-robbiverse/deployment && ./deploy-all-robbie-apps.sh
```

**Estimated deployment time:** 5-10 minutes

**All Robbie apps will be live and secure!** 🚀💜













