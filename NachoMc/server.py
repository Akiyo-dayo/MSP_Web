from mcstatus import JavaServer
import sys
import time
import json
from datetime import datetime, timedelta

# 定义服务器列表
SERVERS = [
    {"address": "create.akiyo.fun:18004", "name": "1.20.1 机械动力-月亮工厂"},
    {"address": "akiyo.fun:18003", "name": "1.20.1空岛"},
    {"address": "f1ycar.fun:21009", "name": "1.21生电服"},
    {"address": "f1ycar.fun:15597", "name": "1.21.4FB原版"}
]

def check_server_status():
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"\n[{current_time}] 正在检查所有服务器状态...")
    
    servers_status = []
    
    # 准备写入txt文件的内容
    txt_content = []
    txt_content.append(f"检查时间: {current_time}\n")
    
    for server_info in SERVERS:
        try:
            server = JavaServer.lookup(server_info["address"])
            status = server.status()
            
            server_status = {
                "name": server_info["name"],
                "address": server_info["address"],
                "version": status.version.name,
                "online": status.players.online,
                "max_players": status.players.max,
                "players": [player.name for player in (status.players.sample or [])],
                "status": "online",
                "timestamp": current_time
            }
            
            # 添加到txt内容
            txt_content.append(f"\n{server_info['name']} ({server_info['address']}):")
            txt_content.append(f"服务器版本: {status.version.name}")
            if status.players.sample:
                player_names = ', '.join([player.name for player in status.players.sample])
                txt_content.append(f"在线玩家: {player_names}")
            else:
                txt_content.append("当前没有在线玩家")
            txt_content.append(f"玩家数: {status.players.online}/{status.players.max}")
            
        except Exception as e:
            server_status = {
                "name": server_info["name"],
                "address": server_info["address"],
                "status": "offline",
                "error": str(e),
                "timestamp": current_time
            }
            
            # 添加错误信息到txt内容
            txt_content.append(f"\n{server_info['name']} ({server_info['address']}):")
            txt_content.append(f"状态: 离线")
            txt_content.append(f"错误信息: {str(e)}")
            
        servers_status.append(server_status)
    
    # 将所有服务器状态写入JSON文件
    with open('servers_status.json', 'w', encoding='utf-8') as f:
        json.dump(servers_status, f, ensure_ascii=False, indent=2)
    
    # 将内容写入txt文件
    with open('server_status.txt', 'w', encoding='utf-8') as f:
        f.write('\n'.join(txt_content))
            
    print("检查完成！")

def get_sleep_time():
    """计算到下一个1分钟整点的等待时间（秒）"""
    now = datetime.now()
    seconds = now.second
    microseconds = now.microsecond
    
    # 计算到下一分钟的等待时间
    target = now.replace(second=0, microsecond=0) + timedelta(minutes=1)
    
    # 计算需要等待的秒数
    wait_seconds = (target - now).total_seconds()
    return max(0, wait_seconds), target

def main():
    print("多服务器状态检查程序已启动...")
    while True:
        check_server_status()
        sleep_time, next_check_time = get_sleep_time()
        next_check_str = next_check_time.strftime("%H:%M:%S")
        
        # 显示倒计时
        while sleep_time > 0:
            secs = int(sleep_time % 60)
            print(f"\r下次检查时间: {next_check_str} (还需等待: {secs:02d}秒)", end='', flush=True)
            time.sleep(1)
            sleep_time -= 1

if __name__ == "__main__":
    main()
