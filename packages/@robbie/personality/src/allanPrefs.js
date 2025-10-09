import { db } from "./db.js";
import { randomUUID } from "crypto";

export function recordPreference(category, item, context = null, confidence = 1.0) {
  try {
    // Check if this preference already exists
    const existing = db.prepare(`
      SELECT id, evidence_count, confidence FROM allan_preferences 
      WHERE item = ? AND (context = ? OR (context IS NULL AND ? IS NULL))
    `).get(item, context, context);

    if (existing) {
      // Update existing preference - increase evidence count and adjust confidence
      const newCount = existing.evidence_count + 1;
      const newConfidence = Math.min(1.0, existing.confidence + (confidence * 0.1));
      
      db.prepare(`
        UPDATE allan_preferences 
        SET evidence_count = ?, confidence = ?, last_seen = datetime('now')
        WHERE id = ?
      `).run(newCount, newConfidence, existing.id);
      
      return { updated: true, count: newCount, confidence: newConfidence };
    } else {
      // Create new preference
      db.prepare(`
        INSERT INTO allan_preferences (id, category, item, context, confidence, evidence_count)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(randomUUID(), category, item, context, confidence, 1);
      
      return { created: true, count: 1, confidence };
    }
  } catch (error) {
    console.error('Failed to record preference:', error);
    return { error: error.message };
  }
}

export function getPreferences(category = null, minConfidence = 0.5) {
  let query = `
    SELECT category, item, context, confidence, evidence_count, last_seen
    FROM allan_preferences
    WHERE confidence >= ?
  `;
  const params = [minConfidence];
  
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  
  query += ' ORDER BY confidence DESC, evidence_count DESC';
  
  return db.prepare(query).all(...params);
}

export function getLikes(minConfidence = 0.5) {
  return getPreferences('likes', minConfidence);
}

export function getDislikes(minConfidence = 0.5) {
  return getPreferences('dislikes', minConfidence);
}

export function getPreferenceSummary() {
  const stats = db.prepare(`
    SELECT 
      category,
      COUNT(*) as count,
      AVG(confidence) as avg_confidence,
      MAX(last_seen) as last_updated
    FROM allan_preferences 
    GROUP BY category
    ORDER BY count DESC
  `).all();
  
  return stats;
}

// Helper to infer preferences from interactions
export function inferPreferencesFromInteraction(interaction) {
  const { channel, action, content, metadata } = interaction;
  
  // Parse metadata if it's a string
  const meta = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
  
  // Look for positive/negative signals
  const positiveWords = ['love', 'awesome', 'great', 'perfect', 'excellent', 'amazing', 'fantastic', 'brilliant'];
  const negativeWords = ['hate', 'terrible', 'awful', 'bad', 'wrong', 'stupid', 'annoying', 'frustrating'];
  
  const text = (content || '').toLowerCase();
  const hasPositive = positiveWords.some(word => text.includes(word));
  const hasNegative = negativeWords.some(word => text.includes(word));
  
  if (hasPositive && !hasNegative) {
    // Try to extract what Allan likes
    if (channel === 'chat' && content) {
      recordPreference('likes', content.substring(0, 100), 'chat interaction', 0.7);
    }
    if (meta?.model) {
      recordPreference('likes', `LLM model: ${meta.model}`, 'llm usage', 0.8);
    }
  }
  
  if (hasNegative && !hasPositive) {
    // Try to extract what Allan dislikes
    if (channel === 'chat' && content) {
      recordPreference('dislikes', content.substring(0, 100), 'chat interaction', 0.7);
    }
    if (meta?.error) {
      recordPreference('dislikes', `Error: ${meta.error}`, 'system error', 0.9);
    }
  }
  
  // Track specific patterns
  if (channel === 'command' && action === 'thumbsup') {
    recordPreference('likes', 'thumbs up feedback', 'user feedback', 0.9);
  }
  
  if (channel === 'command' && action === 'thumbsdown') {
    recordPreference('dislikes', 'thumbs down feedback', 'user feedback', 0.9);
  }
}

// Seed some initial preferences based on our conversation
export function seedInitialPreferences() {
  const initialPrefs = [
    { category: 'likes', item: 'TEXT FIRST interface', context: 'UI design', confidence: 0.9 },
    { category: 'likes', item: 'Terminal aesthetic with AI superpowers', context: 'UI design', confidence: 0.9 },
    { category: 'likes', item: 'Old school IRC/BBS mashed with AI', context: 'UI design', confidence: 0.9 },
    { category: 'likes', item: 'Visible progress and dopamine hits', context: 'workflow', confidence: 0.9 },
    { category: 'likes', item: 'One-click operations', context: 'workflow', confidence: 0.8 },
    { category: 'likes', item: 'Mouse-friendly interfaces', context: 'workflow', confidence: 0.8 },
    { category: 'dislikes', item: 'Cluttered repositories', context: 'code organization', confidence: 0.9 },
    { category: 'dislikes', item: 'Silent work without feedback', context: 'workflow', confidence: 0.8 },
    { category: 'dislikes', item: 'Complex interfaces', context: 'UI design', confidence: 0.7 },
    { category: 'likes', item: 'Clean, organized code', context: 'code organization', confidence: 0.9 },
    { category: 'likes', item: 'Local GPU-first approach', context: 'technical', confidence: 0.9 },
    { category: 'likes', item: 'Streaming responses', context: 'UI design', confidence: 0.8 }
  ];
  
  for (const pref of initialPrefs) {
    recordPreference(pref.category, pref.item, pref.context, pref.confidence);
  }
}
