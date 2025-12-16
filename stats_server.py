from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

STATS_FILE = 'stats.json'

def load_stats():
    if not os.path.exists(STATS_FILE):
        return {
            'total_visits': 0,
            'daily_visits': {},  # Format: "YYYY-MM-DD": count
            'unique_visitors': {}, # Format: "YYYY-MM-DD": [ip_list]
            'total_unique_ips': [] # List of all unique IPs ever seen
        }
    try:
        with open(STATS_FILE, 'r') as f:
            stats = json.load(f)
            # Ensure new field exists for existing files
            if 'total_unique_ips' not in stats:
                stats['total_unique_ips'] = []
            return stats
    except:
        return {
            'total_visits': 0,
            'daily_visits': {},
            'unique_visitors': {},
            'total_unique_ips': []
        }

def save_stats(stats):
    with open(STATS_FILE, 'w') as f:
        json.dump(stats, f, indent=4)

@app.route('/api/visit', methods=['POST'])
def record_visit():
    stats = load_stats()
    today = datetime.now().strftime('%Y-%m-%d')
    client_ip = request.remote_addr
    
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 收到访问请求，IP: {client_ip}")

    # Update total visits
    stats['total_visits'] += 1
    
    # Update daily visits (PV)
    if today not in stats['daily_visits']:
        stats['daily_visits'][today] = 0
    stats['daily_visits'][today] += 1
    
    # Update unique visitors (UV)
    if 'unique_visitors' not in stats:
        stats['unique_visitors'] = {}
    if today not in stats['unique_visitors']:
        stats['unique_visitors'][today] = []
    
    if client_ip not in stats['unique_visitors'][today]:
        stats['unique_visitors'][today].append(client_ip)
    
    # Update total unique IPs (Total Users)
    if 'total_unique_ips' not in stats:
        stats['total_unique_ips'] = []
    
    # Check if client_ip is already in the list
    if client_ip not in stats['total_unique_ips']:
        stats['total_unique_ips'].append(client_ip)
    
    save_stats(stats)
    
    return jsonify({
        'total_visits': stats['total_visits'],
        'today_visits': len(stats['unique_visitors'][today]), # Return UV for today
        'total_users': len(stats['total_unique_ips']) # Return total unique IPs
    })

@app.route('/api/stats', methods=['GET'])
def get_stats():
    stats = load_stats()
    today = datetime.now().strftime('%Y-%m-%d')
    
    today_uv = 0
    if 'unique_visitors' in stats and today in stats['unique_visitors']:
        today_uv = len(stats['unique_visitors'][today])
    
    total_users = 0
    if 'total_unique_ips' in stats:
        total_users = len(stats['total_unique_ips'])
        
    return jsonify({
        'total_visits': stats['total_visits'],
        'today_visits': today_uv,
        'total_users': total_users
    })

if __name__ == '__main__':
    print("Starting Statistics Server on port 5000...")
    app.run(host='0.0.0.0', port=5000)
