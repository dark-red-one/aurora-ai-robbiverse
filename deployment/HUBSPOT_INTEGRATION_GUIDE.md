# 📧 HubSpot Integration - GroceryShop Landing Page

**Purpose**: Send personalized follow-up emails with tracked landing pages  
**Campaign**: GroceryShop 2025  
**Landing Page**: `testpilot.ai/landing/groceryshop/`

---

## 🎯 Quick Start

### Personalized URL Format

```
https://testpilot.ai/landing/groceryshop/?name={{contact.firstname}}&company={{company.name}}
```

HubSpot automatically replaces:
- `{{contact.firstname}}` → Actual first name
- `{{company.name}}` → Actual company name

---

## 📧 Email Template

### Subject Line Options

```
Following up from GroceryShop - Quick TestPilot Overview
[{{contact.firstname}}] Your GroceryShop Follow-Up
GroceryShop Follow-Up: 72-Hour Product Testing for {{company.name}}
```

### Email Body (Plain Text)

```
Hi {{contact.firstname}},

Following up from GroceryShop last week. Had such a great time but came back with a bad cold - finally dug out and wanted to reconnect.

I put together a quick overview of TestPilot specifically for you:
→ https://testpilot.ai/landing/groceryshop/?name={{contact.firstname}}&company={{company.name}}

It shows:
✓ How we get shopper feedback in 72 hours vs weeks
✓ Real purchase behavior testing at $49/shopper  
✓ Why brands like Cholula and Modica use us before launch

Worth a quick look?

If you'd rather just chat:
→ https://calendly.com/allan-testpilotcpg/30min

Best,
Allan

---
Allan Peretz
CEO & Co-Founder, TestPilot CPG
allan@testpilotcpg.com
```

### Email Body (HTML Version)

```html
<p>Hi {{contact.firstname}},</p>

<p>Following up from GroceryShop last week. Had such a great time but came back with a bad cold - finally dug out and wanted to reconnect.</p>

<p>I put together a quick overview of TestPilot specifically for you:</p>

<p><a href="https://testpilot.ai/landing/groceryshop/?name={{contact.firstname}}&company={{company.name}}" style="background: #4ECDC4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">View Your Personalized Overview →</a></p>

<p>It shows:</p>
<ul>
  <li>✓ How we get shopper feedback in 72 hours vs weeks</li>
  <li>✓ Real purchase behavior testing at $49/shopper</li>
  <li>✓ Why brands like Cholula and Modica use us before launch</li>
</ul>

<p>Worth a quick look?</p>

<p>If you'd rather just chat:<br>
<a href="https://calendly.com/allan-testpilotcpg/30min">Book a 30-minute call →</a></p>

<p>Best,<br>
Allan</p>

<hr>
<p style="font-size: 12px; color: #666;">
Allan Peretz<br>
CEO & Co-Founder, TestPilot CPG<br>
<a href="mailto:allan@testpilotcpg.com">allan@testpilotcpg.com</a>
</p>
```

---

## 🔗 HubSpot Sequence Setup

### Sequence Structure

**Email 1** (Day 0): Personalized landing page
**Email 2** (Day 3): "Did you see this?" + case study
**Email 3** (Day 7): Final touch - direct calendly link

### Email 1 Template

Already provided above ↑

### Email 2 Template (Follow-Up)

```
Subject: Quick question, {{contact.firstname}}

Hi {{contact.firstname}},

Wanted to make sure you saw the TestPilot overview I sent:
→ https://testpilot.ai/landing/groceryshop/?name={{contact.firstname}}&company={{company.name}}

I'm particularly proud of the "Science" tab - shows how Robbie (our AI) delivers 25 years of CPG expertise in 72 hours.

If {{company.name}} is thinking about any launches in 2025, we should chat. TestPilot helped Cholula validate their new line before going to market.

Open to a quick call?
→ https://calendly.com/allan-testpilotcpg/30min

Best,
Allan
```

### Email 3 Template (Final Touch)

```
Subject: Last touch, {{contact.firstname}}

Hi {{contact.firstname}},

Don't want to be a pest, but wanted to give this one last shot.

If {{company.name}} is testing any new products, packaging, or pricing in 2025, I'd love to show you how TestPilot can de-risk those launches.

72 hours to results, $49/shopper, real purchase behavior.

Worth 30 minutes?
→ https://calendly.com/allan-testpilotcpg/30min

If not, no worries - I'll stop bugging you! 😊

Best,
Allan
```

---

## 📊 Tracking in HubSpot

### What HubSpot Tracks Automatically

✅ Email sent
✅ Email opened
✅ Link clicked
✅ Calendly booking (if integrated)

