// ========== 报备模块 - 双人时间轴 ==========
const CHECKIN_DATA_KEY = 'checkin_data';
const CHECKIN_ACTIVITIES_KEY = 'checkin_activities';

const DEFAULT_ACTIVITIES = [
    { name: '起床', buckets: ['morning'] },
    { name: '洗漱', buckets: ['morning'] },
    { name: '吃早餐', buckets: ['morning'] },
    { name: '晨跑', buckets: ['morning'] },
    { name: '上班', buckets: ['morning', 'afternoon'] },
    { name: '上课', buckets: ['morning', 'afternoon'] },
    { name: '开会', buckets: ['morning', 'afternoon'] },
    { name: '吃午饭', buckets: ['afternoon'] },
    { name: '午休', buckets: ['afternoon'] },
    { name: '写作业', buckets: ['afternoon', 'evening'] },
    { name: '健身', buckets: ['afternoon', 'evening'] },
    { name: '看书', buckets: ['afternoon', 'evening'] },
    { name: '吃晚饭', buckets: ['evening'] },
    { name: '散步', buckets: ['evening'] },
    { name: '看剧', buckets: ['evening'] },
    { name: '打游戏', buckets: ['evening'] },
    { name: '洗澡', buckets: ['evening'] },
    { name: '刷手机', buckets: ['morning', 'afternoon', 'evening'] },
    { name: '喝咖啡', buckets: ['morning', 'afternoon'] },
    { name: '遛狗', buckets: ['morning', 'evening'] },
    { name: '购物', buckets: ['afternoon', 'evening'] },
    { name: '做家务', buckets: ['morning', 'afternoon', 'evening'] },
    { name: '听音乐', buckets: ['morning', 'afternoon', 'evening'] },
    { name: '发呆', buckets: ['morning', 'afternoon', 'evening'] },
];

let checkinDate = new Date();
let checkinEditId = null;

// 获取活动库
function getActivityLibrary() {
    const saved = localStorage.getItem(CHECKIN_ACTIVITIES_KEY);
    return saved ? JSON.parse(saved) : [...DEFAULT_ACTIVITIES];
}
function saveActivityLibrary(lib) {
    localStorage.setItem(CHECKIN_ACTIVITIES_KEY, JSON.stringify(lib));
}

// 获取报备数据
function getCheckinData() {
    const saved = localStorage.getItem(CHECKIN_DATA_KEY);
    return saved ? JSON.parse(saved) : {};
}
function saveCheckinData(data) {
    localStorage.setItem(CHECKIN_DATA_KEY, JSON.stringify(data));
}

// 获取日期字符串
function getDateStr(d) { return d.toISOString().slice(0, 10); }

// 根据时间确定 bucket
function getTimeBucket(timeStr) {
    const h = parseInt(timeStr.split(':')[0]);
    if (h >= 6 && h < 12) return 'morning';
    if (h >= 12 && h < 18) return 'afternoon';
    return 'evening'; // 18-23 and 0-5
}

