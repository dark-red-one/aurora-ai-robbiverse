import { exec } from "child_process";
import { promisify } from "util";
import { db } from "./db.js";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

const execAsync = promisify(exec);

export function logInteraction(channel, action, content, metadata = {}, userId = 'allan') {
  try {
    db.prepare(`
      INSERT INTO interactions (id, channel, action, content, metadata, user_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      randomUUID(),
      channel,
      action,
      content,
      JSON.stringify(metadata),
      userId
    );
  } catch (error) {
    console.error('Failed to log interaction:', error);
  }
}

export async function syncGitRepo(repoPath) {
  try {
    if (!fs.existsSync(repoPath)) {
      logInteraction('git', 'error', `Repo not found: ${repoPath}`, { error: 'not_found' });
      return false;
    }

    const { stdout: lastCommit } = await execAsync('git rev-parse HEAD', { cwd: repoPath });
    const commitHash = lastCommit.trim();

    // Check if we've seen this commit before
    const existing = db.prepare(`
      SELECT last_commit FROM git_sync WHERE repo_path = ? AND last_commit = ?
    `).get(repoPath, commitHash);

    if (existing) {
      return true; // Already synced
    }

    // Get recent commits
    const { stdout: commits } = await execAsync(
      'git log --oneline -10 --pretty=format:"%h|%s|%an|%ad" --date=short',
      { cwd: repoPath }
    );

    const commitLines = commits.trim().split('\n').filter(Boolean);
    
    for (const line of commitLines) {
      const [hash, message, author, date] = line.split('|');
      
      // Log each commit as an interaction
      logInteraction('git', 'commit', message, {
        hash,
        author,
        date,
        repo: path.basename(repoPath)
      });
    }

    // Update sync tracking
    db.prepare(`
      INSERT OR REPLACE INTO git_sync (id, repo_path, last_commit, last_sync)
      VALUES (?, ?, ?, datetime('now'))
    `).run(randomUUID(), repoPath, commitHash);

    logInteraction('git', 'sync', `Synced ${commitLines.length} commits from ${path.basename(repoPath)}`, {
      repo: path.basename(repoPath),
      commit_count: commitLines.length
    });

    return true;
  } catch (error) {
    logInteraction('git', 'error', `Git sync failed: ${error.message}`, { 
      repo: repoPath,
      error: error.message 
    });
    return false;
  }
}

export function getRecentInteractions(limit = 20, channel = null) {
  let query = `
    SELECT channel, action, content, metadata, user_id, created_at
    FROM interactions
  `;
  const params = [];
  
  if (channel) {
    query += ' WHERE channel = ?';
    params.push(channel);
  }
  
  query += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit);
  
  return db.prepare(query).all(...params);
}

export function getInteractionStats() {
  const stats = db.prepare(`
    SELECT 
      channel,
      COUNT(*) as count,
      MAX(created_at) as last_activity
    FROM interactions 
    GROUP BY channel
    ORDER BY count DESC
  `).all();
  
  return stats;
}

// Auto-sync common repos
export async function startGitSync() {
  const commonRepos = [
    '/home/allan/vengeance',
    '/home/allan/src/robbie_v3',
    '/home/allan/testpilot_platform'
  ];

  for (const repo of commonRepos) {
    if (fs.existsSync(repo)) {
      await syncGitRepo(repo);
    }
  }
}
