/**
 * 服务器状态更新脚本
 */

// 配置
const CONFIG = {
    statusFile: 'server_status.txt',
    updateInterval: 30000, // 30秒更新一次，与index.html保持一致
    defaultAvatar: 'image/logo.png'
};

// 服务器ID映射
const serverIdMap = {
    "香草纪元整合包": "server-vefc",
    "1.21.4FB原版": "server-fb214",
    "1.21生电服": "server-fb21",
    "1.20.1空岛": "server-skyblock"
};

/**
 * 解析服务器状态文本
 */
function parseServerStatus(text) {
    const lines = text.split('\n').filter(line => line.trim());
    let currentServer = null;
    const servers = [];
    let checkTime = '';

    lines.forEach(line => {
        line = line.trim();
        
        if (line.startsWith('检查时间:')) {
            checkTime = line.split(': ')[1];
        }
        else if (line.endsWith(':')) {
            // 新的服务器块开始
            currentServer = {
                name: line.split(' (')[0],
                address: line.slice(line.indexOf('(') + 1, -2),
                version: '',
                players: [],
                online: 0,
                max_players: 0,
                status: 'offline',
                timestamp: checkTime
            };
            servers.push(currentServer);
        }
        else if (currentServer) {
            if (line.startsWith('服务器版本:')) {
                currentServer.version = line.split(': ')[1];
                currentServer.status = 'online';
            }
            else if (line.startsWith('在线玩家:')) {
                const playerList = line.split(': ')[1];
                currentServer.players = playerList === '当前没有在线玩家' ? [] : playerList.split(', ');
            }
            else if (line.startsWith('玩家数:')) {
                const [current, max] = line.split(': ')[1].split('/');
                currentServer.online = parseInt(current);
                currentServer.max_players = parseInt(max);
            }
        }
    });

    return servers;
}

/**
 * 更新服务器状态显示
 */
function updateServerStatus() {
    fetch(CONFIG.statusFile, {
        cache: 'no-store'  // 禁用缓存
    })
    .then(response => response.text())
    .then(text => {
        const servers = parseServerStatus(text);
        const serversGrid = document.querySelector('.servers-grid');
        
        if (serversGrid) {
            serversGrid.innerHTML = ''; // 清空现有内容

            servers.forEach(server => {
                const serverCard = document.createElement('div');
                serverCard.className = `server-card ${server.status}`;
                serverCard.style.cursor = 'pointer';
                
                // 添加点击事件
                serverCard.onclick = () => {
                    const serverId = serverIdMap[server.name];
                    if (serverId) {
                        window.location.href = `changelog.html#${serverId}`;
                    }
                };

                const statusIcon = server.status === 'online' ? 
                    '<i class="fas fa-check-circle"></i>' : 
                    '<i class="fas fa-times-circle"></i>';

                let playersHtml = '';
                if (server.status === 'online') {
                    if (server.players && server.players.length > 0) {
                        playersHtml = `
                            <div class="players-list">
                                <h4>在线玩家:</h4>
                                <ul>
                                    ${server.players.map(player => `<li>${player}</li>`).join('')}
                                </ul>
                            </div>
                        `;
                    } else {
                        playersHtml = '<p>当前没有在线玩家</p>';
                    }
                }

                serverCard.innerHTML = `
                    <h3>${server.name} ${statusIcon}</h3>
                    <p class="server-address">${server.address}</p>
                    ${server.status === 'online' ? `
                        <p class="server-info">版本: ${server.version}</p>
                        <p class="player-count">玩家: ${server.online}/${server.max_players}</p>
                        ${playersHtml}
                    ` : `
                        <p class="error-message">服务器离线</p>
                    `}
                    <p class="update-time">更新时间: ${server.timestamp}</p>
                `;
                
                serversGrid.appendChild(serverCard);
            });
        }
    })
    .catch(error => {
        console.error('获取服务器状态失败:', error);
        const serversGrid = document.querySelector('.servers-grid');
        if (serversGrid) {
            serversGrid.innerHTML = `
                <div class="server-card offline">
                    <h3>错误 <i class="fas fa-times-circle"></i></h3>
                    <p class="error-message">无法获取服务器状态</p>
                </div>
            `;
        }
    });
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    updateServerStatus();
    setInterval(updateServerStatus, CONFIG.updateInterval);
}); 