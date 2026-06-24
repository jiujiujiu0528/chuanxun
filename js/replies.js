// 回复库全局变量
let customReplies = {
    cards: [],
    pokes: [],
    statuses: [],
    mottos: [],
    intros: [],
    cardGroups: [],
    myStickers: [],
    partnerStickers: []
};
let disabledReplies = {
    cards: new Set(),
    pokes: new Set(),
    statuses: new Set(),
    mottos: new Set(),
    intros: new Set()
};

// 加载数据
function loadRepliesData() {
    const saved = localStorage.getItem('custom_replies');
    if (saved) {
        const data = JSON.parse(saved);
        customReplies = { ...customReplies, ...data };
    }
    // 初始化默认数据（如果为空）
    if (customReplies.cards.length === 0) customReplies.cards = [...DEFAULT_REPLIES.cards];
    if (customReplies.pokes.length === 0) customReplies.pokes = [...DEFAULT_REPLIES.pokes];
    if (customReplies.statuses.length === 0) customReplies.statuses = [...DEFAULT_REPLIES.statuses];
    if (customReplies.mottos.length === 0) customReplies.mottos = [...DEFAULT_REPLIES.mottos];
    if (customReplies.intros.length === 0) customReplies.intros = [...DEFAULT_REPLIES.intros];
    if (!customReplies.cardGroups) customReplies.cardGroups = [];
    // 加载屏蔽状态
    const disabled = localStorage.getItem('disabled_replies');
    if (disabled) {
        const parsed = JSON.parse(disabled);
        for (let key in parsed) {
            disabledReplies[key] = new Set(parsed[key]);
        }
    }
}

function saveRepliesData() {
    const toSave = {
        cards: customReplies.cards,
        pokes: customReplies.pokes,
        statuses: customReplies.statuses,
        mottos: customReplies.mottos,
        intros: customReplies.intros,
        cardGroups: customReplies.cardGroups,
        myStickers: customReplies.myStickers || [],
        partnerStickers: customReplies.partnerStickers || []
    };
    localStorage.setItem('custom_replies', JSON.stringify(toSave));
    // 保存屏蔽状态
    const disabledObj = {};
    for (let key in disabledReplies) {
        disabledObj[key] = Array.from(disabledReplies[key]);
    }
    localStorage.setItem('disabled_replies', JSON.stringify(disabledObj));
}

