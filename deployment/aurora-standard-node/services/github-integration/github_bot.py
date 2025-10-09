#!/usr/bin/env python3
"""
GitHub Integration Service
Handles PR reviews, issue management, and security alerts
"""

import os
import json
import logging
import asyncio
from datetime import datetime
from typing import Dict, List, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
import redis
import httpx
from github import Github
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
fastapi_app = FastAPI(title="GitHub Integration Service")

# Configuration
NODE_NAME = os.getenv("NODE_NAME", "unknown")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "postgres")
POSTGRES_PORT = int(os.getenv("POSTGRES_PORT", "5432"))
POSTGRES_DB = os.getenv("POSTGRES_DB", "aurora_unified")
POSTGRES_USER = os.getenv("POSTGRES_USER", "aurora_app")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "")

REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", "")

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
GITHUB_REPO = os.getenv("GITHUB_REPO", "allanperetz/aurora-ai-robbiverse")
PRIORITY_ENGINE_URL = os.getenv("PRIORITY_ENGINE_URL", "http://priority-surface:8002")

# Redis client
redis_client = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    password=REDIS_PASSWORD if REDIS_PASSWORD else None,
    decode_responses=True
)


def get_db_connection():
    """Get PostgreSQL connection"""
    return psycopg2.connect(
        host=POSTGRES_HOST,
        port=POSTGRES_PORT,
        database=POSTGRES_DB,
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD,
        cursor_factory=RealDictCursor
    )


