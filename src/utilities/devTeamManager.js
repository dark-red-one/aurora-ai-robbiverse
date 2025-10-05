// Dev Team Manager - Marcus Chen
// Coordinates feature development and manages team communications

class DevTeamManager {
  constructor(db) {
    this.db = db;
    this.name = 'Marcus Chen';
    this.role = 'Senior Development Manager';
    this.personality = 'strategic, detail-oriented, proactive';
    
    this.workQueue = [];
    this.activeProjects = new Map();
    this.teamCapacity = {
      frontend: 2, // Available frontend dev capacity
      backend: 3,  // Available backend dev capacity
      qa: 1,       // QA capacity
      devops: 1    // DevOps capacity
    };
    
    this.communicationStyle = {
      updates_frequency: 'daily',
      detail_level: 'comprehensive',
      escalation_threshold: 'medium_risk',
      preferred_channels: ['slack', 'email', 'dashboard']
    };
  }

  // Initialize Dev Team Manager
  async initialize() {
    console.log(`👨‍💻 ${this.name} (Dev Team Manager) initializing...`);
    
    await this.initializeTables();
    await this.loadActiveProjects();
    await this.assessTeamCapacity();
    
    // Start daily routines
    this.startDailyRoutines();
    
    console.log(`✅ ${this.name} ready to manage development team`);
  }

  // Process feedback from Allan
  async processFeedback(packageId, feedback, changes) {
    console.log(`📝 ${this.name}: Processing Allan's feedback on ${packageId}`);
    
    // Analyze impact of changes
    const impactAnalysis = await this.analyzeImpact(packageId, changes);
    
    // Update project timeline
    const timelineUpdate = await this.updateProjectTimeline(packageId, impactAnalysis);
    
    // Assign tasks to team members
    const taskAssignments = await this.assignTasks(packageId, changes);
    
    // Generate status update
    const statusUpdate = await this.generateStatusUpdate(packageId, {
      feedback,
      changes,
      impact: impactAnalysis,
      timeline: timelineUpdate,
      assignments: taskAssignments
    });

    // Store in database
    await this.storeFeedbackProcessing(packageId, feedback, statusUpdate);

    // Send update to Allan
    await this.sendUpdateToAllan(statusUpdate);

    return statusUpdate;
  }

  // Analyze impact of changes
  async analyzeImpact(packageId, changes) {
    const analysis = {
      complexity: 'medium',
      estimated_hours: 0,
      resources_needed: [],
      dependencies_affected: [],
      risk_level: 'low',
      timeline_impact: 0 // days
    };

    // Analyze based on change type
    switch (changes.type) {
      case 'split_frontend_backend':
        analysis.complexity = 'high';
        analysis.estimated_hours = 40; // 1 week of work
        analysis.resources_needed = ['frontend', 'backend', 'qa'];
        analysis.timeline_impact = 5; // 5 days
        analysis.risk_level = 'medium';
        break;
        
      case 'merge_packages':
        analysis.complexity = 'medium';
        analysis.estimated_hours = 24; // 3 days
        analysis.resources_needed = ['backend', 'qa'];
        analysis.timeline_impact = 3;
        analysis.risk_level = 'low';
        break;
        
      case 'priority_change':
        analysis.complexity = 'low';
        analysis.estimated_hours = 2; // Planning time
        analysis.resources_needed = ['pm'];
        analysis.timeline_impact = 0;
        analysis.risk_level = 'low';
        break;
    }

    // Check team capacity
    const capacityCheck = this.checkTeamCapacity(analysis.resources_needed);
    if (!capacityCheck.available) {
      analysis.risk_level = 'high';
      analysis.timeline_impact += 3; // Additional delay
    }

    return analysis;
  }

  // Update project timeline
  async updateProjectTimeline(packageId, impact) {
    const project = this.activeProjects.get(packageId);
    const timelineUpdate = {
      original_deadline: project?.deadline || new Date(),
      new_deadline: null,
      delay_days: impact.timeline_impact,
      reason: `Allan's feedback requires ${impact.complexity} complexity changes`
    };

    // Calculate new deadline
    const newDeadline = new Date(timelineUpdate.original_deadline);
    newDeadline.setDate(newDeadline.getDate() + impact.timeline_impact);
    timelineUpdate.new_deadline = newDeadline;

    // Update active project
    if (project) {
      project.deadline = newDeadline;
      project.last_updated = new Date();
      project.update_reason = 'Allan feedback integration';
    }

    return timelineUpdate;
  }

  // Assign tasks to team members
  async assignTasks(packageId, changes) {
    const assignments = [];

    switch (changes.type) {
      case 'split_frontend_backend':
        assignments.push({
          task: 'Create frontend package structure',
          assignee: 'Sarah Kim (Frontend Lead)',
          estimated_hours: 16,
          priority: 'high',
          deadline: this.calculateDeadline(3) // 3 days
        });
        
        assignments.push({
          task: 'Create backend service separation',
          assignee: 'Alex Rodriguez (Backend Lead)', 
          estimated_hours: 20,
          priority: 'high',
          deadline: this.calculateDeadline(4) // 4 days
        });
        
        assignments.push({
          task: 'Update API contracts between FE/BE',
          assignee: 'Jordan Wu (Full Stack)',
          estimated_hours: 8,
          priority: 'medium',
          deadline: this.calculateDeadline(2) // 2 days
        });
        break;
    }

    // Store assignments in database
    for (const assignment of assignments) {
      await this.storeTaskAssignment(packageId, assignment);
    }

    return assignments;
  }

