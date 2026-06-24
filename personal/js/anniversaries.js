// ========== 重要日/纪念日模块 ==========
const ANNIVERSARY_KEY = 'anniversaries_data';

let anniversaries = [];

// 加载纪念日数据
function loadAnniversaries() {
    const saved = localStorage.getItem(ANNIVERSARY_KEY);
    anniversaries = saved ? JSON.parse(saved) : [];
}

// 保存纪念日数据
function saveAnniversaries() {
    localStorage.setItem(ANNIVERSARY_KEY, JSON.stringify(anniversaries));
}

// 计算天数差（正数为已过天数，负数为剩余天数）
function calcDays(dateStr, type) {
    const target = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffMs = today - target;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (type === 'countdown') {
        // 倒数日：显示到未来某天的倒数
        const nextDate = new Date(target);
        nextDate.setFullYear(today.getFullYear());
        if (nextDate < today) nextDate.setFullYear(today.getFullYear() + 1);
        const daysLeft = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
        return { days: daysLeft, label: '天' };
    } else {
        // 正数日：显示从那天起已经过了多少天
        return { days: Math.abs(diffDays), label: diffDays >= 0 ? '天' : '天后' };
    }
}

// 渲染纪念日列表（在纪念日视图中）
function renderAnniversaryList() {
    const container = document.getElementById('anniversary-list');
    if (!container) return;

    if (anniversaries.length === 0) {
        container.innerHTML = '<div class="no-data">💝 还没有重要日，点击上方按钮添加吧</div>';
        return;
    }

    // 按日期排序
    const sorted = [...anniversaries].sort((a, b) => {
        const daysA = calcDays(a.date, a.type).days;
        const daysB = calcDays(b.date, b.type).days;
        return daysA - daysB;
    });

    container.innerHTML = sorted.map(a => {
        const { days, label } = calcDays(a.date, a.type);
        const dateObj = new Date(a.date + 'T00:00:00');
        const dateStr = dateObj.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
        const isCountdown = a.type === 'countdown';
        const dayDisplay = isCountdown ? (days === 0 ? '就是今天！' : `还有 ${days} 天`) : `已 ${days} 天`;

        return `
            <div class="anniversary-item">
                <div class="anniversary-item-icon">${isCountdown ? '⏳' : '📅'}</div>
                <div class="anniversary-item-info">
                    <div class="anniversary-item-name">${escapeHtml(a.name)}</div>
                    <div class="anniversary-item-date">${dateStr}</div>
                    <div class="anniversary-item-days ${days === 0 && isCountdown ? 'is-today' : ''}">${dayDisplay}</div>
                </div>
                <div class="anniversary-item-actions">
                    <button class="anniversary-edit-btn" data-id="${a.id}">✏️</button>
                    <button class="anniversary-delete-btn" data-id="${a.id}">🗑️</button>
                </div>
            </div>
        `;
    }).join('');

    // 绑定编辑/删除事件
    container.querySelectorAll('.anniversary-edit-btn').forEach(btn => {
        btn.onclick = () => openAnniversaryEditor(btn.dataset.id);
    });
    container.querySelectorAll('.anniversary-delete-btn').forEach(btn => {
        btn.onclick = () => {
            if (confirm('确定删除这个重要日吗？')) {
                anniversaries = anniversaries.filter(a => a.id !== btn.dataset.id);
                saveAnniversaries();
                renderAnniversaryList();
                renderHomeAnniversaries();
                showNotification('重要日已删除', 'info');
            }
        };
    });
}