// 渲染普通列表（用于非字卡类型）
function renderList(type, searchTerm = '') {
    const listEl = document.getElementById(`${type}-list`);
    if (!listEl) return;
    let items = [...customReplies[type]];
    if (searchTerm) {
        items = items.filter(item => item.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    listEl.innerHTML = '';
    items.forEach(item => {
        const isDisabled = disabledReplies[type].has(item);
        const div = document.createElement('div');
        div.className = `reply-item ${isDisabled ? 'disabled' : ''}`;
        let displayText = item;
        if (type === 'intros' && item.includes('|')) {
            const [line1, line2] = item.split('|');
            displayText = `${line1}<br><small style="font-size:11px; opacity:0.7;">${line2}</small>`;
        }
        div.innerHTML = `
            <div class="reply-item-text">${displayText}</div>
            <div class="reply-item-actions">
                <button class="toggle-disable" title="${isDisabled ? '启用' : '屏蔽'}"><i class="fas ${isDisabled ? 'fa-eye' : 'fa-eye-slash'}"></i></button>
                <button class="edit-item" title="编辑"><i class="fas fa-edit"></i></button>
                <button class="delete-item" title="删除"><i class="fas fa-trash"></i></button>
            </div>
        `;
        div.querySelector('.toggle-disable').onclick = () => {
            if (disabledReplies[type].has(item)) disabledReplies[type].delete(item);
            else disabledReplies[type].add(item);
            saveRepliesData();
            renderList(type, searchTerm);
        };
        div.querySelector('.edit-item').onclick = () => {
            let newValue = prompt('编辑内容:', item);
            if (newValue && newValue.trim()) {
                const idx = customReplies[type].indexOf(item);
                if (idx !== -1) {
                    customReplies[type][idx] = newValue.trim();
                    if (disabledReplies[type].has(item)) {
                        disabledReplies[type].delete(item);
                        disabledReplies[type].add(newValue.trim());
                    }
                    saveRepliesData();
                    renderList(type, searchTerm);
                }
            }
        };
        div.querySelector('.delete-item').onclick = () => {
            if (confirm('确定删除吗？')) {
                const idx = customReplies[type].indexOf(item);
                if (idx !== -1) {
                    customReplies[type].splice(idx, 1);
                    disabledReplies[type].delete(item);
                    saveRepliesData();
                    renderList(type, searchTerm);
                }
            }
        };
        listEl.appendChild(div);
    });
}

// 渲染字卡分组视图
function renderCardGroups(searchTerm = '') {
    const container = document.getElementById('cards-groups-container');
    const ungroupedContainer = document.getElementById('cards-ungrouped-list');
    if (!container || !ungroupedContainer) return;

    const groups = customReplies.cardGroups || [];
    const ungroupedCards = customReplies.cards || [];

    let filteredGroups = [];
    let filteredUngrouped = [];
    if (searchTerm) {
        filteredGroups = groups.map(group => ({
            ...group,
            items: (group.items || []).filter(item => item.toLowerCase().includes(searchTerm.toLowerCase()))
        })).filter(group => group.items.length > 0);
        filteredUngrouped = ungroupedCards.filter(item => item.toLowerCase().includes(searchTerm.toLowerCase()));
    } else {
        filteredGroups = groups;
        filteredUngrouped = ungroupedCards;
    }

    container.innerHTML = '';
    filteredGroups.forEach(group => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'reply-group';
        groupDiv.dataset.groupId = group.id;
        const isCollapsed = group._collapsed || false;
        groupDiv.innerHTML = `
            <div class="reply-group-header" style="display:flex; align-items:center; gap:8px; padding:8px 12px; background:var(--primary-bg); border-radius:12px; margin-bottom:8px; cursor:pointer;">
                <span class="group-chevron" style="transform:${isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)'};">▼</span>
                <span class="group-name" style="flex:1; font-weight:600;">${escapeHtml(group.name)}</span>
                <span class="group-count" style="font-size:12px; color:var(--text-secondary);">${group.items.length}</span>
                <button class="group-edit" data-group-id="${group.id}" style="background:none; border:none; cursor:pointer;">✏️</button>
                <button class="group-delete" data-group-id="${group.id}" style="background:none; border:none; cursor:pointer;">🗑️</button>
            </div>
            <div class="reply-group-items" style="display:${isCollapsed ? 'none' : 'flex'}; flex-direction:column; gap:8px; margin-left:16px; margin-bottom:12px;">
                ${renderGroupItems(group, searchTerm)}
            </div>
        `;
        const header = groupDiv.querySelector('.reply-group-header');
        const itemsContainer = groupDiv.querySelector('.reply-group-items');
        header.addEventListener('click', (e) => {
            if (e.target.closest('.group-edit') || e.target.closest('.group-delete')) return;
            const isNowCollapsed = itemsContainer.style.display !== 'none';
            itemsContainer.style.display = isNowCollapsed ? 'none' : 'flex';
            const chevron = header.querySelector('.group-chevron');
            if (chevron) chevron.style.transform = isNowCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)';
            group._collapsed = isNowCollapsed;
            saveRepliesData();
        });
        header.querySelector('.group-edit').addEventListener('click', (e) => {
            e.stopPropagation();
            const newName = prompt('输入分组名称:', group.name);
            if (newName && newName.trim()) {
                group.name = newName.trim();
                saveRepliesData();
                renderCardGroups(searchTerm);
            }
        });
        header.querySelector('.group-delete').addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(`确定删除分组“${group.name}”吗？分组内的字卡将移动到“未分组”。`)) {
                if (group.items && group.items.length) customReplies.cards.push(...group.items);
                const index = customReplies.cardGroups.findIndex(g => g.id === group.id);
                if (index !== -1) customReplies.cardGroups.splice(index, 1);
                saveRepliesData();
                renderCardGroups(searchTerm);
            }
        });
        container.appendChild(groupDiv);
    });

    ungroupedContainer.innerHTML = '';
    if (filteredUngrouped.length > 0) {
        const headerDiv = document.createElement('div');
        headerDiv.style.cssText = 'display:flex; align-items:center; gap:8px; padding:8px 12px; background:var(--primary-bg); border-radius:12px; margin-bottom:8px;';
        headerDiv.innerHTML = `<span style="font-weight:600;">未分组</span><span style="font-size:12px; color:var(--text-secondary); margin-left:auto;">${filteredUngrouped.length}</span>`;
        ungroupedContainer.appendChild(headerDiv);
        filteredUngrouped.forEach(item => {
            ungroupedContainer.appendChild(createCardItemElement(item, null, null));
        });
    } else if (!searchTerm) {
        ungroupedContainer.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-secondary);">暂无未分组字卡</div>';
    }
}

