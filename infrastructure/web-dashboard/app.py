#!/usr/bin/env python3
"""
Aurora Business Intelligence Dashboard
Real-time visualization of TestPilot Simulations data
"""

import os
from datetime import datetime, timedelta
from flask import Flask, render_template, jsonify, request
import psycopg2
import psycopg2.extras
from typing import Dict, List, Any
import json

app = Flask(__name__)
app.config['SECRET_KEY'] = 'aurora-testpilot-2025'

# Database configuration
DB_CONFIG = {
    "host": "aurora-postgres-u44170.vm.elestio.app",
    "port": 25432,
    "dbname": "aurora_unified",
    "user": "aurora_app",
    "password": "TestPilot2025_Aurora!",
    "sslmode": "require"
}

def get_db_connection():
    """Get database connection with dict cursor"""
    conn = psycopg2.connect(**DB_CONFIG)
    conn.cursor_factory = psycopg2.extras.RealDictCursor
    return conn

@app.route('/')
def dashboard():
    """Main dashboard page"""
    return render_template('dashboard.html')

@app.route('/api/overview')
def api_overview():
    """Get overview statistics"""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            stats = {}
            
            # HubSpot data
            cur.execute("SELECT COUNT(*) FROM companies WHERE owner_id = %s", ('aurora',))
            stats['companies'] = cur.fetchone()['count']
            
            cur.execute("SELECT COUNT(*) FROM contacts WHERE owner_id = %s", ('aurora',))
            stats['contacts'] = cur.fetchone()['count']
            
            cur.execute("SELECT COUNT(*) FROM deals WHERE owner_id = %s", ('aurora',))
            stats['deals'] = cur.fetchone()['count']
            
            cur.execute("SELECT COALESCE(SUM(amount), 0) FROM deals WHERE owner_id = %s", ('aurora',))
            stats['total_deal_value'] = float(cur.fetchone()['coalesce'])
            
            # Google Workspace data (if tables exist)
            try:
                cur.execute("SELECT COUNT(*) FROM google_emails WHERE owner_id = %s", ('aurora',))
                stats['emails'] = cur.fetchone()['count']
            except:
                stats['emails'] = 0
            
            try:
                cur.execute("SELECT COUNT(*) FROM google_calendar_events WHERE owner_id = %s", ('aurora',))
                stats['events'] = cur.fetchone()['count']
            except:
                stats['events'] = 0
            
            try:
                cur.execute("SELECT COUNT(*) FROM google_drive_files WHERE owner_id = %s", ('aurora',))
                stats['files'] = cur.fetchone()['count']
            except:
                stats['files'] = 0
            
            # Meetings data
            try:
                cur.execute("SELECT COUNT(*) FROM meetings WHERE owner_id = %s", ('aurora',))
                stats['meetings'] = cur.fetchone()['count']
            except:
                stats['meetings'] = 0
            
            return jsonify(stats)
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/deals-pipeline')
def api_deals_pipeline():
    """Get deals by pipeline stage"""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    dealstage,
                    COUNT(*) as count,
                    COALESCE(SUM(amount), 0) as total_value
                FROM deals 
                WHERE owner_id = %s
                GROUP BY dealstage
                ORDER BY total_value DESC
            """, ('aurora',))
            
            pipeline_data = []
            for row in cur.fetchall():
                pipeline_data.append({
                    'stage': row['dealstage'] or 'Unknown',
                    'count': row['count'],
                    'value': float(row['total_value'])
                })
            
            return jsonify(pipeline_data)
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/recent-activity')
def api_recent_activity():
    """Get recent activity across all systems"""
    conn = get_db_connection()
    activities = []
    
    try:
        with conn.cursor() as cur:
            # Recent deals
            cur.execute("""
                SELECT 
                    'deal' as type,
                    deal_name as title,
                    amount,
                    dealstage as status,
                    create_date as timestamp
                FROM deals 
                WHERE owner_id = %s AND create_date IS NOT NULL
                ORDER BY create_date DESC
                LIMIT 5
            """, ('aurora',))
            
            for row in cur.fetchall():
                activities.append({
                    'type': row['type'],
                    'title': row['title'],
                    'amount': float(row['amount']) if row['amount'] else 0,
                    'status': row['status'],
                    'timestamp': row['timestamp'].isoformat() if row['timestamp'] else None
                })
            
            # Recent emails (if table exists)
            try:
                cur.execute("""
                    SELECT 
                        'email' as type,
                        subject as title,
                        from_email as status,
                        email_date as timestamp
                    FROM google_emails 
                    WHERE owner_id = %s AND is_business = true
                    ORDER BY email_date DESC
                    LIMIT 5
                """, ('aurora',))
                
                for row in cur.fetchall():
                    activities.append({
                        'type': row['type'],
                        'title': row['title'],
                        'status': row['status'],
                        'timestamp': row['timestamp'].isoformat() if row['timestamp'] else None
                    })
            except:
                pass
            
            # Recent meetings (if table exists)
            try:
                cur.execute("""
                    SELECT 
                        'meeting' as type,
                        title,
                        organizer as status,
                        meeting_date as timestamp
                    FROM meetings 
                    WHERE owner_id = %s
                    ORDER BY meeting_date DESC
                    LIMIT 3
                """, ('aurora',))
                
                for row in cur.fetchall():
                    activities.append({
                        'type': row['type'],
                        'title': row['title'],
                        'status': row['status'],
                        'timestamp': row['timestamp'].isoformat() if row['timestamp'] else None
                    })
            except:
                pass
            
            # Sort all activities by timestamp
            activities.sort(key=lambda x: x['timestamp'] or '', reverse=True)
            
            return jsonify(activities[:10])
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/companies')
def api_companies():
    """Get companies data"""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    name,
                    domain,
                    industry,
                    total_deal_value,
                    total_deal_count,
                    created_at
                FROM companies 
                WHERE owner_id = %s
                ORDER BY total_deal_value DESC NULLS LAST
                LIMIT 20
            """, ('aurora',))
            
            companies = []
            for row in cur.fetchall():
                companies.append({
                    'name': row['name'],
                    'domain': row['domain'],
                    'industry': row['industry'],
                    'deal_value': float(row['total_deal_value']) if row['total_deal_value'] else 0,
                    'deal_count': row['total_deal_count'] or 0,
                    'created_at': row['created_at'].isoformat() if row['created_at'] else None
                })
            
            return jsonify(companies)
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/email-insights')
def api_email_insights():
    """Get email insights (if Google data available)"""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            insights = {}
            
            try:
                # Email volume by day
                cur.execute("""
                    SELECT 
                        DATE(email_date) as date,
                        COUNT(*) as count,
                        COUNT(*) FILTER (WHERE is_business = true) as business_count
                    FROM google_emails 
                    WHERE owner_id = %s 
                    AND email_date > NOW() - INTERVAL '30 days'
                    GROUP BY DATE(email_date)
                    ORDER BY date DESC
                    LIMIT 30
                """, ('aurora',))
                
                email_volume = []
                for row in cur.fetchall():
                    email_volume.append({
                        'date': row['date'].isoformat(),
                        'total': row['count'],
                        'business': row['business_count']
                    })
                
                insights['volume'] = email_volume
                
                # Top senders
                cur.execute("""
                    SELECT 
                        from_email,
                        COUNT(*) as count
                    FROM google_emails 
                    WHERE owner_id = %s 
                    AND is_business = true
                    AND email_date > NOW() - INTERVAL '30 days'
                    GROUP BY from_email
                    ORDER BY count DESC
                    LIMIT 10
                """, ('aurora',))
                
                top_senders = []
                for row in cur.fetchall():
                    top_senders.append({
                        'email': row['from_email'],
                        'count': row['count']
                    })
                
                insights['top_senders'] = top_senders
                
            except Exception as e:
                insights['error'] = f"Google email data not available: {str(e)}"
            
            return jsonify(insights)
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/calendar-insights')
def api_calendar_insights():
    """Get calendar insights (if Google data available)"""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            insights = {}
            
            try:
                # Upcoming events
                cur.execute("""
                    SELECT 
                        title,
                        start_time,
                        end_time,
                        attendees,
                        location
                    FROM google_calendar_events 
                    WHERE owner_id = %s 
                    AND start_time > NOW()
                    ORDER BY start_time ASC
                    LIMIT 10
                """, ('aurora',))
                
                upcoming_events = []
                for row in cur.fetchall():
                    upcoming_events.append({
                        'title': row['title'],
                        'start_time': row['start_time'].isoformat() if row['start_time'] else None,
                        'end_time': row['end_time'].isoformat() if row['end_time'] else None,
                        'attendees': row['attendees'] or [],
                        'location': row['location']
                    })
                
                insights['upcoming'] = upcoming_events
                
                # Meeting frequency
                cur.execute("""
                    SELECT 
                        DATE(start_time) as date,
                        COUNT(*) as count
                    FROM google_calendar_events 
                    WHERE owner_id = %s 
                    AND start_time > NOW() - INTERVAL '30 days'
                    AND start_time < NOW() + INTERVAL '7 days'
                    GROUP BY DATE(start_time)
                    ORDER BY date DESC
                """, ('aurora',))
                
                meeting_frequency = []
                for row in cur.fetchall():
                    meeting_frequency.append({
                        'date': row['date'].isoformat(),
                        'count': row['count']
                    })
                
                insights['frequency'] = meeting_frequency
                
            except Exception as e:
                insights['error'] = f"Google calendar data not available: {str(e)}"
            
            return jsonify(insights)
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
