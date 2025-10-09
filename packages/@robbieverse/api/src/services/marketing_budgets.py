#!/usr/bin/env python3
"""
Marketing Budget Management Service
Track budgets, expenses, and spending across campaigns
Part of Robbie@Growth marketing platform
"""

import os
import json
import logging
from datetime import datetime, date
from typing import Dict, List, Optional
from decimal import Decimal
import psycopg2
from psycopg2.extras import RealDictCursor
from pydantic import BaseModel

logger = logging.getLogger(__name__)

# ============================================================================
# CONFIGURATION
# ============================================================================

POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = int(os.getenv("POSTGRES_PORT", "5432"))
POSTGRES_DB = os.getenv("POSTGRES_DB", "robbieverse")
POSTGRES_USER = os.getenv("POSTGRES_USER", "robbie")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "")

# ============================================================================
# MODELS
# ============================================================================

class Budget(BaseModel):
    """Marketing budget"""
    name: str
    description: Optional[str] = None
    total_budget: Decimal
    period_start: date
    period_end: date
    category: str  # 'ads', 'tools', 'content', 'events', 'agencies', 'other'
    owner: Optional[str] = None
    is_active: bool = True
    metadata: Dict = {}

class Expense(BaseModel):
    """Marketing expense"""
    budget_id: str
    description: str
    amount: Decimal
    expense_date: date
    vendor: Optional[str] = None
    category: Optional[str] = None
    receipt_url: Optional[str] = None
    invoice_number: Optional[str] = None
    submitted_by: Optional[str] = None
    notes: Optional[str] = None
    metadata: Dict = {}

# ============================================================================
# DATABASE
# ============================================================================

def get_db_connection():
    """Get PostgreSQL connection"""
    return psycopg2.connect(
        host=POSTGRES_HOST,
        port=POSTGRES_PORT,
        database=POSTGRES_DB,
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD
    )

# ============================================================================
# BUDGET MANAGEMENT
# ============================================================================

