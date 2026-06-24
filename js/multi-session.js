// ========== 多会话管理模块 ==========
const SESSIONS_KEY = 'chat_sessions';
const ACTIVE_SESSION_KEY = 'chat_active_session';

// 全局：当前活跃会话ID
let currentSessionId = null;

// 获取会话列表
function getSessions() {
    const saved = localStorage.getItem(SESSIONS_KEY);
    if (saved) return JSON.parse(saved);
    // 创建默认会话
    const defaultSession = { id: 'default', name: '默认会话', createdAt: Date.now() };
    localStorage.setItem(SESSIONS_KEY, JSON.stringify([defaultSession]));
    return [defaultSession];
}

// 保存会话列表
function saveSessions(sessions) {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

// 获取当前活跃会话ID
function getActiveSessionId() {
    if (currentSessionId) return currentSessionId;
    const saved = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (saved) {
        currentSessionId = saved;
    } else {
        const sessions = getSessions();
        currentSessionId = sessions[0]?.id || 'default';
        localStorage.setItem(ACTIVE_SESSION_KEY, currentSessionId);
    }
    return currentSessionId;
}

// 设置活跃会话
function setActiveSessionId(sessionId) {
    currentSessionId = sessionId;
    localStorage.setItem(ACTIVE_SESSION_KEY, sessionId);
}

// 获取当前会话的消息存储键
function getCurrentMessagesKey() {
    const sid = getActiveSessionId();
    return `chat_messages_${sid}`;
}

// 保存当前会话的消息
function saveCurrentSessionMessages(msgs) {
    const key = getCurrentMessagesKey();
    localStorage.setItem(key, JSON.stringify(msgs));
}

// 加载当前会话的消息
function loadCurrentSessionMessages() {
    const key = getCurrentMessagesKey();
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
    return [];
}

// 创建新会话
function createSession(name) {
    const sessions = getSessions();
    const newSession = {
        id: 'session_' + Date.now(),
        name: name || ('会话 ' + (sessions.length + 1)),
        createdAt: Date.now()
    };
    sessions.push(newSession);
    saveSessions(sessions);
    return newSession;
}

// 删除会话
function deleteSession(sessionId) {
    const sessions = getSessions();
    if (sessions.length <= 1) {
        showNotification('至少保留一个会话', 'warning');
        return false;
    }
    const idx = sessions.findIndex(s => s.id === sessionId);
    if (idx === -1) return false;
    sessions.splice(idx, 1);
    saveSessions(sessions);
    // 删除该会话的消息
    localStorage.removeItem(`chat_messages_${sessionId}`);
    // 如果删除的是当前会话，切换到第一个
    if (getActiveSessionId() === sessionId) {
        switchSession(sessions[0].id);
    }
    return true;
}

// 切换会话
function switchSession(sessionId) {
    // 保存当前会话消息
    saveCurrentSessionMessages(window.messages);
    // 切换
    setActiveSessionId(sessionId);
    // 加载新会话消息
    window.messages = loadCurrentSessionMessages();
    if (typeof renderMessages === 'function') renderMessages(true);
    window.displayedMessageCount = Math.min(20, window.messages.length);
    updateSessionIndicator();
}

// 更新会话指示器
function updateSessionIndicator() {
    const indicator = document.getElementById('session-indicator');
    if (!indicator) return;
    const sessions = getSessions();
    const active = sessions.find(s => s.id === getActiveSessionId());
    indicator.textContent = active ? active.name : '会话';
}

// 显示会话管理面板
function showSessionManager() {
    const sessions = getSessions();
    const activeId = getActiveSessionId();

    const overlay = document.createElement('div');
    overlay.id = 'session-manager-overlay';
    overlay.style.cssText = 'position:fixed; inset:0; z-index:30000; background:rgba(0,0,0,0.7); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center;';
    overlay.innerHTML = `
        <div style="background:var(--secondary-bg); border-radius:20px; width:85%; max-width:400px; max-height:80vh; overflow-y:auto; padding:20px;">
            <h3 style="margin-bottom:16px; font-size:18px;">💬 会话管理</h3>
            <div id="session-list" style="margin-bottom:16px;">
                ${sessions.map(s => `
                    <div class="session-item ${s.id === activeId ? 'active' : ''}" data-sid="${s.id}" style="
                        display:flex; align-items:center; justify-content:space-between;
                        padding:12px; margin-bottom:8px; border-radius:12px;
                        border:1px solid var(--border-color);
                        ${s.id === activeId ? 'background:rgba(var(--accent-color-rgb), 0.1); border-color:var(--accent-color);' : ''}
                        cursor:pointer; transition:0.2s;
                    ">
                        <span style="font-weight:${s.id === activeId ? '600' : '400'};">${escapeHtml(s.name)}</span>
                        <div style="display:flex; gap:6px;">
                            ${s.id !== 'default' ? `<button class="session-delete-btn" data-sid="${s.id}" style="background:none; border:none; cursor:pointer; color:var(--text-secondary); font-size:14px;">🗑️</button>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
            <div style="display:flex; gap:10px;">
                <input type="text" id="new-session-name" placeholder="新会话名称..." style="flex:1; padding:8px 12px; border:1px solid var(--border-color); border-radius:20px; background:var(--primary-bg); color:var(--text-primary);">
                <button id="create-session-btn" class="btn-primary">+ 创建</button>
            </div>
            <button id="close-session-manager" class="btn-secondary" style="width:100%; margin-top:12px;">关闭</button>
        </div>
    `;
    document.body.appendChild(overlay);

    // 关闭
    overlay.querySelector('#close-session-manager').onclick = () => overlay.remove();
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    // 创建新会话
    overlay.querySelector('#create-session-btn').onclick = () => {
        const nameInput = overlay.querySelector('#new-session-name');
        const name = nameInput.value.trim() || null;
        const newSession = createSession(name);
        showNotification(`会话"${newSession.name}"已创建`, 'success');
        overlay.remove();
        // 切换到新会话
        switchSession(newSession.id);
        renderSessionManagerUI();
    };

    // 点击会话项切换
    overlay.querySelectorAll('.session-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.closest('.session-delete-btn')) return;
            const sid = item.dataset.sid;
            if (sid !== activeId) {
                switchSession(sid);
                overlay.remove();
                renderSessionManagerUI();
            }
        });
    });

    // 删除会话
    overlay.querySelectorAll('.session-delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const sid = btn.dataset.sid;
            const session = sessions.find(s => s.id === sid);
            if (confirm(`确定删除会话"${session?.name}"吗？\n该会话的所有消息将永久删除。`)) {
                if (deleteSession(sid)) {
                    showNotification('会话已删除', 'info');
                    overlay.remove();
                    renderSessionManagerUI();
                }
            }
        });
    });
}

