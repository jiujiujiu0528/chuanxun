// ========== 聊天核心逻辑（含分页、引用回复、收藏、批量发送、音效） ==========
let messages = [];
window.messages = messages;   // 全局挂载
let currentImageData = null;
let isBatchMode = false;
let batchMessages = [];

// 分页相关
let displayedMessageCount = 20;      // 当前显示的消息条数
window.displayedMessageCount = displayedMessageCount;
const HISTORY_BATCH_SIZE = 20;       // 每次加载更多条数
let isLoadingHistory = false;        // 防止重复加载

// 引用回复相关
let currentReplyTo = null;

// 正在输入指示器相关
let typingIndicatorElement = null;
let typingTimeoutId = null;
//勾选导出
let isSelectExportMode = false;
let selectedMessagesForExport = new Set();   // 存储选中消息的id

// DOM 元素
let chatContainer, messageInput, sendBtn, continueBtn, pokeBtn;
let replyPreviewContainer, batchPreviewContainer;

// 初始化聊天DOM引用
function initChatElements() {
    chatContainer = document.getElementById('chat-container');
    messageInput = document.getElementById('message-input');
    sendBtn = document.getElementById('send-btn');
    continueBtn = document.getElementById('continue-btn');
    pokeBtn = document.getElementById('poke-btn');
    replyPreviewContainer = document.getElementById('reply-preview-container');
    batchPreviewContainer = document.getElementById('batch-preview-container');
    
    if (chatContainer) {
        chatContainer.addEventListener('scroll', handleChatScroll);
    }
    // 初始化输入指示器名称
    const nameEl = document.getElementById('typing-indicator-name');
    if (nameEl) nameEl.textContent = settings.partnerName || '对方';
}

// 滚动加载更多历史消息
function handleChatScroll() {
    if (isLoadingHistory) return;
    if (chatContainer.scrollTop < 100 && messages.length > displayedMessageCount) {
        isLoadingHistory = true;
        const oldHeight = chatContainer.scrollHeight;
        displayedMessageCount = Math.min(messages.length, displayedMessageCount + HISTORY_BATCH_SIZE);
        window.displayedMessageCount = displayedMessageCount;
        renderMessages(true);
        const newHeight = chatContainer.scrollHeight;
        chatContainer.scrollTop = newHeight - oldHeight;
        isLoadingHistory = false;
    }
}

// 滚动到底部（显示最新消息）
function scrollChatToBottom() {
    if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}
window.scrollChatToBottom = scrollChatToBottom;

// 添加消息
function addMessage(msg) {
    if (msg.favorited === undefined) msg.favorited = false;
    messages.push(msg);
    window.messages = messages;
    
    // 如果显示的消息条数已经是全部，增加显示数量以显示新消息
    if (displayedMessageCount >= messages.length - 1) {
        displayedMessageCount = messages.length;
        window.displayedMessageCount = displayedMessageCount;
    }
    renderMessages(true);
    throttledSaveData();
    scrollChatToBottom();
    
    // 播放音效
    if (msg.sender === 'user' && msg.type !== 'system') {
        if (typeof playSoundForScene === 'function') playSoundForScene('my_send');
    } else if (msg.sender !== 'user' && msg.type !== 'system') {
        if (typeof playSoundForScene === 'function') playSoundForScene('partner_message');
    } else if (msg.type === 'system' && msg.text && msg.text.includes('拍了拍')) {
        if (msg.text.includes(settings.myName)) {
            if (typeof playSoundForScene === 'function') playSoundForScene('my_poke');
        } else {
            if (typeof playSoundForScene === 'function') playSoundForScene('partner_poke');
        }
    }
    
    // 发送系统通知（仅对方发送的消息）
    if (msg.sender !== 'user' && msg.type !== 'system') {
        if (typeof sendNotification === 'function') {
            sendNotification(settings.partnerName, msg.text || '发来了一条消息');
        }
    }
    
    // 刷新统计视图（如果打开）
    const statsView = document.getElementById('stats-view');
    if (statsView && statsView.classList.contains('active') && typeof window.refreshStats === 'function') {
        window.refreshStats();
    }
}

