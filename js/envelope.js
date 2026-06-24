// ========== 信封投递模块 ==========
let envelopeData = {
    outbox: [],   // 发件箱：{ id, content, sentTime, status, expectedReplyTime, replyId? }
    inbox: []     // 收件箱：{ id, refId, content, receivedTime, isRead }
};

const ENVELOPE_KEY = 'envelope_data';

function loadEnvelopeData() {
    const saved = localStorage.getItem(ENVELOPE_KEY);
    if (saved) {
        envelopeData = JSON.parse(saved);
    } else {
        envelopeData = { outbox: [], inbox: [] };
    }
}

function saveEnvelopeData() {
    localStorage.setItem(ENVELOPE_KEY, JSON.stringify(envelopeData));
}

function renderEnvelopeLists() {
    renderOutboxList();
    renderInboxList();
    updateBadges();
}

function renderOutboxList() {
    const container = document.getElementById('outbox-list');
    if (!container) return;
    if (envelopeData.outbox.length === 0) {
        container.innerHTML = '<div class="empty-envelope"><i class="fas fa-paper-plane"></i><p>暂无寄出的信</p><p style="font-size:12px;opacity:0.6;">写下你的思念，寄给远方的 Ta</p></div>';
        return;
    }
    const sorted = [...envelopeData.outbox].reverse();
    container.innerHTML = sorted.map(letter => {
        const sentDate = new Date(letter.sentTime).toLocaleString();
        let statusText = '';
        if (letter.status === 'pending') {
            const remain = letter.expectedReplyTime - Date.now();
            const hours = Math.ceil(remain / (3600 * 1000));
            statusText = `等待回信（约${hours}小时后）`;
        } else if (letter.status === 'replied') {
            statusText = '已回信';
        }
        return `
            <div class="envelope-item" data-id="${letter.id}" data-type="outbox">
                <div class="envelope-item-header">
                    <span class="envelope-date">📅 ${sentDate}</span>
                    <span class="envelope-status">${statusText}</span>
                </div>
                <div class="envelope-preview">${escapeHtml(letter.content.substring(0, 80))}${letter.content.length > 80 ? '…' : ''}</div>
                <div class="envelope-actions">
                    <button class="envelope-view-btn" data-id="${letter.id}" data-type="outbox">查看</button>
                </div>
            </div>
        `;
    }).join('');
    // 绑定查看事件
    document.querySelectorAll('.envelope-view-btn[data-type="outbox"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            const letter = envelopeData.outbox.find(l => l.id === id);
            if (letter) viewLetter(letter, 'outbox');
        });
    });
}

function renderInboxList() {
    const container = document.getElementById('inbox-list');
    if (!container) return;
    if (envelopeData.inbox.length === 0) {
        container.innerHTML = '<div class="empty-envelope"><i class="fas fa-inbox"></i><p>暂无收到的信</p><p style="font-size:12px;opacity:0.6;">Ta 的回信会在 24 小时后送达</p></div>';
        return;
    }
    const sorted = [...envelopeData.inbox].reverse();
    container.innerHTML = sorted.map(letter => {
        const receivedDate = new Date(letter.receivedTime).toLocaleString();
        const isUnread = !letter.isRead;
        return `
            <div class="envelope-item ${isUnread ? 'unread' : ''}" data-id="${letter.id}" data-type="inbox">
                <div class="envelope-item-header">
                    <span class="envelope-date"><i class="fas fa-envelope-open"></i> ${receivedDate}</span>
                    ${isUnread ? '<span class="unread-badge">新</span>' : ''}
                </div>
                <div class="envelope-preview">${escapeHtml(letter.content.substring(0, 80))}${letter.content.length > 80 ? '…' : ''}</div>
                <div class="envelope-actions">
                    <button class="envelope-view-btn" data-id="${letter.id}" data-type="inbox">查看</button>
                </div>
            </div>
        `;
    }).join('');
    // 绑定查看事件
    document.querySelectorAll('.envelope-view-btn[data-type="inbox"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            const letter = envelopeData.inbox.find(l => l.id === id);
            if (letter) viewLetter(letter, 'inbox');
        });
    });
}

function viewLetter(letter, type) {
    if (type === 'inbox' && !letter.isRead) {
        letter.isRead = true;
        saveEnvelopeData();
        renderInboxList();
        updateBadges();
    }
    if (type === 'outbox') {
        // 查看寄出的信（只读）
        const modal = document.getElementById('letter-modal');
        const textarea = modal.querySelector('#letter-content');
        const titleSpan = modal.querySelector('.modal-title span');
        const sendBtn = modal.querySelector('#letter-send');
        const cancelBtn = modal.querySelector('#letter-cancel');
        textarea.value = letter.content;
        textarea.readOnly = true;
        titleSpan.innerText = '寄出的信';
        sendBtn.style.display = 'none';
        cancelBtn.innerText = '关闭';
        // 关闭恢复
        const closeHandler = () => {
            textarea.readOnly = false;
            textarea.value = '';
            titleSpan.innerText = '写一封信';
            sendBtn.style.display = 'inline-block';
            cancelBtn.innerText = '取消';
            hideModal(modal);
            modal.removeEventListener('click', closeHandler);
        };
        cancelBtn.onclick = closeHandler;
        modal.querySelector('.modal-content').addEventListener('click', (e) => e.stopPropagation());
        showModal(modal);
    } else {
        // 查看回信
        const modal = document.getElementById('reply-modal');
        const contentDiv = document.getElementById('reply-content');
        contentDiv.innerText = letter.content;
        showModal(modal);
    }
}

