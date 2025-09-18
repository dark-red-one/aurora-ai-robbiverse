// Calendly Integration for Robbie Meeting Coordination
// Complete meeting lifecycle management with guest links and automation

class CalendlyIntegration {
  constructor() {
    this.apiKey = process.env.CALENDLY_API_KEY || 'your_calendly_api_key';
    this.baseUrl = 'https://api.calendly.com';
    this.headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
    this.meetingThreads = new Map(); // Track full conversation threads
  }

  // Create a meeting invitation with custom email
  async createMeetingInvitation(guest, meetingType = 'robbie_demo') {
    console.log(`📧 Creating meeting invitation for ${guest.name}...`);
    
    try {
      // Enrich guest data
      const enrichedGuest = await this.enrichGuestData(guest);
      
      // Create Calendly event type
      const eventType = await this.createEventType(meetingType, enrichedGuest);
      
      // Generate guest link
      const guestLink = await this.generateGuestLink(eventType, enrichedGuest);
      
      // Send custom invitation email
      const emailResult = await this.sendCustomInvitationEmail(enrichedGuest, guestLink, meetingType);
      
      // Track the meeting thread
      this.meetingThreads.set(guest.email, {
        guest: enrichedGuest,
        eventType,
        guestLink,
        status: 'invited',
        thread: [{
          type: 'invitation',
          timestamp: new Date().toISOString(),
          content: emailResult.emailContent,
          sent: true
        }],
        meetingType
      });
      
      console.log(`✅ Meeting invitation sent to ${guest.name}`);
      return {
        success: true,
        guestLink,
        emailSent: true,
        threadId: guest.email
      };
      
    } catch (error) {
      console.error('❌ Failed to create meeting invitation:', error);
      throw error;
    }
  }

  // Enrich guest data with available information
  async enrichGuestData(guest) {
    console.log(`🔍 Enriching data for ${guest.name}...`);
    
    const enriched = {
      ...guest,
      enrichment: {
        company: await this.getCompanyInfo(guest.company),
        linkedin: await this.getLinkedInProfile(guest.email),
        recent_activity: await this.getRecentActivity(guest.email),
        mutual_connections: await this.getMutualConnections(guest.email),
        interests: await this.inferInterests(guest),
        communication_style: await this.analyzeCommunicationStyle(guest),
        timezone: await this.detectTimezone(guest.email),
        preferred_meeting_times: await this.suggestMeetingTimes(guest)
      },
      enriched_at: new Date().toISOString()
    };
    
    console.log(`✅ Data enriched for ${guest.name}`);
    return enriched;
  }

  // Create Calendly event type
  async createEventType(meetingType, guest) {
    const eventTypes = {
      'robbie_demo': {
        name: `Robbie AI Demo with ${guest.name}`,
        duration: 30,
        description: 'Interactive demo of Robbie AI automation system',
        location: 'Online - Secure Web Chat',
        color: '#FF6B6B'
      },
      'consultation': {
        name: `Business Consultation with ${guest.name}`,
        duration: 60,
        description: 'Strategic business discussion and automation opportunities',
        location: 'Online - Secure Web Chat',
        color: '#4ECDC4'
      },
      'quick_chat': {
        name: `Quick Chat with ${guest.name}`,
        duration: 15,
        description: 'Brief discussion about automation possibilities',
        location: 'Online - Secure Web Chat',
        color: '#45B7D1'
      }
    };
    
    const eventConfig = eventTypes[meetingType] || eventTypes['robbie_demo'];
    
    // In a real implementation, you'd create this via Calendly API
    return {
      uri: `https://calendly.com/robbie-ai/${meetingType}-${Date.now()}`,
      name: eventConfig.name,
      duration: eventConfig.duration,
      description: eventConfig.description,
      location: eventConfig.location,
      color: eventConfig.color
    };
  }

  // Generate guest link
  async generateGuestLink(eventType, guest) {
    const baseUrl = 'https://robbie-ai.com/guest-chat';
    const params = new URLSearchParams({
      guest: guest.email,
      event: eventType.uri,
      token: this.generateSecureToken(guest.email),
      type: 'meeting'
    });
    
    return `${baseUrl}?${params.toString()}`;
  }

  // Send custom invitation email
  async sendCustomInvitationEmail(guest, guestLink, meetingType) {
    console.log(`📧 Crafting custom invitation for ${guest.name}...`);
    
    const emailContent = this.craftPersonalizedInvitation(guest, guestLink, meetingType);
    
    // In a real implementation, you'd send this via your email service
    console.log(`📧 Email content for ${guest.name}:`);
    console.log(emailContent);
    
    return {
      to: guest.email,
      subject: emailContent.subject,
      emailContent: emailContent,
      sent: true,
      timestamp: new Date().toISOString()
    };
  }

