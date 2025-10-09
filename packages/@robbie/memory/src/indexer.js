// Minimal RAG Indexer (file-based)
// Builds a simple embedding index from all .md/.txt files in a directory
// Persists to JSON alongside the data directory

import fs from 'fs';
import path from 'path';

function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function tokenize(text) {
  return normalize(text).split(' ').filter(Boolean);
}

function termFrequency(tokens) {
  const counts = new Map();
  for (const t of tokens) counts.set(t, (counts.get(t) || 0) + 1);
  const max = Math.max(1, ...counts.values());
  const tf = Object.fromEntries(Array.from(counts.entries()).map(([k, v]) => [k, v / max]));
  return tf;
}

function cosineSimilarity(a, b) {
  let dot = 0;
  let aNorm = 0;
  let bNorm = 0;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    const av = a[k] || 0;
    const bv = b[k] || 0;
    dot += av * bv;
    aNorm += av * av;
    bNorm += bv * bv;
  }
  const denom = Math.sqrt(aNorm) * Math.sqrt(bNorm) || 1;
  return dot / denom;
}

export function buildIndex(dataDir, outFile) {
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.md') || f.endsWith('.txt'));
  const docs = [];
  for (const file of files) {
    const fp = path.join(dataDir, file);
    const text = fs.readFileSync(fp, 'utf8');
    const tokens = tokenize(text);
    const tf = termFrequency(tokens);
    docs.push({ id: file, tf, preview: text.slice(0, 500) });
  }
  fs.writeFileSync(outFile, JSON.stringify({ dataDir, builtAt: new Date().toISOString(), docs }, null, 2));
  return { count: docs.length, outFile };
}

export function loadIndex(outFile) {
  if (!fs.existsSync(outFile)) return null;
  return JSON.parse(fs.readFileSync(outFile, 'utf8'));
}

export function queryIndex(index, query, k = 4) {
  const qtf = termFrequency(tokenize(query));
  const scored = index.docs.map(d => ({ id: d.id, score: cosineSimilarity(qtf, d.tf), preview: d.preview }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}
