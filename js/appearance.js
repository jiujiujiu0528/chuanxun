// ========== 外观与主题模块 ==========
function initAppearanceModule() {
    loadTheme();
    bindDarkModeToggle();
    loadFontSize();
    bindThemeButtons();
    bindFontSizeSlider();
    bindBubbleStyleButtons();
    bindChatBackground();
    loadIconSettings();
    bindIconSettings();
    loadCustomIcons();
    bindCustomIconSettings();
    bindFrameSettings();
    bindRecordSettings();
    // 主视图背景（合并自 custom-settings）
    bindHomeBgUpload();
    loadHomeBgPreview();
    const homeBg = localStorage.getItem(HOME_BG_KEY);
    if (homeBg) applyHomeBackground(homeBg);
    // 启动画面
    bindSplashUpload();
    loadSplashPreview();
    // 素材库
    renderMaterialGallery();
    bindMaterialUpload();
    // 装饰文字
    loadDecoText();
    const saveDecoBtn = document.getElementById('save-deco-text');
    if (saveDecoBtn) saveDecoBtn.onclick = saveDecoText;
}

// 主题色切换
function bindThemeButtons() {
    const btns = document.querySelectorAll('.theme-btn');
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            setTheme(theme);
            saveTheme(theme);
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-color-theme', theme);
    // 应用自定义主题颜色（简单预设，实际可扩展）
    const themes = {
        gold: { '--accent-color': '#c5a47e', '--accent-color-rgb': '197,164,126' },
        blue: { '--accent-color': '#7FA6CD', '--accent-color-rgb': '127,166,205' },
        purple: { '--accent-color': '#BB9EC7', '--accent-color-rgb': '187,158,199' },
        green: { '--accent-color': '#7BC8A4', '--accent-color-rgb': '123,200,164' },
        pink: { '--accent-color': '#F4A6B3', '--accent-color-rgb': '244,166,179' },
        'black-white': { '--accent-color': '#333333', '--accent-color-rgb': '51,51,51' },
        pastel: { '--accent-color': '#A8D8EA', '--accent-color-rgb': '168,216,234' },
        sunset: { '--accent-color': '#FF9A8B', '--accent-color-rgb': '255,154,139' },
        forest: { '--accent-color': '#7BA05B', '--accent-color-rgb': '123,160,91' },
        ocean: { '--accent-color': '#4A90E2', '--accent-color-rgb': '74,144,226' }
    };
    const colors = themes[theme];
    if (colors) {
        for (let [key, value] of Object.entries(colors)) {
            document.documentElement.style.setProperty(key, value);
        }
    }
}

function saveTheme(theme) {
    localStorage.setItem('app_theme', theme);
}

function loadTheme() {
    const saved = localStorage.getItem('app_theme');
    if (saved) {
        setTheme(saved);
        const btn = document.querySelector(`.theme-btn[data-theme="${saved}"]`);
        if (btn) btn.classList.add('active');
    } else {
        setTheme('gold');
        document.querySelector('.theme-btn[data-theme="gold"]').classList.add('active');
    }
}

// 深色模式
function bindDarkModeToggle() {
    const toggle = document.getElementById('dark-mode-toggle');
    if (!toggle) return;
    toggle.addEventListener('change', (e) => {
        setDarkMode(e.target.checked);
        saveDarkMode(e.target.checked);
    });
    const saved = localStorage.getItem('dark_mode') === 'true';
    toggle.checked = saved;
    setDarkMode(saved);
}

function setDarkMode(enabled) {
    if (enabled) {
        document.body.classList.add('dark');
    } else {
        document.body.classList.remove('dark');
    }
}

function saveDarkMode(enabled) {
    localStorage.setItem('dark_mode', enabled);
}