### What Our Landing Page Tracks

✅ Page visit (anonymous or identified)
✅ Time on page
✅ Scroll depth
✅ Tab switches (which content they viewed)
✅ Button clicks (Book, Email, LinkedIn)
✅ Conversion events

### Syncing Data Back to HubSpot

**Option 1**: Manual export
```sql
-- Export for HubSpot import
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

**Option 2**: API integration (future)
- Create HubSpot custom properties
- Push tracking data via HubSpot API
- Enriches contact records automatically

---

## 🎯 Segmentation Ideas

### High-Intent Contacts

Criteria:
- Clicked email link
- Time on page > 60 seconds
- Scrolled > 50%
- Clicked "Book Meeting" button

Action: Priority follow-up call

### Medium-Intent Contacts

Criteria:
- Clicked email link
- Time on page 20-60 seconds
- Viewed multiple tabs

Action: Send case study email

### Low-Intent / No Response

Criteria:
- Opened email but didn't click
- OR didn't open at all

Action: Try different subject line or wait 2 weeks

---

## 🔥 Pro Tips

### Personalization Beyond Name

Add more URL parameters:
```
?name={{contact.firstname}}&company={{company.name}}&role={{contact.jobtitle}}&industry={{company.industry}}
```

Update landing page to use role/industry for even more customization.

### A/B Testing

Create multiple versions:
- `/landing/groceryshop/` (version A)
- `/landing/groceryshop-v2/` (version B)

Track which performs better:
```sql
SELECT 
    CASE 
        WHEN page_url LIKE '%-v2/%' THEN 'Version B'
        ELSE 'Version A'
    END as version,
    COUNT(DISTINCT session_id) as visitors,
    AVG(time_on_page_seconds) as avg_time,
    SUM(CASE WHEN converted THEN 1 ELSE 0 END) as conversions
FROM website_activity
WHERE page_url LIKE '%groceryshop%'
GROUP BY version;
```

### Re-engagement

For contacts who visited but didn't convert:
```
Subject: {{contact.firstname}}, I saw you checked out TestPilot

Hi {{contact.firstname}},

Noticed you looked at the TestPilot overview I sent. 
Curious what questions you might have?

Common ones:
- How do you recruit shoppers? (1.2M+ U.S. panel)
- Can we test multiple SKUs? (Yes, up to 3 at once)
- How accurate is it? (Validated against real test markets)

Want to hop on a call and I can walk through any of these?

Best,
Allan
```

---

## 📈 Success Metrics

### Email Performance

Target metrics:
- **Open rate**: 35-45% (B2B avg: 21%)
- **Click rate**: 8-12% (B2B avg: 2.6%)
- **Response rate**: 5-10%
- **Meeting booked**: 2-5%

### Landing Page Performance

Target metrics:
- **Bounce rate**: <40%
- **Avg time on page**: >90 seconds
- **Scroll depth**: >60%
- **Conversion rate**: >15%

### Overall Campaign

Target:
- **Meetings booked**: 10-15 from 200 contacts
- **Pipeline generated**: $150K+
- **Closed deals**: 2-3 ($25K average)

---

## 🛠 HubSpot Workflow Setup

### Trigger

**Enrollment trigger**:
- Contact property: `GroceryShop Attendee` = `Yes`
- OR List: `GroceryShop 2025`

### Actions

1. **Wait 1 day** (give them time to recover from conference)
2. **Send Email 1** (with personalized landing page)
3. **If/Then**: Email clicked → Set property `Hot Lead = True`
4. **Wait 3 days**
5. **If/Then**: If no response → Send Email 2
6. **Wait 4 days**
7. **If/Then**: If still no response → Send Email 3
8. **If meeting booked**: Remove from sequence

---

## 🚀 Launch Checklist

Before sending to full list:

- [ ] Test email with your own contact
- [ ] Verify personalization tokens work
- [ ] Click link and verify landing page loads
- [ ] Check tracking in browser console
- [ ] Verify tracking data in database
- [ ] Test on mobile device
- [ ] Check all CTA buttons work
- [ ] Verify Calendly integration
- [ ] Set up HubSpot workflow
- [ ] Send to test group (10 contacts)
- [ ] Review metrics after 24 hours
- [ ] Adjust if needed
- [ ] Send to full list

---

## 📞 Support

**Landing page issues**: Check deployment/LANDING_PAGES_GUIDE.md  
**Tracking issues**: Check packages/@robbieverse/api/src/routes/tracking.py  
**HubSpot issues**: HubSpot support or Allan directly

---

**Ship it and close deals!** 🚀💰

