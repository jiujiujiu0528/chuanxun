// ========== 数据管理模块 ==========
function initDataManager() {
    updateStorageUsage();
    bindDataEvents();
}

// 更新存储用量（估算）
function updateStorageUsage() {
    // 消息数量
    const msgCount = (window.messages || []).length;
    document.getElementById('storage-messages').innerText = msgCount;
    
    // 设置项数量（localStorage 中不含 chat_messages 和 chat_settings 的 key 数量）
    let settingsCount = 0;
    let mediaSize = 0;
    let totalSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const val = localStorage.getItem(key);
        const size = (key.length + (val ? val.length : 0)) * 2;
        totalSize += size;
        if (key === 'chat_settings') settingsCount = Object.keys(JSON.parse(val || '{}')).length;
        if (key.includes('avatar') || key.includes('cover') || key.includes('background')) mediaSize += size;
    }
    // 粗略估算 IndexedDB 中的消息大小（每条消息约 200 字节）
    const msgSizeEstimate = msgCount * 200;
    totalSize += msgSizeEstimate;
    mediaSize += msgSizeEstimate;
    
    document.getElementById('storage-settings').innerText = settingsCount;
    document.getElementById('storage-media').innerText = (mediaSize / 1024).toFixed(1);
    const totalKB = (totalSize / 1024).toFixed(1);
    document.getElementById('storage-total').innerText = totalKB;
    // 假设最大存储 5MB，计算百分比
    const percent = Math.min(100, (totalSize / (5 * 1024 * 1024)) * 100);
    document.getElementById('storage-bar-fill').style.width = percent + '%';
}

// 构建备份数据（按模块收集）
async function buildBackupData(modules) {
    const backup = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        modules: modules
    };
    if (modules.includes('chatMessages')) backup.chatMessages = window.messages || [];
    if (modules.includes('chatSettings')) backup.chatSettings = window.settings || {};
    if (modules.includes('customReplies')) {
        backup.customReplies = {
            cards: window.customReplies?.cards,
            pokes: window.customReplies?.pokes,
            statuses: window.customReplies?.statuses,
            mottos: window.customReplies?.mottos,
            intros: window.customReplies?.intros,
            cardGroups: window.customReplies?.cardGroups,
            myStickers: window.customReplies?.myStickers || [],
            partnerStickers: window.customReplies?.partnerStickers || []
        };
    }
    if (modules.includes('disabledReplies')) backup.disabledReplies = window.disabledReplies;
    if (modules.includes('songList')) backup.songList = window.songList || [];
    if (modules.includes('appearance')) {
        backup.appearance = {
            theme: localStorage.getItem('app_theme'),
            darkMode: localStorage.getItem('dark_mode') === 'true',
            fontSize: localStorage.getItem('font_size'),
            bubbleStyle: localStorage.getItem('bubble_style'),
            chatBackground: localStorage.getItem('chat_background')
        };
    }
    if (modules.includes('soundSettings')) {
        backup.soundSettings = {
            soundEnabled: localStorage.getItem('sound_enabled'),
            soundVolume: localStorage.getItem('sound_volume'),
            presets: {
                my_send: localStorage.getItem('sound_preset_my_send'),
                partner_message: localStorage.getItem('sound_preset_partner_message'),
                my_poke: localStorage.getItem('sound_preset_my_poke'),
                partner_poke: localStorage.getItem('sound_preset_partner_poke')
            },
            customUrls: {
                my_send: localStorage.getItem('sound_custom_my_send'),
                partner_message: localStorage.getItem('sound_custom_partner_message'),
                my_poke: localStorage.getItem('sound_custom_my_poke'),
                partner_poke: localStorage.getItem('sound_custom_partner_poke')
            }
        };
    }
    if (modules.includes('avatars')) {
        backup.avatars = {
            my: localStorage.getItem('avatar_my'),
            partner: localStorage.getItem('avatar_partner')
        };
    }
    if (modules.includes('decoText')) backup.decoText = localStorage.getItem('home_deco_text');
    if (modules.includes('stats')) backup.stats = {}; // 暂不需要
    return backup;
}

