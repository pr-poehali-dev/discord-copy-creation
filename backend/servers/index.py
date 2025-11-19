'''
Business: Manage servers and channels (list, create)
Args: event - dict with httpMethod, body, queryStringParameters
      context - object with attributes: request_id, function_name
Returns: HTTP response dict with servers/channels data
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
            user_id = params.get('user_id')
            
            if user_id:
                # Get servers for user
                cur.execute(
                    """
                    SELECT s.id, s.name, s.icon_url, s.created_at
                    FROM servers s
                    JOIN server_members sm ON s.id = sm.server_id
                    WHERE sm.user_id = %s
                    ORDER BY s.created_at
                    """,
                    (user_id,)
                )
            else:
                # Get all servers
                cur.execute("SELECT id, name, icon_url, created_at FROM servers ORDER BY created_at")
            
            servers = cur.fetchall()
            
            # Get channels for each server
            result = []
            for server in servers:
                cur.execute(
                    "SELECT id, name, type FROM channels WHERE server_id = %s ORDER BY id",
                    (server['id'],)
                )
                channels = cur.fetchall()
                
                server_dict = dict(server)
                server_dict['channels'] = [dict(ch) for ch in channels]
                result.append(server_dict)
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'servers': result}, default=str)
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