// 渲染消息列表（支持分页）
function renderMessages(preserveScroll = false) {
    if (!chatContainer) return;
    const total = messages.length;
    const startIndex = Math.max(0, total - displayedMessageCount);
    const messagesToRender = messages.slice(startIndex);
    
    const oldScrollTop = chatContainer.scrollTop;
    const oldScrollHeight = chatContainer.scrollHeight;
    
    chatContainer.innerHTML = '';
    
    messagesToRender.forEach(msg => {
        const wrapper = document.createElement('div');
        // 系统消息居中显示
        if (msg.type === 'system') {
            wrapper.className = 'message-wrapper system';
        } else {
            wrapper.className = `message-wrapper ${msg.sender === 'user' ? 'sent' : 'received'}`;
        }
        wrapper.dataset.id = msg.id;

        // 系统消息：居中通知样式
        if (msg.type === 'system') {
            const systemDiv = document.createElement('div');
            systemDiv.className = 'message-system';
            systemDiv.textContent = msg.text;
            wrapper.appendChild(systemDiv);
            chatContainer.appendChild(wrapper);
            return;
        }
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        if (isSelectExportMode) {
            const checkbox = document.createElement('div');
            checkbox.className = 'select-checkbox';
            const isChecked = selectedMessagesForExport.has(msg.id);
            checkbox.innerHTML = isChecked ? '☑' : '☐';
            checkbox.style.cssText = 'cursor: pointer; margin-right: 8px; font-size: 20px;';
            checkbox.onclick = (e) => {
                e.stopPropagation();
                toggleMessageSelection(msg.id);
            };
            wrapper.insertBefore(checkbox, wrapper.firstChild);
        }
        wrapper.onclick = (e) => {
            if (isSelectExportMode && !e.target.closest('.message-actions') && !e.target.closest('.msg-action-btn')) {
                e.stopPropagation();
                toggleMessageSelection(msg.id);
             }
        };
        
        // 引用块
        if (msg.replyTo) {
            const replyBlock = document.createElement('div');
            replyBlock.className = 'reply-indicator';
            replyBlock.setAttribute('data-reply-id', msg.replyTo.id);
            const senderName = msg.replyTo.sender === 'user' ? (settings.myName || '我') : (settings.partnerName || '对方');
            const previewText = msg.replyTo.text ? (msg.replyTo.text.length > 40 ? msg.replyTo.text.substring(0,40)+'…' : msg.replyTo.text) : (msg.replyTo.image ? '📷 图片' : '[消息]');
            replyBlock.innerHTML = `<span class="reply-sender">${escapeHtml(senderName)}</span><span class="reply-text">${escapeHtml(previewText)}</span>`;
            replyBlock.addEventListener('click', (e) => {
                e.stopPropagation();
                scrollToMessage(msg.replyTo.id);
            });
            contentDiv.appendChild(replyBlock);
        }
        
        // 消息气泡
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${msg.sender === 'user' ? 'message-sent' : 'message-received'}`;
        if (msg.text) {
            messageDiv.textContent = msg.text;
        } else if (msg.image) {
            const img = document.createElement('img');
            img.src = msg.image;
            img.style.maxWidth = '150px';
            img.style.borderRadius = '8px';
            messageDiv.appendChild(img);
        }
        contentDiv.appendChild(messageDiv);
        
        // 操作按钮
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'message-actions';
        
        // 回复按钮
        const replyBtn = document.createElement('button');
        replyBtn.innerHTML = '<i class="fas fa-reply"></i>';
        replyBtn.title = '回复';
        replyBtn.className = 'msg-action-btn';
        replyBtn.onclick = (e) => {
            e.stopPropagation();
            setReplyTo(msg);
        };
        actionsDiv.appendChild(replyBtn);
        
        // 收藏按钮
        const favBtn = document.createElement('button');
        const isFavorited = msg.favorited === true;
        favBtn.innerHTML = isFavorited ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
        favBtn.title = isFavorited ? '取消收藏' : '收藏';
        favBtn.className = 'msg-action-btn favorite-btn';
        if (isFavorited) favBtn.classList.add('favorited');
        favBtn.onclick = (e) => {
            e.stopPropagation();
            toggleFavorite(msg.id);
        };
        actionsDiv.appendChild(favBtn);
        
        // 已读回执状态（仅用户消息且开启已读回执）
        if (msg.sender === 'user' && settings.readReceiptsEnabled && msg.status === 'read') {
            const statusSpan = document.createElement('div');
            statusSpan.className = 'message-status';
            if (settings.readReceiptStyle === 'icon') {
                statusSpan.innerHTML = '<i class="fas fa-check-double"></i>';
            } else {
                statusSpan.textContent = '已读';
            }
            contentDiv.appendChild(statusSpan);
        }
        
        contentDiv.appendChild(actionsDiv);
        wrapper.appendChild(contentDiv);
        chatContainer.appendChild(wrapper);
    });
    
    if (preserveScroll) {
        const newScrollHeight = chatContainer.scrollHeight;
        chatContainer.scrollTop = oldScrollTop + (newScrollHeight - oldScrollHeight);
    } else {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}

// 切换收藏
function toggleFavorite(messageId) {
    const msg = messages.find(m => m.id === messageId);
    if (msg) {
        msg.favorited = !msg.favorited;
        renderMessages(true);
        throttledSaveData();
        if (typeof showNotification === 'function') {
            showNotification(msg.favorited ? '已收藏' : '已取消收藏', 'success', 1500);
        }
    }
}

// 设置引用目标
function setReplyTo(msg) {
    currentReplyTo = {
        id: msg.id,
        sender: msg.sender,
        text: msg.text || (msg.image ? '[图片]' : '[消息]'),
        image: msg.image || null
    };
    updateReplyPreview();
    messageInput.focus();
}

// 更新引用预览条
function updateReplyPreview() {
    if (!replyPreviewContainer) return;
    if (!currentReplyTo) {
        replyPreviewContainer.style.display = 'none';
        replyPreviewContainer.innerHTML = '';
        return;
    }
    const senderName = currentReplyTo.sender === 'user' ? (settings.myName || '我') : (settings.partnerName || '对方');
    const previewText = currentReplyTo.text ? (currentReplyTo.text.length > 40 ? currentReplyTo.text.substring(0,40)+'…' : currentReplyTo.text) : (currentReplyTo.image ? '📷 图片' : '');
    replyPreviewContainer.style.display = 'flex';
    replyPreviewContainer.innerHTML = `
        <div class="reply-preview">
            <span class="reply-preview-label">回复 ${escapeHtml(senderName)}：</span>
            <span class="reply-preview-text">${escapeHtml(previewText)}</span>
            <button class="reply-preview-cancel" id="cancel-reply-preview">&times;</button>
        </div>
    `;
    const cancelBtn = document.getElementById('cancel-reply-preview');
    if (cancelBtn) cancelBtn.onclick = () => { currentReplyTo = null; updateReplyPreview(); };
}

// 显示正在输入指示器（使用静态元素，不受 renderMessages 的 innerHTML 影响）
function showTypingIndicator() {
    if (!settings.typingIndicatorEnabled) return;
    const indicator = document.getElementById('typing-indicator');
    if (!indicator) return;
    const nameEl = document.getElementById('typing-indicator-name');
    if (nameEl) nameEl.textContent = settings.partnerName || '对方';
    indicator.style.display = 'flex';
    typingIndicatorElement = indicator;
}

// 隐藏正在输入指示器
function hideTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.style.display = 'none';
    }
    typingIndicatorElement = null;
}
function enterSelectExportMode() {
    isSelectExportMode = true;
    selectedMessagesForExport.clear();
    renderMessages(true);
    showNotification('进入选择模式，点击消息勾选，完成后点击工具栏“确认导出”', 'info');
    // 在底部添加确认导出条
    showExportSelectionBar();
}

function exitSelectExportMode() {
    isSelectExportMode = false;
    selectedMessagesForExport.clear();
    renderMessages(true);
    hideExportSelectionBar();
}

function showExportSelectionBar() {
    if (document.getElementById('export-selection-bar')) return;
    const bar = document.createElement('div');
    bar.id = 'export-selection-bar';
    bar.style.cssText = 'position: fixed; bottom: 80px; left: 0; right: 0; background: var(--secondary-bg); border-top: 1px solid var(--border-color); padding: 10px; display: flex; justify-content: space-between; z-index: 1000;';
    bar.innerHTML = `
        <span id="selected-count">已选 0 条</span>
        <div>
            <button id="cancel-selection" class="btn-secondary">取消</button>
            <button id="confirm-export" class="btn-primary">确认导出</button>
        </div>
    `;
    document.body.appendChild(bar);
    document.getElementById('cancel-selection').onclick = exitSelectExportMode;
    document.getElementById('confirm-export').onclick = confirmExportSelected;
}

function hideExportSelectionBar() {
    const bar = document.getElementById('export-selection-bar');
    if (bar) bar.remove();
}

function updateSelectedCount() {
    const span = document.getElementById('selected-count');
    if (span) span.innerText = `已选 ${selectedMessagesForExport.size} 条`;
}

function toggleMessageSelection(msgId) {
    if (selectedMessagesForExport.has(msgId)) {
        selectedMessagesForExport.delete(msgId);
    } else {
        selectedMessagesForExport.add(msgId);
    }
    updateSelectedCount();
    // 重新渲染以更新勾选样式
    renderMessages(true);
}

//勾选导出
function confirmExportSelected() {
    if (selectedMessagesForExport.size === 0) {
        showNotification('请至少选择一条消息', 'warning');
        return;
    }
    const selectedMsgs = messages.filter(m => selectedMessagesForExport.has(m.id));
    const myName = settings.myName || '我';
    const partnerName = settings.partnerName || '对方';
    
    let textContent = `勾选导出 (${new Date().toLocaleString()})\n`;
    textContent += `共 ${selectedMsgs.length} 条消息\n`;
    textContent += '='.repeat(50) + '\n\n';
    
    selectedMsgs.forEach(msg => {
        const sender = msg.sender === 'user' ? myName : partnerName;
        const time = new Date(msg.timestamp).toLocaleString();
        const content = msg.text || (msg.image ? '[图片]' : '[消息]');
        textContent += `[${time}] ${sender}：\n${content}\n\n`;
    });
    
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `selected_chat_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification(`已导出 ${selectedMsgs.length} 条消息`, 'success');
    exitSelectExportMode();
}

// 发送消息（支持引用、已读回执、已读不回）
function sendMessage() {
    const text = messageInput.value.trim();
    if (!text && !currentImageData) return;

    // 取消之前的回复计时器
    if (typingTimeoutId) clearTimeout(typingTimeoutId);

    // 先判断是否会回复
    const shouldIgnore = settings.allowReadNoReply && (Math.random() < settings.readNoReplyChance);

    // 在 addMessage 之前就显示输入指示器（因为它独立于 chatContainer，不会被 renderMessages 破坏）
    if (!shouldIgnore && settings.typingIndicatorEnabled && customReplies.cards && customReplies.cards.length) {
        showTypingIndicator();
    } else if (shouldIgnore) {
        hideTypingIndicator();
    }

    const msg = {
        id: Date.now(),
        sender: 'user',
        text: text,
        image: currentImageData,
        timestamp: new Date(),
        status: 'sent',
        favorited: false,
        replyTo: currentReplyTo ? { ...currentReplyTo } : null
    };
    addMessage(msg);

    messageInput.value = '';
    currentImageData = null;
    currentReplyTo = null;
    updateReplyPreview();

    // 已读回执（延迟标记已读）
    if (settings.readReceiptsEnabled) {
        setTimeout(() => {
            const lastSent = messages.find(m => m.id === msg.id);
            if (lastSent && lastSent.status !== 'read') {
                lastSent.status = 'read';
                renderMessages(true);
                throttledSaveData();
            }
        }, 1500);
    }

    if (shouldIgnore) return;

    // 5% 概率对方来电（在回复之后）
    if (Math.random() < 0.05) triggerIncomingCall();

    const delay = settings.replyDelayMin + Math.random() * (settings.replyDelayMax - settings.replyDelayMin);
    typingTimeoutId = setTimeout(() => {
        hideTypingIndicator();
        // 2% 概率对方发来随机图画
        if (Math.random() < 0.02 && typeof generateAndSendDrawingToChat === 'function') {
            generateAndSendDrawingToChat();
            return;
        }
        // 连发多条消息
        const burstCount = settings.replyMaxBurst || 1;
        const actualBurst = 1 + Math.floor(Math.random() * burstCount); // 1 ~ maxBurst
        let burstDelay = 0;
        for (let i = 0; i < actualBurst; i++) {
            setTimeout(() => {
                if (customReplies.cards && customReplies.cards.length) {
                    const replyText = customReplies.cards[Math.floor(Math.random() * customReplies.cards.length)];
                    let replyTo = null;
                    if (i === 0 && Math.random() < 0.1 && msg.id) {
                        replyTo = { id: msg.id, sender: msg.sender, text: msg.text || (msg.image ? '[图片]' : '') };
                    }
                    addMessage({
                        id: Date.now() + i,
                        sender: settings.partnerName,
                        text: replyText,
                        timestamp: new Date(),
                        status: 'received',
                        favorited: false,
                        replyTo: replyTo
                    });
                }
            }, burstDelay);
            burstDelay += 400 + Math.random() * 800; // 每条间隔0.4-1.2s
        }
    }, delay);
}

// 滚动到引用的消息
function scrollToMessage(msgId) {
    const target = document.querySelector(`.message-wrapper[data-id="${msgId}"]`);
    if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.classList.add('highlight-msg');
        setTimeout(() => target.classList.remove('highlight-msg'), 1500);
    } else {
        if (typeof showNotification === 'function') showNotification('原消息已删除或不在当前范围', 'info');
    }
}

// 对方继续说（遵循设置的回复节奏）
function triggerPartnerReply() {
    // 取消之前的计时器但保留输入指示器
    if (typingTimeoutId) clearTimeout(typingTimeoutId);

    const shouldIgnore = settings.allowReadNoReply && (Math.random() < settings.readNoReplyChance);
    if (shouldIgnore) {
        hideTypingIndicator();
        return;
    }

    if (!customReplies.cards || !customReplies.cards.length) return;

    // 显示正在输入中
    if (settings.typingIndicatorEnabled) {
        showTypingIndicator();
    }

    const delay = settings.replyDelayMin + Math.random() * (settings.replyDelayMax - settings.replyDelayMin);
    typingTimeoutId = setTimeout(() => {
        hideTypingIndicator();
        const reply = customReplies.cards[Math.floor(Math.random() * customReplies.cards.length)];
        addMessage({
            id: Date.now(),
            sender: settings.partnerName,
            text: reply,
            timestamp: new Date(),
            status: 'received',
            favorited: false
        });
    }, delay);
}

// 拍一拍（发送系统提示，对方延迟回复）
function sendPoke(pokeText) {
    const text = pokeText || `${settings.myName} 拍了拍 ${settings.partnerName}`;
    addMessage({
        id: Date.now(),
        sender: 'system',
        text: text,
        timestamp: new Date(),
        type: 'system',
        favorited: false
    });
    // 对方回应（使用回复库字卡或拍一拍预设）
    const delay = 800 + Math.random() * 1200;
    setTimeout(() => {
        const pokes = customReplies.pokes || [];
        const cards = customReplies.cards || [];
        const pool = [...pokes, ...cards];
        const reply = pool.length ? pool[Math.floor(Math.random() * pool.length)] : '嗯？';
        addMessage({
            id: Date.now(),
            sender: settings.partnerName,
            text: reply,
            timestamp: new Date(),
            status: 'received',
            favorited: false
        });
    }, delay);
}

// 发送表情包
function sendSticker(dataUrl) {
    addMessage({
        id: Date.now(),
        sender: 'user',
        text: '',
        image: dataUrl,
        timestamp: new Date(),
        status: 'sent',
        favorited: false
    });
    // 对方回应表情包
    const partnerStickers = customReplies.partnerStickers || [];
    if (partnerStickers.length > 0) {
        const delay = settings.replyDelayMin + Math.random() * (settings.replyDelayMax - settings.replyDelayMin);
        setTimeout(() => {
            const sticker = partnerStickers[Math.floor(Math.random() * partnerStickers.length)];
            addMessage({
                id: Date.now(),
                sender: settings.partnerName,
                text: '',
                image: sticker.dataUrl,
                timestamp: new Date(),
                status: 'received',
                favorited: false
            });
        }, delay);
    } else {
        // 没有对方表情包则文字回复
        const delay = settings.replyDelayMin + Math.random() * (settings.replyDelayMax - settings.replyDelayMin);
        setTimeout(() => {
            const cards = customReplies.cards || [];
            if (cards.length) {
                addMessage({
                    id: Date.now(),
                    sender: settings.partnerName,
                    text: cards[Math.floor(Math.random() * cards.length)],
                    timestamp: new Date(),
                    status: 'received',
                    favorited: false
                });
            }
        }, delay);
    }
}

// 显示表情互动面板
function showInteractPanel() {
    // 如果已存在则关闭
    const existing = document.getElementById('interact-panel');
    if (existing) { existing.remove(); return; }

    const panel = document.createElement('div');
    panel.id = 'interact-panel';
    panel.className = 'interact-panel';
    panel.innerHTML = `
        <div class="interact-section">
            <div class="interact-section-title">😊 表情包(我)</div>
            <div class="interact-sticker-grid" id="interact-my-stickers">
                ${renderInteractStickers('myStickers')}
            </div>
        </div>
        <div class="interact-section">
            <div class="interact-section-title">😊 表情包(对方)</div>
            <div class="interact-sticker-grid" id="interact-partner-stickers">
                ${renderInteractStickers('partnerStickers')}
            </div>
        </div>
        <div class="interact-section">
            <div class="interact-section-title">👋 拍一拍</div>
            <div class="interact-poke-list" id="interact-poke-list">
                ${renderInteractPokes()}
            </div>
            <div class="interact-poke-custom">
                <input type="text" id="interact-custom-poke" placeholder="自定义拍一拍...">
                <button id="interact-send-custom-poke" class="btn-primary" style="font-size:12px; padding:6px 12px;">发送</button>
            </div>
        </div>
    `;
    document.body.appendChild(panel);

    // 定位在输入区域上方
    const inputArea = document.querySelector('#chat-view .input-area');
    if (inputArea) {
        const rect = inputArea.getBoundingClientRect();
        panel.style.bottom = (window.innerHeight - rect.top + 8) + 'px';
        panel.style.left = '12px';
        panel.style.right = '12px';
    }

    // 绑定事件
    bindInteractPanelEvents(panel);

    // 点击外部关闭
    setTimeout(() => {
        document.addEventListener('click', function closeInteract(e) {
            if (!panel.contains(e.target) && e.target !== document.getElementById('poke-btn')) {
                panel.remove();
                document.removeEventListener('click', closeInteract);
            }
        });
    }, 100);
}

function renderInteractStickers(type) {
    let stickers = (typeof customReplies !== 'undefined' && customReplies) ? (customReplies[type] || []) : [];
    // 回退：直接从 localStorage 读取
    if (!stickers.length) {
        try {
            const raw = localStorage.getItem('custom_replies');
            if (raw) { const d = JSON.parse(raw); stickers = d[type] || []; }
        } catch (e) {}
    }
    if (!stickers.length) return '<div class="interact-empty">暂无表情包，去回复库添加吧</div>';
    return stickers.map(s => `
        <div class="interact-sticker-item" data-sticker="${escapeHtml(s.dataUrl)}">
            <img src="${s.dataUrl}" alt="${escapeHtml(s.name || '')}" title="${escapeHtml(s.name || '')}">
        </div>
    `).join('');
}

function renderInteractPokes() {
    const pokes = customReplies.pokes || [];
    const defaults = ['拍了拍你的头', '戳了戳你的脸', '给了你一个拥抱', '牵起了你的手', '摸了摸你的头发', '轻轻靠在你肩上'];
    const allPokes = pokes.length ? pokes : defaults;
    return allPokes.slice(0, 8).map(p => `
        <div class="interact-poke-item">${escapeHtml(p)}</div>
    `).join('');
}

function bindInteractPanelEvents(panel) {
    // 表情包点击
    panel.querySelectorAll('.interact-sticker-item').forEach(item => {
        item.addEventListener('click', () => {
            const dataUrl = item.dataset.sticker;
            if (dataUrl) {
                sendSticker(dataUrl);
                panel.remove();
            }
        });
    });

    // 拍一拍点击
    panel.querySelectorAll('.interact-poke-item').forEach(item => {
        item.addEventListener('click', () => {
            const text = `${settings.myName} ${item.textContent.trim()}`;
            sendPoke(text);
            panel.remove();
        });
    });

    // 自定义拍一拍
    const customInput = panel.querySelector('#interact-custom-poke');
    const sendCustomBtn = panel.querySelector('#interact-send-custom-poke');
    if (sendCustomBtn && customInput) {
        sendCustomBtn.onclick = () => {
            const text = customInput.value.trim();
            if (text) {
                sendPoke(`${settings.myName} ${text}`);
                panel.remove();
            }
        };
        customInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && customInput.value.trim()) {
                sendPoke(`${settings.myName} ${customInput.value.trim()}`);
                panel.remove();
            }
        });
    }
}

