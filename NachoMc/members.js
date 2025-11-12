// 格式化日期显示
function formatDate(dateStr) {
    if (!dateStr || dateStr === '未知') return '未知';
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 成员数据处理和显示
function createMemberCard(member) {
    const card = document.createElement('div');
    card.className = 'member-card';

    // 生成服务器列表HTML
    let serverHtml = '';
    if (member.isOnline && member.currentServers.length > 0) {
        if (member.currentServers.length === 1) {
            serverHtml = `
                <p class="server-playing">
                    <i class="fas fa-gamepad"></i> 正在游玩: 
                    <span class="highlight">${member.currentServers[0]}</span>
                </p>
            `;
        } else {
            serverHtml = `
                <p class="server-playing">
                    <i class="fas fa-gamepad"></i> 正在游玩多个服务器:
                    <div class="server-list">
                        ${member.currentServers.map(server => 
                            `<span class="highlight">${server}</span>`
                        ).join(', ')}
                    </div>
                </p>
            `;
        }
    }

    card.innerHTML = `
        <div class="member-avatar">
            <img src="https://crafthead.net/avatar/${member.name}" alt="${member.name}">
            <div class="status-badge ${member.isOnline ? 'online' : 'offline'}"></div>
        </div>
        <div class="member-info">
            <h3>${member.name}</h3>
            <p class="member-role">${member.role}</p>
            ${serverHtml}
            <div class="member-dates">
                <p class="first-seen">
                    <i class="fas fa-calendar-plus"></i> 第一次游玩: 
                    <span>${formatDate(member.firstSeen)}</span>
                </p>
                ${!member.isOnline ? `
                    <p class="last-seen">
                        <i class="fas fa-clock"></i> 最近游玩: 
                        <span>${member.lastServer}</span>
                        <br>
                        <small class="last-seen-time">最后在线: ${formatDate(member.lastSeen)}</small>
                    </p>
                ` : ''}
            </div>
            <div class="member-tags">
                ${member.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        </div>
    `;

    return card;
}

// 更新成员列表显示
function updateMembersList(members) {
    const membersGrid = document.querySelector('.members-grid');
    membersGrid.innerHTML = ''; // 清空现有内容

    // 对成员进行排序
    const sortedMembers = members.sort((a, b) => {
        // 在线用户优先
        if (a.isOnline !== b.isOnline) {
            return a.isOnline ? -1 : 1;
        }
        
        // 如果都在线或都离线，按最后在线时间排序
        const timeA = a.lastSeen || '0';  // 如果没有lastSeen，放到最后
        const timeB = b.lastSeen || '0';
        return timeB.localeCompare(timeA);  // 降序排列
    });

    sortedMembers.forEach(member => {
        const card = createMemberCard(member);
        membersGrid.appendChild(card);
    });
}

// 从服务器获取成员数据
function fetchMemberData() {
    fetch('player_data.json', {
        cache: 'no-store'  // 禁用缓存
    })
        .then(response => response.json())
        .then(members => {
            updateMembersList(members);
        })
        .catch(error => {
            console.error('获取成员数据失败:', error);
            document.querySelector('.members-grid').innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>无法加载成员数据</p>
                </div>
            `;
        });
}

// 搜索功能
function setupSearch() {
    const searchInput = document.querySelector('.search-box input');
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const members = document.querySelectorAll('.member-card');
        
        members.forEach(card => {
            const name = card.querySelector('h3').textContent.toLowerCase();
            const role = card.querySelector('.member-role').textContent.toLowerCase();
            const tags = Array.from(card.querySelectorAll('.tag')).map(tag => tag.textContent.toLowerCase());
            const shouldShow = name.includes(searchTerm) || 
                             role.includes(searchTerm) || 
                             tags.some(tag => tag.includes(searchTerm));
            card.style.display = shouldShow ? 'block' : 'none';
        });
    });
}

// 标签筛选功能
function setupFilters() {
    const filterButtons = document.querySelectorAll('.filter-tag');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.dataset.filter;
            
            // 更新按钮状态
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // 筛选成员
            const members = document.querySelectorAll('.member-card');
            members.forEach(card => {
                const role = card.querySelector('.member-role').textContent;
                const tags = Array.from(card.querySelectorAll('.tag')).map(tag => tag.textContent);
                const shouldShow = filter === 'all' || 
                                 role === filter || 
                                 tags.includes(filter);
                card.style.display = shouldShow ? 'block' : 'none';
            });
        });
    });
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    fetchMemberData();
    setupSearch();
    setupFilters();
    
    // 每60秒更新一次成员数据
    setInterval(fetchMemberData, 60000);
});

document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.querySelector('.search-box input');
    const filterTags = document.querySelectorAll('.filter-tag');
    const memberCards = document.querySelectorAll('.member-card');

    // 为成员卡片添加延迟动画
    memberCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
    });
}); 