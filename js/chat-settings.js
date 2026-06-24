// ========== 聊天设置模块 ==========
function initChatSettingsModule() {
    loadSettings();
    bindSettingsEvents();
}

function loadSettings() {
    // 回复速度
    const minSlider = document.getElementById('delay-min');
    const maxSlider = document.getElementById('delay-max');
    if (minSlider) minSlider.value = window.settings.replyDelayMin;
    if (maxSlider) maxSlider.value = window.settings.replyDelayMax;
    updateDelayValues();
    // 已读回执
    const readReceiptsToggle = document.getElementById('read-receipts-toggle');
    if (readReceiptsToggle) readReceiptsToggle.checked = window.settings.readReceiptsEnabled;
    toggleReadReceiptStyleRow();
    // 已读不回
    const readNoReplyToggle = document.getElementById('read-no-reply-toggle');
    if (readNoReplyToggle) readNoReplyToggle.checked = window.settings.allowReadNoReply;
    const chanceSlider = document.getElementById('read-no-reply-chance');
    if (chanceSlider) chanceSlider.value = window.settings.readNoReplyChance * 100;
    updateChanceValue();
    toggleReadNoReplyRow();
    // 连发
    const burstSlider = document.getElementById('reply-burst-max');
    if (burstSlider) burstSlider.value = window.settings.replyMaxBurst || 1;
    updateBurstValue();
    // 主动发送
    const autoSendToggle = document.getElementById('auto-send-toggle');
    if (autoSendToggle) autoSendToggle.checked = window.settings.autoSendEnabled;
    const intervalSlider = document.getElementById('auto-send-interval');
    if (intervalSlider) intervalSlider.value = window.settings.autoSendInterval;
    updateIntervalValue();
    toggleAutoSendRow();
    // 其他
    const typingToggle = document.getElementById('typing-indicator-toggle');
    if (typingToggle) typingToggle.checked = window.settings.typingIndicatorEnabled;
    const emojiMixToggle = document.getElementById('emoji-mix-toggle');
    if (emojiMixToggle) emojiMixToggle.checked = window.settings.emojiMixEnabled;
    const replyToggle = document.getElementById('reply-toggle');
    if (replyToggle) replyToggle.checked = window.settings.replyEnabled;
}

function bindSettingsEvents() {
    // 回复速度
    const minSlider = document.getElementById('delay-min');
    const maxSlider = document.getElementById('delay-max');
    if (minSlider) minSlider.addEventListener('input', (e) => {
        window.settings.replyDelayMin = parseInt(e.target.value);
        updateDelayValues();
        saveSettings();
    });
    if (maxSlider) maxSlider.addEventListener('input', (e) => {
        window.settings.replyDelayMax = parseInt(e.target.value);
        updateDelayValues();
        saveSettings();
    });
    // 已读回执
    const readReceiptsToggle = document.getElementById('read-receipts-toggle');
    if (readReceiptsToggle) readReceiptsToggle.addEventListener('change', (e) => {
        window.settings.readReceiptsEnabled = e.target.checked;
        toggleReadReceiptStyleRow();
        saveSettings();
        // 重新渲染消息以更新已读状态显示
        if (typeof renderMessages === 'function') renderMessages(true);
    });
    const styleBtns = document.querySelectorAll('.style-btn');
    styleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const style = btn.dataset.style;
            window.settings.readReceiptStyle = style;
            styleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            saveSettings();
            if (typeof renderMessages === 'function') renderMessages(true);
        });
    });
    // 已读不回
    const readNoReplyToggle = document.getElementById('read-no-reply-toggle');
    if (readNoReplyToggle) readNoReplyToggle.addEventListener('change', (e) => {
        window.settings.allowReadNoReply = e.target.checked;
        toggleReadNoReplyRow();
        saveSettings();
    });
    const chanceSlider = document.getElementById('read-no-reply-chance');
    if (chanceSlider) chanceSlider.addEventListener('input', (e) => {
        window.settings.readNoReplyChance = parseInt(e.target.value) / 100;
        updateChanceValue();
        saveSettings();
    });
    // 连发
    const burstSlider = document.getElementById('reply-burst-max');
    if (burstSlider) burstSlider.addEventListener('input', (e) => {
        window.settings.replyMaxBurst = parseInt(e.target.value);
        updateBurstValue();
        saveSettings();
    });
    // 主动发送
    const autoSendToggle = document.getElementById('auto-send-toggle');
    if (autoSendToggle) autoSendToggle.addEventListener('change', (e) => {
        window.settings.autoSendEnabled = e.target.checked;
        toggleAutoSendRow();
        saveSettings();
        manageAutoSendTimer();
    });
    const intervalSlider = document.getElementById('auto-send-interval');
    if (intervalSlider) intervalSlider.addEventListener('input', (e) => {
        window.settings.autoSendInterval = parseInt(e.target.value);
        updateIntervalValue();
        saveSettings();
        manageAutoSendTimer();
    });
    // 其他
    const typingToggle = document.getElementById('typing-indicator-toggle');
    if (typingToggle) typingToggle.addEventListener('change', (e) => {
        window.settings.typingIndicatorEnabled = e.target.checked;
        saveSettings();
    });
    const emojiMixToggle = document.getElementById('emoji-mix-toggle');
    if (emojiMixToggle) emojiMixToggle.addEventListener('change', (e) => {
        window.settings.emojiMixEnabled = e.target.checked;
        saveSettings();
    });
    const replyToggle = document.getElementById('reply-toggle');
    if (replyToggle) replyToggle.addEventListener('change', (e) => {
        window.settings.replyEnabled = e.target.checked;
        saveSettings();
        // 可动态显示/隐藏回复按钮，这里简单重新渲染
        if (typeof renderMessages === 'function') renderMessages(true);
    });
}

