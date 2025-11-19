'''
Business: User authentication (registration and login)
Args: event - dict with httpMethod, body, queryStringParameters
      context - object with attributes: request_id, function_name
Returns: HTTP response dict with user data or error
'''
import json
import os
import hashlib
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    # Handle CORS OPTIONS request
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
    
    try:
        db_url = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(db_url)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            if action == 'register':
                username = body_data.get('username')
                email = body_data.get('email')
                password = body_data.get('password')
                
                password_hash = hash_password(password)
                
                cur.execute(
                    "INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s) RETURNING id, username, email, avatar_url, status",
                    (username, email, password_hash)
                )
                user = cur.fetchone()
                conn.commit()
                
                # Add user to default server
                cur.execute(
                    "INSERT INTO server_members (server_id, user_id) VALUES (1, %s)",
                    (user['id'],)
                )
                conn.commit()
                
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'user': dict(user), 'message': 'Registration successful'})
                }
            
            elif action == 'login':
                email = body_data.get('email')
                password = body_data.get('password')
                
                password_hash = hash_password(password)
                
                cur.execute(
                    "SELECT id, username, email, avatar_url, status FROM users WHERE email = %s AND password_hash = %s",
                    (email, password_hash)
                )
                user = cur.fetchone()
                
                cur.close()
                conn.close()
                
                if user:
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps({'user': dict(user), 'message': 'Login successful'})
                    }
                else:
                    return {
                        'statusCode': 401,
                        'headers': headers,
                        'body': json.dumps({'error': 'Invalid credentials'})
                    }
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 405,
            'headers': headers,
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }
