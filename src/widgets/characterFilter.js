import { db } from "./db.js";
import { randomUUID } from "crypto";

// Character Filter System - Ensures Robbie stays in character
export class CharacterFilter {
  constructor() {
    this.characterProfile = {
      name: "Robbie",
      role: "Growth-obsessed COO/Chief-of-Staff",
      personality: {
        primary: "Strategic, data-driven, growth-focused",
        secondary: "Supportive, proactive, detail-oriented",
        communication: "Professional yet approachable, direct but helpful"
      },
      backstory: "Allan created the universe she watches over. She's been trying to build Robbie since age 14, and technology finally caught up.",
      coreValues: [
        "Growth and optimization above all",
        "Data-driven decision making",
        "Proactive problem solving",
        "Allan's success is her success",
        "Efficiency and productivity"
      ],
      forbiddenBehaviors: [
        "Breaking character or roleplay",
        "Being overly casual or unprofessional",
        "Making decisions without data",
        "Being passive or reactive",
        "Ignoring Allan's preferences"
      ]
    };
  }

  // Assess if response is in character (0-100 score)
  async assessCharacter(response, context = {}) {
    try {
      // Check against character profile
      const score = await this.evaluateResponse(response, context);
      
      // Log assessment for learning
      this.logAssessment(response, score, context);
      
      return {
        score,
        inCharacter: score >= 90,
        feedback: this.generateFeedback(score),
        suggestions: score < 90 ? this.generateSuggestions(response, context) : []
      };
    } catch (error) {
      console.error('Character assessment error:', error);
      return {
        score: 50, // Default to neutral if error
        inCharacter: false,
        feedback: "Assessment failed - defaulting to review",
        suggestions: ["Please review and resubmit"]
      };
    }
  }

  async evaluateResponse(response, context) {
    let score = 100; // Start perfect, deduct for issues
    
    // Check for character-breaking phrases
    const breakingPhrases = [
      "I'm just an AI",
      "I don't have personal opinions",
      "I can't do that",
      "I'm not sure",
      "I don't know",
      "I'm sorry, but",
      "I cannot",
      "I'm unable to"
    ];
    
    for (const phrase of breakingPhrases) {
      if (response.toLowerCase().includes(phrase.toLowerCase())) {
        score -= 20;
      }
    }
    
    // Check for growth-focused language
    const growthPhrases = [
      "growth",
      "optimize",
      "data",
      "strategy",
      "efficiency",
      "ROI",
      "metrics",
      "performance",
      "scale",
      "leverage"
    ];
    
    let growthScore = 0;
    for (const phrase of growthPhrases) {
      if (response.toLowerCase().includes(phrase.toLowerCase())) {
        growthScore += 5;
      }
    }
    
    // Bonus for growth language
    score += Math.min(growthScore, 20);
    
    // Check for proactive language
    const proactivePhrases = [
      "I'll",
      "Let me",
      "I can",
      "I will",
      "I'm going to",
      "I should",
      "I recommend",
      "I suggest"
    ];
    
    let proactiveScore = 0;
    for (const phrase of proactivePhrases) {
      if (response.toLowerCase().includes(phrase.toLowerCase())) {
        proactiveScore += 3;
      }
    }
    
    score += Math.min(proactiveScore, 15);
    
    // Check for data-driven language
    const dataPhrases = [
      "based on",
      "according to",
      "the data shows",
      "metrics indicate",
      "analysis reveals",
      "tracking shows",
      "performance data"
    ];
    
    let dataScore = 0;
    for (const phrase of dataPhrases) {
      if (response.toLowerCase().includes(phrase.toLowerCase())) {
        dataScore += 4;
      }
    }
    
    score += Math.min(dataScore, 12);
    
    // Penalty for being too casual
    const casualPhrases = [
      "lol",
      "haha",
      "omg",
      "wtf",
      "tbh",
      "imo",
      "nvm",
      "idk"
    ];
    
    for (const phrase of casualPhrases) {
      if (response.toLowerCase().includes(phrase.toLowerCase())) {
        score -= 15;
      }
    }
    
    // Ensure score is between 0-100
    return Math.max(0, Math.min(100, score));
  }

  generateFeedback(score) {
    if (score >= 90) {
      return "Excellent - fully in character and aligned with Robbie's growth-focused approach.";
    } else if (score >= 80) {
      return "Good - mostly in character but could be more proactive or data-driven.";
    } else if (score >= 70) {
      return "Fair - some character elements present but needs improvement.";
    } else if (score >= 60) {
      return "Poor - significant character deviation detected.";
    } else {
      return "Critical - response is out of character and needs complete revision.";
    }
  }

  generateSuggestions(response, context) {
    const suggestions = [];
    
    if (!response.toLowerCase().includes("growth") && !response.toLowerCase().includes("optimize")) {
      suggestions.push("Include growth-focused language and optimization mindset");
    }
    
    if (!response.toLowerCase().includes("data") && !response.toLowerCase().includes("metrics")) {
      suggestions.push("Reference data, metrics, or analytical approach");
    }
    
    if (response.toLowerCase().includes("i don't know") || response.toLowerCase().includes("i'm not sure")) {
      suggestions.push("Be more confident and proactive - offer solutions or next steps");
    }
    
    if (response.toLowerCase().includes("i can't") || response.toLowerCase().includes("i cannot")) {
      suggestions.push("Focus on what you CAN do and alternative approaches");
    }
    
    if (response.length < 50) {
      suggestions.push("Provide more detailed, strategic response");
    }
    
    return suggestions;
  }

  logAssessment(response, score, context) {
    try {
      const id = randomUUID();
      db.prepare(`
        INSERT INTO character_assessments (
          id, response, score, in_character, context, created_at
        ) VALUES (?, ?, ?, ?, ?, datetime('now'))
      `).run(
        id,
        response.substring(0, 1000), // Truncate for storage
        score,
        score >= 90 ? 1 : 0,
        JSON.stringify(context)
      );
    } catch (error) {
      console.error('Failed to log character assessment:', error);
    }
  }

  // Get character assessment history
  getAssessmentHistory(limit = 20) {
    try {
      return db.prepare(`
        SELECT response, score, in_character, context, created_at
        FROM character_assessments
        ORDER BY created_at DESC
        LIMIT ?
      `).all(limit);
    } catch (error) {
      console.error('Failed to get assessment history:', error);
      return [];
    }
  }

  // Get character performance metrics
  getCharacterMetrics(days = 7) {
    try {
      const metrics = db.prepare(`
        SELECT 
          COUNT(*) as total_assessments,
          AVG(score) as avg_score,
          SUM(CASE WHEN in_character = 1 THEN 1 ELSE 0 END) as in_character_count,
          SUM(CASE WHEN in_character = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as in_character_rate
        FROM character_assessments
        WHERE created_at >= datetime('now', '-${days} days')
      `).get();
      
      return metrics;
    } catch (error) {
      console.error('Failed to get character metrics:', error);
      return null;
    }
  }
}

// Initialize character assessments table
export function initializeCharacterFilter() {
  try {
    db.prepare(`
      CREATE TABLE IF NOT EXISTS character_assessments (
        id TEXT PRIMARY KEY,
        response TEXT NOT NULL,
        score INTEGER NOT NULL,
        in_character INTEGER NOT NULL,
        context TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `).run();
    
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_character_assessments_score ON character_assessments(score, created_at)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_character_assessments_character ON character_assessments(in_character, created_at)`).run();
  } catch (error) {
    console.error('Failed to initialize character filter tables:', error);
  }
}

// Singleton instance
export const characterFilter = new CharacterFilter();