function renderGroupItems(group, searchTerm) {
    let items = group.items || [];
    if (searchTerm) items = items.filter(item => item.toLowerCase().includes(searchTerm.toLowerCase()));
    if (items.length === 0) return '<div style="padding:12px; text-align:center; color:var(--text-secondary);">该分组暂无字卡</div>';
    let html = '';
    items.forEach(item => {
        const isDisabled = disabledReplies.cards.has(item);
        html += `
            <div class="reply-item ${isDisabled ? 'disabled' : ''}" data-item="${escapeHtml(item)}" data-group-id="${group.id}">
                <div class="reply-item-text">${escapeHtml(item)}</div>
                <div class="reply-item-actions">
                    <button class="toggle-disable" title="${isDisabled ? '启用' : '屏蔽'}"><i class="fas ${isDisabled ? 'fa-eye' : 'fa-eye-slash'}"></i></button>
                    <button class="edit-item" title="编辑"><i class="fas fa-edit"></i></button>
                    <button class="move-item" title="移动到其他分组"><i class="fas fa-folder-open"></i></button>
                    <button class="delete-item" title="删除"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    });
    return html;
}

function createCardItemElement(item, groupId, groupIdForData) {
    const isDisabled = disabledReplies.cards.has(item);
    const div = document.createElement('div');
    div.className = `reply-item ${isDisabled ? 'disabled' : ''}`;
    div.dataset.item = item;
    if (groupIdForData) div.dataset.groupId = groupIdForData;
    div.innerHTML = `
        <div class="reply-item-text">${escapeHtml(item)}</div>
        <div class="reply-item-actions">
            <button class="toggle-disable" title="${isDisabled ? '启用' : '屏蔽'}"><i class="fas ${isDisabled ? 'fa-eye' : 'fa-eye-slash'}"></i></button>
            <button class="edit-item" title="编辑"><i class="fas fa-edit"></i></button>
            <button class="move-item" title="移动到其他分组"><i class="fas fa-folder-open"></i></button>
            <button class="delete-item" title="删除"><i class="fas fa-trash"></i></button>
        </div>
    `;
    return div;
}

function bindCardItemEvents() {
    const container = document.getElementById('cards-groups-container');
    const ungroupedContainer = document.getElementById('cards-ungrouped-list');
    if (!container) return;
    const handleItemClick = (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        const itemDiv = target.closest('.reply-item');
        if (!itemDiv) return;
        const itemText = itemDiv.dataset.item;
        const groupId = itemDiv.dataset.groupId || null;
        if (target.classList.contains('toggle-disable')) {
            if (disabledReplies.cards.has(itemText)) disabledReplies.cards.delete(itemText);
            else disabledReplies.cards.add(itemText);
            saveRepliesData();
            renderCardGroups(document.getElementById('cards-search').value);
        }
        else if (target.classList.contains('edit-item')) {
            const newText = prompt('编辑字卡:', itemText);
            if (newText && newText.trim() && newText !== itemText) {
                if (groupId) {
                    const group = customReplies.cardGroups.find(g => g.id === groupId);
                    if (group) {
                        const idx = group.items.indexOf(itemText);
                        if (idx !== -1) group.items[idx] = newText.trim();
                    }
                } else {
                    const idx = customReplies.cards.indexOf(itemText);
                    if (idx !== -1) customReplies.cards[idx] = newText.trim();
                }
                if (disabledReplies.cards.has(itemText)) {
                    disabledReplies.cards.delete(itemText);
                    disabledReplies.cards.add(newText.trim());
                }
                saveRepliesData();
                renderCardGroups(document.getElementById('cards-search').value);
            }
        }
        else if (target.classList.contains('move-item')) {
            const groups = customReplies.cardGroups || [];
            if (groups.length === 0) {
                alert('暂无分组，请先创建分组');
                return;
            }
            const groupNames = groups.map(g => `${g.name}`).join('\n');
            const targetGroupName = prompt(`选择要移入的分组（输入名称）：\n可用分组：\n${groupNames}`, groups[0].name);
            if (!targetGroupName) return;
            const targetGroup = groups.find(g => g.name === targetGroupName);
            if (!targetGroup) {
                alert('分组不存在');
                return;
            }
            if (groupId) {
                const srcGroup = groups.find(g => g.id === groupId);
                if (srcGroup) {
                    const idx = srcGroup.items.indexOf(itemText);
                    if (idx !== -1) srcGroup.items.splice(idx, 1);
                }
            } else {
                const idx = customReplies.cards.indexOf(itemText);
                if (idx !== -1) customReplies.cards.splice(idx, 1);
            }
            if (!targetGroup.items) targetGroup.items = [];
            targetGroup.items.push(itemText);
            saveRepliesData();
            renderCardGroups(document.getElementById('cards-search').value);
        }
        else if (target.classList.contains('delete-item')) {
            if (confirm('确定删除此字卡吗？')) {
                if (groupId) {
                    const group = customReplies.cardGroups.find(g => g.id === groupId);
                    if (group) {
                        const idx = group.items.indexOf(itemText);
                        if (idx !== -1) group.items.splice(idx, 1);
                    }
                } else {
                    const idx = customReplies.cards.indexOf(itemText);
                    if (idx !== -1) customReplies.cards.splice(idx, 1);
                }
                disabledReplies.cards.delete(itemText);
                saveRepliesData();
                renderCardGroups(document.getElementById('cards-search').value);
            }
        }
    };
    container.addEventListener('click', handleItemClick);
    ungroupedContainer.addEventListener('click', handleItemClick);
}

// 添加新项目（用于非字卡类型）
function addItem(type, value) {
    if (!value || !value.trim()) return;
    if (customReplies[type].includes(value.trim())) {
        alert('内容已存在');
        return;
    }
    customReplies[type].push(value.trim());
    saveRepliesData();
    const searchInput = document.getElementById(`${type}-search`);
    renderList(type, searchInput ? searchInput.value : '');
}

function batchAddItems(type) {
    const text = prompt('输入多条内容，每行一条：');
    if (!text) return;
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    let added = 0;
    lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !customReplies[type].includes(trimmed)) {
            customReplies[type].push(trimmed);
            added++;
        }
    });
    if (added) {
        saveRepliesData();
        const searchInput = document.getElementById(`${type}-search`);
        renderList(type, searchInput ? searchInput.value : '');
        alert(`成功添加 ${added} 条`);
    } else {
        alert('没有新内容');
    }
}

function initRepliesTabs() {
    const tabs = document.querySelectorAll('.replies-tab');
    const panels = document.querySelectorAll('.replies-panel');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            panels.forEach(panel => panel.classList.remove('active'));
            // 表情包面板ID用驼峰命名
            const panelId = (target === 'mystickers') ? 'myStickers' : (target === 'partnerstickers') ? 'partnerStickers' : target;
            document.getElementById(`${panelId}-panel`).classList.add('active');
            const searchInput = document.getElementById(`${target}-search`);
            // 表情包用独立渲染逻辑，跳过 renderList
            if (target === 'mystickers' || target === 'partnerstickers') {
                renderStickerGrid(panelId);
            } else if (target === 'cards') {
                renderCardGroups(searchInput ? searchInput.value : '');
            } else {
                renderList(target, searchInput ? searchInput.value : '');
            }
        });
    });
}

function bindPanelButtons() {
    const types = ['cards', 'pokes', 'statuses', 'mottos', 'intros'];
    types.forEach(type => {
        const addBtn = document.getElementById(`${type}-add`);
        const batchBtn = document.getElementById(`${type}-batch-add`);
        const searchInput = document.getElementById(`${type}-search`);
        if (addBtn) {
            addBtn.onclick = () => {
                let newValue;
                if (type === 'intros') {
                    const line1 = prompt('主标题:');
                    if (!line1) return;
                    const line2 = prompt('副标题:');
                    newValue = line2 ? `${line1}|${line2}` : line1;
                } else {
                    newValue = prompt(`请输入新的${getTypeName(type)}:`);
                }
                if (newValue) addItem(type, newValue);
            };
        }
        if (batchBtn) batchBtn.onclick = () => batchAddItems(type);
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                if (type === 'cards') {
                    renderCardGroups(e.target.value);
                } else {
                    renderList(type, e.target.value);
                }
            });
        }
    });
    const groupManageBtn = document.getElementById('cards-group-manage');
    if (groupManageBtn) {
        groupManageBtn.onclick = () => {
            const groupName = prompt('请输入分组名称:');
            if (groupName && groupName.trim()) {
                const newGroup = {
                    id: Date.now().toString(),
                    name: groupName.trim(),
                    color: '#c5a47e',
                    items: []
                };
                if (!customReplies.cardGroups) customReplies.cardGroups = [];
                customReplies.cardGroups.push(newGroup);
                saveRepliesData();
                renderCardGroups(document.getElementById('cards-search').value);
            }
        };
    }
}

function getTypeName(type) {
    const map = { cards: '字卡', pokes: '拍一拍', statuses: '状态', mottos: '格言', intros: '开场动画', mystickers: '表情包(我)', partnerstickers: '表情包(对方)' };
    return map[type] || type;
}

// ========== 表情包管理 ==========
function renderStickerGrid(type) {
    const container = document.getElementById(`${type}-list`);
    if (!container) return;
    const stickers = customReplies[type] || [];
    if (stickers.length === 0) {
        container.innerHTML = '<div class="no-data" style="grid-column:1/-1;">暂无表情包，点击上方按钮上传</div>';
        return;
    }
    container.innerHTML = stickers.map((s, idx) => `
        <div class="sticker-card">
            <img class="sticker-card-img" src="${s.dataUrl}" alt="${escapeHtml(s.name || '')}">
            <div class="sticker-card-name" data-id="${s.id}" data-type="${type}">${escapeHtml(s.name || `表情${idx + 1}`)}</div>
            <button class="sticker-card-delete" data-id="${s.id}">删除</button>
        </div>
    `).join('');

    // 绑定删除按钮
    container.querySelectorAll('.sticker-card-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            const sid = btn.dataset.id;
            if (confirm('确定删除这个表情包吗？')) {
                customReplies[type] = (customReplies[type] || []).filter(s => s.id !== sid);
                saveRepliesData();
                renderStickerGrid(type);
            }
        });
    });
    // 点击名字重命名
    container.querySelectorAll('.sticker-card-name').forEach(nameEl => {
        nameEl.style.cursor = 'pointer';
        nameEl.title = '点击修改备注名';
        nameEl.addEventListener('click', () => {
            const sid = nameEl.dataset.id;
            const stickerType = nameEl.dataset.type;
            const sticker = (customReplies[stickerType] || []).find(s => s.id === sid);
            if (!sticker) return;
            const newName = prompt('修改备注名（导出聊天记录时使用）：', sticker.name || '');
            if (newName !== null && newName.trim()) {
                sticker.name = newName.trim();
                saveRepliesData();
                renderStickerGrid(stickerType);
                showNotification('备注名已更新', 'success');
            }
        });
    });
}

function uploadSticker(type) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            alert('图片不能超过 2MB');
            return;
        }
        try {
            const base64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = ev => resolve(ev.target.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
            const defaultName = file.name.replace(/\.[^.]+$/, '');
            const name = prompt('给这个表情包起个备注名（导出聊天记录时使用）：', defaultName) || defaultName;
            if (!customReplies[type]) customReplies[type] = [];
            customReplies[type].push({
                id: 'sticker_' + Date.now(),
                name: name.trim() || defaultName,
                dataUrl: base64
            });
            saveRepliesData();
            renderStickerGrid(type);
            showNotification('表情包已添加', 'success');
        } catch (err) {
            alert('图片处理失败');
        }
    };
    input.click();
}

function initStickerTabs() {
    // 上传按钮（tab切换由 initRepliesTabs 统一处理）
    const myUploadBtn = document.getElementById('myStickers-upload');
    const partnerUploadBtn = document.getElementById('partnerStickers-upload');
    if (myUploadBtn) myUploadBtn.onclick = () => uploadSticker('myStickers');
    if (partnerUploadBtn) partnerUploadBtn.onclick = () => uploadSticker('partnerStickers');
}

let repliesInitialized = false;
function initRepliesModule() {
    if (repliesInitialized) return;
    loadRepliesData();
    initRepliesTabs();
    bindPanelButtons();
    initStickerTabs();
    renderCardGroups('');
    bindCardItemEvents();
    renderList('pokes', '');
    renderList('statuses', '');
    renderList('mottos', '');
    renderList('intros', '');
    repliesInitialized = true;
}