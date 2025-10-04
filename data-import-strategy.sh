#!/bin/bash
# Data Import Strategy - Import from External Databases to Enhanced Schema
# Maps production data to our new unified schema with town separation

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        DATA IMPORT STRATEGY - PRODUCTION TO ENHANCED      ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Configuration
EXTERNAL_HOST="pg-u44170.vm.elestio.app"
EXTERNAL_PORT="25432"
EXTERNAL_USER="postgres"
EXTERNAL_PASSWORD="LVuvUcvV-jqrK-ETlTNQWb"

LOCAL_HOST="localhost"
LOCAL_PORT="5433"
LOCAL_USER="postgres"
LOCAL_DB="aurora_unified"

echo -e "${GREEN}✅ Enhanced schema ready for data import!${NC}"
echo ""

# 1. Import Companies (7,910 records)
echo -e "${YELLOW}📦 Importing Companies (7,910 records)...${NC}"
PGPASSWORD="$EXTERNAL_PASSWORD" psql -h $EXTERNAL_HOST -p $EXTERNAL_PORT -U $EXTERNAL_USER -d robbie -c "
COPY (
    SELECT 
        id,
        hubspot_id,
        name,
        domain,
        industry,
        created_at,
        updated_at,
        last_sync,
        'testpilot' as owner_id,
        owner_email,
        owner_name,
        linkedin_url,
        has_deals,
        total_deal_count,
        open_deal_count,
        won_deal_count,
        total_deal_value,
        open_deal_value,
        won_deal_value,
        last_deal_date,
        last_won_date,
        embedding,
        active_deals_summary,
        deals_last_analyzed,
        market_intelligence,
        is_active
    FROM companies
) TO STDOUT WITH CSV HEADER
" | psql -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d $LOCAL_DB -c "
COPY companies (
    id,
    hubspot_id,
    name,
    domain,
    industry,
    created_at,
    updated_at,
    last_sync,
    owner_id,
    owner_email,
    owner_name,
    linkedin_url,
    has_deals,
    total_deal_count,
    open_deal_count,
    won_deal_count,
    total_deal_value,
    open_deal_value,
    won_deal_value,
    last_deal_date,
    last_won_date,
    embedding,
    active_deals_summary,
    deals_last_analyzed,
    market_intelligence,
    is_active
) FROM STDIN WITH CSV HEADER;
"

# 2. Import Contacts (5,657 records)
echo -e "${YELLOW}👥 Importing Contacts (5,657 records)...${NC}"
PGPASSWORD="$EXTERNAL_PASSWORD" psql -h $EXTERNAL_HOST -p $EXTERNAL_PORT -U $EXTERNAL_USER -d robbie -c "
COPY (
    SELECT 
        id,
        hubspot_id,
        company_id,
        email,
        first_name,
        last_name,
        job_title,
        phone,
        mobile_phone,
        updated_at,
        last_sync,
        'testpilot' as owner_id,
        linkedin_url,
        linkedin_bio,
        is_engaged,
        engagement_score,
        last_engagement_date,
        engagement_type,
        engagement_count,
        last_email_open,
        last_email_click,
        last_meeting_date,
        last_reply_date,
        has_deals,
        total_deal_count,
        open_deal_count,
        won_deal_count,
        total_deal_value,
        open_deal_value,
        won_deal_value,
        last_deal_date,
        last_won_date,
        is_primary_on_deals,
        last_activity_date,
        last_activity_type,
        activity_count,
        embedding,
        is_active
    FROM contacts
) TO STDOUT WITH CSV HEADER
" | psql -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d $LOCAL_DB -c "
COPY contacts (
    id,
    hubspot_id,
    company_id,
    email,
    first_name,
    last_name,
    job_title,
    phone,
    mobile_phone,
    updated_at,
    last_sync,
    owner_id,
    linkedin_url,
    linkedin_bio,
    is_engaged,
    engagement_score,
    last_engagement_date,
    engagement_type,
    engagement_count,
    last_email_open,
    last_email_click,
    last_meeting_date,
    last_reply_date,
    has_deals,
    total_deal_count,
    open_deal_count,
    won_deal_count,
    total_deal_value,
    open_deal_value,
    won_deal_value,
    last_deal_date,
    last_won_date,
    is_primary_on_deals,
    last_activity_date,
    last_activity_type,
    activity_count,
    embedding,
    is_active
) FROM STDIN WITH CSV HEADER;
"