// 重新渲染会话管理UI（用于切换会话后刷新）
function renderSessionManagerUI() {
    // 重新渲染消息区域
    if (typeof renderMessages === 'function') renderMessages(true);
    updateSessionIndicator();
}

// 修改原有的消息保存函数，使用会话特定的键
function patchSaveData() {
    // 重写 throttledSaveData
    if (typeof window.originalThrottledSaveData === 'undefined') {
        window.originalThrottledSaveData = window.throttledSaveData;
    }
    window.throttledSaveData = function() {
        saveCurrentSessionMessages(window.messages);
        localStorage.setItem('chat_settings', JSON.stringify(window.settings));
    };
}

// 修改原有的消息加载函数
function patchLoadData() {
    window.messages = loadCurrentSessionMessages();
    if (typeof renderMessages === 'function') renderMessages();
    window.displayedMessageCount = Math.min(20, window.messages.length);
}

// 初始化多会话管理
function initMultiSession() {
    // 确保默认会话存在
    getSessions();
    // 加载活跃会话
    getActiveSessionId();
    // 修补数据保存/加载
    patchSaveData();
    // 加载当前会话消息（替换默认加载）
    window.messages = loadCurrentSessionMessages();

    // 添加会话管理按钮到加号菜单（仅此入口）
    addSessionButtonToPlusMenu();

    updateSessionIndicator();
}

// 在聊天头部添加会话指示器
function addSessionIndicator() {
    const chatHeader = document.querySelector('#chat-view .view-header');
    if (!chatHeader) return;
    // 在返回按钮和标题之间添加
    const backBtn = chatHeader.querySelector('.view-back-btn');
    const indicator = document.createElement('span');
    indicator.id = 'session-indicator';
    indicator.style.cssText = 'font-size:12px; color:var(--accent-color); background:rgba(var(--accent-color-rgb), 0.1); padding:2px 10px; border-radius:12px; margin:0 8px; cursor:pointer; white-space:nowrap; max-width:120px; overflow:hidden; text-overflow:ellipsis;';
    indicator.textContent = '默认会话';
    indicator.onclick = showSessionManager;
    if (backBtn) {
        backBtn.after(indicator);
    }
}

// 添加会话管理按钮到加号菜单
function addSessionButtonToPlusMenu() {
    const dropdown = document.getElementById('chat-more-dropdown');
    if (!dropdown) return;
    const sessionBtn = document.createElement('button');
    sessionBtn.id = 'more-session-manage';
    sessionBtn.innerHTML = '<i class="fas fa-comments"></i> 会话管理';
    sessionBtn.onclick = (e) => {
        e.stopPropagation();
        showSessionManager();
    };
    dropdown.appendChild(sessionBtn);
}

// 暴露函数到全局
window.getCurrentMessagesKey = getCurrentMessagesKey;
window.saveCurrentSessionMessages = saveCurrentSessionMessages;
window.loadCurrentSessionMessages = loadCurrentSessionMessages;
window.getActiveSessionId = getActiveSessionId;
window.switchSession = switchSession;
