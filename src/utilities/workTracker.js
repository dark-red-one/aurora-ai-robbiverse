import { db } from "./db.js";
import { randomUUID } from "crypto";

// Work Tracker System - Manages Robbie's work queue with real-time progress
export class WorkTracker {
  constructor() {
    this.initializeTables();
  }

  initializeTables() {
    // Work items table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS work_items (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL, -- 'pdf', 'analysis', 'research', 'strategy', etc.
        status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
        priority INTEGER DEFAULT 5, -- 1-10, 10 being highest
        client_id TEXT, -- Allan, Tom, or external client
        estimated_duration_minutes INTEGER,
        actual_duration_minutes INTEGER,
        estimated_cost_usd REAL DEFAULT 0.0,
        actual_cost_usd REAL DEFAULT 0.0,
        estimated_tokens INTEGER DEFAULT 0,
        actual_tokens INTEGER DEFAULT 0,
        progress_percentage INTEGER DEFAULT 0,
        eta TEXT, -- ISO timestamp
        started_at TEXT,
        completed_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `).run();

    // Work options table (for 3-option system)
    db.prepare(`
      CREATE TABLE IF NOT EXISTS work_options (
        id TEXT PRIMARY KEY,
        work_item_id TEXT NOT NULL,
        option_number INTEGER NOT NULL, -- 1, 2, or 3
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        concept_approach TEXT NOT NULL,
        estimated_duration_minutes INTEGER,
        estimated_cost_usd REAL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `).run();

    // Work feedback table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS work_feedback (
        id TEXT PRIMARY KEY,
        work_item_id TEXT NOT NULL,
        feedback_type TEXT NOT NULL, -- 'selection', 'revision', 'approval', 'rejection'
        content TEXT NOT NULL,
        user_id TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `).run();

    // Work progress updates
    db.prepare(`
      CREATE TABLE IF NOT EXISTS work_progress (
        id TEXT PRIMARY KEY,
        work_item_id TEXT NOT NULL,
        progress_percentage INTEGER NOT NULL,
        status_message TEXT NOT NULL,
        estimated_completion TEXT, -- ISO timestamp
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `).run();

    // Indexes
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_work_items_status ON work_items(status, priority)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_work_items_client ON work_items(client_id, created_at)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_work_options_item ON work_options(work_item_id)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_work_feedback_item ON work_feedback(work_item_id, created_at)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_work_progress_item ON work_progress(work_item_id, created_at)`).run();
  }

  // Create a new work item with 3 conceptual options
  async createWorkItem({
    title,
    description,
    type,
    priority = 5,
    clientId = 'allan',
    estimatedDurationMinutes = 60,
    estimatedCostUsd = 0.0
  }) {
    const workItemId = randomUUID();
    const now = new Date();
    const eta = new Date(now.getTime() + estimatedDurationMinutes * 60000);

    // Create work item
    db.prepare(`
      INSERT INTO work_items (
        id, title, description, type, priority, client_id,
        estimated_duration_minutes, estimated_cost_usd, eta
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      workItemId,
      title,
      description,
      type,
      priority,
      clientId,
      estimatedDurationMinutes,
      estimatedCostUsd,
      eta.toISOString()
    );

    // Generate 3 conceptual options
    const options = await this.generateWorkOptions(workItemId, title, description, type);
    
    return {
      workItemId,
      title,
      eta: eta.toISOString(),
      options
    };
  }

