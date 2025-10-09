// Minimal RAG Retriever
// Loads index JSON and retrieves top-k documents by cosine similarity

import fs from 'fs';
import path from 'path';
import { loadIndex, queryIndex } from './indexer.js';

export function retrieveContext({ profileDir, indexFile, query, k = 4, maxChars = 1200 }) {
  const idx = loadIndex(indexFile);
  if (!idx) return '';
  const hits = queryIndex(idx, query, k);
  const parts = [];
  for (const h of hits) {
    const fp = path.join(profileDir, h.id);
    const text = fs.existsSync(fp) ? fs.readFileSync(fp, 'utf8') : h.preview;
    parts.push(`---\n# ${h.id} (score=${h.score.toFixed(3)})\n${text.slice(0, maxChars)}\n`);
    if (parts.join('\n').length >= maxChars * 1.5) break;
  }
  return parts.join('\n');
}