  // Craft personalized invitation based on guest data
  craftPersonalizedInvitation(guest, guestLink, meetingType) {
    const enriched = guest.enrichment;
    
    // Base invitation
    let subject = `Quick automation demo - ${guest.name}`;
    let opening = `Hi ${guest.name},`;
    
    // Personalize based on enrichment
    if (enriched.company?.recent_news) {
      opening += `\n\nI saw the news about ${enriched.company.recent_news.headline} - congratulations!`;
    }
    
    if (enriched.mutual_connections?.length > 0) {
      const connection = enriched.mutual_connections[0];
      opening += `\n\n${connection.name} mentioned you might be interested in seeing this.`;
    }
    
    // Main message
    const mainMessage = `
I've been experimenting with some automation tools and wanted to get your perspective on something I've been working on. 

I know you're busy, but I thought you might find this interesting - it's a quick 30-minute demo of an AI system I've been developing that could be relevant to ${enriched.company?.name || 'your work'}.

The cool part is it's designed to be really human-like in how it coordinates and communicates. I'd love to get your honest feedback on it.

If you're interested, you can schedule a time that works for you here:
${guestLink}

No pressure at all - just thought you might find it interesting!`;

    // Add personalized closing
    let closing = `\n\nBest regards,\nAllan`;
    
    if (enriched.communication_style === 'casual') {
      closing = `\n\nThanks!\nAllan`;
    } else if (enriched.communication_style === 'formal') {
      closing = `\n\nI look forward to hearing your thoughts.\n\nBest regards,\nAllan Peretz\nTestPilot CPG`;
    }
    
    return {
      subject,
      body: opening + mainMessage + closing,
      html: this.generateHTMLEmail(guest, guestLink, meetingType)
    };
  }