def create_budget(budget: Budget) -> Dict:
    """Create a new marketing budget"""
    conn = get_db_connection()
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                INSERT INTO marketing_budgets
                (name, description, total_budget, period_start, period_end, 
                 category, owner, is_active, metadata)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, name, total_budget, spent, remaining
            """, (
                budget.name,
                budget.description,
                budget.total_budget,
                budget.period_start,
                budget.period_end,
                budget.category,
                budget.owner,
                budget.is_active,
                json.dumps(budget.metadata)
            ))
            
            result = cur.fetchone()
            conn.commit()
            
            logger.info(f"✅ Created budget: {result['name']} (${result['total_budget']})")
            return {
                "success": True,
                "budget_id": str(result["id"]),
                "name": result["name"],
                "total_budget": float(result["total_budget"]),
                "remaining": float(result["remaining"])
            }
            
    except Exception as e:
        logger.error(f"❌ Failed to create budget: {e}")
        conn.rollback()
        return {"success": False, "error": str(e)}
        
    finally:
        conn.close()

def get_budgets(
    category: Optional[str] = None,
    is_active: Optional[bool] = None,
    current_only: bool = False
) -> List[Dict]:
    """Get marketing budgets with filters"""
    conn = get_db_connection()
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            query = """
                SELECT 
                    id,
                    name,
                    description,
                    total_budget,
                    spent,
                    remaining,
                    period_start,
                    period_end,
                    category,
                    owner,
                    is_active,
                    ROUND((spent / NULLIF(total_budget, 0)) * 100, 2) as spend_percentage,
                    created_at,
                    updated_at
                FROM marketing_budgets
                WHERE 1=1
            """
            params = []
            
            if category:
                query += " AND category = %s"
                params.append(category)
            
            if is_active is not None:
                query += " AND is_active = %s"
                params.append(is_active)
            
            if current_only:
                query += " AND period_start <= CURRENT_DATE AND period_end >= CURRENT_DATE"
            
            query += " ORDER BY period_start DESC, name ASC"
            
            cur.execute(query, params)
            budgets = cur.fetchall()
            
            return [dict(budget) for budget in budgets]
            
    finally:
        conn.close()

def get_budget_summary() -> Dict:
    """Get overall budget summary"""
    conn = get_db_connection()
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Overall summary
            cur.execute("""
                SELECT 
                    COUNT(*) as total_budgets,
                    SUM(total_budget) as total_allocated,
                    SUM(spent) as total_spent,
                    SUM(remaining) as total_remaining,
                    ROUND((SUM(spent) / NULLIF(SUM(total_budget), 0)) * 100, 2) as overall_spend_percentage
                FROM marketing_budgets
                WHERE is_active = true
                AND period_start <= CURRENT_DATE 
                AND period_end >= CURRENT_DATE
            """)
            
            overall = cur.fetchone()
            
            # By category
            cur.execute("""
                SELECT 
                    category,
                    COUNT(*) as budget_count,
                    SUM(total_budget) as total_allocated,
                    SUM(spent) as total_spent,
                    SUM(remaining) as total_remaining,
                    ROUND((SUM(spent) / NULLIF(SUM(total_budget), 0)) * 100, 2) as spend_percentage
                FROM marketing_budgets
                WHERE is_active = true
                AND period_start <= CURRENT_DATE 
                AND period_end >= CURRENT_DATE
                GROUP BY category
                ORDER BY total_allocated DESC
            """)
            
            by_category = cur.fetchall()
            
            # Recent expenses (last 30 days)
            cur.execute("""
                SELECT COUNT(*) as expense_count,
                       SUM(amount) as total_amount
                FROM marketing_expenses
                WHERE expense_date > CURRENT_DATE - INTERVAL '30 days'
                AND status = 'approved'
            """)
            
            recent_expenses = cur.fetchone()
            
            # Pending approvals
            cur.execute("""
                SELECT COUNT(*) as pending_count,
                       SUM(amount) as pending_amount
                FROM marketing_expenses
                WHERE status = 'pending'
            """)
            
            pending = cur.fetchone()
            
            return {
                "success": True,
                "overall": dict(overall) if overall else {},
                "by_category": [dict(cat) for cat in by_category],
                "recent_expenses": dict(recent_expenses) if recent_expenses else {},
                "pending_approvals": dict(pending) if pending else {}
            }
            
    except Exception as e:
        logger.error(f"❌ Failed to get budget summary: {e}")
        return {"success": False, "error": str(e)}
        
    finally:
        conn.close()

# ============================================================================
# EXPENSE MANAGEMENT
# ============================================================================

def create_expense(expense: Expense) -> Dict:
    """Create a new expense"""
    conn = get_db_connection()
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Check if budget exists and has remaining funds
            cur.execute("""
                SELECT total_budget, spent, remaining, name
                FROM marketing_budgets
                WHERE id = %s AND is_active = true
            """, (expense.budget_id,))
            
            budget = cur.fetchone()
            if not budget:
                return {"success": False, "error": "Budget not found or inactive"}
            
            if budget["remaining"] < expense.amount:
                return {
                    "success": False,
                    "error": f"Insufficient budget. Remaining: ${budget['remaining']}, Requested: ${expense.amount}"
                }
            
            # Create expense
            cur.execute("""
                INSERT INTO marketing_expenses
                (budget_id, description, amount, expense_date, vendor, category,
                 receipt_url, invoice_number, submitted_by, notes, metadata, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'pending')
                RETURNING id, description, amount, status
            """, (
                expense.budget_id,
                expense.description,
                expense.amount,
                expense.expense_date,
                expense.vendor,
                expense.category,
                expense.receipt_url,
                expense.invoice_number,
                expense.submitted_by,
                expense.notes,
                json.dumps(expense.metadata)
            ))
            
            result = cur.fetchone()
            conn.commit()
            
            logger.info(f"✅ Created expense: {result['description']} (${result['amount']}) - Status: {result['status']}")
            return {
                "success": True,
                "expense_id": str(result["id"]),
                "description": result["description"],
                "amount": float(result["amount"]),
                "status": result["status"],
                "requires_approval": True
            }
            
    except Exception as e:
        logger.error(f"❌ Failed to create expense: {e}")
        conn.rollback()
        return {"success": False, "error": str(e)}
        
    finally:
        conn.close()

def approve_expense(expense_id: str, approved_by: str, notes: Optional[str] = None) -> Dict:
    """Approve an expense"""
    conn = get_db_connection()
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                UPDATE marketing_expenses
                SET status = 'approved',
                    approved_by = %s,
                    approved_at = CURRENT_TIMESTAMP,
                    notes = COALESCE(%s, notes),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s AND status = 'pending'
                RETURNING id, description, amount, budget_id
            """, (approved_by, notes, expense_id))
            
            result = cur.fetchone()
            
            if not result:
                return {"success": False, "error": "Expense not found or already processed"}
            
            conn.commit()
            
            logger.info(f"✅ Approved expense: {result['description']} (${result['amount']}) by {approved_by}")
            return {
                "success": True,
                "expense_id": str(result["id"]),
                "description": result["description"],
                "amount": float(result["amount"]),
                "status": "approved"
            }
            
    except Exception as e:
        logger.error(f"❌ Failed to approve expense: {e}")
        conn.rollback()
        return {"success": False, "error": str(e)}
        
    finally:
        conn.close()