// 渲染主视图的重要日网格
function renderHomeAnniversaries() {
    const container = document.getElementById('home-anniversary-grid');
    const section = document.getElementById('home-anniversary-section');
    if (!container || !section) return;

    if (anniversaries.length === 0) {
        section.style.display = 'none';
        return;
    }
    section.style.display = 'block';

    // 取最近的3个纪念日
    const withDays = anniversaries.map(a => ({
        ...a,
        ...calcDays(a.date, a.type)
    }));
    const sorted = withDays.sort((a, b) => a.days - b.days);
    const top3 = sorted.slice(0, 3);

    container.innerHTML = top3.map(a => {
        const dateObj = new Date(a.date + 'T00:00:00');
        const dateStr = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
        const isCountdown = a.type === 'countdown';
        const displayText = isCountdown ? (a.days === 0 ? '今天！' : `${a.days}天`) : `${a.days}天`;

        return `
            <div class="home-anniversary-card">
                <div class="home-anniversary-icon">${isCountdown ? '⏳' : '📅'}</div>
                <div class="home-anniversary-name">${escapeHtml(a.name)}</div>
                <div class="home-anniversary-days">${displayText}</div>
                <div class="home-anniversary-date">${dateStr}</div>
            </div>
        `;
    }).join('');
}

// 打开添加/编辑模态框
let editingId = null;
function openAnniversaryEditor(id) {
    editingId = id || null;
    const modal = document.getElementById('anniversary-modal');
    const title = document.getElementById('anniversary-modal-title');
    const nameInput = document.getElementById('anniversary-name');
    const dateInput = document.getElementById('anniversary-date');
    const countdownBtn = document.getElementById('anniversary-type-countdown');
    const countupBtn = document.getElementById('anniversary-type-countup');

    if (id) {
        const item = anniversaries.find(a => a.id === id);
        if (!item) return;
        title.textContent = '编辑重要日';
        nameInput.value = item.name;
        dateInput.value = item.date;
        document.getElementById('anniversary-edit-id').value = id;
        if (item.type === 'countdown') {
            countdownBtn.classList.add('active');
            countupBtn.classList.remove('active');
        } else {
            countupBtn.classList.add('active');
            countdownBtn.classList.remove('active');
        }
    } else {
        title.textContent = '添加重要日';
        nameInput.value = '';
        dateInput.value = new Date().toISOString().slice(0, 10);
        document.getElementById('anniversary-edit-id').value = '';
        countdownBtn.classList.add('active');
        countupBtn.classList.remove('active');
    }
    showModal(modal);
}

// 关闭编辑模态框
function closeAnniversaryEditor() {
    const modal = document.getElementById('anniversary-modal');
    if (modal) hideModal(modal);
    editingId = null;
}

// 保存纪念日
function saveAnniversaryItem() {
    const name = document.getElementById('anniversary-name').value.trim();
    const date = document.getElementById('anniversary-date').value;
    const editId = document.getElementById('anniversary-edit-id').value;
    const type = document.querySelector('.anniversary-type-btn.active')?.dataset?.type || 'countdown';

    if (!name) { showNotification('请输入名称', 'warning'); return; }
    if (!date) { showNotification('请选择日期', 'warning'); return; }

    if (editId) {
        // 编辑模式
        const item = anniversaries.find(a => a.id === editId);
        if (item) {
            item.name = name;
            item.date = date;
            item.type = type;
        }
    } else {
        // 新增
        anniversaries.push({
            id: 'ann_' + Date.now(),
            name,
            date,
            type
        });
    }

    saveAnniversaries();
    renderAnniversaryList();
    renderHomeAnniversaries();
    closeAnniversaryEditor();
    showNotification(editId ? '重要日已更新' : '重要日已添加', 'success');
}

// 初始化纪念日模块
function initAnniversaries() {
    loadAnniversaries();

    // 添加按钮
    const addBtn = document.getElementById('anniversary-add-btn');
    if (addBtn) addBtn.onclick = () => openAnniversaryEditor(null);

    // 模态框按钮
    const saveBtn = document.getElementById('anniversary-save');
    if (saveBtn) saveBtn.onclick = saveAnniversaryItem;
    const cancelBtn = document.getElementById('anniversary-cancel');
    if (cancelBtn) cancelBtn.onclick = closeAnniversaryEditor;

    // 类型切换
    document.querySelectorAll('.anniversary-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.anniversary-type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // 模态框外部点击关闭
    const modal = document.getElementById('anniversary-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeAnniversaryEditor();
        });
    }

    renderAnniversaryList();
    renderHomeAnniversaries();
}