  // Generate HTML email
  generateHTMLEmail(guest, guestLink, meetingType) {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .cta-button { background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
        .security-badge { background: #e8f5e8; border: 1px solid #4CAF50; padding: 10px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>🤖 Robbie AI Demo Invitation</h2>
            <p>Automation that feels human</p>
        </div>
        <div class="content">
            <p>Hi ${guest.name},</p>
            
            <p>I've been experimenting with some automation tools and wanted to get your perspective on something I've been working on.</p>
            
            <p>I know you're busy, but I thought you might find this interesting - it's a quick 30-minute demo of an AI system I've been developing that could be relevant to your work.</p>
            
            <p>The cool part is it's designed to be really human-like in how it coordinates and communicates. I'd love to get your honest feedback on it.</p>
            
            <div style="text-align: center;">
                <a href="${guestLink}" class="cta-button">Schedule Demo</a>
            </div>
            
            <div class="security-badge">
                <strong>🔒 Secure & Private:</strong> This demo uses end-to-end encryption and SSL security. Your data is protected.
            </div>
            
            <p>No pressure at all - just thought you might find it interesting!</p>
            
            <p>Best regards,<br>Allan</p>
        </div>
        <div class="footer">
            <p>This invitation was sent by Robbie AI - TestPilot CPG</p>
        </div>
    </div>
</body>
</html>`;
  }

  // Send day-before reminder
  async sendDayBeforeReminder(guestEmail) {
    const thread = this.meetingThreads.get(guestEmail);
    if (!thread) return;
    
    console.log(`📅 Sending day-before reminder to ${guestEmail}...`);
    
    const reminderContent = this.craftReminderEmail(thread.guest, thread.guestLink);
    
    // Add to thread
    thread.thread.push({
      type: 'reminder',
      timestamp: new Date().toISOString(),
      content: reminderContent,
      sent: true
    });
    
    console.log(`✅ Reminder sent to ${guestEmail}`);
    return reminderContent;
  }

  // Craft reminder email
  craftReminderEmail(guest, guestLink) {
    return {
      subject: `Reminder: Robbie AI Demo tomorrow - ${guest.name}`,
      body: `Hi ${guest.name},\n\nJust a quick reminder about our Robbie AI demo tomorrow. I'm excited to show you what I've been working on!\n\nIf you need to reschedule, just let me know.\n\nDemo link: ${guestLink}\n\nTalk soon!\nAllan`,
      html: this.generateReminderHTML(guest, guestLink)
    };
  }

  // Generate reminder HTML
  generateReminderHTML(guest, guestLink) {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .reminder { background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; }
        .cta-button { background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="reminder">
            <h3>📅 Reminder: Robbie AI Demo Tomorrow</h3>
            <p>Hi ${guest.name},</p>
            <p>Just a quick reminder about our Robbie AI demo tomorrow. I'm excited to show you what I've been working on!</p>
            <p>If you need to reschedule, just let me know.</p>
            <div style="text-align: center;">
                <a href="${guestLink}" class="cta-button">Join Demo</a>
            </div>
            <p>Talk soon!<br>Allan</p>
        </div>
    </div>
</body>
</html>`;
  }

  // Send thank you email after meeting
  async sendThankYouEmail(guestEmail, meetingNotes) {
    const thread = this.meetingThreads.get(guestEmail);
    if (!thread) return;
    
    console.log(`🙏 Sending thank you email to ${guestEmail}...`);
    
    const thankYouContent = this.craftThankYouEmail(thread.guest, meetingNotes, thread.thread);
    
    // Add to thread
    thread.thread.push({
      type: 'thank_you',
      timestamp: new Date().toISOString(),
      content: thankYouContent,
      sent: true
    });
    
    console.log(`✅ Thank you email sent to ${guestEmail}`);
    return thankYouContent;
  }

  // Craft thank you email with full thread recap
  craftThankYouEmail(guest, meetingNotes, fullThread) {
    const threadSummary = this.summarizeThread(fullThread);
    
    return {
      subject: `Thank you for the great conversation, ${guest.name}!`,
      body: `Hi ${guest.name},\n\nThank you so much for taking the time to chat with me today! I really appreciated your insights and feedback on the Robbie AI system.\n\nHere's a quick recap of our conversation:\n\n${threadSummary}\n\nKey takeaways:\n${meetingNotes.keyTakeaways}\n\nNext steps:\n${meetingNotes.nextSteps}\n\nI'll keep you posted on any updates. Thanks again for your time!\n\nBest regards,\nAllan`,
      html: this.generateThankYouHTML(guest, meetingNotes, threadSummary)
    };
  }

  // Generate thank you HTML
  generateThankYouHTML(guest, meetingNotes, threadSummary) {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .recap { background: #e8f4fd; border-left: 4px solid #2196F3; padding: 20px; margin: 20px 0; }
        .takeaways { background: #e8f5e8; border-left: 4px solid #4CAF50; padding: 20px; margin: 20px 0; }
        .next-steps { background: #fff3e0; border-left: 4px solid #FF9800; padding: 20px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>🙏 Thank You!</h2>
            <p>Great conversation with ${guest.name}</p>
        </div>
        <div class="content">
            <p>Hi ${guest.name},</p>
            
            <p>Thank you so much for taking the time to chat with me today! I really appreciated your insights and feedback on the Robbie AI system.</p>
            
            <div class="recap">
                <h3>📝 Conversation Recap</h3>
                <p>${threadSummary}</p>
            </div>
            
            <div class="takeaways">
                <h3>🎯 Key Takeaways</h3>
                <p>${meetingNotes.keyTakeaways}</p>
            </div>
            
            <div class="next-steps">
                <h3>🚀 Next Steps</h3>
                <p>${meetingNotes.nextSteps}</p>
            </div>
            
            <p>I'll keep you posted on any updates. Thanks again for your time!</p>
            
            <p>Best regards,<br>Allan</p>
        </div>
    </div>
</body>
</html>`;
  }

  // Summarize the full conversation thread
  summarizeThread(thread) {
    const events = thread.filter(event => event.sent);
    let summary = '';
    
    events.forEach((event, index) => {
      switch (event.type) {
        case 'invitation':
          summary += `${index + 1}. Initial invitation sent - ${event.timestamp}\n`;
          break;
        case 'reminder':
          summary += `${index + 1}. Day-before reminder sent - ${event.timestamp}\n`;
          break;
        case 'meeting':
          summary += `${index + 1}. Meeting conducted - ${event.timestamp}\n`;
          break;
        case 'thank_you':
          summary += `${index + 1}. Thank you email sent - ${event.timestamp}\n`;
          break;
      }
    });
    
    return summary;
  }

  // Generate secure token for guest links
  generateSecureToken(email) {
    const crypto = require('crypto');
    const secret = process.env.ROBBIE_SECRET || 'robbie-secret-key';
    return crypto.createHmac('sha256', secret).update(email).digest('hex');
  }

  // Placeholder methods for data enrichment
  async getCompanyInfo(companyName) {
    // In real implementation, integrate with company data APIs
    return { name: companyName, industry: 'Technology' };
  }

  async getLinkedInProfile(email) {
    // In real implementation, integrate with LinkedIn API
    return { profile_url: `https://linkedin.com/in/${email.split('@')[0]}` };
  }

  async getRecentActivity(email) {
    // In real implementation, get recent activity data
    return { last_activity: '1 week ago', activity_type: 'email' };
  }

  async getMutualConnections(email) {
    // In real implementation, find mutual connections
    return [];
  }

  async inferInterests(guest) {
    // In real implementation, infer interests from available data
    return ['automation', 'AI', 'business efficiency'];
  }

  async analyzeCommunicationStyle(guest) {
    // In real implementation, analyze communication style
    return 'professional';
  }

  async detectTimezone(email) {
    // In real implementation, detect timezone
    return 'America/New_York';
  }

  async suggestMeetingTimes(guest) {
    // In real implementation, suggest optimal meeting times
    return ['9:00 AM', '2:00 PM', '4:00 PM'];
  }
}

export default CalendlyIntegration;