// 为某天生成对方活动（如果还没有）
function generatePartnerActivities(dateStr) {
    const data = getCheckinData();
    if (!data[dateStr]) data[dateStr] = { partner: [], me: [], endMsg: '' };
    if (data[dateStr].partner && data[dateStr].partner.length > 0) return data;

    const lib = getActivityLibrary();
    const count = 3 + Math.floor(Math.random() * 4); // 3-6 个活动

    // 生成随机时间
    const times = [];
    for (let i = 0; i < count; i++) {
        const h = 7 + Math.floor(Math.random() * 16); // 7-22
        const m = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45
        times.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
    times.sort();

    // 为每个时间选活动
    const activities = times.map(t => {
        const bucket = getTimeBucket(t);
        const candidates = lib.filter(a => a.buckets.includes(bucket));
        if (candidates.length === 0) return { time: t, activity: '休息' };
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        return { time: t, activity: pick.name };
    });

    data[dateStr].partner = activities;

    // 生成每日留言（随机1-5条字卡）
    const cards = window.customReplies?.cards || [];
    if (cards.length > 0) {
        const msgCount = 1 + Math.floor(Math.random() * 5);
        const shuffled = [...cards].sort(() => Math.random() - 0.5);
        data[dateStr].endMsg = shuffled.slice(0, msgCount).join(' | ');
    }

    saveCheckinData(data);
    return data;
}

// 渲染报备视图
function renderCheckinView() {
    const dateStr = getDateStr(checkinDate);
    document.getElementById('checkin-date-label').textContent =
        checkinDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

    // 确保数据存在
    const data = generatePartnerActivities(dateStr);
    const dayData = data[dateStr] || { partner: [], me: [], endMsg: '' };

    // 对方活动
    const partnerList = document.getElementById('checkin-partner-list');
    partnerList.innerHTML = (dayData.partner || []).map(a =>
        `<div class="checkin-item"><span class="checkin-item-time">${a.time}</span><span class="checkin-item-activity">${escapeHtml(a.activity)}</span></div>`
    ).join('') || '<div style="text-align:center;color:var(--text-secondary);font-size:12px;padding:12px;">暂无</div>';

    // 我的活动
    const meList = document.getElementById('checkin-me-list');
    meList.innerHTML = (dayData.me || []).map((a, idx) =>
        `<div class="checkin-item">
            <span class="checkin-item-time">${a.time}</span><span class="checkin-item-activity">${escapeHtml(a.activity)}</span>
            <button class="checkin-item-delete" data-idx="${idx}">✕</button>
        </div>`
    ).join('') || '<div style="text-align:center;color:var(--text-secondary);font-size:12px;padding:12px;">点击下方添加</div>';

    // 删除按钮事件
    meList.querySelectorAll('.checkin-item-delete').forEach(btn => {
        btn.onclick = () => {
            const idx = parseInt(btn.dataset.idx);
            dayData.me.splice(idx, 1);
            saveCheckinData(data);
            renderCheckinView();
        };
    });

    // 每日留言
    document.getElementById('checkin-endmsg').innerHTML = dayData.endMsg
        ? `<span style="opacity:0.6;">💌 今日寄语：</span><br>${escapeHtml(dayData.endMsg)}`
        : '<span style="opacity:0.4;">还没有今日寄语</span>';

    // 今天不能导航到未来
    const today = getDateStr(new Date());
    document.getElementById('checkin-next-day').style.visibility = (dateStr >= today) ? 'hidden' : 'visible';
}

// 初始化报备模块
function initCheckin() {
    const today = new Date();
    checkinDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // 日期导航
    document.getElementById('checkin-prev-day').onclick = () => {
        checkinDate.setDate(checkinDate.getDate() - 1);
        renderCheckinView();
    };
    document.getElementById('checkin-next-day').onclick = () => {
        const todayStr = getDateStr(new Date());
        const nextStr = getDateStr(new Date(checkinDate.getTime() + 86400000));
        if (nextStr <= todayStr) {
            checkinDate.setDate(checkinDate.getDate() + 1);
            renderCheckinView();
        }
    };

    // 添加我的活动
    const addModal = document.getElementById('checkin-add-modal');
    document.getElementById('checkin-add-me').onclick = () => {
        const now = new Date();
        document.getElementById('checkin-add-time').value =
            `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        document.getElementById('checkin-add-activity').value = '';
        showModal(addModal);
    };
    document.getElementById('checkin-add-cancel').onclick = () => hideModal(addModal);
    document.getElementById('checkin-add-save').onclick = () => {
        const time = document.getElementById('checkin-add-time').value;
        const activity = document.getElementById('checkin-add-activity').value.trim();
        if (!time || !activity) { showNotification('请填写时间和活动', 'warning'); return; }
        const dateStr = getDateStr(checkinDate);
        const data = getCheckinData();
        if (!data[dateStr]) data[dateStr] = { partner: [], me: [], endMsg: '' };
        data[dateStr].me.push({ time, activity });
        data[dateStr].me.sort((a, b) => a.time.localeCompare(b.time));
        saveCheckinData(data);
        hideModal(addModal);
        renderCheckinView();
        showNotification('活动已添加', 'success');
    };
    if (addModal) addModal.addEventListener('click', e => { if (e.target === addModal) hideModal(addModal); });

    // 活动库管理
    const libModal = document.getElementById('checkin-library-modal');
    document.getElementById('checkin-library-btn').onclick = () => {
        renderActivityLibrary();
        showModal(libModal);
    };
    document.getElementById('checkin-library-close').onclick = () => hideModal(libModal);
    if (libModal) libModal.addEventListener('click', e => { if (e.target === libModal) hideModal(libModal); });

    document.getElementById('checkin-library-add').onclick = () => {
        const input = document.getElementById('checkin-library-new');
        const name = input.value.trim();
        if (!name) { showNotification('请输入活动名称', 'warning'); return; }
        const lib = getActivityLibrary();
        const buckets = [];
        if (document.getElementById('chk-morning')?.checked) buckets.push('morning');
        if (document.getElementById('chk-afternoon')?.checked) buckets.push('afternoon');
        if (document.getElementById('chk-evening')?.checked) buckets.push('evening');
        if (buckets.length === 0) buckets.push('morning', 'afternoon', 'evening');
        lib.push({ name, buckets });
        saveActivityLibrary(lib);
        input.value = '';
        renderActivityLibrary();
        showNotification('活动已添加', 'success');
    };

    renderCheckinView();
}

// 渲染活动库管理面板
function renderActivityLibrary() {
    const container = document.getElementById('checkin-library-list');
    const lib = getActivityLibrary();
    container.innerHTML = lib.map((a, idx) => `
        <div class="checkin-lib-item">
            <span class="activity-name">${escapeHtml(a.name)}</span>
            <label><input type="checkbox" class="chk-bucket" data-idx="${idx}" value="morning" ${a.buckets.includes('morning') ? 'checked' : ''}>早</label>
            <label><input type="checkbox" class="chk-bucket" data-idx="${idx}" value="afternoon" ${a.buckets.includes('afternoon') ? 'checked' : ''}>中</label>
            <label><input type="checkbox" class="chk-bucket" data-idx="${idx}" value="evening" ${a.buckets.includes('evening') ? 'checked' : ''}>晚</label>
            <button class="checkin-lib-delete" data-idx="${idx}">🗑️</button>
        </div>
    `).join('');
    // 保存 id 引用
    container.querySelectorAll('.chk-bucket').forEach(cb => {
        cb.onchange = () => {
            const idx = parseInt(cb.dataset.idx);
            const lib = getActivityLibrary();
            const buckets = [];
            container.querySelectorAll(`.chk-bucket[data-idx="${idx}"]:checked`).forEach(c => buckets.push(c.value));
            lib[idx].buckets = buckets.length ? buckets : ['morning', 'afternoon', 'evening'];
            saveActivityLibrary(lib);
        };
    });
    container.querySelectorAll('.checkin-lib-delete').forEach(btn => {
        btn.onclick = () => {
            const idx = parseInt(btn.dataset.idx);
            if (confirm(`删除活动"${lib[idx].name}"？`)) {
                lib.splice(idx, 1);
                saveActivityLibrary(lib);
                renderActivityLibrary();
            }
        };
    });
}
