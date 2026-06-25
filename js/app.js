// 全局设置
// 初始化全局设置
window.settings = { ...DEFAULT_SETTINGS };

// DOM 元素
let homeTime, homeAvatarMy, homeAvatarPartner, homeDecorationText, homeAppGrid;
let chatMoreBtn, chatMoreDropdown, moreSendImage, moreBatch;
let splash, dailyGreeting;

// 数据存储简化
function throttledSaveData() {
    localStorage.setItem('chat_messages', JSON.stringify(messages));
    localStorage.setItem('chat_settings', JSON.stringify(settings));
}

function loadData() {
    // 多会话模块已加载消息，这里只加载设置
    const savedSettings = localStorage.getItem('chat_settings');
    if (savedSettings) settings = { ...settings, ...JSON.parse(savedSettings) };
    renderMessages();
    window.displayedMessageCount = Math.min(20, (window.messages || []).length);
}

// 更新主视图时间
function updateHomeTime() {
    if (homeTime) {
        const now = new Date();
        homeTime.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}

// 生成主视图网格
function generateHomeGrid() {
    const apps = [
        { name: '聊天', icon: 'fa-comment-dots', view: 'chat-view' },
        { name: '回复库', icon: 'fa-comment', view: 'replies-view' },
        { name: '睡眠记录', icon: 'fa-moon', view: 'sleep-view' },
        { name: '碎碎念', icon: 'fa-comment', view: 'whisper-view' },
        { name: '信箱', icon: 'fa-envelope', view: 'envelope-view' },
        { name: '小团子', icon: 'fa-heart', view: 'pet-view' },
        { name: '占卜', icon: 'fa-star-and-crescent', view: 'fortune-view' },
        { name: '抉择', icon: 'fa-balance-scale', view: 'decision-view' },
        { name: '每日公告', icon: 'fa-newspaper', action: 'showDailyGreeting' },
        { name: '心情日历', icon: 'fa-calendar-day', view: 'mood-view' },
        { name: '场外援助', icon: 'fa-robot', view: 'ai-chat-view' },
        { name: '五子棋', icon: 'fa-chess-board', view: 'gomoku-view' },
        { name: '翻牌记忆', icon: 'fa-clone', view: 'memory-view' },
        { name: '报备', icon: 'fa-clipboard-list', view: 'checkin-view' },
        { name: '图画板', icon: 'fa-paint-brush', view: 'draw-view' },
        { name: '重要日', icon: 'fa-heart', view: 'anniversary-view' },
        { name: '聊天记录与统计', icon: 'fa-chart-bar', view: 'stats-view' },
        { name: '设置', icon: 'fa-cog', view: 'settings-view' }
    ];
    homeAppGrid.innerHTML = '';
    // 读取自定义图标
    let customIcons = {};
    try {
        const raw = localStorage.getItem('custom_icons');
        if (raw) customIcons = JSON.parse(raw);
    } catch (e) {}
    apps.forEach(app => {
        const div = document.createElement('div');
        div.className = 'app-icon';
        const customImg = customIcons[app.name];
        if (customImg) {
            div.innerHTML = `<span class="icon-img-wrap"><img src="${customImg}" style="width:56px;height:56px;object-fit:cover;border-radius:var(--icon-radius, 18px);box-shadow:0 4px 10px rgba(0,0,0,0.05);opacity:var(--icon-opacity,1);border:var(--icon-border-width, 0px) solid var(--icon-border-color, transparent);" alt="${app.name}"></span><span>${app.name}</span>`;
        } else {
            div.innerHTML = `<i class="fas ${app.icon}"></i><span>${app.name}</span>`;
        }
        div.onclick = () => {
            if (app.action && typeof window[app.action] === 'function') {
                window[app.action]();
            } else if (app.view) {
                showView(app.view);
            }
        };
        homeAppGrid.appendChild(div);
    });
}

// 启动函数
document.addEventListener('DOMContentLoaded', () => {
    // 应用自定义启动画面图片
    if (typeof applySplashImage === 'function') applySplashImage();
    // 获取 DOM 元素
    homeTime = document.getElementById('home-time');
    homeAvatarMy = document.getElementById('home-avatar-my');
    homeAvatarPartner = document.getElementById('home-avatar-partner');
    homeDecorationText = document.getElementById('home-decoration-text');
    homeAppGrid = document.getElementById('home-app-grid');
    chatMoreBtn = document.getElementById('chat-more-btn');
    chatMoreDropdown = document.getElementById('chat-more-dropdown');
    moreSendImage = document.getElementById('more-send-image');
    moreBatch = document.getElementById('more-batch');
    splash = document.getElementById('splash');
    dailyGreeting = document.getElementById('daily-greeting');
    
    // 初始化各模块
    initMultiSession();
    initChatElements();
    bindChatEvents();
    initViewManager();
    initMusicModule();
    initRepliesModule();
    generateHomeGrid();
    updateHomeTime();
    setInterval(updateHomeTime, 1000); 
    initStatsModule();
    initAppearanceModule();
    initChatSettingsModule();
    initSoundSettings();
    initDataManager();
    initOtherSettings();
    initSleepModule();
    initWhisperModule();
    initEnvelopeModule();
    initFortuneModule();
    initDecisionModule();
    initMoodCalendar();
    initAnniversaries();
    initAISettings();
    initAIChat();
    initGomoku();
    initMemoryGame();
    initCheckin();
    initDrawBoard();

    // 加载数据
    loadData();
    
    // 初始化每日公告（含启动画面→公告流程）
    initDailyGreeting();
    
    // 顶部加号菜单
    if (chatMoreBtn) {
        chatMoreBtn.onclick = (e) => {
            e.stopPropagation();
            chatMoreDropdown.classList.toggle('show');
        };
        document.addEventListener('click', () => chatMoreDropdown.classList.remove('show'));
    }
    if (moreSendImage) moreSendImage.onclick = openImagePicker;
    if (moreBatch) moreBatch.onclick = toggleBatchMode;
    const moreSelectExport = document.getElementById('more-select-export');
    if (moreSelectExport) moreSelectExport.onclick = enterSelectExportMode;
    
    // 设置菜单点击（示例跳转）
    document.querySelectorAll('.settings-item').forEach(item => {
        const sub = item.dataset.sub;
        if (sub === 'music') {
            item.addEventListener('click', () => showView('music-settings-view'));
        } else if (sub === 'appearance') {
            item.addEventListener('click', () => showView('appearance-view'));
        } else if (sub === 'chat') {
            item.addEventListener('click', () => showView('chat-settings-view'));
        } else if (sub === 'sound') {
            item.addEventListener('click', () => showView('sound-settings-view'));
        } else if (sub === 'data') {
            item.addEventListener('click', () => showView('data-settings-view'));
        } else if (sub === 'ai') {
            item.addEventListener('click', () => showView('ai-settings-view'));
        } else if (sub === 'other') {
            item.addEventListener('click', () => showView('other-settings-view'));
        } else {
            item.addEventListener('click', () => alert('设置子页面暂未实现，后续会完善'));
        }
    });
        // 装饰文字存储键名
    const DECO_TEXT_KEY = 'home_deco_text';

    function loadDecoText() {
        const saved = localStorage.getItem(DECO_TEXT_KEY);
        if (saved) {
            homeDecorationText.innerText = saved;
        } else {
            // 默认文字
            homeDecorationText.innerText = '✨ 你是我最重要的决定 ✨';
        }
    }
    homeDecorationText.style.cursor = 'pointer';
    homeDecorationText.onclick = () => {
    const currentText = homeDecorationText.innerText;
    const newText = prompt('请输入新的装饰文字：', currentText);
    if (newText && newText.trim()) {
        saveDecoText(newText.trim());
        }
    };

    function saveDecoText(newText) {
        localStorage.setItem(DECO_TEXT_KEY, newText);
        homeDecorationText.innerText = newText;
        showNotification('装饰文字已更新', 'success');
    }
    // 头像存储键名
    const AVATAR_MY_KEY = 'avatar_my';
    const AVATAR_PARTNER_KEY = 'avatar_partner';

    // 加载保存的头像
    function loadAvatars() {
        const myAvatarData = localStorage.getItem(AVATAR_MY_KEY);
        if (myAvatarData) {
            homeAvatarMy.innerHTML = `<img src="${myAvatarData}" style="width:100%;height:100%;object-fit:cover;">`;
        } else {
            homeAvatarMy.innerHTML = '<i class="fas fa-user"></i>';
        }
        const partnerAvatarData = localStorage.getItem(AVATAR_PARTNER_KEY);
        if (partnerAvatarData) {
            homeAvatarPartner.innerHTML = `<img src="${partnerAvatarData}" style="width:100%;height:100%;object-fit:cover;">`;
        } else {
            homeAvatarPartner.innerHTML = '<i class="fas fa-user-circle"></i>';
        }
    }

    // 保存头像
    function saveAvatar(isPartner, base64Data) {
        const key = isPartner ? AVATAR_PARTNER_KEY : AVATAR_MY_KEY;
        if (base64Data) {
            localStorage.setItem(key, base64Data);
        } else {
            localStorage.removeItem(key);
        }
        // 更新界面
        const targetEl = isPartner ? homeAvatarPartner : homeAvatarMy;
        if (base64Data) {
            targetEl.innerHTML = `<img src="${base64Data}" style="width:100%;height:100%;object-fit:cover;">`;
        } else {
            targetEl.innerHTML = isPartner ? '<i class="fas fa-user-circle"></i>' : '<i class="fas fa-user"></i>';
        }
    }

    // 打开头像上传选择器
    function openAvatarUpload(isPartner) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        // Android TWA 修复：必须挂到 DOM 里 click 才能触发文件选择器
        input.style.position = 'fixed';
        input.style.top = '-9999px';
        input.style.left = '-9999px';
        input.style.visibility = 'hidden';
        document.body.appendChild(input);
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) { document.body.removeChild(input); return; }
            if (file.size > 2 * 1024 * 1024) {
                alert('图片不能超过 2MB');
                document.body.removeChild(input);
                return;
            }
            try {
                const base64 = await cropImageToSquare(file, 300);
                saveAvatar(isPartner, base64);
                showNotification('头像已更新', 'success');
            } catch (err) {
                console.error(err);
                // 裁剪失败时降级为直接读取原图
                const reader = new FileReader();
                reader.onload = ev => { saveAvatar(isPartner, ev.target.result); showNotification('头像已更新（未裁剪）', 'success'); };
                reader.onerror = () => alert('图片读取失败');
                reader.readAsDataURL(file);
            }
            document.body.removeChild(input);
        };
        input.click();
    }

    // 为头像元素添加点击事件
    homeAvatarMy.style.cursor = 'pointer';
    homeAvatarPartner.style.cursor = 'pointer';
    homeAvatarMy.onclick = () => openAvatarUpload(false);
    homeAvatarPartner.onclick = () => openAvatarUpload(true);

    // 加载已保存的头像
    loadAvatars();

    // 头像动效：周期性轻轻碰碰
    function triggerAvatarNudge() {
        if (!homeAvatarMy || !homeAvatarPartner) return;
        // 只在主视图可见时触发
        const homeView = document.getElementById('home-view');
        if (!homeView || !homeView.classList.contains('active')) return;
        // 随机选择我的头像或对方头像先动
        const delay = 200 + Math.random() * 300;
        homeAvatarMy.classList.add('nudge');
        setTimeout(() => {
            homeAvatarPartner.classList.add('nudge-partner');
        }, delay);
        // 清除动画class以便下次触发
        setTimeout(() => {
            homeAvatarMy.classList.remove('nudge');
            homeAvatarPartner.classList.remove('nudge-partner');
        }, 1200);
    }
    // 每8-14秒触发一次
    function scheduleNextNudge() {
        const interval = 8000 + Math.random() * 6000;
        setTimeout(() => {
            triggerAvatarNudge();
            scheduleNextNudge();
        }, interval);
    }
    scheduleNextNudge();

    // 装饰文字：仅在无保存内容时设置默认
    loadDecoText();
    // 头像已通过 loadAvatars() 加载，无需覆盖

    console.log('新网站启动完成！');
});