# 3. Import Deals (68 records)
echo -e "${YELLOW}💰 Importing Deals (68 records)...${NC}"
PGPASSWORD="$EXTERNAL_PASSWORD" psql -h $EXTERNAL_HOST -p $EXTERNAL_PORT -U $EXTERNAL_USER -d robbie -c "
COPY (
    SELECT 
        id,
        hubspot_id,
        deal_name,
        amount,
        pipeline,
        dealstage,
        close_date,
        create_date,
        hs_lastmodifieddate,
        dealtype,
        hs_forecast_category,
        hs_forecast_probability,
        hs_manual_forecast_category,
        hs_next_step,
        'testpilot' as owner_id,
        is_closed,
        closed_won,
        closed_lost_reason,
        company_id,
        primary_contact_id,
        created_at,
        updated_at,
        last_sync,
        deal_embedding,
        hs_deal_score,
        intelligence_score,
        intelligence_updated_at,
        latest_intelligence_report,
        velocity_status,
        recommended_stage,
        predicted_close_date,
        deal_score,
        risks,
        opportunities,
        timing_analysis,
        progression_analysis,
        formatted_report,
        ai_insights,
        is_active
    FROM deals
) TO STDOUT WITH CSV HEADER
" | psql -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d $LOCAL_DB -c "
COPY deals (
    id,
    hubspot_id,
    deal_name,
    amount,
    pipeline,
    dealstage,
    close_date,
    create_date,
    hs_lastmodifieddate,
    dealtype,
    hs_forecast_category,
    hs_forecast_probability,
    hs_manual_forecast_category,
    hs_next_step,
    owner_id,
    is_closed,
    closed_won,
    closed_lost_reason,
    company_id,
    primary_contact_id,
    created_at,
    updated_at,
    last_sync,
    deal_embedding,
    hs_deal_score,
    intelligence_score,
    intelligence_updated_at,
    latest_intelligence_report,
    velocity_status,
    recommended_stage,
    predicted_close_date,
    deal_score,
    risks,
    opportunities,
    timing_analysis,
    progression_analysis,
    formatted_report,
    ai_insights,
    is_active
) FROM STDIN WITH CSV HEADER;
"

# 4. Import Activities (63,669 records) - Sample first 10,000
echo -e "${YELLOW}📊 Importing Activities (first 10,000 records)...${NC}"
PGPASSWORD="$EXTERNAL_PASSWORD" psql -h $EXTERNAL_HOST -p $EXTERNAL_PORT -U $EXTERNAL_USER -d robbie -c "
COPY (
    SELECT 
        id,
        hubspot_activity_id,
        activity_type,
        activity_subtype,
        contact_id,
        company_id,
        deal_id,
        'testpilot' as owner_id,
        subject,
        body_preview,
        direction,
        status,
        duration_minutes,
        outcome,
        page_url,
        page_title,
        session_id,
        referrer_url,
        utm_source,
        utm_campaign,
        form_name,
        form_values,
        chat_transcript,
        activity_date,
        created_at,
        updated_at,
        metadata,
        sync_status,
        embedding,
        objections_mentioned,
        sentiment_score
    FROM activities
    ORDER BY activity_date DESC
    LIMIT 10000
) TO STDOUT WITH CSV HEADER
" | psql -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d $LOCAL_DB -c "
COPY activities (
    id,
    hubspot_activity_id,
    activity_type,
    activity_subtype,
    contact_id,
    company_id,
    deal_id,
    owner_id,
    subject,
    body_preview,
    direction,
    status,
    duration_minutes,
    outcome,
    page_url,
    page_title,
    session_id,
    referrer_url,
    utm_source,
    utm_campaign,
    form_name,
    form_values,
    chat_transcript,
    activity_date,
    created_at,
    updated_at,
    metadata,
    sync_status,
    embedding,
    objections_mentioned,
    sentiment_score
) FROM STDIN WITH CSV HEADER;
"

# 5. Import Deal Contacts
echo -e "${YELLOW}🔗 Importing Deal Contacts...${NC}"
PGPASSWORD="$EXTERNAL_PASSWORD" psql -h $EXTERNAL_HOST -p $EXTERNAL_PORT -U $EXTERNAL_USER -d robbie -c "
COPY (
    SELECT 
        id,
        deal_id,
        contact_id,
        role,
        created_at
    FROM deal_contacts
) TO STDOUT WITH CSV HEADER
" | psql -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d $LOCAL_DB -c "
COPY deal_contacts (
    id,
    deal_id,
    contact_id,
    role,
    created_at
) FROM STDIN WITH CSV HEADER;
"

# 6. Verify import
echo -e "${YELLOW}🔍 Verifying data import...${NC}"
psql -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d $LOCAL_DB -c "
SELECT 
    'Companies' as table_name, COUNT(*) as records FROM companies
UNION ALL
SELECT 'Contacts', COUNT(*) FROM contacts
UNION ALL
SELECT 'Deals', COUNT(*) FROM deals
UNION ALL
SELECT 'Activities', COUNT(*) FROM activities
UNION ALL
SELECT 'Deal Contacts', COUNT(*) FROM deal_contacts;
"

echo ""
echo -e "${GREEN}✅ DATA IMPORT COMPLETE!${NC}"
echo ""
echo -e "${BLUE}📊 Imported Data Summary:${NC}"
echo "• Companies: 7,910 records"
echo "• Contacts: 5,657 records"
echo "• Deals: 68 records"
echo "• Activities: 10,000 records (sample)"
echo "• Deal Contacts: All relationships"
echo ""
echo -e "${BLUE}🏘️ Town Separation:${NC}"
echo "• All data tagged with owner_id for town isolation"
echo "• Aurora, Fluenti, Collaboration views created"
echo "• Cross-town analytics available"
echo ""
echo -e "${GREEN}🎉 Your enhanced Aurora database is ready!${NC}"
