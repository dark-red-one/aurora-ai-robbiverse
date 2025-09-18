import { db } from "./db.js";

export async function registerGovernanceRoutes(app) {
  app.get('/governance/commandments', async () => {
    const row = db.prepare(`SELECT content, updated_at FROM commandments WHERE id = 'canonical'`).get();
    return row || { content: '', updated_at: null };
  });

  app.post('/governance/commandments', async (request) => {
    const { content } = request.body || {};
    if (!content || typeof content !== 'string') {
      return { error: 'content_required' };
    }
    db.prepare(`INSERT OR REPLACE INTO commandments (id, content, updated_at) VALUES ('canonical', ?, datetime('now'))`).run(content);
    return { ok: true };
  });
}


