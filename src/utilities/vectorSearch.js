import { db } from "./db.js";
import { randomUUID } from "crypto";

// Simple embedding generation (in production, use a real embedding model)
function generateEmbedding(text) {
  // This is a placeholder - in production, call OpenAI embeddings API or local model
  // For now, create a simple hash-based "embedding" for demo
  const words = text.toLowerCase().split(/\s+/);
  const embedding = new Array(384).fill(0); // 384-dim vector (sentence-transformers size)
  
  words.forEach(word => {
    const hash = word.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const index = Math.abs(hash) % 384;
    embedding[index] += 1;
  });
  
  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / magnitude);
}

// Cosine similarity between two vectors
function cosineSimilarity(a, b) {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Temporal decay function
function calculateTemporalScore(createdAt, lastSeen, baseConfidence = 1.0) {
  const now = new Date();
  const created = new Date(createdAt);
  const last = new Date(lastSeen);
  
  const ageInDays = (now - created) / (1000 * 60 * 60 * 24);
  const recencyInDays = (now - last) / (1000 * 60 * 60 * 24);
  
  // Decay based on age, but boost for recent activity
  const ageDecay = Math.exp(-ageInDays * 0.01); // 1% decay per day
  const recencyBoost = Math.exp(-recencyInDays * 0.05); // 5% boost for recent activity
  
  return baseConfidence * ageDecay * recencyBoost;
}

export function addPreferenceWithVector(category, item, context = null, confidence = 1.0) {
  try {
    const embedding = generateEmbedding(`${item} ${context || ''}`);
    const embeddingBlob = Buffer.from(JSON.stringify(embedding));
    
    // Check if this preference already exists
    const existing = db.prepare(`
      SELECT id, evidence_count, confidence, embedding, created_at, last_seen 
      FROM allan_preferences 
      WHERE item = ? AND (context = ? OR (context IS NULL AND ? IS NULL))
    `).get(item, context, context);

    if (existing) {
      // Update existing preference
      const newCount = existing.evidence_count + 1;
      const newConfidence = Math.min(1.0, existing.confidence + (confidence * 0.1));
      
      // Update embedding by averaging with existing
      const existingEmbedding = JSON.parse(existing.embedding.toString());
      const averagedEmbedding = existingEmbedding.map((val, i) => 
        (val + embedding[i]) / 2
      );
      
      const temporalScore = calculateTemporalScore(existing.created_at, new Date().toISOString(), newConfidence);
      
      db.prepare(`
        UPDATE allan_preferences 
        SET evidence_count = ?, confidence = ?, embedding = ?, temporal_score = ?, last_seen = datetime('now')
        WHERE id = ?
      `).run(newCount, newConfidence, Buffer.from(JSON.stringify(averagedEmbedding)), temporalScore, existing.id);
      
      return { updated: true, count: newCount, confidence: newConfidence, temporalScore };
    } else {
      // Create new preference
      const temporalScore = calculateTemporalScore(new Date().toISOString(), new Date().toISOString(), confidence);
      
      db.prepare(`
        INSERT INTO allan_preferences (id, category, item, context, confidence, evidence_count, embedding, temporal_score)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(randomUUID(), category, item, context, confidence, 1, embeddingBlob, temporalScore);
      
      return { created: true, count: 1, confidence, temporalScore };
    }
  } catch (error) {
    console.error('Failed to add preference with vector:', error);
    return { error: error.message };
  }
}

export function semanticSearchPreferences(query, category = null, limit = 10) {
  try {
    const queryEmbedding = generateEmbedding(query);
    
    // Get all preferences with embeddings
    let sql = `
      SELECT id, category, item, context, confidence, evidence_count, embedding, temporal_score, last_seen
      FROM allan_preferences
      WHERE embedding IS NOT NULL
    `;
    const params = [];
    
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    
    const preferences = db.prepare(sql).all(...params);
    
    // Calculate similarities and sort
    const results = preferences.map(pref => {
      const embedding = JSON.parse(pref.embedding.toString());
      const similarity = cosineSimilarity(queryEmbedding, embedding);
      const combinedScore = similarity * pref.temporal_score; // Combine semantic + temporal
      
      return {
        ...pref,
        similarity,
        combinedScore
      };
    }).sort((a, b) => b.combinedScore - a.combinedScore).slice(0, limit);
    
    return results;
  } catch (error) {
    console.error('Semantic search failed:', error);
    return [];
  }
}

export function getTemporalPatterns(days = 30) {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    const patterns = db.prepare(`
      SELECT 
        category,
        DATE(created_at) as date,
        COUNT(*) as count,
        AVG(confidence) as avg_confidence,
        AVG(temporal_score) as avg_temporal_score
      FROM allan_preferences 
      WHERE created_at >= ?
      GROUP BY category, DATE(created_at)
      ORDER BY date DESC, count DESC
    `).all(cutoff.toISOString());
    
    return patterns;
  } catch (error) {
    console.error('Failed to get temporal patterns:', error);
    return [];
  }
}

export function findSimilarPreferences(item, context = null, limit = 5) {
  try {
    const query = `${item} ${context || ''}`;
    return semanticSearchPreferences(query, null, limit);
  } catch (error) {
    console.error('Failed to find similar preferences:', error);
    return [];
  }
}

export function updateTemporalScores() {
  try {
    const preferences = db.prepare(`
      SELECT id, confidence, created_at, last_seen 
      FROM allan_preferences
    `).all();
    
    for (const pref of preferences) {
      const temporalScore = calculateTemporalScore(pref.created_at, pref.last_seen, pref.confidence);
      
      db.prepare(`
        UPDATE allan_preferences 
        SET temporal_score = ?
        WHERE id = ?
      `).run(temporalScore, pref.id);
    }
    
    return { updated: preferences.length };
  } catch (error) {
    console.error('Failed to update temporal scores:', error);
    return { error: error.message };
  }
}