// 图片选择
function openImagePicker() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = e => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = ev => {
                currentImageData = ev.target.result;
                if (isBatchMode) {
                    addToBatch();
                } else {
                    sendMessage();
                }
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
}

// ========== 批量发送模式 ==========
function showBatchPreview() {
    if (!batchPreviewContainer) return;
    batchPreviewContainer.style.display = 'block';
    renderBatchPreview();
}

function hideBatchPreview() {
    if (!batchPreviewContainer) return;
    batchPreviewContainer.style.display = 'none';
    batchPreviewContainer.innerHTML = '';
}

function renderBatchPreview() {
    if (!batchPreviewContainer) return;
    if (batchMessages.length === 0) {
        batchPreviewContainer.innerHTML = '<div class="batch-empty">暂无消息，点击 + 添加</div>';
        return;
    }
    let html = '<div class="batch-list">';
    batchMessages.forEach((msg, idx) => {
        const preview = msg.image 
            ? `<img src="${msg.image}" style="width:36px; height:36px; object-fit:cover; border-radius:6px;">` 
            : `<span class="batch-text-preview">${escapeHtml(msg.text || '')}</span>`;
        html += `
            <div class="batch-item" data-index="${idx}">
                <div class="batch-item-content">${preview}</div>
                <div class="batch-item-actions">
                    <button class="batch-edit" data-index="${idx}"><i class="fas fa-edit"></i></button>
                    <button class="batch-delete" data-index="${idx}"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>
        `;
    });
    html += `</div><div class="batch-footer"><button id="batch-send-all" class="btn-primary">发送全部 (${batchMessages.length})</button></div>`;
    batchPreviewContainer.innerHTML = html;
    
    document.querySelectorAll('.batch-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(btn.dataset.index);
            const msg = batchMessages[idx];
            if (msg && !msg.image) {
                const newText = prompt('编辑消息内容:', msg.text);
                if (newText !== null) {
                    batchMessages[idx].text = newText.trim();
                    renderBatchPreview();
                }
            } else {
                alert('暂不支持编辑图片，请删除后重新添加');
            }
        });
    });
    document.querySelectorAll('.batch-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(btn.dataset.index);
            batchMessages.splice(idx, 1);
            renderBatchPreview();
            if (batchMessages.length === 0) exitBatchMode();
        });
    });
    const sendAllBtn = document.getElementById('batch-send-all');
    if (sendAllBtn) sendAllBtn.onclick = sendAllBatchMessages;
}