// 字体大小
function bindFontSizeSlider() {
    const slider = document.getElementById('font-size-slider');
    const valueSpan = document.getElementById('font-size-value');
    if (!slider) return;
    slider.addEventListener('input', (e) => {
        const size = e.target.value;
        document.documentElement.style.setProperty('--font-size', size + 'px');
        valueSpan.textContent = size + 'px';
        localStorage.setItem('font_size', size);
    });
    const saved = localStorage.getItem('font_size');
    if (saved) {
        slider.value = saved;
        valueSpan.textContent = saved + 'px';
        document.documentElement.style.setProperty('--font-size', saved + 'px');
    }
}

function loadFontSize() {
    const saved = localStorage.getItem('font_size');
    if (saved) {
        document.documentElement.style.setProperty('--font-size', saved + 'px');
        const slider = document.getElementById('font-size-slider');
        const valueSpan = document.getElementById('font-size-value');
        if (slider) slider.value = saved;
        if (valueSpan) valueSpan.textContent = saved + 'px';
    }
}

// 气泡样式
function bindBubbleStyleButtons() {
    const btns = document.querySelectorAll('.bubble-style-btn');
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            const style = btn.dataset.style;
            setBubbleStyle(style);
            saveBubbleStyle(style);
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    loadBubbleStyle();
}

function setBubbleStyle(style) {
    document.documentElement.style.setProperty('--bubble-style', style);
    // 更新消息气泡样式类
    document.querySelectorAll('.message').forEach(msg => {
        msg.classList.remove('standard', 'rounded', 'rounded-large', 'square');
        msg.classList.add(style);
    });
}

function saveBubbleStyle(style) {
    localStorage.setItem('bubble_style', style);
}

function loadBubbleStyle() {
    const saved = localStorage.getItem('bubble_style');
    if (saved) {
        setBubbleStyle(saved);
        const btn = document.querySelector(`.bubble-style-btn[data-style="${saved}"]`);
        if (btn) btn.classList.add('active');
    } else {
        setBubbleStyle('standard');
        document.querySelector('.bubble-style-btn[data-style="standard"]').classList.add('active');
    }
}

// 聊天背景（复用之前背景选择逻辑，但作用于聊天视图）
function bindChatBackground() {
    const bgBtn = document.getElementById('chat-bg-btn');
    const resetBtn = document.getElementById('reset-chat-bg');
    if (bgBtn) bgBtn.onclick = openChatBackgroundPicker;
    if (resetBtn) resetBtn.onclick = resetChatBackground;
    loadChatBackground();
}

function openChatBackgroundPicker() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = e => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = ev => {
                const bg = ev.target.result;
                setChatBackground(bg);
                saveChatBackground(bg);
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
}

function setChatBackground(bgValue) {
    const chatView = document.getElementById('chat-view');
    const chatContainer = document.getElementById('chat-container');
    if (chatView) {
        chatView.style.backgroundImage = `url(${bgValue})`;
        chatView.style.backgroundSize = 'cover';
        chatView.style.backgroundPosition = 'center';
        chatView.classList.add('has-custom-bg');
    }
    if (chatContainer) chatContainer.style.background = 'transparent';
}

function resetChatBackground() {
    const chatView = document.getElementById('chat-view');
    const chatContainer = document.getElementById('chat-container');
    if (chatView) {
        chatView.style.backgroundImage = '';
        chatView.classList.remove('has-custom-bg');
    }
    if (chatContainer) chatContainer.style.background = '';
    localStorage.removeItem('chat_background');
}

function saveChatBackground(bg) {
    localStorage.setItem('chat_background', bg);
}

// ========== 图标外观自定义 ==========
function loadIconSettings() {
    const radius = localStorage.getItem('icon_radius') || '18';
    const opacity = localStorage.getItem('icon_opacity') || '100';
    const border = localStorage.getItem('icon_border') || '0';
    const borderColor = localStorage.getItem('icon_border_color') || '#c5a47e';
    document.documentElement.style.setProperty('--icon-radius', radius + 'px');
    document.documentElement.style.setProperty('--icon-opacity', opacity / 100);
    document.documentElement.style.setProperty('--icon-border-width', border + 'px');
    document.documentElement.style.setProperty('--icon-border-color', borderColor);
    // 同步滑块
    const rSlider = document.getElementById('icon-radius-slider');
    const oSlider = document.getElementById('icon-opacity-slider');
    const bSlider = document.getElementById('icon-border-slider');
    const cPicker = document.getElementById('icon-border-color');
    if (rSlider) rSlider.value = radius;
    if (oSlider) oSlider.value = opacity;
    if (bSlider) bSlider.value = border;
    if (cPicker) cPicker.value = borderColor;
    document.getElementById('icon-radius-value').textContent = radius + 'px';
    document.getElementById('icon-opacity-value').textContent = opacity + '%';
    document.getElementById('icon-border-value').textContent = border + 'px';
}

