// ========== 碎碎念模块 ==========
let whispers = [];
const WHISPER_KEY = 'whispers';

function loadWhispers() {
    const saved = localStorage.getItem(WHISPER_KEY);
    if (saved) {
        whispers = JSON.parse(saved);
    } else {
        whispers = [];
    }
}

function saveWhispers() {
    localStorage.setItem(WHISPER_KEY, JSON.stringify(whispers));
}

function renderWhispers() {
    const container = document.getElementById('whisper-list');
    if (!container) return;
    if (whispers.length === 0) {
        container.innerHTML = '<div class="empty-whisper">还没有碎碎念，写点什么吧～</div>';
        return;
    }
    // 倒序显示（最新的在上方）
    const sorted = [...whispers].reverse();
    container.innerHTML = sorted.map(item => `
        <div class="whisper-item" data-id="${item.id}">
            <div class="whisper-time">${new Date(item.timestamp).toLocaleString()}</div>
            <div class="whisper-text">${escapeHtml(item.text)}</div>
            <button class="whisper-delete" data-id="${item.id}">🗑️</button>
        </div>
    `).join('');
    
    // 绑定删除事件
    document.querySelectorAll('.whisper-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            deleteWhisper(id);
        });
    });
}

function addWhisper(text) {
    if (!text.trim()) return;
    whispers.push({
        id: Date.now(),
        text: text.trim(),
        timestamp: Date.now()
    });
    saveWhispers();
    renderWhispers();
    if (typeof showNotification === 'function') showNotification('已记录', 'success');
}

function deleteWhisper(id) {
    whispers = whispers.filter(w => w.id !== id);
    saveWhispers();
    renderWhispers();
    if (typeof showNotification === 'function') showNotification('已删除', 'info');
}

function initWhisperModule() {
    loadWhispers();
    renderWhispers();
    const sendBtn = document.getElementById('whisper-send-btn');
    const textarea = document.getElementById('whisper-textarea');
    if (sendBtn) {
        sendBtn.onclick = () => {
            const text = textarea.value.trim();
            if (text) {
                addWhisper(text);
                textarea.value = '';
                textarea.focus();
            } else {
                if (typeof showNotification === 'function') showNotification('内容不能为空', 'warning');
            }
        };
    }
    if (textarea) {
        textarea.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendBtn.click();
            }
        });
    }
}