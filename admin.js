let API_BASE = '';
if (window.location.hostname.includes('akiyo.fun')) {
    API_BASE = '/api/bot';
    document.getElementById('network-status').innerText = '当前环境: 线上服务器 (Nginx)';
} else {
    API_BASE = 'http://127.0.0.1:5001';
    document.getElementById('network-status').innerText = '当前环境: 本地调试 (Port 5001)';
}

const GET_API = API_BASE + '/accounts';
const POST_API = API_BASE + '/admin/update';

let list = [];

document.addEventListener('DOMContentLoaded', () => {
    fetch(GET_API)
        .then(r => r.json())
        .then(data => { list = data; render(); })
        .catch(() => alert('连接失败，请确认后端 bot_server.py 是否启动！'));

    document.getElementById('add-bot-btn').addEventListener('click', add);
    document.getElementById('save-btn').addEventListener('click', save);
});

function render() {
    const box = document.getElementById('list-box');
    box.innerHTML = ''; // 清空现有内容
    
    list.forEach((item, i) => {
        const isTemp = item.status === 'temp';
        const showDurationClass = isTemp ? 'display-flex' : 'display-none';
        
        // 计算剩余时间，拆分为 天/时/分
        let d=0, h=0, m=0;
        if(isTemp && item.unban_date) {
            const mins = getMinutesFromNow(item.unban_date);
            if(mins > 0) {
                d = Math.floor(mins / 1440);
                h = Math.floor((mins % 1440) / 60);
                m = mins % 60;
            }
        }

        const adminItem = document.createElement('div');
        adminItem.className = 'admin-item col-layout';
        adminItem.innerHTML = `
            <div>
                <label class="mobile-label">名称</label>
                <input class="admin-input bot-name-input" data-index="${i}" value="${item.name}" placeholder="Bot名称">
            </div>

            <div>
                <label class="mobile-label">备注</label>
                <input class="admin-input bot-note-input" data-index="${i}" value="${item.note || ''}" placeholder="如: 1号机">
            </div>
            
            <div>
                <label class="mobile-label">QQ</label>
                <input class="admin-input bot-qq-input" type="text" inputmode="numeric" data-index="${i}" value="${item.qq}" placeholder="QQ号">
            </div>

            <div>
                <label class="mobile-label">状态</label>
                <select class="admin-select bot-status-select status-${item.status}" data-index="${i}">
                    <option value="ok" ${item.status=='ok'?'selected':''}>✅ 正常运行</option>
                    <option value="temp" ${item.status=='temp'?'selected':''}>⏳ 临时冻结</option>
                    <option value="offline" ${item.status=='offline'?'selected':''}>⚫ 离线维护</option>
                    <option value="ban" ${item.status=='ban'?'selected':''}>🚫 永久封禁</option>
                </select>
            </div>

            <div class="duration-controls ${showDurationClass}">
                <div class="time-group">
                    <div class="time-input-wrapper">
                        <input class="time-input time-day-input" type="number" min="0" data-index="${i}" value="${d}">
                        <span class="time-unit">天</span>
                    </div>
                    <div class="time-input-wrapper">
                        <input class="time-input time-hour-input" type="number" min="0" max="23" data-index="${i}" value="${h}">
                        <span class="time-unit">时</span>
                    </div>
                    <div class="time-input-wrapper">
                        <input class="time-input time-minute-input" type="number" min="0" max="59" data-index="${i}" value="${m}">
                        <span class="time-unit">分</span>
                    </div>
                </div>

                <div class="unban-date-display">
                    解封: <span class="date-display-value" id="date-display-${i}">${item.unban_date || '未设置'}</span>
                </div>
            </div>
            
            <div class="no-duration-setting ${!isTemp?'display-flex':'display-none'}">
                (无需设置)
            </div>

            <div>
                <button class="btn btn-del delete-bot-btn" data-index="${i}">🗑️</button>
            </div>
        `;
        box.appendChild(adminItem);
    });
    
    addEventListeners();
    applyMobileLayout(); // 移动端布局调整仍保留在JS中，但建议优先使用CSS媒体查询
}

