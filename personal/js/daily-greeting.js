// ========== 每日公告模块 ==========
const DAILY_GREETING_KEY = 'daily_greeting_data';

// 预设心情和天气
const PARTNER_MOODS = ['😊 开心', '🥰 甜蜜', '😴 慵懒', '🌟 元气', '💭 思念', '🌸 温柔', '🎵 惬意', '💪 努力'];
const PARTNER_WEATHERS = ['☀️ 晴天', '⛅ 多云', '🌧️ 小雨', '🌈 彩虹', '🌙 月夜', '❄️ 飘雪', '🍃 微风', '⭐ 星空'];
const GREETING_MESSAGES = [
    '新的一天，新的开始，有你在的每一天都很美好。',
    '无论晴天雨天，只要想到你，心情就是最好的天气。',
    '今天也要元气满满哦！一起加油吧～',
    '每一天都是限量版，和你在一起的每一天都值得珍藏。',
    '生活明朗，万物可爱，而你最可爱。'
];

// 获取每日公告数据
function getGreetingData() {
    const saved = localStorage.getItem(DAILY_GREETING_KEY);
    if (saved) return JSON.parse(saved);
    return { lastCheckinDate: null, totalDays: 0, partnerMood: null, partnerWeather: null, message: null, wordcards: null };
}

// 保存每日公告数据
function saveGreetingData(data) {
    localStorage.setItem(DAILY_GREETING_KEY, JSON.stringify(data));
}

// 获取今天的日期字符串 YYYY-MM-DD
function getTodayStr() {
    return new Date().toISOString().slice(0, 10);
}

// 检查今天是否已签到
function hasCheckedInToday() {
    const data = getGreetingData();
    return data.lastCheckinDate === getTodayStr();
}

// 生成今日公告内容
function generateTodayGreeting() {
    const data = getGreetingData();
    // 如果今天还没有生成过内容（或者内容为空），则生成新的
    if (data.lastCheckinDate !== getTodayStr() || !data.partnerMood) {
        const moodIdx = Math.floor(Math.random() * PARTNER_MOODS.length);
        const weatherIdx = Math.floor(Math.random() * PARTNER_WEATHERS.length);
        const msgIdx = Math.floor(Math.random() * GREETING_MESSAGES.length);
        data.partnerMood = PARTNER_MOODS[moodIdx];
        data.partnerWeather = PARTNER_WEATHERS[weatherIdx];
        data.message = GREETING_MESSAGES[msgIdx];
        // 从回复库随机选择 1-3 个字卡
        const cards = window.customReplies?.cards || [];
        if (cards.length > 0) {
            const count = Math.min(3, 1 + Math.floor(Math.random() * cards.length));
            const shuffled = [...cards].sort(() => Math.random() - 0.5);
            data.wordcards = shuffled.slice(0, count);
        } else {
            data.wordcards = ['今天也要开心呀', '想你啦'];
        }
        saveGreetingData(data);
    }
    return data;
}

// 渲染每日公告弹窗
function renderDailyGreeting(data) {
    const today = new Date();
    const dateStr = today.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
    document.getElementById('greeting-date').textContent = dateStr;
    document.getElementById('greeting-mood').textContent = data.partnerMood || '😊 开心';
    document.getElementById('greeting-weather').textContent = data.partnerWeather || '☀️ 晴天';
    document.getElementById('greeting-message').textContent = data.message || '新的一天，新的开始！';
    document.getElementById('greeting-total-days').textContent = data.totalDays || 0;

    // 字卡
    const wordcardsEl = document.getElementById('greeting-wordcards');
    wordcardsEl.innerHTML = '';
    (data.wordcards || []).forEach(card => {
        const span = document.createElement('span');
        span.className = 'greeting-wordcard';
        span.textContent = card;
        wordcardsEl.appendChild(span);
    });

    // 签到按钮状态
    const checkinBtn = document.getElementById('greeting-checkin-btn');
    if (hasCheckedInToday()) {
        checkinBtn.textContent = '✅ 今天已签到';
        checkinBtn.classList.add('checked');
    } else {
        checkinBtn.textContent = '✨ 开始今天吧 ✨';
        checkinBtn.classList.remove('checked');
    }
}

// 执行签到
function doCheckin() {
    if (hasCheckedInToday()) return;
    const data = getGreetingData();
    data.lastCheckinDate = getTodayStr();
    data.totalDays = (data.totalDays || 0) + 1;
    saveGreetingData(data);
    renderDailyGreeting(data);
    showNotification('签到成功！已相伴 ' + data.totalDays + ' 天 💕', 'success');

    // 在聊天中添加签到消息
    if (typeof addMessage === 'function') {
        addMessage({
            id: Date.now(),
            sender: 'system',
            text: `📅 今日签到完成！已相伴 ${data.totalDays} 天 ✨`,
            timestamp: new Date(),
            type: 'system',
            favorited: false
        });
    }
}

// 显示每日公告（公开函数，供网格按钮调用）
function showDailyGreeting() {
    const data = generateTodayGreeting();
    renderDailyGreeting(data);
    const modal = document.getElementById('daily-greeting');
    if (modal) modal.classList.add('active');
}

// 隐藏每日公告
function hideDailyGreeting() {
    const modal = document.getElementById('daily-greeting');
    if (modal) modal.classList.remove('active');
}

// 初始化每日公告
function initDailyGreeting() {
    // 绑定签到按钮
    const checkinBtn = document.getElementById('greeting-checkin-btn');
    if (checkinBtn) {
        checkinBtn.onclick = doCheckin;
    }

    // 启动画面：点击后显示公告（如果今天未签到）
    const splash = document.getElementById('splash');
    const dailyGreeting = document.getElementById('daily-greeting');

    if (splash && dailyGreeting) {
        splash.addEventListener('click', () => {
            splash.classList.add('hidden');
            // 更新公告内容并显示
            const data = generateTodayGreeting();
            renderDailyGreeting(data);
            dailyGreeting.classList.add('active');
        });
    }

    // 点击公告外部关闭（仅在已签到后可用）
    if (dailyGreeting) {
        dailyGreeting.addEventListener('click', (e) => {
            if (e.target === dailyGreeting && hasCheckedInToday()) {
                hideDailyGreeting();
            }
        });
    }

    // 暴露全局函数供网格按钮使用
    window.showDailyGreeting = showDailyGreeting;
}
