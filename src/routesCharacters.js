import { db } from "./db.js";
import { 
  createCharacterCard, 
  findCharacterByContext, 
  getCharacterCard, 
  updateCharacterStats, 
  getTopCharacters,
  formatStatsForDisplay,
  seedExampleCharacters 
} from "./characterCards.js";

export async function registerCharacterRoutes(app) {
  // Get character by context search
  app.get('/characters/search', async (request) => {
    const { q } = request.query || {};
    if (!q) return { error: 'Query required' };
    
    const characters = findCharacterByContext(q);
    return { characters };
  });

  // Get specific character card
  app.get('/characters/:id', async (request) => {
    const { id } = request.params || {};
    const character = getCharacterCard(id);
    
    if (!character) {
      return { error: 'Character not found' };
    }
    
    return character;
  });

  // Create new character card
  app.post('/characters', async (request) => {
    const { name, company, title, context, bio, facts = [], quotes = [] } = request.body || {};
    
    if (!name) {
      return { error: 'Name required' };
    }
    
    const character = createCharacterCard(name, company, title, context, bio, facts, quotes);
    return character;
  });

  // Update character with new data
  app.post('/characters/:id/update', async (request) => {
    const { id } = request.params || {};
    const { facts = [], quotes = [] } = request.body || {};
    
    const result = updateCharacterStats(id, facts, quotes);
    return result;
  });

  // Get top characters
  app.get('/characters', async (request) => {
    const { limit = 20, minConfidence = 0.5 } = request.query || {};
    const characters = getTopCharacters(parseInt(limit), parseFloat(minConfidence));
    return { characters };
  });

  // Character card UI
  app.get('/characters/ui', async (request, reply) => {
    const html = `<!doctype html>
<html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Character Cards</title>
<style>
body{font-family:system-ui, sans-serif; background:#1e1e1e; color:#cccccc; margin:0; padding:20px;}
.card{background:#252526; border:1px solid #3c3c3c; padding:20px; margin:15px 0; border-radius:8px;}
.search{background:#2d2d30; border:1px solid #3c3c3c; padding:15px; margin-bottom:20px; border-radius:6px;}
.search input{width:100%; padding:10px; background:#1e1e1e; border:1px solid #3c3c3c; color:#cccccc; border-radius:4px;}
.stats{display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin:15px 0;}
.stat{background:#2d2d30; padding:10px; text-align:center; border-radius:4px;}
.stat-value{font-size:18px; font-weight:bold; color:#4fc1ff;}
.stat-label{font-size:12px; color:#969696; text-transform:uppercase;}
.privilege{display:inline-block; padding:4px 8px; border-radius:4px; font-size:12px; font-weight:bold;}
.privilege-high{background:#4caf50; color:white;}
.privilege-medium{background:#ff9800; color:white;}
.privilege-low{background:#f44336; color:white;}
.privilege-unknown{background:#666; color:white;}
</style>
</head><body>
  <h1>Character Cards - Westworld + D&D Style</h1>
  <div class="search">
    <input type="text" id="search" placeholder="Search: 'bill's friend', 'kraft contact', 'joe smith'..." />
  </div>
  <div id="results"></div>
  <script>
    document.getElementById('search').addEventListener('input', async (e) => {
      const query = e.target.value.trim();
      if (query.length < 2) {
        document.getElementById('results').innerHTML = '';
        return;
      }
      
      const res = await fetch('/characters/search?q=' + encodeURIComponent(query));
      const data = await res.json();
      
      if (data.characters && data.characters.length > 0) {
        document.getElementById('results').innerHTML = data.characters.map(char => {
          const stats = JSON.parse(char.stats || '{}');
          const formattedStats = formatStatsForDisplay(stats, char.confidence);
          
          return \`
            <div class="card">
              <h3>\${char.name} - \${char.title || 'Unknown Title'}</h3>
              <p><strong>Company:</strong> \${char.company || 'Unknown'}</p>
              <p><strong>Context:</strong> \${char.context || 'No context'}</p>
              <p><strong>Privilege:</strong> <span class="privilege privilege-\${char.privilege_level}">\${char.privilege_level.toUpperCase()}</span></p>
              <p><strong>Confidence:</strong> \${Math.round(char.confidence * 100)}%</p>
              
              <div class="stats">
                <div class="stat">
                  <div class="stat-value">\${formattedStats.int || '?'}</div>
                  <div class="stat-label">Intelligence</div>
                </div>
                <div class="stat">
                  <div class="stat-value">\${formattedStats.cha || '?'}</div>
                  <div class="stat-label">Charisma</div>
                </div>
                <div class="stat">
                  <div class="stat-value">\${formattedStats.str || '?'}</div>
                  <div class="stat-label">Strength</div>
                </div>
                <div class="stat">
                  <div class="stat-value">\${formattedStats.wis || '?'}</div>
                  <div class="stat-label">Wisdom</div>
                </div>
                <div class="stat">
                  <div class="stat-value">\${formattedStats.dex || '?'}</div>
                  <div class="stat-label">Dexterity</div>
                </div>
                <div class="stat">
                  <div class="stat-value">\${formattedStats.con || '?'}</div>
                  <div class="stat-label">Constitution</div>
                </div>
              </div>
              
              <p><strong>Bio:</strong> \${char.bio || 'No bio available'}</p>
              
              \${char.facts && char.facts.length > 0 ? \`
                <p><strong>Facts:</strong></p>
                <ul>\${char.facts.map(fact => \`<li>\${fact}</li>\`).join('')}</ul>
              \` : ''}
              
              \${char.quotes && char.quotes.length > 0 ? \`
                <p><strong>Quotes:</strong></p>
                <ul>\${char.quotes.map(quote => \`<li>"\${quote}"</li>\`).join('')}</ul>
              \` : ''}
            </div>
          \`;
        }).join('');
      } else {
        document.getElementById('results').innerHTML = '<div class="card">No characters found. Try a different search term.</div>';
      }
    });
    
    function formatStatsForDisplay(stats, confidence) {
      const formatted = {};
      const threshold = 0.7;
      
      for (const [stat, value] of Object.entries(stats)) {
        if (confidence < threshold) {
          formatted[stat] = '?';
        } else if (value >= 8) {
          formatted[stat] = \`\${value} (Top 20%)\`;
        } else {
          formatted[stat] = value.toString();
        }
      }
      
      return formatted;
    }
  </script>
</body></html>`;
    reply.headers({ 'content-type': 'text/html; charset=utf-8' }).send(html);
  });

  // Seed example characters on first run
  try {
    const count = db.prepare('SELECT COUNT(*) as count FROM character_cards').get();
    if (count.count === 0) {
      seedExampleCharacters();
    }
  } catch (error) {
    console.error('Failed to seed example characters:', error);
  }
}
