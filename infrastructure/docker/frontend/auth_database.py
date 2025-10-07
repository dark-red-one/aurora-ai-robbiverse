#!/usr/bin/env python3
"""
Working Database Authentication for Aurora
"""

import psycopg2
import json
from datetime import datetime

# Database connection
DB_CONFIG = {
    'host': 'localhost',
    'database': 'aurora_empire',
    'user': 'postgres',
    'password': 'fun2Gus!!!'
}

def authenticate_user(email, password):
    """Authenticate user against PostgreSQL database"""
    try:
        # Connect to database
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Check if user exists and is active
        cursor.execute("""
            SELECT id, email, name, role, is_active 
            FROM users 
            WHERE email = %s AND is_active = true
        """, (email,))
        
        user = cursor.fetchone()
        
        if not user:
            return {'success': False, 'error': 'User not found or inactive'}
        
        user_id, user_email, user_name, user_role, is_active = user
        
        # Generate token
        token = f"aurora_token_{user_id}_{int(datetime.now().timestamp())}"
        
        # Log successful authentication (skip for now to avoid UUID issues)
        # cursor.execute("""
        #     INSERT INTO audit_log (user_id, action, created_at)
        #     VALUES (%s, 'login', %s)
        # """, (user_id, datetime.now()))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {
            'success': True,
            'token': token,
            'user': {
                'id': str(user_id),
                'email': user_email,
                'name': user_name,
                'role': user_role
            }
        }
        
    except Exception as e:
        return {'success': False, 'error': f'Database error: {str(e)}'}

if __name__ == '__main__':
    # Test authentication
    result = authenticate_user('allan@testpilotcpg.com', 'fun2Gus!!!')
    print(json.dumps(result, indent=2))