  // Generate status update for Allan
  async generateStatusUpdate(packageId, data) {
    const update = {
      manager: this.name,
      package_id: packageId,
      timestamp: new Date().toISOString(),
      summary: this.generateSummary(data),
      impact_analysis: data.impact,
      timeline_changes: data.timeline,
      team_assignments: data.assignments,
      next_steps: this.generateNextSteps(data),
      risk_assessment: this.generateRiskAssessment(data),
      communication_plan: this.generateCommunicationPlan(data)
    };

    return update;
  }

  // Generate executive summary
  generateSummary(data) {
    const complexity = data.impact.complexity;
    const timelineImpact = data.impact.timeline_impact;
    
    let summary = `Allan's feedback on ${data.changes.type} has been processed. `;
    
    if (complexity === 'high') {
      summary += `This is a high-complexity change requiring ${data.impact.estimated_hours} development hours. `;
    }
    
    if (timelineImpact > 0) {
      summary += `Timeline impact: +${timelineImpact} days. `;
    }
    
    summary += `Team capacity checked and assignments made. All changes tracked and ready for implementation.`;
    
    return summary;
  }

  // Generate next steps
  generateNextSteps(data) {
    const steps = [];
    
    if (data.assignments.length > 0) {
      steps.push(`Notify team members of new assignments (${data.assignments.length} tasks)`);
      steps.push('Schedule kickoff meeting for changed requirements');
    }
    
    if (data.impact.timeline_impact > 0) {
      steps.push('Update project timeline and communicate to stakeholders');
    }
    
    if (data.impact.risk_level !== 'low') {
      steps.push('Schedule risk mitigation planning session');
    }
    
    steps.push('Begin daily progress tracking and reporting');
    
    return steps;
  }

  // Generate risk assessment
  generateRiskAssessment(data) {
    const risks = [];
    
    if (data.impact.complexity === 'high') {
      risks.push({
        risk: 'High complexity may lead to scope creep',
        mitigation: 'Clear requirements documentation and regular check-ins',
        probability: 'medium'
      });
    }
    
    if (data.impact.timeline_impact > 3) {
      risks.push({
        risk: 'Timeline delay may affect other projects',
        mitigation: 'Resource reallocation and priority adjustment',
        probability: 'high'
      });
    }
    
    const capacityCheck = this.checkTeamCapacity(data.impact.resources_needed);
    if (!capacityCheck.available) {
      risks.push({
        risk: 'Insufficient team capacity for immediate implementation',
        mitigation: 'Stagger implementation or bring in contractors',
        probability: 'high'
      });
    }
    
    return risks;
  }

  // Generate communication plan
  generateCommunicationPlan(data) {
    return {
      daily_standups: true,
      weekly_progress_reports: true,
      stakeholder_updates: data.impact.timeline_impact > 0,
      risk_escalation_threshold: data.impact.risk_level,
      communication_channels: ['slack', 'email', 'dashboard'],
      update_frequency: data.impact.complexity === 'high' ? 'twice_daily' : 'daily'
    };
  }

  // Send update to Allan
  async sendUpdateToAllan(statusUpdate) {
    // This would integrate with your notification system
    console.log(`📧 ${this.name}: Sending status update to Allan`);
    console.log(`Summary: ${statusUpdate.summary}`);
    
    // Store the communication
    await this.storeCommunication('allan', 'status_update', statusUpdate);
  }

  // Check team capacity
  checkTeamCapacity(resourcesNeeded) {
    const capacity = { available: true, constraints: [] };
    
    resourcesNeeded.forEach(resource => {
      if (this.teamCapacity[resource] <= 0) {
        capacity.available = false;
        capacity.constraints.push(`No available ${resource} capacity`);
      }
    });
    
    return capacity;
  }