  // Generate 3 conceptually different options
  async generateWorkOptions(workItemId, title, description, type) {
    const options = [];
    
    // This would integrate with Robbie's LLM to generate 3 different approaches
    // For now, we'll create template options based on type
    const optionTemplates = this.getOptionTemplates(type);
    
    for (let i = 0; i < 3; i++) {
      const optionId = randomUUID();
      const template = optionTemplates[i] || optionTemplates[0];
      
      db.prepare(`
        INSERT INTO work_options (
          id, work_item_id, option_number, title, description, concept_approach,
          estimated_duration_minutes, estimated_cost_usd
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        optionId,
        workItemId,
        i + 1,
        template.title,
        template.description,
        template.concept_approach,
        template.estimated_duration_minutes,
        template.estimated_cost_usd
      );

      options.push({
        id: optionId,
        optionNumber: i + 1,
        title: template.title,
        description: template.description,
        conceptApproach: template.concept_approach,
        estimatedDurationMinutes: template.estimated_duration_minutes,
        estimatedCostUsd: template.estimated_cost_usd
      });
    }

    return options;
  }

  getOptionTemplates(type) {
    const templates = {
      'pdf': [
        {
          title: "Professional Corporate Design",
          description: "Clean, minimalist design with corporate branding and professional typography",
          concept_approach: "Focus on credibility and trust through clean design and professional presentation",
          estimated_duration_minutes: 45,
          estimated_cost_usd: 15.00
        },
        {
          title: "Creative Visual Storytelling",
          description: "Dynamic layout with visual elements, infographics, and engaging design",
          concept_approach: "Use visual storytelling to make complex information accessible and memorable",
          estimated_duration_minutes: 75,
          estimated_cost_usd: 25.00
        },
        {
          title: "Data-Driven Analytical",
          description: "Charts, graphs, and data visualization with analytical focus",
          concept_approach: "Present information through data visualization and analytical frameworks",
          estimated_duration_minutes: 60,
          estimated_cost_usd: 20.00
        }
      ],
      'analysis': [
        {
          title: "Comprehensive Deep Dive",
          description: "Thorough analysis with multiple data sources and detailed insights",
          concept_approach: "Leave no stone unturned - comprehensive research and analysis",
          estimated_duration_minutes: 120,
          estimated_cost_usd: 40.00
        },
        {
          title: "Strategic Overview",
          description: "High-level strategic analysis focusing on key opportunities and risks",
          concept_approach: "Focus on strategic implications and actionable recommendations",
          estimated_duration_minutes: 90,
          estimated_cost_usd: 30.00
        },
        {
          title: "Quick Intelligence Brief",
          description: "Rapid analysis with key insights and immediate actionable items",
          concept_approach: "Speed and efficiency - get insights fast for immediate action",
          estimated_duration_minutes: 45,
          estimated_cost_usd: 15.00
        }
      ],
      'research': [
        {
          title: "Academic Rigor Approach",
          description: "Thorough research with citations, multiple sources, and peer-reviewed methodology",
          concept_approach: "Academic-level research with rigorous methodology and comprehensive sources",
          estimated_duration_minutes: 180,
          estimated_cost_usd: 60.00
        },
        {
          title: "Market Intelligence Focus",
          description: "Competitive analysis and market trends with business implications",
          concept_approach: "Business-focused research with competitive intelligence and market insights",
          estimated_duration_minutes: 120,
          estimated_cost_usd: 40.00
        },
        {
          title: "Rapid Market Scan",
          description: "Quick market overview with key trends and immediate opportunities",
          concept_approach: "Fast market intelligence for quick decision-making",
          estimated_duration_minutes: 60,
          estimated_cost_usd: 20.00
        }
      ]
    };

    return templates[type] || templates['analysis'];
  }

  // Select an option and start work
  async selectOption(workItemId, optionId, feedback = '') {
    const option = db.prepare(`
      SELECT * FROM work_options WHERE id = ? AND work_item_id = ?
    `).get(optionId, workItemId);

    if (!option) {
      throw new Error('Option not found');
    }

    // Update work item with selected option details
    db.prepare(`
      UPDATE work_items SET
        status = 'in_progress',
        started_at = datetime('now'),
        estimated_duration_minutes = ?,
        estimated_cost_usd = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      option.estimated_duration_minutes,
      option.estimated_cost_usd,
      workItemId
    );

    // Log selection feedback
    if (feedback) {
      this.addFeedback(workItemId, 'selection', feedback, 'allan');
    }

    // Create initial progress update
    this.updateProgress(workItemId, 0, 'Work started - analyzing requirements and planning approach');

    return {
      workItemId,
      selectedOption: option,
      status: 'in_progress',
      eta: new Date(Date.now() + option.estimated_duration_minutes * 60000).toISOString()
    };
  }

  // Update work progress
  updateProgress(workItemId, percentage, statusMessage, estimatedCompletion = null) {
    const progressId = randomUUID();
    
    db.prepare(`
      INSERT INTO work_progress (
        id, work_item_id, progress_percentage, status_message, estimated_completion
      ) VALUES (?, ?, ?, ?, ?)
    `).run(
      progressId,
      workItemId,
      percentage,
      statusMessage,
      estimatedCompletion
    );

    // Update work item progress
    db.prepare(`
      UPDATE work_items SET
        progress_percentage = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(percentage, workItemId);

    return {
      progressId,
      percentage,
      statusMessage,
      estimatedCompletion
    };
  }

  // Add feedback to work item
  addFeedback(workItemId, feedbackType, content, userId) {
    const feedbackId = randomUUID();
    
    db.prepare(`
      INSERT INTO work_feedback (
        id, work_item_id, feedback_type, content, user_id
      ) VALUES (?, ?, ?, ?, ?)
    `).run(feedbackId, workItemId, feedbackType, content, userId);

    return { feedbackId, feedbackType, content, userId };
  }

  // Complete work item
  async completeWork(workItemId, finalCost = null, finalTokens = null, finalDuration = null) {
    const workItem = db.prepare(`SELECT * FROM work_items WHERE id = ?`).get(workItemId);
    
    if (!workItem) {
      throw new Error('Work item not found');
    }

    const now = new Date();
    const actualDuration = finalDuration || Math.round((now.getTime() - new Date(workItem.started_at).getTime()) / 60000);

    db.prepare(`
      UPDATE work_items SET
        status = 'completed',
        progress_percentage = 100,
        actual_duration_minutes = ?,
        actual_cost_usd = ?,
        actual_tokens = ?,
        completed_at = datetime('now'),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      actualDuration,
      finalCost || workItem.estimated_cost_usd,
      finalTokens || workItem.estimated_tokens,
      workItemId
    );

    // Final progress update
    this.updateProgress(workItemId, 100, 'Work completed successfully');

    return {
      workItemId,
      status: 'completed',
      actualDuration,
      actualCost: finalCost || workItem.estimated_cost_usd,
      actualTokens: finalTokens || workItem.estimated_tokens
    };
  }

  // Get work queue status
  getWorkQueue() {
    const pending = db.prepare(`
      SELECT * FROM work_items 
      WHERE status IN ('pending', 'in_progress')
      ORDER BY priority DESC, created_at ASC
    `).all();

    const completed = db.prepare(`
      SELECT * FROM work_items 
      WHERE status = 'completed'
      ORDER BY completed_at DESC
      LIMIT 10
    `).all();

    return { pending, completed };
  }

  // Get work item details with options and progress
  getWorkItemDetails(workItemId) {
    const workItem = db.prepare(`SELECT * FROM work_items WHERE id = ?`).get(workItemId);
    
    if (!workItem) {
      return null;
    }

    const options = db.prepare(`
      SELECT * FROM work_options WHERE work_item_id = ? ORDER BY option_number
    `).all(workItemId);

    const progress = db.prepare(`
      SELECT * FROM work_progress WHERE work_item_id = ? ORDER BY created_at ASC
    `).all(workItemId);

    const feedback = db.prepare(`
      SELECT * FROM work_feedback WHERE work_item_id = ? ORDER BY created_at ASC
    `).all(workItemId);

    return {
      ...workItem,
      options,
      progress,
      feedback
    };
  }

  // Get work statistics
  getWorkStatistics(days = 30) {
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_work_items,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_items,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_items,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_items,
        AVG(actual_duration_minutes) as avg_duration_minutes,
        SUM(actual_cost_usd) as total_cost_usd,
        SUM(actual_tokens) as total_tokens
      FROM work_items
      WHERE created_at >= datetime('now', '-${days} days')
    `).get();

    return stats;
  }
}

// Singleton instance
export const workTracker = new WorkTracker();