function addToBatch() {
    const text = messageInput.value.trim();
    if (!text && !currentImageData) {
        if (typeof showNotification === 'function') showNotification('请输入内容或选择图片', 'warning');
        return;
    }
    batchMessages.push({
        id: Date.now() + batchMessages.length,
        text: text,
        image: currentImageData
    });
    messageInput.value = '';
    currentImageData = null;
    if (!isBatchMode) enterBatchMode();
    else renderBatchPreview();
}

function sendAllBatchMessages() {
    if (batchMessages.length === 0) return;
    if (typeof showNotification === 'function') showNotification(`正在发送 ${batchMessages.length} 条消息...`, 'info');
    let delay = 0;
    batchMessages.forEach((msg, idx) => {
        setTimeout(() => {
            addMessage({
                id: Date.now() + idx,
                sender: 'user',
                text: msg.text || '',
                image: msg.image || null,
                timestamp: new Date(),
                status: 'sent',
                favorited: false,
                replyTo: null
            });
        }, delay);
        delay += 300;
    });
    setTimeout(() => {
        if (customReplies.cards && customReplies.cards.length) {
            const reply = customReplies.cards[Math.floor(Math.random() * customReplies.cards.length)];
            addMessage({
                id: Date.now(),
                sender: settings.partnerName,
                text: reply,
                timestamp: new Date(),
                status: 'received',
                favorited: false
            });
        }
    }, delay + (settings.replyDelayMin + Math.random() * (settings.replyDelayMax - settings.replyDelayMin)));
    
    batchMessages = [];
    exitBatchMode();
}