  // Calculate deadline
  calculateDeadline(days) {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + days);
    return deadline.toISOString();
  }

  // Start daily routines
  startDailyRoutines() {
    // Daily team status check at 9 AM
    setInterval(() => {
      const now = new Date();
      if (now.getHours() === 9 && now.getMinutes() === 0) {
        this.performDailyStatusCheck();
      }
    }, 60000); // Check every minute

    // Weekly planning on Mondays at 10 AM
    setInterval(() => {
      const now = new Date();
      if (now.getDay() === 1 && now.getHours() === 10 && now.getMinutes() === 0) {
        this.performWeeklyPlanning();
      }
    }, 60000);
  }

  // Perform daily status check
  async performDailyStatusCheck() {
    console.log(`📊 ${this.name}: Performing daily status check...`);
    
    const statusReport = {
      active_projects: this.activeProjects.size,
      team_utilization: this.calculateTeamUtilization(),
      blockers: await this.identifyBlockers(),
      at_risk_projects: await this.identifyAtRiskProjects(),
      recommendations: []
    };

    // Generate recommendations
    if (statusReport.team_utilization > 90) {
      statusReport.recommendations.push('Team at high utilization - consider resource adjustment');
    }
    
    if (statusReport.blockers.length > 0) {
      statusReport.recommendations.push(`${statusReport.blockers.length} blockers need attention`);
    }

    // Send daily report
    await this.sendDailyReport(statusReport);
  }

  // Calculate team utilization
  calculateTeamUtilization() {
    // Mock calculation - in production this would be based on actual assignments
    return Math.floor(Math.random() * 100);
  }

  // Identify blockers
  async identifyBlockers() {
    // Mock blockers - in production this would query actual project status
    return [
      { project: 'personality_system_3_0', blocker: 'Waiting for LLM API access', severity: 'high' },
      { project: 'meeting_mining', blocker: 'Fireflies API rate limits', severity: 'medium' }
    ];
  }

  // Identify at-risk projects
  async identifyAtRiskProjects() {
    const atRisk = [];
    
    for (const [projectId, project] of this.activeProjects) {
      const daysUntilDeadline = Math.ceil((project.deadline - new Date()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDeadline < 3 && project.completion < 80) {
        atRisk.push({
          project: projectId,
          deadline: project.deadline,
          completion: project.completion,
          risk_level: 'high'
        });
      }
    }
    
    return atRisk;
  }

  // Send daily report
  async sendDailyReport(statusReport) {
    console.log(`📈 ${this.name}: Daily Status Report`);
    console.log(`Active Projects: ${statusReport.active_projects}`);
    console.log(`Team Utilization: ${statusReport.team_utilization}%`);
    console.log(`Blockers: ${statusReport.blockers.length}`);
    
    // Store report
    await this.storeStatusReport(statusReport);
  }

  // Storage methods
  async storeFeedbackProcessing(packageId, feedback, statusUpdate) {
    await this.db.run(`
      INSERT INTO dev_feedback_processing (
        package_id, feedback, status_update, processed_at
      ) VALUES (?, ?, ?, ?)
    `, [packageId, feedback, JSON.stringify(statusUpdate), new Date().toISOString()]);
  }

  async storeTaskAssignment(packageId, assignment) {
    await this.db.run(`
      INSERT INTO task_assignments (
        package_id, task, assignee, estimated_hours, priority, deadline, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      packageId,
      assignment.task,
      assignment.assignee,
      assignment.estimated_hours,
      assignment.priority,
      assignment.deadline,
      new Date().toISOString()
    ]);
  }

  async storeCommunication(recipient, type, content) {
    await this.db.run(`
      INSERT INTO dev_communications (
        recipient, communication_type, content, sent_at
      ) VALUES (?, ?, ?, ?)
    `, [recipient, type, JSON.stringify(content), new Date().toISOString()]);
  }

  async storeStatusReport(report) {
    await this.db.run(`
      INSERT INTO daily_status_reports (
        report_data, generated_at
      ) VALUES (?, ?)
    `, [JSON.stringify(report), new Date().toISOString()]);
  }

  // Initialize database tables
  async initializeTables() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS dev_feedback_processing (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        package_id TEXT NOT NULL,
        feedback TEXT NOT NULL,
        status_update TEXT NOT NULL,
        processed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS task_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        package_id TEXT NOT NULL,
        task TEXT NOT NULL,
        assignee TEXT NOT NULL,
        estimated_hours INTEGER NOT NULL,
        priority TEXT NOT NULL,
        deadline DATETIME NOT NULL,
        status TEXT DEFAULT 'assigned',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS dev_communications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipient TEXT NOT NULL,
        communication_type TEXT NOT NULL,
        content TEXT NOT NULL,
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS daily_status_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_data TEXT NOT NULL,
        generated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_dev_feedback_package ON dev_feedback_processing (package_id, processed_at DESC);
      CREATE INDEX IF NOT EXISTS idx_task_assignments_package ON task_assignments (package_id, status);
      CREATE INDEX IF NOT EXISTS idx_dev_communications_recipient ON dev_communications (recipient, sent_at DESC);
    `);
  }

  async loadActiveProjects() {
    // Mock active projects - in production this would load from database
    this.activeProjects.set('personality_system_3_0', {
      name: 'Personality System 3.0',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      completion: 45,
      last_updated: new Date()
    });
  }

  async assessTeamCapacity() {
    // Mock capacity assessment - in production this would be dynamic
    console.log(`📊 ${this.name}: Team capacity assessed - Frontend: ${this.teamCapacity.frontend}, Backend: ${this.teamCapacity.backend}`);
  }

  async notifySystemInitialization(packages) {
    console.log(`🚀 ${this.name}: System initialized with ${Object.keys(packages).length} feature packages`);
  }
}

module.exports = DevTeamManager;