function addEventListeners() {
    document.querySelectorAll('.bot-name-input').forEach(input => input.addEventListener('input', (e) => edit(e.target.dataset.index, 'name', e.target.value)));
    document.querySelectorAll('.bot-note-input').forEach(input => input.addEventListener('input', (e) => edit(e.target.dataset.index, 'note', e.target.value)));
    document.querySelectorAll('.bot-qq-input').forEach(input => input.addEventListener('input', (e) => edit(e.target.dataset.index, 'qq', e.target.value)));
    document.querySelectorAll('.bot-status-select').forEach(select => select.addEventListener('change', (e) => edit(e.target.dataset.index, 'status', e.target.value)));
    document.querySelectorAll('.time-day-input, .time-hour-input, .time-minute-input').forEach(input => input.addEventListener('input', (e) => updateDate(e.target.dataset.index)));
    document.querySelectorAll('.delete-bot-btn').forEach(button => button.addEventListener('click', (e) => del(e.target.dataset.index)));
}

function applyMobileLayout() {
    if(window.innerWidth <= 768) {
        document.querySelectorAll('.mobile-label').forEach(el => el.style.display = 'block');
        document.querySelectorAll('.admin-item').forEach(el => {
            el.style.display = 'flex';
            el.style.flexDirection = 'column';
        });
    }
}

// --- 核心逻辑：读取三个框 -> 算出总分钟 -> 更新日期 ---
function updateDate(index) {
    const d = parseInt(document.querySelector(`.time-day-input[data-index="${index}"]`).value) || 0;
    const h = parseInt(document.querySelector(`.time-hour-input[data-index="${index}"]`).value) || 0;
    const m = parseInt(document.querySelector(`.time-minute-input[data-index="${index}"]`).value) || 0;

    if(d === 0 && h === 0 && m === 0) {
        list[index].unban_date = '';
        document.getElementById(`date-display-${index}`).innerText = '未设置';
        return;
    }

    const totalMinutes = (d * 1440) + (h * 60) + m;
    
    const date = new Date();
    date.setMinutes(date.getMinutes() + totalMinutes);
    
    const timeString = formatTime(date);
    list[index].unban_date = timeString;
    
    document.getElementById(`date-display-${index}`).innerText = timeString;
}

// --- 辅助：格式化时间 YYYY-MM-DD HH:mm ---
function formatTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}`;
}

// --- 辅助：算出剩余分钟数 (用于初始化回显) ---
function getMinutesFromNow(dateStr) {
    if (!dateStr || !dateStr.includes(':')) return 0; 
    const target = new Date(dateStr);
    const now = new Date();
    const diffMs = target - now;
    const diffMins = Math.ceil(diffMs / 60000); 
    return diffMins > 0 ? diffMins : 0;
}

function edit(i, k, v) {
    list[i][k] = v;
    if(k === 'status') {
        // 根据新的状态更新 select 元素的类名，以便 CSS 应用背景色
        const selectElement = document.querySelector(`.bot-status-select[data-index="${i}"]`);
        selectElement.className = `admin-select bot-status-select status-${v}`;
        render(); // 重新渲染以显示/隐藏时长控制
    }
}

function add() {
    list.push({name:'新Bot', note:'1号机', qq:'', status:'ok', unban_date:'', last_unban_date: ''});
    render();
}

function del(i) {
    if(confirm('删除此账号？')) {
        list.splice(i, 1);
        render();
    }
}

function save() {
    const k = document.getElementById('key').value;
    if(!k) return alert('请输入密钥');
    const btn = document.getElementById('save-btn');
    const oldText = btn.innerText;
    btn.innerText = '保存中...';
    fetch(POST_API, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ key: k, accounts: list })
    }).then(r=>r.json()).then(d => {
        alert(d.message);
        btn.innerText = oldText;
    }).catch(()=> {
        alert("保存失败");
        btn.innerText = oldText;
    });
}