function bindIconSettings() {
    const rSlider = document.getElementById('icon-radius-slider');
    const oSlider = document.getElementById('icon-opacity-slider');
    const bSlider = document.getElementById('icon-border-slider');
    const cPicker = document.getElementById('icon-border-color');
    if (rSlider) rSlider.oninput = () => {
        document.documentElement.style.setProperty('--icon-radius', rSlider.value + 'px');
        document.getElementById('icon-radius-value').textContent = rSlider.value + 'px';
        localStorage.setItem('icon_radius', rSlider.value);
    };
    if (oSlider) oSlider.oninput = () => {
        document.documentElement.style.setProperty('--icon-opacity', oSlider.value / 100);
        document.getElementById('icon-opacity-value').textContent = oSlider.value + '%';
        localStorage.setItem('icon_opacity', oSlider.value);
    };
    if (bSlider) bSlider.oninput = () => {
        document.documentElement.style.setProperty('--icon-border-width', bSlider.value + 'px');
        document.getElementById('icon-border-value').textContent = bSlider.value + 'px';
        localStorage.setItem('icon_border', bSlider.value);
    };
    if (cPicker) cPicker.oninput = () => {
        document.documentElement.style.setProperty('--icon-border-color', cPicker.value);
        localStorage.setItem('icon_border_color', cPicker.value);
    };
}

// ========== 自定义图标图案 ==========
const CUSTOM_ICONS_KEY = 'custom_icons';
const APP_LIST = [
    { name: '聊天', icon: 'fa-comment-dots' },
    { name: '回复库', icon: 'fa-comment' },
    { name: '睡眠记录', icon: 'fa-moon' },
    { name: '碎碎念', icon: 'fa-comment' },
    { name: '信箱', icon: 'fa-envelope' },
    { name: '小团子', icon: 'fa-heart' },
    { name: '占卜', icon: 'fa-star-and-crescent' },
    { name: '抉择', icon: 'fa-balance-scale' },
    { name: '每日公告', icon: 'fa-newspaper' },
    { name: '心情日历', icon: 'fa-calendar-day' },
    { name: '场外援助', icon: 'fa-robot' },
    { name: '五子棋', icon: 'fa-chess-board' },
    { name: '翻牌记忆', icon: 'fa-clone' },
    { name: '报备', icon: 'fa-clipboard-list' },
    { name: '图画板', icon: 'fa-paint-brush' },
    { name: '重要日', icon: 'fa-heart' },
    { name: '聊天记录与统计', icon: 'fa-chart-bar' },
    { name: '设置', icon: 'fa-cog' }
];

function getCustomIcons() {
    const s = localStorage.getItem(CUSTOM_ICONS_KEY);
    return s ? JSON.parse(s) : {};
}

function saveCustomIcons(obj) {
    localStorage.setItem(CUSTOM_ICONS_KEY, JSON.stringify(obj));
}

function loadCustomIcons() {
    const select = document.getElementById('custom-icon-select');
    if (!select) return;
    const icons = getCustomIcons();
    select.innerHTML = APP_LIST.map(a => `<option value="${escapeHtml(a.name)}">${escapeHtml(a.name)}</option>`).join('');
    // 默认选中第一个有自定义图标的
    const firstCustom = APP_LIST.find(a => icons[a.name]);
    if (firstCustom) select.value = firstCustom.name;
    updateCustomIconPreview();
    renderCustomIconList();
}

