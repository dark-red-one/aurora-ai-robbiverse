import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

const dataDir = path.resolve("/home/allan/vengeance/data");
const dbPath = path.join(dataDir, "vengeance.db");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new Database(dbPath);

export function initializeSchema() {
  // citizens
  db.prepare(`
    CREATE TABLE IF NOT EXISTS citizens (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      town_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `).run();

  // banishments
  db.prepare(`
    CREATE TABLE IF NOT EXISTS banishments (
      id TEXT PRIMARY KEY,
      target_citizen_id TEXT NOT NULL,
      mayor_id TEXT NOT NULL,
      town_id TEXT NOT NULL,
      reason_summary TEXT NOT NULL,
      report_draft TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      started_at TEXT NOT NULL,
      ends_at TEXT NOT NULL,
      result_yes INTEGER NOT NULL DEFAULT 0,
      result_no INTEGER NOT NULL DEFAULT 0,
      final_decision TEXT,
      closed_at TEXT
    )
  `).run();

  // votes
  db.prepare(`
    CREATE TABLE IF NOT EXISTS banishment_votes (
      id TEXT PRIMARY KEY,
      banishment_id TEXT NOT NULL,
      voter_citizen_id TEXT NOT NULL,
      vote TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `).run();

  // reminders
  db.prepare(`
    CREATE TABLE IF NOT EXISTS banishment_reminders (
      id TEXT PRIMARY KEY,
      banishment_id TEXT NOT NULL,
      when_at TEXT NOT NULL,
      sent INTEGER NOT NULL DEFAULT 0,
      channel TEXT,
      note TEXT
    )
  `).run();

  // reports
  db.prepare(`
    CREATE TABLE IF NOT EXISTS banishment_reports (
      id TEXT PRIMARY KEY,
      banishment_id TEXT NOT NULL,
      content TEXT NOT NULL,
      approved_by_mayor INTEGER NOT NULL DEFAULT 0,
      approved_at TEXT
    )
  `).run();

  // llm usage
  db.prepare(`
    CREATE TABLE IF NOT EXISTS llm_usage (
      id TEXT PRIMARY KEY,
      request_id TEXT,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      input_tokens INTEGER DEFAULT 0,
      output_tokens INTEGER DEFAULT 0,
      total_tokens INTEGER DEFAULT 0,
      duration_ms INTEGER DEFAULT 0,
      success INTEGER DEFAULT 1,
      error_message TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `).run();

  // proxy access logs (for Cursor verification)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS proxy_access (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      method TEXT,
      path TEXT,
      user_agent TEXT,
      status INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `).run();

  // commandments (single canonical record keyed by 'canonical')
  db.prepare(`
    CREATE TABLE IF NOT EXISTS commandments (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `).run();

  // quotes store
  db.prepare(`
    CREATE TABLE IF NOT EXISTS quotes (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      author TEXT,
      source TEXT,
      tags TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `).run();

  // interactions - multichannel tracking (chat, git, approvals, notes, etc.)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS interactions (
      id TEXT PRIMARY KEY,
      channel TEXT NOT NULL, -- 'chat', 'git', 'approval', 'note', 'command'
      action TEXT NOT NULL, -- 'message', 'commit', 'approve', 'create', 'edit'
      content TEXT,
      metadata TEXT, -- JSON for extra context
      user_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `).run();

  // git sync tracking
  db.prepare(`
    CREATE TABLE IF NOT EXISTS git_sync (
      id TEXT PRIMARY KEY,
      repo_path TEXT NOT NULL,
      last_commit TEXT,
      last_sync TEXT NOT NULL DEFAULT (datetime('now')),
      status TEXT DEFAULT 'active'
    )
  `).run();

  // Allan's preferences tracking with temporal vectors
  db.prepare(`
    CREATE TABLE IF NOT EXISTS allan_preferences (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL, -- 'likes', 'dislikes', 'neutral'
      item TEXT NOT NULL,
      context TEXT, -- what situation this applies to
      confidence REAL DEFAULT 1.0, -- 0.0 to 1.0, how sure we are
      evidence_count INTEGER DEFAULT 1, -- how many times we've seen this
      embedding BLOB, -- vector embedding for semantic search
      temporal_score REAL DEFAULT 1.0, -- decayed confidence over time
      last_seen TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `).run();

  // Vector search index for semantic similarity
  db.prepare(`
    CREATE VIRTUAL TABLE IF NOT EXISTS preferences_fts USING fts5(
      item, context, category,
      content='allan_preferences',
      content_rowid='rowid'
    )
  `).run();

  // Character cards - Westworld + D&D style
  db.prepare(`
    CREATE TABLE IF NOT EXISTS character_cards (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      company TEXT,
      title TEXT,
      context TEXT, -- "bill's friend", "kraft contact", etc.
      bio TEXT, -- biographical data
      facts TEXT, -- JSON array of facts
      quotes TEXT, -- JSON array of quotes
      stats TEXT, -- JSON: {int: 8, str: 6, cha: 9, etc.}
      confidence REAL DEFAULT 0.0, -- 0.0 to 1.0
      privilege_level TEXT DEFAULT 'unknown', -- 'high', 'medium', 'low', 'unknown'
      last_seen TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `).run();

  // Character relationships
  db.prepare(`
    CREATE TABLE IF NOT EXISTS character_relationships (
      id TEXT PRIMARY KEY,
      character_id TEXT NOT NULL,
      related_character_id TEXT NOT NULL,
      relationship_type TEXT, -- 'friend', 'colleague', 'reports_to', etc.
      strength REAL DEFAULT 0.5, -- 0.0 to 1.0
      context TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `).run();

  // indexes
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_banishments_town_status ON banishments(town_id, status)`).run();
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_votes_banishment ON banishment_votes(banishment_id)`).run();
  db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_target ON banishments(target_citizen_id) WHERE status = 'active'`).run();
  db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS uniq_vote ON banishment_votes(banishment_id, voter_citizen_id)`).run();
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_llm_usage_model ON llm_usage(model, created_at)`).run();
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_proxy_access_time ON proxy_access(created_at)`).run();
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_quotes_time ON quotes(created_at)`).run();
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_interactions_channel ON interactions(channel, created_at)`).run();
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_git_sync_repo ON git_sync(repo_path)`).run();
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_allan_prefs_category ON allan_preferences(category, confidence)`).run();
  db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS uniq_allan_pref ON allan_preferences(item, context)`).run();
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_character_name ON character_cards(name)`).run();
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_character_company ON character_cards(company)`).run();
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_character_context ON character_cards(context)`).run();
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_character_privilege ON character_cards(privilege_level, confidence)`).run();
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_relationships_character ON character_relationships(character_id)`).run();

  // seed commandments from repo file if empty
  try {
    const existing = db.prepare(`SELECT COUNT(1) as c FROM commandments WHERE id = 'canonical'`).get();
    if (!existing || existing.c === 0) {
      const repoPaths = [
        path.resolve('/home/allan/testpilot/COMMANDMENTS.md'),
        path.resolve('/home/allan/vengeance/COMMANDMENTS.md')
      ];
      let content = null;
      for (const p of repoPaths) {
        if (fs.existsSync(p)) {
          try { content = fs.readFileSync(p, 'utf8'); break; } catch {}
        }
      }
      if (!content) {
        content = `# 10 Commandments of Working with Allan\n\n1. Show visible progress early and often.\n2. Prioritize local GPU-first; fall back only when needed.\n3. Keep the repo clean; hide mess in the dumpster.\n4. Track cost, tokens, and satisfaction on every action.\n5. Be wasteful for discovery, optimize later.\n6. Default to sharing unless Allan-only or unsure.\n7. Protect live flow; no blocking prompts.\n8. Strong defaults, one-click ops, mouse-friendly.\n9. Honor non-training sessions for guests (e.g., Tom).\n10. Announce dopamine moments: “reload and enjoy.”\n`;
      }
      db.prepare(`INSERT OR REPLACE INTO commandments (id, content) VALUES ('canonical', ?)`)
        .run(content);
    }
  } catch {}
}

export function withinLastMonths(dateIso, months) {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  return new Date(dateIso) >= cutoff;
}


