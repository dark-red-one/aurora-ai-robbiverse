#!/usr/bin/env python3
"""
Robbie@Growth API Routes
Marketing automation, budgets, campaigns, and LinkedIn management
"""

import logging
from datetime import datetime, date
from typing import Optional, List
from decimal import Decimal
from fastapi import APIRouter, HTTPException, Query, Body
from pydantic import BaseModel

# Import services
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from services import buffer_integration, marketing_budgets, campaign_manager, growth_automation

logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/growth", tags=["growth"])

# ============================================================================
# MODELS
# ============================================================================

class BufferAccountRequest(BaseModel):
    account_type: str
    account_name: str
    account_handle: Optional[str] = None
    buffer_profile_id: str
    access_token: str
    is_active: bool = True

class BufferPostRequest(BaseModel):
    account_id: str
    content: str
    media_urls: List[str] = []
    scheduled_at: Optional[datetime] = None
    campaign_id: Optional[str] = None
    utm_params: dict = {}

class BudgetRequest(BaseModel):
    name: str
    description: Optional[str] = None
    total_budget: float
    period_start: date
    period_end: date
    category: str
    owner: Optional[str] = None

class ExpenseRequest(BaseModel):
    budget_id: str
    description: str
    amount: float
    expense_date: date = date.today()
    vendor: Optional[str] = None
    category: Optional[str] = None
    receipt_url: Optional[str] = None
    invoice_number: Optional[str] = None
    submitted_by: Optional[str] = None
    notes: Optional[str] = None

class CampaignRequest(BaseModel):
    name: str
    description: Optional[str] = None
    goal: Optional[str] = None
    budget_allocated: float = 0
    start_date: date
    end_date: Optional[date] = None
    channels: List[str] = []
    target_metrics: dict = {}
    owner: Optional[str] = None
    utm_campaign: Optional[str] = None

class LinkedInActionRequest(BaseModel):
    action_type: str
    target_profile_url: Optional[str] = None
    target_post_url: Optional[str] = None
    content: Optional[str] = None
    reason: str
    quality_score: int = 7
    priority: int = 5
    contact_id: Optional[str] = None
    deal_id: Optional[str] = None
    campaign_id: Optional[str] = None

# ============================================================================
# BUFFER INTEGRATION ROUTES
# ============================================================================

@router.post("/buffer/sync-accounts")
async def sync_buffer_accounts():
    """Sync Buffer accounts from API"""
    result = await buffer_integration.sync_buffer_accounts()
    if not result["success"]:
        raise HTTPException(status_code=500, detail=result.get("error"))
    return result

@router.post("/buffer/posts")
async def create_buffer_post(post: BufferPostRequest):
    """Create a new Buffer post"""
    result = await buffer_integration.create_post(
        account_id=post.account_id,
        content=post.content,
        scheduled_at=post.scheduled_at,
        media_urls=post.media_urls,
        campaign_id=post.campaign_id,
        utm_params=post.utm_params
    )
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result

@router.get("/buffer/posts/scheduled")
async def get_scheduled_posts(
    account_id: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100)
):
    """Get scheduled Buffer posts"""
    posts = await buffer_integration.get_scheduled_posts(account_id, limit)
    return {"success": True, "posts": posts, "count": len(posts)}

@router.get("/buffer/calendar")
async def get_content_calendar(days: int = Query(14, ge=1, le=90)):
    """Get content calendar"""
    return await buffer_integration.get_content_calendar(days)

@router.post("/buffer/sync-engagement")
async def sync_post_engagement():
    """Sync engagement metrics from Buffer"""
    result = await buffer_integration.sync_post_engagement()
    if not result["success"]:
        raise HTTPException(status_code=500, detail=result.get("error"))
    return result

# ============================================================================
# BUDGET MANAGEMENT ROUTES
# ============================================================================

@router.post("/budgets")
def create_budget(budget: BudgetRequest):
    """Create a new marketing budget"""
    budget_obj = marketing_budgets.Budget(
        name=budget.name,
        description=budget.description,
        total_budget=Decimal(str(budget.total_budget)),
        period_start=budget.period_start,
        period_end=budget.period_end,
        category=budget.category,
        owner=budget.owner
    )
    
    result = marketing_budgets.create_budget(budget_obj)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result