function updateCustomIconPreview() {
    const select = document.getElementById('custom-icon-select');
    const preview = document.getElementById('custom-icon-preview-img');
    if (!select || !preview) return;
    const name = select.value;
    const icons = getCustomIcons();
    if (icons[name]) {
        preview.src = icons[name];
        preview.style.display = 'block';
    } else {
        preview.src = '';
        preview.style.display = 'none';
    }
}

function renderCustomIconList() {
    const container = document.getElementById('custom-icon-list');
    if (!container) return;
    const icons = getCustomIcons();
    const names = Object.keys(icons);
    if (!names.length) {
        container.innerHTML = '<span style="font-size:11px;color:var(--text-secondary);">暂无自定义图标</span>';
        return;
    }
    container.innerHTML = names.map(name => `
        <div style="display:flex;align-items:center;gap:4px;background:var(--secondary-bg);padding:4px 8px;border-radius:8px;font-size:11px;">
            <img src="${icons[name]}" style="width:20px;height:20px;object-fit:cover;border-radius:4px;">
            <span style="color:var(--text-primary);">${escapeHtml(name)}</span>
            <button class="custom-icon-reset-one" data-name="${escapeHtml(name)}" style="background:none;border:none;cursor:pointer;font-size:12px;padding:0 2px;" title="重置">×</button>
        </div>
    `).join('');
    // 绑定单个重置
    container.querySelectorAll('.custom-icon-reset-one').forEach(btn => {
        btn.onclick = () => {
            const icons = getCustomIcons();
            delete icons[btn.dataset.name];
            saveCustomIcons(icons);
            updateCustomIconPreview();
            renderCustomIconList();
            if (typeof generateHomeGrid === 'function') generateHomeGrid();
            showNotification(`"${btn.dataset.name}" 图标已重置`, 'info');
        };
    });
}

function bindCustomIconSettings() {
    const select = document.getElementById('custom-icon-select');
    if (select) {
        select.onchange = () => updateCustomIconPreview();
    }
    // 上传
    const uploadBtn = document.getElementById('custom-icon-upload');
    if (uploadBtn) {
        uploadBtn.onclick = () => {
            const name = select.value;
            const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
            input.onchange = e => {
                const f = e.target.files[0]; if (!f) return;
                if (f.size > 512 * 1024) { alert('图片不超过512KB'); return; }
                const reader = new FileReader();
                reader.onload = ev => {
                    const icons = getCustomIcons();
                    icons[name] = ev.target.result;
                    saveCustomIcons(icons);
                    updateCustomIconPreview();
                    renderCustomIconList();
                    if (typeof generateHomeGrid === 'function') generateHomeGrid();
                    showNotification(`"${name}" 图标已更新`, 'success');
                };
                reader.readAsDataURL(f);
            };
            input.click();
        };
    }
    // 重置当前
    const resetBtn = document.getElementById('custom-icon-reset');
    if (resetBtn) {
        resetBtn.onclick = () => {
            const name = select.value;
            const icons = getCustomIcons();
            if (!icons[name]) { showNotification('该图标未自定义', 'info'); return; }
            delete icons[name];
            saveCustomIcons(icons);
            updateCustomIconPreview();
            renderCustomIconList();
            if (typeof generateHomeGrid === 'function') generateHomeGrid();
            showNotification(`"${name}" 图标已重置`, 'info');
        };
    }
    // 全部重置
    const resetAllBtn = document.getElementById('custom-icon-reset-all');
    if (resetAllBtn) {
        resetAllBtn.onclick = () => {
            if (!confirm('确定要重置所有自定义图标吗？')) return;
            localStorage.removeItem(CUSTOM_ICONS_KEY);
            updateCustomIconPreview();
            renderCustomIconList();
            if (typeof generateHomeGrid === 'function') generateHomeGrid();
            showNotification('所有自定义图标已重置', 'info');
        };
    }
}

// ========== 素材库管理 ==========
const MATERIALS_KEY = 'custom_materials';
function getMaterials() {
    const s = localStorage.getItem(MATERIALS_KEY);
    return s ? JSON.parse(s) : [];
}
function saveMaterials(arr) { localStorage.setItem(MATERIALS_KEY, JSON.stringify(arr)); }