function enterBatchMode() {
    isBatchMode = true;
    if (sendBtn) {
        sendBtn.innerHTML = '<i class="fas fa-plus"></i>';
        sendBtn.title = '添加到批量列表';
    }
    showBatchPreview();
    if (messageInput) messageInput.placeholder = '输入内容，点击 + 添加到列表';
}

function exitBatchMode() {
    isBatchMode = false;
    if (sendBtn) {
        sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
        sendBtn.title = '发送';
    }
    hideBatchPreview();
    if (messageInput) messageInput.placeholder = '输入消息...';
}

function toggleBatchMode() {
    if (isBatchMode) exitBatchMode();
    else enterBatchMode();
}

// ========== 视频通话模块 ==========
let callState = {
    active: false,
    direction: null,   // 'outgoing' | 'incoming'
    startTime: null,
    timerInterval: null,
    incomingTimeout: null,
    answered: false
};

// 打开通话模态框
function openCallModal(direction) {
    const modal = document.getElementById('call-modal');
    if (!modal) return;
    callState.active = true;
    callState.direction = direction;
    callState.answered = false;
    document.getElementById('call-minimize').style.display = 'none';
    modal.style.display = 'flex';

    // 显示对方头像
    const avatar = document.getElementById('call-avatar');
    const partnerAvatar = localStorage.getItem('avatar_partner');
    if (partnerAvatar) {
        avatar.innerHTML = `<img src="${partnerAvatar}" style="width:100%;height:100%;object-fit:cover;">`;
    } else {
        avatar.innerHTML = '<i class="fas fa-user-circle"></i>';
    }
    document.getElementById('call-name').textContent = settings.partnerName || '对方';

    // 根据方向显示不同UI
    if (direction === 'outgoing') {
        document.getElementById('call-status').textContent = '正在呼叫...';
        document.getElementById('call-timer').style.display = 'none';
        document.getElementById('call-actions-outgoing').style.display = 'flex';
        document.getElementById('call-actions-incoming').style.display = 'none';
        document.getElementById('call-actions-connected').style.display = 'none';
        document.getElementById('call-avatar-ring').classList.remove('connected');
        // 模拟对方5s内接听
        callState.incomingTimeout = setTimeout(() => simulateAnswer(), 2000 + Math.random() * 3000);
    } else {
        document.getElementById('call-status').textContent = '邀请你进行视频通话...';
        document.getElementById('call-timer').style.display = 'none';
        document.getElementById('call-actions-outgoing').style.display = 'none';
        document.getElementById('call-actions-incoming').style.display = 'flex';
        document.getElementById('call-actions-connected').style.display = 'none';
        document.getElementById('call-avatar-ring').classList.remove('connected');
        // 10s未接听视为无法接通
        callState.incomingTimeout = setTimeout(() => callTimeout(), 10000);
    }
}