@router.get("/budgets")
def get_budgets(
    category: Optional[str] = None,
    is_active: Optional[bool] = None,
    current_only: bool = False
):
    """Get budgets with filters"""
    budgets = marketing_budgets.get_budgets(category, is_active, current_only)
    return {"success": True, "budgets": budgets, "count": len(budgets)}

@router.get("/budgets/summary")
def get_budget_summary():
    """Get budget summary dashboard"""
    return marketing_budgets.get_budget_summary()

@router.post("/expenses")
def create_expense(expense: ExpenseRequest):
    """Create a new expense"""
    expense_obj = marketing_budgets.Expense(
        budget_id=expense.budget_id,
        description=expense.description,
        amount=Decimal(str(expense.amount)),
        expense_date=expense.expense_date,
        vendor=expense.vendor,
        category=expense.category,
        receipt_url=expense.receipt_url,
        invoice_number=expense.invoice_number,
        submitted_by=expense.submitted_by,
        notes=expense.notes
    )
    
    result = marketing_budgets.create_expense(expense_obj)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result

@router.post("/expenses/{expense_id}/approve")
def approve_expense(expense_id: str, approved_by: str = Body(..., embed=True)):
    """Approve an expense"""
    result = marketing_budgets.approve_expense(expense_id, approved_by)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result

@router.post("/expenses/{expense_id}/reject")
def reject_expense(
    expense_id: str,
    approved_by: str = Body(...),
    notes: Optional[str] = Body(None)
):
    """Reject an expense"""
    result = marketing_budgets.reject_expense(expense_id, approved_by, notes)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result

@router.get("/expenses/pending")
def get_pending_expenses(limit: int = Query(50, ge=1, le=100)):
    """Get expenses awaiting approval"""
    expenses = marketing_budgets.get_pending_expenses(limit)
    return {"success": True, "expenses": expenses, "count": len(expenses)}

# ============================================================================
# CAMPAIGN MANAGEMENT ROUTES
# ============================================================================

@router.post("/campaigns")
def create_campaign(campaign: CampaignRequest):
    """Create a new marketing campaign"""
    campaign_obj = campaign_manager.Campaign(
        name=campaign.name,
        description=campaign.description,
        goal=campaign.goal,
        budget_allocated=Decimal(str(campaign.budget_allocated)),
        start_date=campaign.start_date,
        end_date=campaign.end_date,
        channels=campaign.channels,
        target_metrics=campaign.target_metrics,
        owner=campaign.owner,
        utm_campaign=campaign.utm_campaign
    )
    
    result = campaign_manager.create_campaign(campaign_obj)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result

@router.get("/campaigns")
def get_campaigns(
    status: Optional[str] = None,
    owner: Optional[str] = None,
    active_only: bool = False
):
    """Get campaigns with filters"""
    campaigns = campaign_manager.get_campaigns(status, owner, active_only)
    return {"success": True, "campaigns": campaigns, "count": len(campaigns)}

@router.patch("/campaigns/{campaign_id}/status")
def update_campaign_status(campaign_id: str, status: str = Body(..., embed=True)):
    """Update campaign status"""
    result = campaign_manager.update_campaign_status(campaign_id, status)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result

@router.patch("/campaigns/{campaign_id}/metrics")
def update_campaign_metrics(campaign_id: str, metrics: dict = Body(...)):
    """Update campaign metrics"""
    result = campaign_manager.update_campaign_metrics(campaign_id, metrics)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result

@router.post("/campaigns/{campaign_id}/spend")
def record_campaign_spend(
    campaign_id: str,
    amount: float = Body(...),
    description: str = Body(...)
):
    """Record spend against a campaign"""
    result = campaign_manager.record_campaign_spend(
        campaign_id,
        Decimal(str(amount)),
        description
    )
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result

@router.get("/campaigns/{campaign_id}/performance")
def get_campaign_performance(campaign_id: str):
    """Get detailed campaign performance"""
    result = campaign_manager.get_campaign_performance(campaign_id)
    if not result["success"]:
        raise HTTPException(status_code=404, detail=result.get("error"))
    return result

@router.get("/campaigns/roi-dashboard")
def get_roi_dashboard():
    """Get ROI dashboard"""
    result = campaign_manager.get_roi_dashboard()
    if not result["success"]:
        raise HTTPException(status_code=500, detail=result.get("error"))
    return result

@router.post("/campaigns/{campaign_id}/snapshot")
def create_performance_snapshot(campaign_id: str):
    """Create daily performance snapshot"""
    result = campaign_manager.create_performance_snapshot(campaign_id)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result