function renderMaterialGallery() {
    const gallery = document.getElementById('material-gallery');
    if (!gallery) return;
    const mats = getMaterials();
    if (!mats.length) { gallery.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text-secondary);font-size:12px;padding:12px;">暂无素材，上传图片吧</div>'; return; }
    gallery.innerHTML = mats.map((m, i) => `
        <div class="material-card">
            <img src="${m.dataUrl}" alt="${escapeHtml(m.name)}">
            <div class="material-card-actions">
                <button class="mat-set-chat-bg" data-idx="${i}">聊天背景</button>
                <button class="mat-set-home-bg" data-idx="${i}">主视图背景</button>
                <button class="mat-delete" data-idx="${i}">🗑️</button>
            </div>
        </div>
    `).join('');
    gallery.querySelectorAll('.mat-set-chat-bg').forEach(b => b.onclick = () => {
        setChatBackground(mats[parseInt(b.dataset.idx)].dataUrl);
        saveChatBackground(mats[parseInt(b.dataset.idx)].dataUrl);
        showNotification('已设为聊天背景', 'success');
    });
    gallery.querySelectorAll('.mat-set-home-bg').forEach(b => b.onclick = () => {
        const bg = mats[parseInt(b.dataset.idx)].dataUrl;
        localStorage.setItem('home_custom_bg', bg);
        const homeView = document.getElementById('home-view');
        if (homeView) { homeView.style.backgroundImage = `url(${bg})`; homeView.style.backgroundSize = 'cover'; homeView.style.backgroundPosition = 'center'; }
        showNotification('已设为主视图背景', 'success');
    });
    gallery.querySelectorAll('.mat-delete').forEach(b => b.onclick = () => {
        const idx = parseInt(b.dataset.idx);
        if (confirm('删除这个素材？')) { mats.splice(idx, 1); saveMaterials(mats); renderMaterialGallery(); }
    });
}

function bindMaterialUpload() {
    const btn = document.getElementById('material-upload-btn');
    if (!btn) return;
    btn.onclick = () => {
        const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; input.multiple = true;
        input.onchange = async () => {
            const mats = getMaterials();
            for (const file of input.files) {
                if (file.size > 3 * 1024 * 1024) { alert(file.name + ' 超过3MB'); continue; }
                const dataUrl = await new Promise(r => { const reader = new FileReader(); reader.onload = e => r(e.target.result); reader.readAsDataURL(file); });
                mats.push({ name: file.name.replace(/\.[^.]+$/, ''), dataUrl });
            }
            saveMaterials(mats); renderMaterialGallery(); showNotification('素材已添加', 'success');
        };
        input.click();
    };
}

// ========== 主视图背景（外观页） ==========
// ========== 图标框 & 头像框 ==========
function applyIconFrame(dataUrl) {
    document.documentElement.style.setProperty('--icon-frame-image', dataUrl ? `url(${dataUrl})` : 'none');
    document.documentElement.style.setProperty('--icon-frame-display', dataUrl ? 'block' : 'none');
}

function applyAvatarFrame(myDataUrl, partnerDataUrl) {
    // 我的头像框 — CSS变量设在元素上，::after 读取
    const myAvatar = document.getElementById('home-avatar-my');
    if (myAvatar) {
        myAvatar.style.setProperty('--avatar-frame-image', myDataUrl ? `url(${myDataUrl})` : 'none');
        myAvatar.style.setProperty('--avatar-frame-display', myDataUrl ? 'block' : 'none');
    }
    // 对方头像框
    const partnerAvatar = document.getElementById('home-avatar-partner');
    if (partnerAvatar) {
        partnerAvatar.style.setProperty('--avatar-frame-image', partnerDataUrl ? `url(${partnerDataUrl})` : 'none');
        partnerAvatar.style.setProperty('--avatar-frame-display', partnerDataUrl ? 'block' : 'none');
    }
}