function updateDelayValues() {
    const minVal = document.getElementById('delay-min-value');
    const maxVal = document.getElementById('delay-max-value');
    if (minVal) minVal.textContent = (window.settings.replyDelayMin / 1000).toFixed(0) + 's';
    if (maxVal) maxVal.textContent = (window.settings.replyDelayMax / 1000).toFixed(0) + 's';
}

function updateChanceValue() {
    const span = document.getElementById('chance-value');
    if (span) span.textContent = Math.round(window.settings.readNoReplyChance * 100) + '%';
}

function updateIntervalValue() {
    const span = document.getElementById('interval-value');
    if (span) span.textContent = window.settings.autoSendInterval + ' 分钟';
}

function updateBurstValue() {
    const span = document.getElementById('burst-max-value');
    if (span) span.textContent = (window.settings.replyMaxBurst || 1) + ' 条';
}

function toggleReadReceiptStyleRow() {
    const row = document.getElementById('read-receipt-style-row');
    if (row) row.style.display = window.settings.readReceiptsEnabled ? 'flex' : 'none';
    // 高亮当前样式按钮
    const btns = document.querySelectorAll('.style-btn');
    btns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.style === window.settings.readReceiptStyle);
    });
}

function toggleReadNoReplyRow() {
    const row = document.getElementById('read-no-reply-chance-row');
    if (row) row.style.display = window.settings.allowReadNoReply ? 'flex' : 'none';
}

function toggleAutoSendRow() {
    const row = document.getElementById('auto-send-interval-row');
    if (row) row.style.display = window.settings.autoSendEnabled ? 'flex' : 'none';
}

function saveSettings() {
    localStorage.setItem('chat_settings', JSON.stringify(window.settings));
    // 如果已经定义 throttleSave，也可调用
    if (typeof throttledSaveData === 'function') throttledSaveData();
}

// 主动发送定时器管理（需要在全局定义 autoSendTimer）
let autoSendTimer = null;
function manageAutoSendTimer() {
    if (autoSendTimer) clearInterval(autoSendTimer);
    if (window.settings.autoSendEnabled && window.settings.autoSendInterval > 0) {
        const intervalMs = window.settings.autoSendInterval * 60 * 1000;
        autoSendTimer = setInterval(() => {
            if (typeof triggerPartnerReply === 'function') {
                triggerPartnerReply();
            }
        }, intervalMs);
    }
}