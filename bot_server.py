from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os
import threading
import time
import requests
from datetime import datetime

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["https://akiyo.fun", "http://127.0.0.1:5500", "http://localhost:5500"]}})

PORT = 5001
DATA_FILE = 'bot_accounts.json'
ADMIN_KEY = os.environ.get('ADMIN_KEY', 'F1yCar') 

def normalize_region(value):
    return 'NA' if str(value or '').strip().lower() == 'na' else 'Astr'

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
                unban_time = datetime.strptime(acc['unban_date'], '%Y-%m-%d %H:%M')
                
                if now >= unban_time:
                    print(f"[{now}] 账号 {acc['qq']} 封禁期满，自动解封。")
                    acc['status'] = 'ok'
                    acc['last_unban_date'] = acc['unban_date'] 
                    acc['unban_date'] = ''
                    is_modified = True
            except ValueError:
                try:
                    unban_date = datetime.strptime(acc['unban_date'], '%Y-%m-%d').date()
                    if now.date() >= unban_date:
                        acc['status'] = 'ok'
                        acc['last_unban_date'] = acc['unban_date'] 
                        acc['unban_date'] = ''
                        is_modified = True
                except:
                    pass

    if is_modified:
        save_data(accounts)
    
    return accounts

# --- 新增核心逻辑：后台数据获取与离线标记 ---
def fetch_and_sync_status():
    while True:
        try:
            active_uins = set()
            telemetry_ok = False

            # 直接获取前100条数据（失败重试，全部失败则本轮不落库）
            url = "http://bot.akiyo.fun/api/public/containers/page?page=1&page_size=100"
            for attempt in range(3):
                try:
                    resp = requests.get(url, timeout=10)
                    if resp.status_code != 200:
                        raise Exception(f"HTTP {resp.status_code}")

                    data = resp.json()
                    if not isinstance(data.get('data', []), list):
                        raise Exception("响应结构异常: data 不是列表")

                    # 提取所有的 uin
                    for item in data.get('data', []):
                        uin = item.get('uin')
                        if uin:
                            active_uins.add(str(uin))

                    telemetry_ok = True
                    break
                except Exception as e:
                    print(f"[{datetime.now()}] 遥测拉取失败，第 {attempt + 1}/3 次: {e}")
                    if attempt < 2:
                        time.sleep(2)

            if not telemetry_ok:
                print(f"[{datetime.now()}] 遥测连续失败，本轮跳过状态同步，不修改任何本地数据。")
                time.sleep(300)
                continue
            
           # 对比本地数据
            accounts = load_data()
            is_modified = False
            
            for acc in accounts:
                qq = str(acc.get('qq', ''))
                current_status = acc.get('status')
                
                # 1. 信号丢失：原本在线(ok)，但最新遥测中没有它 -> 降级为离线(offline)
                if current_status == 'ok' and qq not in active_uins:
                    print(f"[{datetime.now()}] 数据遥测: 账号 {qq} 丢失信号，已降级为 offline。")
                    acc['status'] = 'offline'
                    is_modified = True
                    
                # 2. 信号恢复：原本离线(offline)，但最新遥测中再次捕获到它 -> 恢复为在线(ok)
                elif current_status == 'offline' and qq in active_uins:
                    print(f"[{datetime.now()}] 数据遥测: 账号 {qq} 重新上线，已恢复为 ok。")
                    acc['status'] = 'ok'
                    is_modified = True
                    
            if is_modified:
                save_data(accounts)
                
        except Exception as e:
            print(f"[{datetime.now()}] 通信故障: 无法同步容器状态 - {e}")
            
        # 轮询间隔：5分钟 (300秒)
        time.sleep(300)

@app.route('/accounts', methods=['GET'])
def get_accounts():
    data = load_data()
    updated_data = check_expiry(data)
    changed = False
    for acc in updated_data:
        if not isinstance(acc, dict):
            continue
        normalized_region = normalize_region(acc.get('region'))
        if acc.get('region') != normalized_region:
            acc['region'] = normalized_region
            changed = True
    if changed:
        save_data(updated_data)
    return jsonify(updated_data)

@app.route('/remote_total', methods=['GET'])
def get_remote_total():
    try:
        url = "http://bot.akiyo.fun/api/public/containers/page?page=1&page_size=100"
        resp = requests.get(url, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            return jsonify({'success': True, 'total': data.get('total', 0)})
    except Exception as e:
        print(f"[{datetime.now()}] 远端总数代理请求失败: {e}")
    return jsonify({'success': False, 'total': 0})

@app.route('/admin/update', methods=['POST'])
def update_accounts():
    data = request.json
    if str(data.get('key')) != str(ADMIN_KEY):
        return jsonify({'success': False, 'message': '密钥错误'}), 403

    accounts = data.get('accounts') or []
    valid_status = {'ok', 'temp', 'ban', 'offline'}
    normalized = []

    for item in accounts:
        if not isinstance(item, dict):
            continue

        acc = dict(item)
        status = str(acc.get('status', 'ok')).strip().lower()
        if status not in valid_status:
            status = 'ok'
        acc['status'] = status
        acc['region'] = normalize_region(acc.get('region'))

        if status != 'temp':
            acc['unban_date'] = ''

        normalized.append(acc)

    save_data(normalized)
    return jsonify({'success': True, 'message': '更新成功'})

if __name__ == '__main__':
    # 挂载后台遥测进程
    print("✅ 启动状态遥测线程，轮询间隔: 5 分钟...")
    sync_thread = threading.Thread(target=fetch_and_sync_status, daemon=True)
    sync_thread.start()
    
    print(f"✅ Bot Server 正在运行: http://127.0.0.1:{PORT}")
    app.run(host='0.0.0.0', port=PORT)