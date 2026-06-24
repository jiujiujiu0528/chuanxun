// ========== 心情日历模块 ==========
const MOOD_DATA_KEY = 'mood_calendar_data';
const PARTNER_MOOD_EMOJIS = ['😊', '🥰', '😴', '🌟', '💭', '🌸', '🎵', '💪', '😎', '🤗', '💖', '✨'];
const MY_MOOD_EMOJIS = ['😄', '🥰', '😊', '😴', '😢', '😤', '🤔', '🌟'];

let moodCalendarYear, moodCalendarMonth;

// 获取心情数据
function getMoodData() {
    const saved = localStorage.getItem(MOOD_DATA_KEY);
    return saved ? JSON.parse(saved) : {};
}

// 保存心情数据
function saveMoodData(data) {
    localStorage.setItem(MOOD_DATA_KEY, JSON.stringify(data));
}

// 为某个日期生成对方心情（如果还没有）
function ensurePartnerMood(dateStr) {
    const data = getMoodData();
    if (!data[dateStr]) data[dateStr] = {};
    if (!data[dateStr].partner) {
        data[dateStr].partner = PARTNER_MOOD_EMOJIS[Math.floor(Math.random() * PARTNER_MOOD_EMOJIS.length)];
        saveMoodData(data);
    }
    return data[dateStr].partner;
}

// 设置我的心情
function setMyMood(dateStr, mood) {
    const data = getMoodData();
    if (!data[dateStr]) data[dateStr] = {};
    data[dateStr].me = mood;
    saveMoodData(data);
    renderMoodCalendar();
}

// 渲染心情日历
function renderMoodCalendar() {
    const grid = document.getElementById('mood-calendar-grid');
    const label = document.getElementById('mood-month-label');
    if (!grid || !label) return;

    const year = moodCalendarYear;
    const month = moodCalendarMonth;
    label.textContent = `${year}年${month + 1}月`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const data = getMoodData();

    grid.innerHTML = '';

    // 填充前置空白格
    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'mood-day empty';
        grid.appendChild(empty);
    }

    // 渲染每天
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayDiv = document.createElement('div');
        dayDiv.className = 'mood-day';
        if (dateStr === todayStr) dayDiv.classList.add('today');

        const dayNum = document.createElement('div');
        dayNum.className = 'mood-day-num';
        dayNum.textContent = d;
        dayDiv.appendChild(dayNum);

        // 对方心情
        const partnerMood = document.createElement('div');
        partnerMood.className = 'mood-emoji partner-mood';
        if (data[dateStr]?.partner) {
            partnerMood.textContent = data[dateStr].partner;
        } else if (dateStr <= todayStr) {
            // 过去的日期自动生成对方心情
            const autoMood = ensurePartnerMood(dateStr);
            partnerMood.textContent = autoMood;
        } else {
            partnerMood.textContent = '';
        }
        partnerMood.title = '对方心情';
        dayDiv.appendChild(partnerMood);

        // 我的心情
        const myMood = document.createElement('div');
        myMood.className = 'mood-emoji my-mood';
        if (data[dateStr]?.me) {
            myMood.textContent = data[dateStr].me;
        } else {
            myMood.textContent = '';
        }
        myMood.title = '我的心情';
        dayDiv.appendChild(myMood);

        // 点击日期设置我的心情（仅当天及以前）
        if (dateStr <= todayStr) {
            dayDiv.style.cursor = 'pointer';
            dayDiv.addEventListener('click', () => openMoodPicker(dateStr));
        } else {
            dayDiv.style.opacity = '0.5';
        }

        grid.appendChild(dayDiv);
    }
}

// 打开心情选择器
let currentPickingDate = null;
function openMoodPicker(dateStr) {
    currentPickingDate = dateStr;
    const modal = document.getElementById('mood-picker-modal');
    const dateLabel = document.getElementById('mood-picker-date');
    if (!modal || !dateLabel) return;
    const d = new Date(dateStr + 'T00:00:00');
    dateLabel.textContent = d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
    document.getElementById('mood-custom-input').value = '';
    showModal(modal);
}

// 关闭心情选择器
function closeMoodPicker() {
    const modal = document.getElementById('mood-picker-modal');
    if (modal) hideModal(modal);
    currentPickingDate = null;
}

// 初始化心情日历
function initMoodCalendar() {
    const now = new Date();
    moodCalendarYear = now.getFullYear();
    moodCalendarMonth = now.getMonth();

    // 导航按钮
    document.getElementById('mood-prev-month').onclick = () => {
        if (moodCalendarMonth === 0) {
            moodCalendarMonth = 11;
            moodCalendarYear--;
        } else {
            moodCalendarMonth--;
        }
        renderMoodCalendar();
    };
    document.getElementById('mood-next-month').onclick = () => {
        if (moodCalendarMonth === 11) {
            moodCalendarMonth = 0;
            moodCalendarYear++;
        } else {
            moodCalendarMonth++;
        }
        renderMoodCalendar();
    };

    // 预设心情按钮
    document.querySelectorAll('.mood-preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const mood = btn.dataset.mood;
            if (currentPickingDate) {
                setMyMood(currentPickingDate, mood);
                closeMoodPicker();
                showNotification('心情已记录: ' + mood, 'success');
            }
        });
    });

    // 自定义心情
    const saveBtn = document.getElementById('mood-picker-save');
    if (saveBtn) {
        saveBtn.onclick = () => {
            const customInput = document.getElementById('mood-custom-input');
            const customMood = customInput.value.trim();
            if (customMood && currentPickingDate) {
                setMyMood(currentPickingDate, customMood);
                closeMoodPicker();
                showNotification('心情已记录: ' + customMood, 'success');
            } else if (!customMood.trim() && currentPickingDate) {
                showNotification('请输入心情或选择一个预设', 'warning');
            }
        };
    }

    // 取消按钮
    const cancelBtn = document.getElementById('mood-picker-cancel');
    if (cancelBtn) cancelBtn.onclick = closeMoodPicker;

    // 点击模态框外部关闭
    const moodModal = document.getElementById('mood-picker-modal');
    if (moodModal) {
        moodModal.addEventListener('click', (e) => {
            if (e.target === moodModal) closeMoodPicker();
        });
    }

    renderMoodCalendar();
}