// 关闭通话模态框
function closeCallModal() {
    const modal = document.getElementById('call-modal');
    const float = document.getElementById('call-float');
    if (modal) modal.style.display = 'none';
    if (float) float.style.display = 'none';
    if (callState.timerInterval) clearInterval(callState.timerInterval);
    if (callState.incomingTimeout) clearTimeout(callState.incomingTimeout);
    callState.active = false;
    callState.direction = null;
    callState.startTime = null;
    callState.timerInterval = null;
    callState.incomingTimeout = null;
}

// 对方接听（模拟）
function simulateAnswer() {
    if (!callState.active || callState.direction !== 'outgoing') return;
    callState.answered = true;
    document.getElementById('call-status').textContent = '通话中';
    document.getElementById('call-actions-outgoing').style.display = 'none';
    document.getElementById('call-actions-incoming').style.display = 'none';
    document.getElementById('call-actions-connected').style.display = 'flex';
    document.getElementById('call-avatar-ring').classList.add('connected');
    document.getElementById('call-minimize').style.display = '';
    startCallTimer();
}

// 我方接听
function answerCall() {
    if (!callState.active || callState.direction !== 'incoming') return;
    if (callState.incomingTimeout) clearTimeout(callState.incomingTimeout);
    callState.answered = true;
    document.getElementById('call-status').textContent = '通话中';
    document.getElementById('call-actions-incoming').style.display = 'none';
    document.getElementById('call-actions-connected').style.display = 'flex';
    document.getElementById('call-avatar-ring').classList.add('connected');
    document.getElementById('call-minimize').style.display = '';
    startCallTimer();
}

