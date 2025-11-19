'''
Business: Manage chat messages (send, receive, list)
Args: event - dict with httpMethod, body, queryStringParameters
      context - object with attributes: request_id, function_name
Returns: HTTP response dict with messages or success status
'''
import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

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
        
        if method == 'GET':
            params = event.get('queryStringParameters', {})
            channel_id = params.get('channel_id', '1')
            
            cur.execute(
                """
                SELECT m.id, m.content, m.created_at, 
                       u.id as user_id, u.username, u.avatar_url
                FROM messages m
                JOIN users u ON m.user_id = u.id
                WHERE m.channel_id = %s
                ORDER BY m.created_at DESC
                LIMIT 50
                """,
                (channel_id,)
            )
            messages = cur.fetchall()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'messages': [dict(msg) for msg in messages]}, default=str)
            }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            channel_id = body_data.get('channel_id')
            user_id = body_data.get('user_id')
            content = body_data.get('content')
            
            cur.execute(
                """
                INSERT INTO messages (channel_id, user_id, content) 
                VALUES (%s, %s, %s)
                RETURNING id, channel_id, user_id, content, created_at
                """,
                (channel_id, user_id, content)
            )
            message = cur.fetchone()
            conn.commit()
            
            # Get user info
            cur.execute(
                "SELECT username, avatar_url FROM users WHERE id = %s",
                (user_id,)
            )
            user = cur.fetchone()
            
            cur.close()
            conn.close()
            
            result = dict(message)
            result['username'] = user['username']
            result['avatar_url'] = user['avatar_url']
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'message': result}, default=str)
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
