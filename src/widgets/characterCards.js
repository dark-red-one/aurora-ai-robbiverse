import { db } from "./db.js";
import { randomUUID } from "crypto";

// D&D-style stat calculation
function calculateStats(bio, facts, quotes) {
  const text = `${bio} ${facts.join(' ')} ${quotes.join(' ')}`.toLowerCase();
  
  // Intelligence - based on analytical language, technical terms, strategic thinking
  const intIndicators = ['strategy', 'analysis', 'data', 'research', 'technical', 'intellectual', 'smart', 'brilliant', 'expert', 'phd', 'mba'];
  const intScore = intIndicators.filter(indicator => text.includes(indicator)).length;
  
  // Charisma - based on leadership language, social terms, influence
  const chaIndicators = ['leader', 'influence', 'charismatic', 'inspire', 'motivate', 'speak', 'present', 'network', 'relationship', 'team'];
  const chaScore = chaIndicators.filter(indicator => text.includes(indicator)).length;
  
  // Strength - based on action words, decisiveness, execution
  const strIndicators = ['execute', 'deliver', 'achieve', 'accomplish', 'drive', 'push', 'force', 'strong', 'powerful', 'decisive'];
  const strScore = strIndicators.filter(indicator => text.includes(indicator)).length;
  
  // Wisdom - based on experience, judgment, insight
  const wisIndicators = ['experience', 'wisdom', 'insight', 'judgment', 'intuition', 'foresight', 'mature', 'seasoned', 'veteran'];
  const wisScore = wisIndicators.filter(indicator => text.includes(indicator)).length;
  
  // Dexterity - based on adaptability, quick thinking, agility
  const dexIndicators = ['adapt', 'flexible', 'agile', 'quick', 'nimble', 'responsive', 'versatile', 'dynamic', 'innovative'];
  const dexScore = dexIndicators.filter(indicator => text.includes(indicator)).length;
  
  // Constitution - based on resilience, persistence, endurance
  const conIndicators = ['resilient', 'persistent', 'endure', 'tough', 'strong', 'robust', 'steady', 'reliable', 'consistent'];
  const conScore = conIndicators.filter(indicator => text.includes(indicator)).length;
  
  // Convert to 1-10 scale, with 8+ being top 20%
  const stats = {
    int: Math.min(10, Math.max(1, Math.floor(intScore * 2) + 3)),
    cha: Math.min(10, Math.max(1, Math.floor(chaScore * 2) + 3)),
    str: Math.min(10, Math.max(1, Math.floor(strScore * 2) + 3)),
    wis: Math.min(10, Math.max(1, Math.floor(wisScore * 2) + 3)),
    dex: Math.min(10, Math.max(1, Math.floor(dexScore * 2) + 3)),
    con: Math.min(10, Math.max(1, Math.floor(conScore * 2) + 3))
  };
  
  return stats;
}

// Privilege level assessment
function assessPrivilegeLevel(company, title, bio, facts) {
  const text = `${company} ${title} ${bio} ${facts.join(' ')}`.toLowerCase();
  
  // High privilege indicators
  const highPrivilege = ['ceo', 'president', 'founder', 'c-suite', 'executive', 'director', 'vp', 'vice president', 'fortune 500', 'unicorn', 'ipo'];
  const highCount = highPrivilege.filter(indicator => text.includes(indicator)).length;
  
  // Medium privilege indicators
  const medPrivilege = ['manager', 'senior', 'lead', 'principal', 'head of', 'chief', 'startup', 'scale-up'];
  const medCount = medPrivilege.filter(indicator => text.includes(indicator)).length;
  
  if (highCount >= 2) return 'high';
  if (medCount >= 2 || highCount >= 1) return 'medium';
  return 'low';
}

// Confidence calculation based on data quality
function calculateConfidence(bio, facts, quotes, stats) {
  let confidence = 0.0;
  
  // Base confidence from data completeness
  if (bio && bio.length > 50) confidence += 0.3;
  if (facts && facts.length > 2) confidence += 0.3;
  if (quotes && quotes.length > 1) confidence += 0.2;
  
  // Bonus for stat consistency (not all 5s or all 9s)
  const statValues = Object.values(stats);
  const statVariance = Math.max(...statValues) - Math.min(...statValues);
  if (statVariance >= 3) confidence += 0.2;
  
  return Math.min(1.0, confidence);
}