// 导出备份（选择模块）
async function exportBackup() {
    // 创建模块选择面板
    const modules = await showModulePicker('导出备份', [
        { id: 'chatMessages', label: '聊天记录', default: true },
        { id: 'chatSettings', label: '聊天设置', default: true },
        { id: 'customReplies', label: '回复库（字卡/拍一拍/状态等）', default: true },
        { id: 'disabledReplies', label: '屏蔽状态', default: false },
        { id: 'songList', label: '音乐歌单', default: true },
        { id: 'appearance', label: '外观设置（主题/深色模式/字体/气泡/背景）', default: true },
        { id: 'soundSettings', label: '音效设置', default: true },
        { id: 'avatars', label: '头像', default: true },
        { id: 'decoText', label: '主视图装饰文字', default: true }
    ]);
    if (!modules || modules.length === 0) return;
    const backupData = await buildBackupData(modules);
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chatapp_backup_${new Date().toISOString().slice(0,19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('备份导出成功', 'success');
}

// 导入备份（选择文件，解析后选择模块）
async function importBackup() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const text = await file.text();
        let backupData;
        try {
            backupData = JSON.parse(text);
        } catch (err) {
            showNotification('文件格式错误，不是有效的 JSON', 'error');
            return;
        }
        // 检测备份中包含哪些模块
        const availableModules = [];
        if (backupData.chatMessages) availableModules.push({ id: 'chatMessages', label: '聊天记录', hasData: true });
        if (backupData.chatSettings) availableModules.push({ id: 'chatSettings', label: '聊天设置', hasData: true });
        if (backupData.customReplies) availableModules.push({ id: 'customReplies', label: '回复库', hasData: true });
        if (backupData.disabledReplies) availableModules.push({ id: 'disabledReplies', label: '屏蔽状态', hasData: true });
        if (backupData.songList) availableModules.push({ id: 'songList', label: '音乐歌单', hasData: true });
        if (backupData.appearance) availableModules.push({ id: 'appearance', label: '外观设置', hasData: true });
        if (backupData.soundSettings) availableModules.push({ id: 'soundSettings', label: '音效设置', hasData: true });
        if (backupData.avatars) availableModules.push({ id: 'avatars', label: '头像', hasData: true });
        if (backupData.decoText) availableModules.push({ id: 'decoText', label: '装饰文字', hasData: true });
        if (availableModules.length === 0) {
            showNotification('备份文件中没有可识别的数据', 'error');
            return;
        }
        // 让用户选择要恢复哪些模块
        const selected = await showModulePicker('导入备份', availableModules, { multi: true });
        if (!selected || selected.length === 0) return;
        // 恢复数据
        if (selected.includes('chatMessages') && backupData.chatMessages) {
            window.messages = backupData.chatMessages;
            localStorage.setItem('chat_messages', JSON.stringify(window.messages));
            if (typeof renderMessages === 'function') renderMessages(true);
        }
        if (selected.includes('chatSettings') && backupData.chatSettings) {
            window.settings = backupData.chatSettings;
            localStorage.setItem('chat_settings', JSON.stringify(window.settings));
        }
        if (selected.includes('customReplies') && backupData.customReplies) {
            if (typeof window.customReplies !== 'undefined') {
                window.customReplies = backupData.customReplies;
                if (typeof saveRepliesData === 'function') saveRepliesData();
                if (typeof renderCardGroups === 'function') renderCardGroups('');
            }
        }
        if (selected.includes('disabledReplies') && backupData.disabledReplies) {
            window.disabledReplies = backupData.disabledReplies;
            localStorage.setItem('disabled_replies', JSON.stringify(backupData.disabledReplies));
        }
        if (selected.includes('songList') && backupData.songList) {
            window.songList = backupData.songList;
            localStorage.setItem('songList', JSON.stringify(window.songList));
            if (typeof loadSongList === 'function') loadSongList();
        }
        if (selected.includes('appearance') && backupData.appearance) {
            if (backupData.appearance.theme) localStorage.setItem('app_theme', backupData.appearance.theme);
            if (backupData.appearance.darkMode !== undefined) localStorage.setItem('dark_mode', backupData.appearance.darkMode);
            if (backupData.appearance.fontSize) localStorage.setItem('font_size', backupData.appearance.fontSize);
            if (backupData.appearance.bubbleStyle) localStorage.setItem('bubble_style', backupData.appearance.bubbleStyle);
            if (backupData.appearance.chatBackground) localStorage.setItem('chat_background', backupData.appearance.chatBackground);
            // 刷新外观
            if (typeof loadTheme === 'function') loadTheme();
            if (typeof loadDarkMode === 'function') loadDarkMode();
            if (typeof loadFontSize === 'function') loadFontSize();
            if (typeof loadBubbleStyle === 'function') loadBubbleStyle();
            if (typeof loadChatBackground === 'function') loadChatBackground();
        }
        if (selected.includes('soundSettings') && backupData.soundSettings) {
            const ss = backupData.soundSettings;
            if (ss.soundEnabled !== undefined) localStorage.setItem('sound_enabled', ss.soundEnabled);
            if (ss.soundVolume !== undefined) localStorage.setItem('sound_volume', ss.soundVolume);
            if (ss.presets) {
                for (const [scene, preset] of Object.entries(ss.presets)) {
                    if (preset) localStorage.setItem(`sound_preset_${scene}`, preset);
                }
            }
            if (ss.customUrls) {
                for (const [scene, url] of Object.entries(ss.customUrls)) {
                    if (url) localStorage.setItem(`sound_custom_${scene}`, url);
                }
            }
            if (typeof loadSoundSettings === 'function') loadSoundSettings();
        }
        if (selected.includes('avatars') && backupData.avatars) {
            if (backupData.avatars.my) localStorage.setItem('avatar_my', backupData.avatars.my);
            if (backupData.avatars.partner) localStorage.setItem('avatar_partner', backupData.avatars.partner);
            if (typeof loadAvatars === 'function') loadAvatars();
        }
        if (selected.includes('decoText') && backupData.decoText) {
            localStorage.setItem('home_deco_text', backupData.decoText);
            if (typeof loadDecoText === 'function') loadDecoText();
        }
        showNotification('导入完成，页面将刷新', 'success');
        setTimeout(() => location.reload(), 1500);
    };
    fileInput.click();
}