function bindFrameSettings() {
    // 图标框
    document.getElementById('icon-frame-upload').onclick = () => uploadFrame('icon_frame', (url) => {
        applyIconFrame(url);
        document.getElementById('icon-frame-preview-img').style.display = url ? 'block' : 'none';
        if (url) document.getElementById('icon-frame-preview-img').src = url;
        showNotification('图标框已更新', 'success');
    });
    document.getElementById('icon-frame-reset').onclick = () => {
        localStorage.removeItem('icon_frame');
        applyIconFrame(null);
        document.getElementById('icon-frame-preview-img').style.display = 'none';
        showNotification('图标框已重置', 'info');
    };

    // 我的头像框
    document.getElementById('avatar-frame-my-upload').onclick = () => uploadFrame('avatar_frame_my', (url) => {
        applyAvatarFrame(url, localStorage.getItem('avatar_frame_partner'));
        showNotification('头像框已更新', 'success');
    });
    document.getElementById('avatar-frame-my-reset').onclick = () => {
        localStorage.removeItem('avatar_frame_my');
        applyAvatarFrame(null, localStorage.getItem('avatar_frame_partner'));
        showNotification('头像框已重置', 'info');
    };

    // 对方头像框
    document.getElementById('avatar-frame-partner-upload').onclick = () => uploadFrame('avatar_frame_partner', (url) => {
        applyAvatarFrame(localStorage.getItem('avatar_frame_my'), url);
        showNotification('头像框已更新', 'success');
    });
    document.getElementById('avatar-frame-partner-reset').onclick = () => {
        localStorage.removeItem('avatar_frame_partner');
        applyAvatarFrame(localStorage.getItem('avatar_frame_my'), null);
        showNotification('头像框已重置', 'info');
    };

    // 加载已保存的
    loadFrames();
}

function uploadFrame(key, callback) {
    const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
    input.onchange = e => {
        const f = e.target.files[0]; if (!f) return;
        if (f.size > 1 * 1024 * 1024) { alert('图片不超过1MB'); return; }
        const reader = new FileReader();
        reader.onload = ev => {
            localStorage.setItem(key, ev.target.result);
            callback(ev.target.result);
        };
        reader.readAsDataURL(f);
    };
    input.click();
}

function loadFrames() {
    const iconFrame = localStorage.getItem('icon_frame');
    const myFrame = localStorage.getItem('avatar_frame_my');
    const partnerFrame = localStorage.getItem('avatar_frame_partner');
    if (iconFrame) {
        applyIconFrame(iconFrame);
        const preview = document.getElementById('icon-frame-preview-img');
        if (preview) { preview.src = iconFrame; preview.style.display = 'block'; }
    }
    if (myFrame || partnerFrame) applyAvatarFrame(myFrame, partnerFrame);
}

// ========== 唱片装饰 ==========
const RECORD_PRESETS = {
    classic: 'radial-gradient(circle at 50% 50%, #333 12%, #111 22%, #444 23%, #1a1a1a 26%, #c5a47e 27%, #a07850 62%, #111 63%)',
    rose:   'radial-gradient(circle at 50% 50%, #333 12%, #111 22%, #444 23%, #1a1a1a 26%, #e8b4b8 27%, #d4858b 62%, #111 63%)',
    blue:   'radial-gradient(circle at 50% 50%, #333 12%, #111 22%, #444 23%, #1a1a1a 26%, #7fa6cd 27%, #4a80b0 62%, #111 63%)',
    pink:   'radial-gradient(circle at 50% 50%, #333 12%, #111 22%, #444 23%, #1a1a1a 26%, #f4a6b3 27%, #e87888 62%, #111 63%)',
    green:  'radial-gradient(circle at 50% 50%, #333 12%, #111 22%, #444 23%, #1a1a1a 26%, #7bc8a4 27%, #4ea878 62%, #111 63%)',
};

function getRecordStyle() {
    const custom = localStorage.getItem('record_custom');
    if (custom) return { type: 'custom', value: `url(${custom})` };
    const preset = localStorage.getItem('record_preset') || 'classic';
    return { type: 'preset', value: RECORD_PRESETS[preset] || RECORD_PRESETS.classic };
}

