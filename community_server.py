from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os
import uuid
from datetime import datetime

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["https://akiyo.fun", "http://127.0.0.1:5500", "http://localhost:5500"]}})

PORT = 5002
DATA_FILE = 'messages.json'
ADMIN_KEY = os.environ.get('ADMIN_KEY', 'F1yCar')

def load_msgs():
    if not os.path.exists(DATA_FILE): return []
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f: return json.load(f)
    except: return []

def save_msgs(data):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

# 获取所有留言
@app.route('/api/messages', methods=['GET'])
def get_messages():
    return jsonify(load_msgs())

# 用户提交留言
@app.route('/api/messages', methods=['POST'])
def add_message():
    data = request.json
    qq = str(data.get('qq', '')).strip()
    content = str(data.get('content', '')).strip()
    
    if not qq or not content:
        return jsonify({'success': False, 'message': 'QQ或内容不能为空'}), 400
        
    msgs = load_msgs()
    new_msg = {
        'id': uuid.uuid4().hex,
        'qq': qq,
        'content': content,
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M'),
        'reply': '',
        'reply_timestamp': ''
    }
    msgs.insert(0, new_msg) # 最新留言在最前
    save_msgs(msgs)
    
    return jsonify({'success': True, 'message': '留言成功'})

# 管理员回复留言
@app.route('/admin/messages/reply', methods=['POST'])
def reply_message():
    data = request.json
    if str(data.get('key')) != ADMIN_KEY:
        return jsonify({'success': False, 'message': '密钥错误'}), 403
        
    msg_id = data.get('id')
    reply_content = data.get('reply', '').strip()
    
    msgs = load_msgs()
    for msg in msgs:
        if msg['id'] == msg_id:
            msg['reply'] = reply_content
            msg['reply_timestamp'] = datetime.now().strftime('%Y-%m-%d %H:%M') if reply_content else ''
            save_msgs(msgs)
            return jsonify({'success': True, 'message': '回复更新成功'})
            
    return jsonify({'success': False, 'message': '找不到该留言'}), 404

# 管理员删除留言
@app.route('/admin/messages/delete', methods=['POST'])
def delete_message():
    data = request.json
    if str(data.get('key')) != ADMIN_KEY:
        return jsonify({'success': False, 'message': '密钥错误'}), 403
        
    msg_id = data.get('id')
    msgs = load_msgs()
    filtered_msgs = [m for m in msgs if m['id'] != msg_id]
    
    if len(msgs) != len(filtered_msgs):
        save_msgs(filtered_msgs)
        return jsonify({'success': True, 'message': '删除成功'})
        
    return jsonify({'success': False, 'message': '找不到该留言'}), 404

if __name__ == '__main__':
    print(f"✅ Community Server 正在运行: http://127.0.0.1:{PORT}")
    app.run(host='0.0.0.0', port=PORT)