# ============================================================================
# AUTOMATION ROUTES
# ============================================================================

@router.get("/automation/settings")
def get_automation_settings(user_id: int = Query(1)):
    """Get automation settings"""
    result = growth_automation.get_automation_settings(user_id)
    if not result["success"]:
        raise HTTPException(status_code=404, detail=result.get("error"))
    return result

@router.patch("/automation/level")
def update_automation_level(
    user_id: int = Body(1),
    level: int = Body(..., ge=0, le=100)
):
    """Update automation level (0-100)"""
    result = growth_automation.update_automation_level(user_id, level)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result

@router.patch("/automation/action-settings")
def update_action_settings(
    user_id: int = Body(1),
    action_type: str = Body(...),
    settings: dict = Body(...)
):
    """Update settings for a specific action type"""
    result = growth_automation.update_action_settings(user_id, action_type, settings)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result

# ============================================================================
# LINKEDIN ACTION QUEUE ROUTES
# ============================================================================

@router.post("/linkedin/actions")
def queue_linkedin_action(action: LinkedInActionRequest):
    """Queue a LinkedIn action"""
    action_obj = growth_automation.LinkedInAction(
        action_type=action.action_type,
        target_profile_url=action.target_profile_url,
        target_post_url=action.target_post_url,
        content=action.content,
        reason=action.reason,
        quality_score=action.quality_score,
        priority=action.priority,
        contact_id=action.contact_id,
        deal_id=action.deal_id,
        campaign_id=action.campaign_id
    )
    
    result = growth_automation.queue_action(action_obj)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result

@router.get("/linkedin/actions/pending")
def get_pending_actions(limit: int = Query(20, ge=1, le=100)):
    """Get actions awaiting approval"""
    actions = growth_automation.get_pending_actions(limit)
    return {"success": True, "actions": actions, "count": len(actions)}

@router.get("/linkedin/actions/approved")
def get_approved_actions(limit: int = Query(50, ge=1, le=100)):
    """Get actions ready for execution"""
    actions = growth_automation.get_approved_actions(limit)
    return {"success": True, "actions": actions, "count": len(actions)}

@router.post("/linkedin/actions/{action_id}/approve")
def approve_action(action_id: str, approved_by: str = Body(..., embed=True)):
    """Approve a LinkedIn action"""
    result = growth_automation.approve_action(action_id, approved_by)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result

@router.post("/linkedin/actions/{action_id}/reject")
def reject_action(
    action_id: str,
    approved_by: str = Body(...),
    reason: Optional[str] = Body(None)
):
    """Reject a LinkedIn action"""
    result = growth_automation.reject_action(action_id, approved_by, reason)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result

@router.post("/linkedin/actions/{action_id}/executed")
def mark_action_executed(action_id: str, result_data: dict = Body(...)):
    """Mark action as executed"""
    result = growth_automation.mark_action_executed(action_id, result_data)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result

# ============================================================================
# LEAD SCORING ROUTES
# ============================================================================

@router.post("/linkedin/leads/{contact_id}/score")
def calculate_lead_score(contact_id: str):
    """Calculate and store lead score"""
    result = growth_automation.calculate_and_store_lead_score(contact_id)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result

@router.get("/linkedin/leads/hot")
def get_hot_leads(limit: int = Query(20, ge=1, le=100)):
    """Get hot leads"""
    leads = growth_automation.get_hot_leads(limit)
    return {"success": True, "leads": leads, "count": len(leads)}

# ============================================================================
# DASHBOARD ROUTES
# ============================================================================

@router.get("/dashboard")
def get_growth_dashboard():
    """Get complete growth dashboard"""
    from services.marketing_budgets import get_budget_summary
    from services.campaign_manager import get_roi_dashboard
    from services.growth_automation import get_pending_actions, get_hot_leads
    
    budget_summary = get_budget_summary()
    roi_dashboard = get_roi_dashboard()
    pending_actions = get_pending_actions(10)
    hot_leads = get_hot_leads(10)
    
    return {
        "success": True,
        "budgets": budget_summary.get("overall", {}),
        "campaigns": roi_dashboard.get("summary", {}),
        "pending_approvals": len(pending_actions),
        "hot_leads_count": len(hot_leads),
        "hot_leads": hot_leads[:5]  # Top 5 hot leads
    }

# Export router
__all__ = ["router"]