// 显示模块选择器（返回选中的 id 数组）
function showModulePicker(title, modules, options = {}) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed; inset:0; z-index:30000; background:rgba(0,0,0,0.7); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center;';
        overlay.innerHTML = `
            <div style="background:var(--secondary-bg); border-radius:20px; width:85%; max-width:400px; max-height:80vh; overflow-y:auto; padding:20px;">
                <h3 style="margin-bottom:12px;">${title}</h3>
                <div id="module-list" style="margin-bottom:20px;"></div>
                <div style="display:flex; gap:10px;">
                    <button id="picker-cancel" class="btn-secondary" style="flex:1;">取消</button>
                    <button id="picker-confirm" class="btn-primary" style="flex:2;">确认</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        const listDiv = overlay.querySelector('#module-list');
        modules.forEach(mod => {
            const label = document.createElement('label');
            label.style.cssText = 'display:flex; align-items:center; gap:8px; margin-bottom:12px; cursor:pointer;';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = mod.id;
            checkbox.checked = options.multi !== false ? (mod.default !== false) : false;
            if (!options.multi && modules.length === 1) checkbox.checked = true;
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(mod.label + (mod.hasData !== undefined && !mod.hasData ? ' (无数据)' : '')));
            listDiv.appendChild(label);
        });
        const cancelBtn = overlay.querySelector('#picker-cancel');
        const confirmBtn = overlay.querySelector('#picker-confirm');
        cancelBtn.onclick = () => { overlay.remove(); resolve(null); };
        confirmBtn.onclick = () => {
            const selected = Array.from(overlay.querySelectorAll('input:checked')).map(cb => cb.value);
            overlay.remove();
            resolve(selected);
        };
    });
}

// 清除当前会话消息
function clearCurrentChat() {
    if (confirm('确定要清除当前会话的所有消息吗？此操作不可恢复！')) {
        window.messages = [];
        localStorage.setItem('chat_messages', JSON.stringify([]));
        if (typeof renderMessages === 'function') renderMessages(true);
        showNotification('当前会话消息已清除', 'success');
        updateStorageUsage();
    }
}

// 重置所有数据
function resetAllData() {
    if (confirm('⚠️ 此操作将清空所有数据（消息、设置、头像、字卡等），不可恢复！\n确定继续吗？')) {
        localStorage.clear();
        // 注意：IndexedDB 中的数据（如果用了 localforage）也需要清除，但简化版只用 localStorage
        showNotification('所有数据已清空，页面即将刷新', 'info');
        setTimeout(() => location.reload(), 1500);
    }
}

// 单独导出/导入聊天记录（复用已有函数）
function exportChatOnly() {
    if (typeof exportChatHistory === 'function') exportChatHistory();
    else alert('exportChatHistory 未定义');
}
function importChatOnly() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file && typeof importChatHistory === 'function') importChatHistory(file);
        else alert('importChatHistory 未定义');
    };
    input.click();
}

function bindDataEvents() {
    document.getElementById('full-backup-btn')?.addEventListener('click', exportBackup);
    document.getElementById('full-restore-btn')?.addEventListener('click', importBackup);
    document.getElementById('clear-current-chat-btn')?.addEventListener('click', clearCurrentChat);
    document.getElementById('reset-all-data-btn')?.addEventListener('click', resetAllData);
    document.getElementById('export-chat-btn')?.addEventListener('click', exportChatOnly);
    document.getElementById('import-chat-btn')?.addEventListener('click', importChatOnly);
}
// ========== 数据管理：导出聊天记录 ==========
function exportByDate() {
    // 创建日期选择弹窗
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 320px;">
            <div class="modal-title">按日期导出聊天记录</div>
            <div style="margin-bottom: 12px;">
                <label>开始日期</label>
                <input type="date" id="export-start-date" style="width:100%; padding:8px; margin-top:4px; border-radius:8px; border:1px solid var(--border-color);">
            </div>
            <div style="margin-bottom: 16px;">
                <label>结束日期</label>
                <input type="date" id="export-end-date" style="width:100%; padding:8px; margin-top:4px; border-radius:8px; border:1px solid var(--border-color);">
            </div>
            <div class="modal-buttons">
                <button id="export-cancel" class="modal-btn modal-btn-secondary">取消</button>
                <button id="export-confirm" class="modal-btn modal-btn-primary">导出</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    const startInput = modal.querySelector('#export-start-date');
    const endInput = modal.querySelector('#export-end-date');
    const cancelBtn = modal.querySelector('#export-cancel');
    const confirmBtn = modal.querySelector('#export-confirm');
    
    cancelBtn.onclick = () => modal.remove();
    confirmBtn.onclick = () => {
        const startDate = startInput.value ? new Date(startInput.value) : null;
        const endDate = endInput.value ? new Date(endInput.value + 'T23:59:59') : null;
        
        let filtered = messages.filter(m => m.type !== 'system');
        if (startDate) filtered = filtered.filter(m => new Date(m.timestamp) >= startDate);
        if (endDate) filtered = filtered.filter(m => new Date(m.timestamp) <= endDate);
        
        if (filtered.length === 0) {
            alert('没有找到符合条件的消息');
            modal.remove();
            return;
        }
        
        const myName = settings.myName || '我';
        const partnerName = settings.partnerName || '对方';
        
        let textContent = `聊天记录导出 (${new Date().toLocaleString()})\n`;
        textContent += `日期范围：${startInput.value || '不限'} 至 ${endInput.value || '不限'}\n`;
        textContent += `共 ${filtered.length} 条消息\n`;
        textContent += '='.repeat(50) + '\n\n';
        
        filtered.forEach(msg => {
            const sender = msg.sender === 'user' ? myName : partnerName;
            const time = new Date(msg.timestamp).toLocaleString();
            const content = msg.text || (msg.image ? '[图片]' : '[消息]');
            textContent += `[${time}] ${sender}：\n${content}\n\n`;
        });
        
        const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat_export_${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        modal.remove();
        showNotification('导出成功', 'success');
    };
}

// ========== 回复库导入/导出 ==========
function exportReplies() {
    const data = {
        customReplies: {
            cards: window.customReplies?.cards || [],
            pokes: window.customReplies?.pokes || [],
            statuses: window.customReplies?.statuses || [],
            mottos: window.customReplies?.mottos || [],
            intros: window.customReplies?.intros || [],
            cardGroups: window.customReplies?.cardGroups || [],
            myStickers: window.customReplies?.myStickers || [],
            partnerStickers: window.customReplies?.partnerStickers || []
        },
        disabledReplies: {}
    };
    // 序列化 disabledReplies (Set → Array)
    if (window.disabledReplies) {
        for (const key in window.disabledReplies) {
            data.disabledReplies[key] = Array.from(window.disabledReplies[key] || []);
        }
    }
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `replies_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('回复库导出成功', 'success');
}

