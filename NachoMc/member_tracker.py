import json
import os
from datetime import datetime, timedelta
import time
from typing import Dict, List, Tuple, Optional

class ServerStatus:
    def __init__(self, name: str, address: str):
        self.name = name
        self.address = address
        self.version = ""
        self.players: List[str] = []
        self.online_count = 0
        self.max_players = 0

class PlayerTracker:
    def __init__(self, status_file: str = 'server_status.txt', data_file: str = 'player_data.json'):
        self.status_file = status_file
        self.data_file = data_file
        self.last_check_time: Optional[str] = None
        self.last_content: Optional[str] = None

    def read_server_status(self) -> Tuple[Dict[str, ServerStatus], Dict[str, List[str]], Optional[str]]:
        """
        读取服务器状态
        返回: (服务器状态字典, 在线玩家字典, 检查时间)
        """
        try:
            # 尝试多次读取以确保获取完整内容
            max_retries = 3
            retry_delay = 0.1  # 100ms
            
            for attempt in range(max_retries):
                try:
                    with open(self.status_file, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                    # 如果内容为空，重试
                    if not content.strip():
                        if attempt < max_retries - 1:
                            time.sleep(retry_delay)
                            continue
                        print(f"[错误] 服务器状态文件为空")
                        return {}, {}, None
                        
                    # 如果内容与上次相同，直接返回缓存的解析结果
                    if content == self.last_content:
                        return self._parse_status_content(content)
                        
                    # 更新缓存的内容
                    self.last_content = content
                    return self._parse_status_content(content)
                        
                except Exception as e:
                    if attempt < max_retries - 1:
                        time.sleep(retry_delay)
                        continue
                    raise e
                    
        except FileNotFoundError:
            print(f"[错误] 找不到服务器状态文件: {self.status_file}")
            return {}, {}, None
        except Exception as e:
            print(f"[错误] 读取服务器状态时出错: {str(e)}")
            return {}, {}, None

    def _parse_status_content(self, content: str) -> Tuple[Dict[str, ServerStatus], Dict[str, List[str]], Optional[str]]:
        """解析服务器状态内容"""
        servers: Dict[str, ServerStatus] = {}
        online_players: Dict[str, List[str]] = {}
        check_time = None
        current_server = None

        try:
            for line in content.strip().split('\n'):
                line = line.strip()
                if not line:
                    continue

                if line.startswith('检查时间:'):
                    check_time = line.split(': ')[1]
                    continue

                if line.endswith(':'):
                    server_name = line.split(' (')[0]
                    server_address = line[line.index('(') + 1:-2]
                    current_server = server_name
                    servers[current_server] = ServerStatus(server_name, server_address)
                    continue

                if not current_server:
                    continue

                if line.startswith('服务器版本:'):
                    servers[current_server].version = line.split(': ')[1]
                elif line.startswith('在线玩家:'):
                    player_list = line.split(': ')[1]
                    if player_list != '当前没有在线玩家':
                        players = [p.strip() for p in player_list.split(', ')]
                        servers[current_server].players = players
                        for player in players:
                            if player not in online_players:
                                online_players[player] = []
                            online_players[player].append(current_server)
                elif line.startswith('玩家数:'):
                    current, max_players = map(int, line.split(': ')[1].split('/'))
                    servers[current_server].online_count = current
                    servers[current_server].max_players = max_players

            return servers, online_players, check_time
        except Exception as e:
            print(f"[错误] 解析服务器状态时出错: {str(e)}")
            return {}, {}, None

    def load_player_data(self) -> Dict[str, dict]:
        """加载玩家数据"""
        try:
            if not os.path.exists(self.data_file):
                return {}
            with open(self.data_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return {player['name']: player for player in data}
        except Exception as e:
            print(f"[错误] 加载玩家数据时出错: {str(e)}")
            return {}

    def save_player_data(self, players: Dict[str, dict]):
        """保存玩家数据"""
        try:
            # 先将数据写入临时文件
            temp_file = f"{self.data_file}.tmp"
            with open(temp_file, 'w', encoding='utf-8') as f:
                json.dump(list(players.values()), f, ensure_ascii=False, indent=4)
            
            # 然后重命名临时文件，这样可以确保原子性写入
            os.replace(temp_file, self.data_file)
            print(f"[信息] 成功保存玩家数据，共 {len(players)} 名玩家")
        except Exception as e:
            print(f"[错误] 保存玩家数据时出错: {str(e)}")
            # 清理临时文件
            if os.path.exists(temp_file):
                try:
                    os.remove(temp_file)
                except:
                    pass

    def update(self):
        """更新玩家数据"""
        # 读取服务器状态
        servers, online_players, check_time = self.read_server_status()
        if not check_time:
            return

        # 如果检查时间没变，说明文件未更新
        if check_time == self.last_check_time:
            print("[调试] 服务器状态未更新，跳过此次更新")
            return
        self.last_check_time = check_time

        # 加载现有玩家数据
        player_data = self.load_player_data()
        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        updated_players = {}

        # 更新在线玩家信息
        for player_name, server_list in online_players.items():
            existing_player = player_data.get(player_name, {})
            first_seen = existing_player.get('firstSeen', current_time)
            
            if player_name not in player_data:
                print(f'[新玩家] 发现新玩家: {player_name}')

            updated_players[player_name] = {
                'name': player_name,
                'isOnline': True,
                'currentServers': server_list,
                'lastServer': server_list[0],
                'lastSeen': current_time,
                'firstSeen': first_seen,
                'role': existing_player.get('role', '玩家'),
                'tags': existing_player.get('tags', ['玩家'])
            }
            print(f'[在线] 玩家 {player_name} 在线，服务器: {", ".join(server_list)}')

        # 更新离线玩家信息
        for player_name, data in player_data.items():
            if player_name not in online_players:
                updated_players[player_name] = {
                    'name': player_name,
                    'isOnline': False,
                    'currentServers': [],
                    'lastServer': data.get('lastServer'),
                    'lastSeen': data.get('lastSeen', '未知'),
                    'firstSeen': data.get('firstSeen', '未知'),
                    'role': data.get('role', '玩家'),
                    'tags': data.get('tags', ['玩家'])
                }

        # 保存更新后的数据
        self.save_player_data(updated_players)
        print(f'[更新] 更新完成，当前在线: {len(online_players)}人，总玩家数: {len(updated_players)}人')

def get_wait_time() -> float:
    """计算到下一分钟第1秒的等待时间（秒）"""
    now = datetime.now()
    next_minute = (now + timedelta(minutes=1)).replace(second=1, microsecond=0)
    return max(0, (next_minute - now).total_seconds())

def main():
    print("\n=== 成员追踪程序已启动 ===")
    tracker = PlayerTracker()

    # 启动时立即执行一次更新
    print("[信息] 执行启动检查...")
    tracker.update()
    print("[信息] 启动检查完成，进入常规检查周期")

    while True:
        wait_time = get_wait_time()
        next_update = datetime.now() + timedelta(seconds=wait_time)
        print(f"\n[信息] 下次更新时间: {next_update.strftime('%H:%M:%S')}")

        while wait_time > 0:
            print(f"\r[等待] 下次检查: {int(wait_time):02d}秒", end='', flush=True)
            if wait_time > 1:
                time.sleep(1)
                wait_time -= 1
            else:
                time.sleep(wait_time)
                break

        print()  # 换行
        print("[信息] 执行定时检查...")
        tracker.update()

if __name__ == '__main__':
    main() 