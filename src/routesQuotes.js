import { db } from "./db.js";
import { randomUUID } from "crypto";

export async function registerQuotesRoutes(app) {
  app.get('/quotes/ui', async (request, reply) => {
    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Quotes</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>body{font-family:system-ui, sans-serif; margin:24px;} input,textarea{width:100%; padding:8px; margin:6px 0;} button{padding:8px 12px;}</style>
  </head>
<body>
  <h1>Quotes</h1>
  <form id="qform">
    <label>Quote</label>
    <textarea id="content" rows="3" placeholder="e.g., It has all the data and never gets tired."></textarea>
    <label>Author</label>
    <input id="author" placeholder="Allan Peretz" />
    <label>Source</label>
    <input id="source" placeholder="LeadershipQuotes.com" />
    <label>Tags (comma separated)</label>
    <input id="tags" placeholder="leadership, ai" />
    <button type="submit">Add Quote</button>
  </form>
  <hr />
  <div id="list"></div>
  <script>
    async function load() {
      const res = await fetch('/quotes');
      const data = await res.json();
      const el = document.getElementById('list');
      el.innerHTML = data.rows.map(r => '<div style="margin:8px 0; padding:8px; border:1px solid #ddd;"><div style="font-size:14px;">' + r.content + '</div><div style="color:#666; font-size:12px;">' + (r.author||'') + ' ' + (r.source?('· '+r.source):'') + ' ' + (r.tags?('· '+r.tags):'') + '</div><button data-id="' + r.id + '">Delete</button></div>').join('');
      el.querySelectorAll('button[data-id]').forEach(b => b.onclick = async () => { await fetch('/quotes/' + b.dataset.id, { method: 'DELETE' }); load(); });
    }
    document.getElementById('qform').onsubmit = async (e) => {
      e.preventDefault();
      const payload = {
        content: document.getElementById('content').value,
        author: document.getElementById('author').value,
        source: document.getElementById('source').value,
        tags: document.getElementById('tags').value
      };
      await fetch('/quotes', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      document.getElementById('content').value = '';
      load();
    };
    load();
  </script>
</body></html>`;
    reply.headers({ 'content-type': 'text/html; charset=utf-8' }).send(html);
  });
  app.get('/quotes', async (request) => {
    const { limit = 50, q = '' } = request.query || {};
    let rows = db.prepare(`SELECT id, content, author, source, tags, created_at FROM quotes ORDER BY created_at DESC LIMIT ?`).all(Number(limit));
    if (q) {
      const needle = (q || '').toLowerCase();
      rows = rows.filter(r => `${r.content} ${r.author || ''} ${r.tags || ''}`.toLowerCase().includes(needle));
    }
    return { rows };
  });

  app.post('/quotes', async (request) => {
    const { content, author, source, tags } = request.body || {};
    if (!content) return { error: 'content_required' };
    const id = randomUUID();
    db.prepare(`INSERT INTO quotes (id, content, author, source, tags) VALUES (?,?,?,?,?)`).run(id, content, author || null, source || null, Array.isArray(tags) ? tags.join(',') : (tags || null));
    return { id };
  });

  app.delete('/quotes/:id', async (request) => {
    const { id } = request.params || {};
    db.prepare(`DELETE FROM quotes WHERE id = ?`).run(id);
    return { ok: true };
  });
}