function importReplies() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            if (!data.customReplies) {
                showNotification('文件格式错误，未找到回复库数据', 'error');
                return;
            }
            if (confirm('导入将覆盖当前回复库数据（字卡、拍一拍、状态、格言、开场动画、表情包），确定继续吗？')) {
                // 恢复数据
                window.customReplies = {
                    cards: data.customReplies.cards || [],
                    pokes: data.customReplies.pokes || [],
                    statuses: data.customReplies.statuses || [],
                    mottos: data.customReplies.mottos || [],
                    intros: data.customReplies.intros || [],
                    cardGroups: data.customReplies.cardGroups || [],
                    myStickers: data.customReplies.myStickers || [],
                    partnerStickers: data.customReplies.partnerStickers || []
                };
                // 保存
                const toSave = { ...window.customReplies };
                localStorage.setItem('custom_replies', JSON.stringify(toSave));
                // 恢复屏蔽状态
                if (data.disabledReplies) {
                    const disabledObj = {};
                    for (const key in data.disabledReplies) {
                        disabledObj[key] = data.disabledReplies[key];
                    }
                    window.disabledReplies = {};
                    for (const key in disabledObj) {
                        window.disabledReplies[key] = new Set(disabledObj[key]);
                    }
                    localStorage.setItem('disabled_replies', JSON.stringify(disabledObj));
                }
                // 刷新界面
                if (typeof renderCardGroups === 'function') renderCardGroups('');
                if (typeof renderList === 'function') {
                    ['pokes', 'statuses', 'mottos', 'intros'].forEach(t => renderList(t, ''));
                }
                showNotification('回复库导入成功', 'success');
            }
        } catch (err) {
            showNotification('文件解析失败: ' + err.message, 'error');
        }
    };
    input.click();
}

// 统一的初始化函数
function initDataManager() {
    updateStorageUsage();
    bindDataEvents();
    const exportDateBtn = document.getElementById('export-chat-date-btn');
    if (exportDateBtn) exportDateBtn.onclick = exportByDate;
    // 回复库导入/导出
    const exportRepliesBtn = document.getElementById('export-replies-btn');
    if (exportRepliesBtn) exportRepliesBtn.onclick = exportReplies;
    const importRepliesBtn = document.getElementById('import-replies-btn');
    if (importRepliesBtn) importRepliesBtn.onclick = importReplies;
}