@fastapi_app.on_event("startup")
async def startup_event():
    """Initialize GitHub integration"""
    logger.info(f"🚀 Starting GitHub Integration on {NODE_NAME}...")

    # Ensure GitHub tables exist
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS github_repositories (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    owner TEXT NOT NULL,
                    name TEXT NOT NULL,
                    full_name TEXT NOT NULL,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(owner, name)
                )
            """)

            cur.execute("""
                CREATE TABLE IF NOT EXISTS github_issues (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    repo_id UUID REFERENCES github_repositories(id) ON DELETE CASCADE,
                    github_issue_id INTEGER NOT NULL,
                    title TEXT NOT NULL,
                    body TEXT,
                    state TEXT NOT NULL,
                    labels JSONB DEFAULT '[]'::jsonb,
                    assignee TEXT,
                    priority VARCHAR(10) DEFAULT 'medium',
                    status VARCHAR(20) DEFAULT 'open',
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(repo_id, github_issue_id)
                )
            """)

            cur.execute("""
                CREATE TABLE IF NOT EXISTS github_pull_requests (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    repo_id UUID REFERENCES github_repositories(id) ON DELETE CASCADE,
                    github_pr_id INTEGER NOT NULL,
                    title TEXT NOT NULL,
                    body TEXT,
                    state TEXT NOT NULL,
                    base_branch TEXT,
                    head_branch TEXT,
                    author TEXT,
                    reviewer TEXT,
                    review_status VARCHAR(20) DEFAULT 'pending',
                    priority VARCHAR(10) DEFAULT 'medium',
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(repo_id, github_pr_id)
                )
            """)

            cur.execute("""
                CREATE TABLE IF NOT EXISTS github_security_alerts (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    repo_id UUID REFERENCES github_repositories(id) ON DELETE CASCADE,
                    github_alert_id INTEGER NOT NULL,
                    severity TEXT NOT NULL,
                    summary TEXT NOT NULL,
                    description TEXT,
                    package_name TEXT,
                    vulnerable_version TEXT,
                    fixed_in_version TEXT,
                    status VARCHAR(20) DEFAULT 'open',
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    resolved_at TIMESTAMPTZ,
                    UNIQUE(repo_id, github_alert_id)
                )
            """)

            conn.commit()

        logger.info("✅ GitHub integration ready")

    finally:
        conn.close()


@fastapi_app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "github-integration", "node": NODE_NAME}


@fastapi_app.post("/api/github/webhook")
async def github_webhook(body: Dict):
    """Handle GitHub webhook events"""
    logger.info(f"🔗 GitHub webhook received: {body}")

    action = body.get("action")
    event_type = body.get("type", body.get("zen"))  # GitHub sends 'zen' for ping

    if event_type == "ping":
        return {"status": "ok", "message": "GitHub webhook ping received"}

    # Process different event types
    if "pull_request" in body:
        await handle_pull_request_event(body)
    elif "issues" in body:
        await handle_issue_event(body)
    elif "security_advisory" in body:
        await handle_security_alert(body)

    return {"status": "processed"}


async def handle_pull_request_event(body: Dict):
    """Handle PR events (opened, review_requested, etc.)"""
    pr = body["pull_request"]
    action = body["action"]
    repo = body["repository"]

    # Store/update PR in database
    await store_pull_request(repo, pr)

    # Create priority task for review if needed
    if action in ["opened", "review_requested"]:
        await create_pr_review_task(pr, repo)


async def handle_issue_event(body: Dict):
    """Handle issue events (opened, assigned, etc.)"""
    issue = body["issue"]
    action = body["action"]
    repo = body["repository"]

    # Store/update issue in database
    await store_issue(repo, issue)

    # Create priority task for assignment if needed
    if action == "opened":
        await create_issue_task(issue, repo)


async def handle_security_alert(body: Dict):
    """Handle security vulnerability alerts"""
    alert = body["alert"]
    repo = body["repository"]

    # Store security alert
    await store_security_alert(repo, alert)

    # Create high-priority security task
    await create_security_task(alert, repo)


async def store_pull_request(repo: Dict, pr: Dict):
    """Store PR information in database"""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                # Get or create repository
                cur.execute("""
                    INSERT INTO github_repositories (owner, name, full_name)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (owner, name) DO NOTHING
                """, (repo["owner"]["login"], repo["name"], repo["full_name"]))

                # Get repo ID
                cur.execute("""
                    SELECT id FROM github_repositories WHERE owner = %s AND name = %s
                """, (repo["owner"]["login"], repo["name"]))
                repo_row = cur.fetchone()
                repo_id = repo_row["id"]

                # Store/update PR
                cur.execute("""
                    INSERT INTO github_pull_requests (
                        repo_id, github_pr_id, title, body, state, base_branch,
                        head_branch, author, reviewer, review_status, priority
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (repo_id, github_pr_id) DO UPDATE SET
                        title = EXCLUDED.title,
                        body = EXCLUDED.body,
                        state = EXCLUDED.state,
                        updated_at = NOW()
                """, (
                    repo_id, pr["number"], pr["title"], pr.get("body", ""),
                    pr["state"], pr["base"]["ref"], pr["head"]["ref"],
                    pr["user"]["login"], None, "pending", "medium"
                ))

                conn.commit()

        finally:
            conn.close()

    except Exception as e:
        logger.error(f"❌ Error storing PR: {e}")


async def store_issue(repo: Dict, issue: Dict):
    """Store issue information in database"""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                # Get or create repository
                cur.execute("""
                    INSERT INTO github_repositories (owner, name, full_name)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (owner, name) DO NOTHING
                """, (repo["owner"]["login"], repo["name"], repo["full_name"]))

                # Get repo ID
                cur.execute("""
                    SELECT id FROM github_repositories WHERE owner = %s AND name = %s
                """, (repo["owner"]["login"], repo["name"]))
                repo_row = cur.fetchone()
                repo_id = repo_row["id"]

                # Store/update issue
                cur.execute("""
                    INSERT INTO github_issues (
                        repo_id, github_issue_id, title, body, state, labels,
                        assignee, priority, status
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (repo_id, github_issue_id) DO UPDATE SET
                        title = EXCLUDED.title,
                        body = EXCLUDED.body,
                        state = EXCLUDED.state,
                        labels = EXCLUDED.labels,
                        assignee = EXCLUDED.assignee,
                        updated_at = NOW()
                """, (
                    repo_id, issue["number"], issue["title"], issue.get("body", ""),
                    issue["state"], json.dumps([label["name"] for label in issue.get("labels", [])]),
                    issue.get("assignee", {}).get("login") if issue.get("assignee") else None,
                    "medium", issue["state"]
                ))

                conn.commit()

        finally:
            conn.close()

    except Exception as e:
        logger.error(f"❌ Error storing issue: {e}")


async def store_security_alert(repo: Dict, alert: Dict):
    """Store security alert in database"""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                # Get or create repository
                cur.execute("""
                    INSERT INTO github_repositories (owner, name, full_name)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (owner, name) DO NOTHING
                """, (repo["owner"]["login"], repo["name"], repo["full_name"]))

                # Get repo ID
                cur.execute("""
                    SELECT id FROM github_repositories WHERE owner = %s AND name = %s
                """, (repo["owner"]["login"], repo["name"]))
                repo_row = cur.fetchone()
                repo_id = repo_row["id"]

                # Store security alert
                cur.execute("""
                    INSERT INTO github_security_alerts (
                        repo_id, github_alert_id, severity, summary, description,
                        package_name, vulnerable_version, fixed_in_version, status
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (repo_id, github_alert_id) DO UPDATE SET
                        severity = EXCLUDED.severity,
                        summary = EXCLUDED.summary,
                        description = EXCLUDED.description,
                        status = EXCLUDED.status
                """, (
                    repo_id, alert["id"], alert["security_advisory"]["severity"],
                    alert["security_advisory"]["summary"], alert["security_advisory"].get("description", ""),
                    alert.get("vulnerable_manifest_path", "").split("/")[-1] if alert.get("vulnerable_manifest_path") else None,
                    alert["security_vulnerability"]["vulnerable_version_range"],
                    alert["security_advisory"]["fixed_in"], "open"
                ))

                conn.commit()

        finally:
            conn.close()

    except Exception as e:
        logger.error(f"❌ Error storing security alert: {e}")


async def create_pr_review_task(pr: Dict, repo: Dict):
    """Create priority task for PR review"""
    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{PRIORITY_ENGINE_URL}/api/priorities/task",
                json={
                    "title": f"Review PR: {pr['title']}",
                    "description": f"PR #{pr['number']} in {repo['full_name']}\n\n{pr.get('body', '')[:200]}...",
                    "category": "development",
                    "urgency": 80,
                    "importance": 70,
                    "effort": 30,
                    "context_relevance": 90,
                    "dependencies": [],
                    "personality_alignment": {"gandhi": 8, "flirty": 5, "turbo": 6, "auto": 7},
                    "metadata": {
                        "github_pr_id": pr["number"],
                        "github_repo": repo["full_name"],
                        "github_url": pr["html_url"]
                    }
                },
                headers={"X-API-Key": os.getenv("API_KEY", "robbie-2025")},
                timeout=10.0
            )

        logger.info(f"✅ Created PR review task for #{pr['number']}")

    except Exception as e:
        logger.error(f"❌ Error creating PR review task: {e}")


async def create_issue_task(issue: Dict, repo: Dict):
    """Create priority task for issue"""
    urgency = 60
    if "bug" in [label["name"].lower() for label in issue.get("labels", [])]:
        urgency = 85
    elif "enhancement" in [label["name"].lower() for label in issue.get("labels", [])]:
        urgency = 70

    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{PRIORITY_ENGINE_URL}/api/priorities/task",
                json={
                    "title": f"Issue: {issue['title']}",
                    "description": f"Issue #{issue['number']} in {repo['full_name']}\n\n{issue.get('body', '')[:200]}...",
                    "category": "development",
                    "urgency": urgency,
                    "importance": 60,
                    "effort": 45,
                    "context_relevance": 80,
                    "dependencies": [],
                    "personality_alignment": {"gandhi": 7, "flirty": 5, "turbo": 6, "auto": 6},
                    "metadata": {
                        "github_issue_id": issue["number"],
                        "github_repo": repo["full_name"],
                        "github_url": issue["html_url"]
                    }
                },
                headers={"X-API-Key": os.getenv("API_KEY", "robbie-2025")},
                timeout=10.0
            )

        logger.info(f"✅ Created issue task for #{issue['number']}")

    except Exception as e:
        logger.error(f"❌ Error creating issue task: {e}")


async def create_security_task(alert: Dict, repo: Dict):
    """Create high-priority security task"""
    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{PRIORITY_ENGINE_URL}/api/priorities/task",
                json={
                    "title": f"🔴 SECURITY: {alert['security_advisory']['summary']}",
                    "description": f"Security vulnerability in {repo['full_name']}\n\nPackage: {alert.get('vulnerable_manifest_path', 'Unknown')}\nSeverity: {alert['security_advisory']['severity']}\n\n{alert['security_advisory'].get('description', '')}",
                    "category": "security",
                    "urgency": 95,
                    "importance": 90,
                    "effort": 60,
                    "context_relevance": 100,
                    "dependencies": [],
                    "personality_alignment": {"gandhi": 9, "flirty": 3, "turbo": 8, "auto": 8},
                    "metadata": {
                        "github_alert_id": alert["id"],
                        "github_repo": repo["full_name"],
                        "severity": alert["security_advisory"]["severity"]
                    }
                },
                headers={"X-API-Key": os.getenv("API_KEY", "robbie-2025")},
                timeout=10.0
            )

        logger.info(f"✅ Created security task for alert {alert['id']}")

    except Exception as e:
        logger.error(f"❌ Error creating security task: {e}")


@fastapi_app.get("/api/github/repositories")
async def get_repositories():
    """Get all tracked GitHub repositories"""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT * FROM github_repositories ORDER BY created_at DESC
                """)

                repos = cur.fetchall()
                return {"repositories": [dict(r) for r in repos]}

        finally:
            conn.close()

    except Exception as e:
        logger.error(f"Error getting repositories: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@fastapi_app.get("/api/github/issues")
async def get_issues(repo_id: Optional[str] = None):
    """Get GitHub issues"""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                query = "SELECT * FROM github_issues WHERE 1=1"
                params = []

                if repo_id:
                    query += " AND repo_id = %s"
                    params.append(repo_id)

                query += " ORDER BY updated_at DESC"

                cur.execute(query, params)
                issues = cur.fetchall()
                return {"issues": [dict(i) for i in issues]}

        finally:
            conn.close()

    except Exception as e:
        logger.error(f"Error getting issues: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@fastapi_app.get("/api/github/security-alerts")
async def get_security_alerts(repo_id: Optional[str] = None):
    """Get GitHub security alerts"""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                query = "SELECT * FROM github_security_alerts WHERE 1=1"
                params = []

                if repo_id:
                    query += " AND repo_id = %s"
                    params.append(repo_id)

                query += " ORDER BY created_at DESC"

                cur.execute(query, params)
                alerts = cur.fetchall()
                return {"alerts": [dict(a) for a in alerts]}

        finally:
            conn.close()

    except Exception as e:
        logger.error(f"Error getting security alerts: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def run_github_monitoring():
    """Background task to monitor GitHub for new activity"""
    while True:
        try:
            if GITHUB_TOKEN:
                g = Github(GITHUB_TOKEN)
                repo = g.get_repo(GITHUB_REPO)

                # Check for new PRs
                for pr in repo.get_pulls(state="open"):
                    await store_pull_request({"owner": {"login": repo.owner.login}, "name": repo.name, "full_name": repo.full_name}, {
                        "number": pr.number,
                        "title": pr.title,
                        "body": pr.body,
                        "state": pr.state,
                        "base": {"ref": pr.base.ref},
                        "head": {"ref": pr.head.ref},
                        "user": {"login": pr.user.login},
                        "html_url": pr.html_url
                    })

                # Check for new issues
                for issue in repo.get_issues(state="open"):
                    await store_issue({"owner": {"login": repo.owner.login}, "name": repo.name, "full_name": repo.full_name}, {
                        "number": issue.number,
                        "title": issue.title,
                        "body": issue.body,
                        "state": issue.state,
                        "labels": [{"name": label.name} for label in issue.labels],
                        "assignee": {"login": issue.assignee.login} if issue.assignee else None,
                        "html_url": issue.html_url
                    })

                # Check for security alerts
                try:
                    alerts = repo.get_vulnerability_alert()
                    for alert in alerts:
                        await store_security_alert({"owner": {"login": repo.owner.login}, "name": repo.name, "full_name": repo.full_name}, {
                            "id": alert.id,
                            "security_advisory": {
                                "severity": alert.security_advisory.severity,
                                "summary": alert.security_advisory.summary,
                                "description": alert.security_advisory.description,
                                "fixed_in": alert.security_advisory.fixed_in
                            },
                            "vulnerable_manifest_path": alert.vulnerable_manifest_path,
                            "security_vulnerability": {
                                "vulnerable_version_range": alert.security_vulnerability.vulnerable_version_range
                            }
                        })
                except Exception as e:
                    logger.warning(f"Could not fetch security alerts: {e}")

            await asyncio.sleep(300)  # Check every 5 minutes

        except Exception as e:
            logger.error(f"❌ GitHub monitoring error: {e}")
            await asyncio.sleep(60)  # Wait 1 minute before retry


async def main():
    """Main entry point"""
    # Start GitHub monitoring in background
    monitoring_task = asyncio.create_task(run_github_monitoring())

    # Start FastAPI server
    import uvicorn
    config = uvicorn.Config(fastapi_app, host="0.0.0.0", port=3004)
    server = uvicorn.Server(config)

    try:
        await server.serve()
    except KeyboardInterrupt:
        logger.info("🛑 Shutting down GitHub integration...")
    finally:
        monitoring_task.cancel()
        await server.shutdown()


if __name__ == "__main__":
    asyncio.run(main())