export function createCharacterCard(name, company, title, context, bio, facts = [], quotes = []) {
  try {
    const stats = calculateStats(bio, facts, quotes);
    const privilegeLevel = assessPrivilegeLevel(company, title, bio, facts);
    const confidence = calculateConfidence(bio, facts, quotes, stats);
    
    const character = {
      id: randomUUID(),
      name,
      company,
      title,
      context,
      bio,
      facts: JSON.stringify(facts),
      quotes: JSON.stringify(quotes),
      stats: JSON.stringify(stats),
      confidence,
      privilege_level: privilegeLevel,
      last_seen: new Date().toISOString()
    };
    
    db.prepare(`
      INSERT INTO character_cards (id, name, company, title, context, bio, facts, quotes, stats, confidence, privilege_level, last_seen)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      character.id, character.name, character.company, character.title, character.context,
      character.bio, character.facts, character.quotes, character.stats, character.confidence,
      character.privilege_level, character.last_seen
    );
    
    return character;
  } catch (error) {
    console.error('Failed to create character card:', error);
    return { error: error.message };
  }
}

export function findCharacterByContext(contextQuery) {
  try {
    // First try exact context match
    let characters = db.prepare(`
      SELECT * FROM character_cards 
      WHERE context LIKE ? OR name LIKE ? OR company LIKE ?
      ORDER BY confidence DESC
    `).all(`%${contextQuery}%`, `%${contextQuery}%`, `%${contextQuery}%`);
    
    if (characters.length === 0) {
      // Try semantic search on bio and facts
      characters = db.prepare(`
        SELECT * FROM character_cards 
        WHERE bio LIKE ? OR facts LIKE ? OR quotes LIKE ?
        ORDER BY confidence DESC
      `).all(`%${contextQuery}%`, `%${contextQuery}%`, `%${contextQuery}%`);
    }
    
    return characters.map(char => ({
      ...char,
      facts: JSON.parse(char.facts || '[]'),
      quotes: JSON.parse(char.quotes || '[]'),
      stats: JSON.parse(char.stats || '{}')
    }));
  } catch (error) {
    console.error('Failed to find character:', error);
    return [];
  }
}

export function getCharacterCard(id) {
  try {
    const character = db.prepare(`
      SELECT * FROM character_cards WHERE id = ?
    `).get(id);
    
    if (!character) return null;
    
    return {
      ...character,
      facts: JSON.parse(character.facts || '[]'),
      quotes: JSON.parse(character.quotes || '[]'),
      stats: JSON.parse(character.stats || '{}')
    };
  } catch (error) {
    console.error('Failed to get character card:', error);
    return null;
  }
}

export function updateCharacterStats(id, newFacts = [], newQuotes = []) {
  try {
    const character = getCharacterCard(id);
    if (!character) return { error: 'Character not found' };
    
    const updatedFacts = [...character.facts, ...newFacts];
    const updatedQuotes = [...character.quotes, ...newQuotes];
    const newStats = calculateStats(character.bio, updatedFacts, updatedQuotes);
    const newConfidence = calculateConfidence(character.bio, updatedFacts, updatedQuotes, newStats);
    
    db.prepare(`
      UPDATE character_cards 
      SET facts = ?, quotes = ?, stats = ?, confidence = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      JSON.stringify(updatedFacts),
      JSON.stringify(updatedQuotes),
      JSON.stringify(newStats),
      newConfidence,
      id
    );
    
    return { success: true, confidence: newConfidence };
  } catch (error) {
    console.error('Failed to update character stats:', error);
    return { error: error.message };
  }
}

export function getTopCharacters(limit = 20, minConfidence = 0.5) {
  try {
    const characters = db.prepare(`
      SELECT * FROM character_cards 
      WHERE confidence >= ?
      ORDER BY confidence DESC, privilege_level DESC
      LIMIT ?
    `).all(minConfidence, limit);
    
    return characters.map(char => ({
      ...char,
      facts: JSON.parse(char.facts || '[]'),
      quotes: JSON.parse(char.quotes || '[]'),
      stats: JSON.parse(char.stats || '{}')
    }));
  } catch (error) {
    console.error('Failed to get top characters:', error);
    return [];
  }
}

// Format stats for display with "?" for uncertain values
export function formatStatsForDisplay(stats, confidence) {
  const formatted = {};
  const threshold = 0.7; // Show "?" if confidence below this
  
  for (const [stat, value] of Object.entries(stats)) {
    if (confidence < threshold) {
      formatted[stat] = '?';
    } else if (value >= 8) {
      formatted[stat] = `${value} (Top 20%)`;
    } else {
      formatted[stat] = value.toString();
    }
  }
  
  return formatted;
}

// Seed some example characters
export function seedExampleCharacters() {
  const examples = [
    {
      name: "Joe Smith",
      company: "Kraft Foods",
      title: "VP of Marketing",
      context: "bill's friend",
      bio: "Experienced marketing executive with 15+ years in CPG. Known for data-driven decision making and innovative campaign strategies. Has a reputation for being both analytical and charismatic.",
      facts: ["Led Kraft's digital transformation", "MBA from Wharton", "Previously at P&G", "Speaks 3 languages"],
      quotes: ["Data tells the story, but people make the decisions", "Innovation happens at the intersection of creativity and analytics"]
    },
    {
      name: "Sarah Chen",
      company: "TestPilot",
      title: "Head of Product",
      context: "internal team",
      bio: "Product leader with deep technical background. Known for her ability to translate complex technical concepts into business value. Highly collaborative and detail-oriented.",
      facts: ["Former Google PM", "CS degree from Stanford", "Led 3 successful product launches", "Expert in AI/ML applications"],
      quotes: ["The best products solve real problems for real people", "Technology should amplify human potential, not replace it"]
    }
  ];
  
  examples.forEach(char => {
    createCharacterCard(char.name, char.company, char.title, char.context, char.bio, char.facts, char.quotes);
  });
}
