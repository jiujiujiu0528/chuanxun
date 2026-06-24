// ========== 睡眠记录模块 ==========
let sleepState = {
    isSleeping: false,
    startTime: null,
    history: []   // 存储历史记录 { start, end, duration }
};

const SLEEP_HISTORY_KEY = 'sleep_history';

function loadSleepHistory() {
    const saved = localStorage.getItem(SLEEP_HISTORY_KEY);
    if (saved) {
        sleepState.history = JSON.parse(saved);
    } else {
        sleepState.history = [];
    }
}

function saveSleepHistory() {
    localStorage.setItem(SLEEP_HISTORY_KEY, JSON.stringify(sleepState.history));
}

function renderSleepHistory() {
    const container = document.getElementById('sleep-history-list');
    if (!container) return;
    if (sleepState.history.length === 0) {
        container.innerHTML = '<div class="empty-history">暂无睡眠记录，点击开始晚安模式吧</div>';
        return;
    }
    // 按时间倒序排列
    const sorted = [...sleepState.history].reverse();
    container.innerHTML = sorted.map(record => {
        const startTime = new Date(record.start).toLocaleString();
        const endTime = new Date(record.end).toLocaleString();
        const duration = formatDuration(record.duration);
        return `
            <div class="history-item">
                <div class="history-time">🌙 ${startTime}</div>
                <div class="history-time">☀️ ${endTime}</div>
                <div class="history-duration">💤 睡眠时长：${duration}</div>
            </div>
        `;
    }).join('');
}

function formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
        return `${hours} 小时 ${mins} 分钟`;
    }
    return `${mins} 分钟`;
}

function startSleep() {
    if (sleepState.isSleeping) return;
    sleepState.isSleeping = true;
    sleepState.startTime = Date.now();
    const btn = document.getElementById('sleep-mode-btn');
    if (btn) {
        btn.textContent = '🌙 晚安模式中... 点击结束';
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
    }
    // 可选：显示一个悬浮提示或通知
    showNotification('晚安模式已开启，安心入睡吧', 'success');
}

function endSleep() {
    if (!sleepState.isSleeping) return;
    const endTime = Date.now();
    const duration = endTime - sleepState.startTime;
    if (duration < 60000) {
        showNotification('睡眠时间太短，未记录', 'warning');
        // 重置状态
        sleepState.isSleeping = false;
        sleepState.startTime = null;
        const btn = document.getElementById('sleep-mode-btn');
        if (btn) {
            btn.textContent = '🌙 开始晚安模式';
            btn.classList.remove('btn-secondary');
            btn.classList.add('btn-primary');
        }
        return;
    }
    const record = {
        start: sleepState.startTime,
        end: endTime,
        duration: duration
    };
    sleepState.history.push(record);
    saveSleepHistory();
    renderSleepHistory();
    
    sleepState.isSleeping = false;
    sleepState.startTime = null;
    const btn = document.getElementById('sleep-mode-btn');
    if (btn) {
        btn.textContent = '🌙 开始晚安模式';
        btn.classList.remove('btn-secondary');
        btn.classList.add('btn-primary');
    }
    showNotification(`晚安模式结束，睡眠时长 ${formatDuration(duration)}`, 'success');
    
    // 可选：在聊天中添加一条系统消息
    if (typeof addMessage === 'function') {
        addMessage({
            id: Date.now(),
            sender: 'system',
            text: `🌙 晚安模式结束，共睡眠 ${formatDuration(duration)}。`,
            timestamp: new Date(),
            type: 'system',
            favorited: false
        });
    }
}

function toggleSleepMode() {
    if (sleepState.isSleeping) {
        endSleep();
    } else {
        startSleep();
    }
}

function initSleepModule() {
    loadSleepHistory();
    renderSleepHistory();
    const sleepBtn = document.getElementById('sleep-mode-btn');
    if (sleepBtn) {
        sleepBtn.onclick = toggleSleepMode;
    }
    // 如果之前有未结束的睡眠（页面刷新导致），自动结束？为了简单，重置状态，不自动结束
    // 但可以提示用户
    if (sleepState.isSleeping) {
        // 重置状态，丢失未记录睡眠（因为刷新导致）
        sleepState.isSleeping = false;
        sleepState.startTime = null;
        const btn = document.getElementById('sleep-mode-btn');
        if (btn) {
            btn.textContent = '🌙 开始晚安模式';
            btn.classList.remove('btn-secondary');
            btn.classList.add('btn-primary');
        }
    }
}