// 超时未接听
function callTimeout() {
    if (callState.answered) return;
    closeCallModal();
    addMessage({
        id: Date.now(),
        sender: 'system',
        text: `📞 ${settings.partnerName || '对方'} 的来电未接听（无法接通）`,
        timestamp: new Date(),
        type: 'system',
        favorited: false
    });
}

// 拒绝通话
function rejectCall() {
    closeCallModal();
    if (callState.direction === 'incoming' && !callState.answered) {
        addMessage({
            id: Date.now(),
            sender: 'system',
            text: `📞 已拒绝 ${settings.partnerName || '对方'} 的通话邀请`,
            timestamp: new Date(),
            type: 'system',
            favorited: false
        });
    }
}

// 挂断通话
function hangupCall() {
    let duration = 0;
    if (callState.startTime && callState.answered) {
        duration = Math.floor((Date.now() - callState.startTime) / 1000);
    }
    closeCallModal();
    if (duration > 0) {
        const min = Math.floor(duration / 60);
        const sec = duration % 60;
        const durStr = min > 0 ? `${min}分${sec}秒` : `${sec}秒`;
        addMessage({
            id: Date.now(),
            sender: 'system',
            text: `📞 通话结束，时长 ${durStr}`,
            timestamp: new Date(),
            type: 'system',
            favorited: false
        });
    } else if (callState.direction === 'outgoing') {
        addMessage({
            id: Date.now(),
            sender: 'system',
            text: `📞 已取消通话`,
            timestamp: new Date(),
            type: 'system',
            favorited: false
        });
    }
}

