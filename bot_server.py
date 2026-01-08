from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

PORT = 5001
DATA_FILE = 'bot_accounts.json'
ADMIN_KEY = "F1yCar" 

def load_data():
    if not os.path.exists(DATA_FILE): return []
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f: return json.load(f)
    except: return []

def save_data(data):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

# --- 核心逻辑：精确到分钟的自动解封 ---
def check_expiry(accounts):
    is_modified = False
    now = datetime.now() # 获取当前精确时间

    for acc in accounts:
        if acc.get('status') == 'temp' and acc.get('unban_date'):
            try:
                # 尝试解析格式：YYYY-MM-DD HH:mm
                # 例如：2026-01-08 18:30
                unban_time = datetime.strptime(acc['unban_date'], '%Y-%m-%d %H:%M')
                
                # 如果当前时间 >= 解封时间
                if now >= unban_time:
                    print(f"[{now}] 账号 {acc['qq']} 封禁期满，自动解封。")
                    acc['status'] = 'ok'
                    acc['unban_date'] = ''
                    is_modified = True
            except ValueError:
                # 如果格式不对（比如旧数据的纯日期），尝试按旧格式处理作为兼容
                try:
                    unban_date = datetime.strptime(acc['unban_date'], '%Y-%m-%d').date()
                    if now.date() >= unban_date:
                        acc['status'] = 'ok'
                        acc['unban_date'] = ''
                        is_modified = True
                except:
                    pass

    if is_modified:
        save_data(accounts)
    
    return accounts

@app.route('/accounts', methods=['GET'])
def get_accounts():
    data = load_data()
    updated_data = check_expiry(data)
    return jsonify(updated_data)

@app.route('/admin/update', methods=['POST'])
def update_accounts():
    data = request.json
    if str(data.get('key')) != str(ADMIN_KEY):
        return jsonify({'success': False, 'message': '密钥错误'}), 403
    save_data(data.get('accounts'))
    return jsonify({'success': True, 'message': '更新成功'})

if __name__ == '__main__':
    print(f"✅ Bot Server 正在运行: http://127.0.0.1:{PORT}")
    app.run(host='0.0.0.0', port=PORT)