def reject_expense(expense_id: str, approved_by: str, notes: Optional[str] = None) -> Dict:
    """Reject an expense"""
    conn = get_db_connection()
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                UPDATE marketing_expenses
                SET status = 'rejected',
                    approved_by = %s,
                    approved_at = CURRENT_TIMESTAMP,
                    notes = COALESCE(%s, notes),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s AND status = 'pending'
                RETURNING id, description, amount
            """, (approved_by, notes, expense_id))
            
            result = cur.fetchone()
            
            if not result:
                return {"success": False, "error": "Expense not found or already processed"}
            
            conn.commit()
            
            logger.info(f"✅ Rejected expense: {result['description']} (${result['amount']}) by {approved_by}")
            return {
                "success": True,
                "expense_id": str(result["id"]),
                "status": "rejected"
            }
            
    except Exception as e:
        logger.error(f"❌ Failed to reject expense: {e}")
        conn.rollback()
        return {"success": False, "error": str(e)}
        
    finally:
        conn.close()

def get_pending_expenses(limit: int = 50) -> List[Dict]:
    """Get expenses awaiting approval"""
    conn = get_db_connection()
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT 
                    e.id,
                    e.description,
                    e.amount,
                    e.expense_date,
                    e.vendor,
                    e.category,
                    e.receipt_url,
                    e.invoice_number,
                    e.submitted_by,
                    e.notes,
                    e.created_at,
                    b.name as budget_name,
                    b.category as budget_category,
                    b.remaining as budget_remaining
                FROM marketing_expenses e
                JOIN marketing_budgets b ON b.id = e.budget_id
                WHERE e.status = 'pending'
                ORDER BY e.created_at DESC
                LIMIT %s
            """, (limit,))
            
            expenses = cur.fetchall()
            return [dict(expense) for expense in expenses]
            
    finally:
        conn.close()

def get_expenses(
    budget_id: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = 100
) -> List[Dict]:
    """Get expenses with filters"""
    conn = get_db_connection()
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            query = """
                SELECT 
                    e.id,
                    e.description,
                    e.amount,
                    e.expense_date,
                    e.vendor,
                    e.category,
                    e.status,
                    e.receipt_url,
                    e.invoice_number,
                    e.submitted_by,
                    e.approved_by,
                    e.approved_at,
                    e.notes,
                    e.created_at,
                    b.name as budget_name,
                    b.category as budget_category
                FROM marketing_expenses e
                JOIN marketing_budgets b ON b.id = e.budget_id
                WHERE 1=1
            """
            params = []
            
            if budget_id:
                query += " AND e.budget_id = %s"
                params.append(budget_id)
            
            if status:
                query += " AND e.status = %s"
                params.append(status)
            
            if start_date:
                query += " AND e.expense_date >= %s"
                params.append(start_date)
            
            if end_date:
                query += " AND e.expense_date <= %s"
                params.append(end_date)
            
            query += " ORDER BY e.expense_date DESC, e.created_at DESC LIMIT %s"
            params.append(limit)
            
            cur.execute(query, params)
            expenses = cur.fetchall()
            
            return [dict(expense) for expense in expenses]
            
    finally:
        conn.close()

# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    print("🧪 Testing Marketing Budget Service")
    
    # Get budget summary
    summary = get_budget_summary()
    print(f"Budget Summary: {json.dumps(summary, indent=2, default=str)}")
    
    # Get pending expenses
    pending = get_pending_expenses()
    print(f"Pending Expenses: {len(pending)}")