// 最小化通话
function minimizeCall() {
    const modal = document.getElementById('call-modal');
    const float = document.getElementById('call-float');
    if (modal) modal.style.display = 'none';
    if (float) {
        float.style.display = 'flex';
        // 同步头像
        const partnerAvatar = localStorage.getItem('avatar_partner');
        const floatAvatar = document.getElementById('call-float-avatar');
        if (partnerAvatar) {
            floatAvatar.innerHTML = `<img src="${partnerAvatar}" style="width:100%;height:100%;object-fit:cover;">`;
        }
    }
}

// 恢复通话
function restoreCall() {
    const modal = document.getElementById('call-modal');
    const float = document.getElementById('call-float');
    if (modal) modal.style.display = 'flex';
    if (float) float.style.display = 'none';
}

// 开始计时器
function startCallTimer() {
    callState.startTime = Date.now();
    const timerEl = document.getElementById('call-timer');
    const floatTimer = document.getElementById('call-float-timer');
    document.getElementById('call-timer').style.display = 'block';
    callState.timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - callState.startTime) / 1000);
        const min = String(Math.floor(elapsed / 60)).padStart(2, '0');
        const sec = String(elapsed % 60).padStart(2, '0');
        const timeStr = `${min}:${sec}`;
        if (timerEl) timerEl.textContent = timeStr;
        if (floatTimer) floatTimer.textContent = timeStr;
    }, 200);
}

// 关闭悬浮窗（挂断）
function closeFloatAndHangup() {
    const float = document.getElementById('call-float');
    if (float) float.style.display = 'none';
    hangupCall();
}

// 发起通话
function startOutgoingCall() {
    if (callState.active) return;
    openCallModal('outgoing');
}

// 对方来电（5%概率）
function triggerIncomingCall() {
    if (callState.active) return;
    if (Math.random() < 0.05) {
        const delay = 500 + Math.random() * 2000;
        setTimeout(() => {
            if (!callState.active) openCallModal('incoming');
        }, delay);
    }
}

// 绑定视频通话事件
function bindCallEvents() {
    // 发起通话按钮
    const callBtn = document.getElementById('chat-call-btn');
    if (callBtn) callBtn.onclick = startOutgoingCall;

    // 挂断（去电）
    const hangupOut = document.getElementById('call-hangup-outgoing');
    if (hangupOut) hangupOut.onclick = hangupCall;

    // 接听
    const answerBtn = document.getElementById('call-answer');
    if (answerBtn) answerBtn.onclick = answerCall;

    // 拒绝
    const rejectBtn = document.getElementById('call-reject');
    if (rejectBtn) rejectBtn.onclick = rejectCall;

    // 挂断（通话中）
    const hangupConn = document.getElementById('call-hangup-connected');
    if (hangupConn) hangupConn.onclick = hangupCall;

    // 最小化
    const minimizeBtn = document.getElementById('call-minimize');
    if (minimizeBtn) minimizeBtn.onclick = (e) => { e.stopPropagation(); minimizeCall(); };

    // 悬浮窗双击恢复
    const floatWin = document.getElementById('call-float');
    if (floatWin) {
        floatWin.addEventListener('dblclick', restoreCall);
        // 悬浮窗挂断
        const floatHangup = document.getElementById('call-float-hangup');
        if (floatHangup) {
            floatHangup.addEventListener('click', (e) => { e.stopPropagation(); closeFloatAndHangup(); });
        }
    }
}

// 绑定聊天相关事件
function bindChatEvents() {
    if (sendBtn) {
        sendBtn.onclick = () => {
            if (isBatchMode) addToBatch();
            else sendMessage();
        };
    }
    if (continueBtn) continueBtn.onclick = triggerPartnerReply;
    if (pokeBtn) pokeBtn.onclick = showInteractPanel;
    bindCallEvents();
    if (messageInput) {
        messageInput.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (isBatchMode) addToBatch();
                else sendMessage();
            }
        });
    }
}

// 在全局暴露必要的函数
window.scrollToMessage = scrollToMessage;