function updateBadges() {
    const unreadCount = envelopeData.inbox.filter(l => !l.isRead).length;
    const inboxTab = document.querySelector('.envelope-tab[data-tab="inbox"]');
    if (inboxTab) {
        let badge = inboxTab.querySelector('.badge');
        if (unreadCount > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'badge';
                inboxTab.appendChild(badge);
            }
            badge.textContent = unreadCount;
        } else if (badge) {
            badge.remove();
        }
    }
}

function sendLetter() {
    const content = document.getElementById('letter-content').value.trim();
    if (!content) {
        showNotification('内容不能为空', 'warning');
        return;
    }
    const now = Date.now();
    const replyTime = now + 24 * 60 * 60 * 1000; // 24小时后
    const newLetter = {
        id: now,
        content: content,
        sentTime: now,
        status: 'pending',
        expectedReplyTime: replyTime
    };
    envelopeData.outbox.push(newLetter);
    saveEnvelopeData();
    document.getElementById('letter-content').value = '';
    hideModal(document.getElementById('letter-modal'));
    renderOutboxList();
    showNotification('信件已寄出，回信将在24小时后送达', 'success');
}

function generateReplyContent() {
    // 从回复库获取字卡列表
    let source = [];
    if (window.customReplies && window.customReplies.cards && window.customReplies.cards.length) {
        source = window.customReplies.cards;
    } else if (typeof customReplies !== 'undefined' && customReplies.cards && customReplies.cards.length) {
        source = customReplies.cards;
    } else {
        source = ['今天天气不错', '注意休息', '期待与你聊天'];
    }
    const greetings = ['亲爱的：', '展信佳。', '见字如面，', '嗨，最近还好吗？', ''];
    const signoffs = ['', '—— 想念你的 Ta', '—— 此致 敬礼', '—— 等你回信', '—— 永远爱你'];
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    const signoff = signoffs[Math.floor(Math.random() * signoffs.length)];
    const sentenceCount = Math.floor(Math.random() * 4) + 4; // 4-7句
    let body = '';
    for (let i = 0; i < sentenceCount; i++) {
        const randomIndex = Math.floor(Math.random() * source.length);
        let sentence = source[randomIndex];
        if (!sentence.endsWith('。') && !sentence.endsWith('…') && !sentence.endsWith('！') && !sentence.endsWith('？')) {
            sentence += Math.random() < 0.5 ? '。' : '…';
        }
        body += sentence;
        if (i < sentenceCount - 1) body += '\n';
    }
    const parts = [];
    if (greeting) parts.push(greeting);
    parts.push(body);
    if (signoff) parts.push(signoff);
    return parts.join('\n\n');
}

function checkPendingReplies() {
    const now = Date.now();
    let updated = false;
    for (const letter of envelopeData.outbox) {
        if (letter.status === 'pending' && letter.expectedReplyTime && now >= letter.expectedReplyTime) {
            const replyContent = generateReplyContent();
            const reply = {
                id: now,
                refId: letter.id,
                content: replyContent,
                receivedTime: now,
                isRead: false
            };
            envelopeData.inbox.push(reply);
            letter.status = 'replied';
            letter.replyId = reply.id;
            updated = true;
            // 添加系统消息到聊天
            if (typeof addMessage === 'function') {
                addMessage({
                    id: Date.now(),
                    sender: 'system',
                    text: `📬 你收到了一封回信，快去看看信箱吧～`,
                    timestamp: new Date(),
                    type: 'system',
                    favorited: false
                });
            }
        }
    }
    if (updated) {
        saveEnvelopeData();
        renderInboxList();
        renderOutboxList();
        updateBadges();
        if (typeof showNotification === 'function') showNotification('有新的回信！', 'info');
    }
}

function initEnvelopeModule() {
    loadEnvelopeData();
    renderEnvelopeLists();
    checkPendingReplies(); // 立即检查是否有到期的回信
    // 每隔1小时检查一次（避免页面长期打开不检查）
    setInterval(checkPendingReplies, 60 * 60 * 1000);

    // 标签页切换
    const tabs = document.querySelectorAll('.envelope-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById('envelope-outbox').style.display = target === 'outbox' ? 'block' : 'none';
            document.getElementById('envelope-inbox').style.display = target === 'inbox' ? 'block' : 'none';
        });
    });

    // 新信按钮
    const newBtn = document.getElementById('new-letter-btn');
    if (newBtn) {
        newBtn.onclick = () => {
            const modal = document.getElementById('letter-modal');
            const textarea = modal.querySelector('#letter-content');
            const titleSpan = modal.querySelector('.modal-title span');
            const sendBtn = modal.querySelector('#letter-send');
            const cancelBtn = modal.querySelector('#letter-cancel');
            textarea.value = '';
            textarea.readOnly = false;
            titleSpan.innerText = '写一封信';
            sendBtn.style.display = 'inline-block';
            cancelBtn.innerText = '取消';
            // 重新绑定发送
            const newSend = sendBtn.cloneNode(true);
            sendBtn.parentNode.replaceChild(newSend, sendBtn);
            newSend.onclick = () => sendLetter();
            const newCancel = cancelBtn.cloneNode(true);
            cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);
            newCancel.onclick = () => hideModal(modal);
            showModal(modal);
        };
    }

    // 关闭模态框（点击背景）
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal && typeof hideModal === 'function') hideModal(modal);
        });
    });

    const replyClose = document.getElementById('reply-close');
    if (replyClose) replyClose.onclick = () => hideModal(document.getElementById('reply-modal'));
}