function applyRecordToPlayer() {
    const recordEl = document.getElementById('home-record');
    if (!recordEl) return;
    const style = getRecordStyle();
    if (style.type === 'custom') {
        recordEl.style.background = style.value;
    } else {
        recordEl.style.background = style.value;
    }
    recordEl.style.backgroundSize = 'cover';
    recordEl.style.backgroundPosition = 'center';
    recordEl.classList.add('visible');
}

function syncRecordSpin() {
    const recordEl = document.getElementById('home-record');
    if (!recordEl) return;
    // 通过播放按钮图标判断播放状态
    const playBtn = document.getElementById('home-play-pause');
    const icon = playBtn?.querySelector('i');
    const isPlaying = icon?.classList.contains('fa-pause');
    if (isPlaying) {
        recordEl.classList.add('spinning');
    } else {
        recordEl.classList.remove('spinning');
    }
}

function bindRecordSettings() {
    // 预设选择
    document.querySelectorAll('.record-preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.record-preset-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            localStorage.setItem('record_preset', btn.dataset.record);
            localStorage.removeItem('record_custom'); // 清除自定义
            applyRecordToPlayer();
        });
    });

    // 自定义上传
    document.getElementById('record-custom-upload').onclick = () => {
        const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
        input.onchange = e => {
            const f = e.target.files[0]; if (!f) return;
            if (f.size > 512 * 1024) { alert('图片不超过512KB'); return; }
            const reader = new FileReader();
            reader.onload = ev => {
                localStorage.setItem('record_custom', ev.target.result);
                localStorage.removeItem('record_preset');
                document.querySelectorAll('.record-preset-btn').forEach(b => b.classList.remove('active'));
                applyRecordToPlayer();
                showNotification('唱片已更新', 'success');
            };
            reader.readAsDataURL(f);
        };
        input.click();
    };
    document.getElementById('record-custom-reset').onclick = () => {
        localStorage.removeItem('record_custom');
        localStorage.setItem('record_preset', 'classic');
        document.querySelectorAll('.record-preset-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.record-preset-btn[data-record="classic"]')?.classList.add('active');
        applyRecordToPlayer();
        showNotification('已恢复预设唱片', 'info');
    };

    applyRecordToPlayer();
    // 定期同步旋转状态
    setInterval(syncRecordSpin, 500);
    // 监听播放按钮
    document.getElementById('home-play-pause')?.addEventListener('click', () => setTimeout(syncRecordSpin, 100));
    document.getElementById('home-next')?.addEventListener('click', () => setTimeout(syncRecordSpin, 100));
}

// ========== 主视图背景（合并自 custom-settings） ==========
const HOME_BG_KEY = 'home_custom_bg';

function bindHomeBgUpload() {
    const bgBtn = document.getElementById('home-bg-btn');
    const resetBtn = document.getElementById('reset-home-bg-btn');
    if (bgBtn) {
        bgBtn.onclick = () => {
            const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
            input.onchange = e => {
                const file = e.target.files[0]; if (!file) return;
                if (file.size > 2 * 1024 * 1024) { alert('图片不能超过 2MB'); return; }
                const reader = new FileReader();
                reader.onload = ev => {
                    const data = ev.target.result;
                    localStorage.setItem(HOME_BG_KEY, data);
                    applyHomeBackground(data);
                    updateHomeBgPreview(data);
                    showNotification('主视图背景已更新', 'success');
                };
                reader.readAsDataURL(file);
            };
            input.click();
        };
    }
    if (resetBtn) {
        resetBtn.onclick = () => {
            localStorage.removeItem(HOME_BG_KEY);
            applyHomeBackground('');
            updateHomeBgPreview(null);
            showNotification('已恢复默认主视图背景', 'success');
        };
    }
}

function loadHomeBgPreview() {
    const saved = localStorage.getItem(HOME_BG_KEY);
    updateHomeBgPreview(saved);
}

function updateHomeBgPreview(data) {
    const img = document.getElementById('home-bg-preview-img');
    const placeholder = document.getElementById('home-bg-placeholder');
    if (img && placeholder) {
        if (data) { img.src = data; img.style.display = 'block'; placeholder.style.display = 'none'; }
        else { img.style.display = 'none'; placeholder.style.display = 'flex'; }
    }
}

function applyHomeBackground(bgValue) {
    const homeView = document.getElementById('home-view');
    if (!homeView) return;
    if (bgValue && bgValue.trim()) {
        homeView.style.backgroundImage = `url(${bgValue})`;
        homeView.style.backgroundSize = 'cover';
        homeView.style.backgroundPosition = 'center';
        homeView.style.backgroundColor = 'transparent';
    } else {
        homeView.style.backgroundImage = '';
        homeView.style.backgroundColor = 'var(--primary-bg)';
    }
}

// ========== 启动画面（合并自 custom-settings） ==========
function bindSplashUpload() {
    const uploadBtn = document.getElementById('upload-splash-btn');
    const resetBtn = document.getElementById('reset-splash-btn');
    if (uploadBtn) {
        uploadBtn.onclick = () => {
            const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
            input.onchange = e => {
                const file = e.target.files[0]; if (!file) return;
                if (file.size > 2 * 1024 * 1024) { alert('图片不能超过 2MB'); return; }
                const reader = new FileReader();
                reader.onload = ev => {
                    localStorage.setItem('splash_image', ev.target.result);
                    updateSplashPreview(ev.target.result);
                    showNotification('启动画面已更新，下次启动时生效', 'success');
                };
                reader.readAsDataURL(file);
            };
            input.click();
        };
    }
    if (resetBtn) {
        resetBtn.onclick = () => {
            localStorage.removeItem('splash_image');
            updateSplashPreview(null);
            showNotification('已恢复默认启动画面', 'success');
        };
    }
}

function loadSplashPreview() {
    updateSplashPreview(localStorage.getItem('splash_image'));
}

function updateSplashPreview(data) {
    const img = document.getElementById('splash-preview-img');
    const placeholder = document.getElementById('splash-preview-placeholder');
    if (img && placeholder) {
        if (data) { img.src = data; img.style.display = 'block'; placeholder.style.display = 'none'; }
        else { img.style.display = 'none'; placeholder.style.display = 'flex'; }
    }
}

// 启动画面显示（app.js 启动时调用）
function applySplashImage() {
    const splashImg = localStorage.getItem('splash_image');
    const splashDiv = document.getElementById('splash');
    if (splashDiv && splashImg) {
        splashDiv.style.backgroundImage = `url(${splashImg})`;
        splashDiv.style.backgroundSize = 'cover';
        splashDiv.style.backgroundPosition = 'center';
        splashDiv.style.backgroundColor = 'transparent';
    } else if (splashDiv) {
        splashDiv.style.backgroundImage = '';
        splashDiv.style.backgroundColor = '#06060e';
    }
}

// ========== 装饰文字（合并自 custom-settings） ==========
const DECO_TEXT_KEY = 'home_deco_text';

function loadDecoText() {
    const saved = localStorage.getItem(DECO_TEXT_KEY);
    const input = document.getElementById('deco-text-input');
    if (input) input.value = saved || '';
    const decoEl = document.getElementById('home-decoration-text');
    if (decoEl) decoEl.innerText = saved || '✨ 你是我最重要的决定 ✨';
}

function saveDecoText() {
    const input = document.getElementById('deco-text-input');
    if (!input) return;
    const newText = input.value.trim();
    if (newText) {
        localStorage.setItem(DECO_TEXT_KEY, newText);
        const decoEl = document.getElementById('home-decoration-text');
        if (decoEl) decoEl.innerText = newText;
        showNotification('装饰文字已更新', 'success');
    } else {
        alert('文字不能为空');
    }
}

function loadChatBackground() {
    const saved = localStorage.getItem('chat_background');
    if (saved) setChatBackground(saved);
}