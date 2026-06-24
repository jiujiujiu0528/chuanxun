// ========== 音效与提醒模块 ==========
function initSoundSettings() {
    loadSoundSettings();
    bindSoundEvents();
    bindNotificationToggle();
}

// 默认音效配置（预设URL）
const SOUND_PRESETS = {
    default: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // 临时演示，实际应替换为短提示音
    soft: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    low: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    kakaotalk: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8f8c1c8.mp3', // 示例
    none: ''
};

function loadSoundSettings() {
    // 全局音效开关和音量
    const soundEnabled = localStorage.getItem('sound_enabled') !== 'false';
    const volume = parseInt(localStorage.getItem('sound_volume') || '70');
    document.getElementById('sound-enabled-toggle').checked = soundEnabled;
    const volSlider = document.getElementById('sound-volume-slider');
    if (volSlider) volSlider.value = volume;
    document.getElementById('sound-volume-value').innerText = volume + '%';
    
    // 加载每个场景的预设和自定义URL
    const scenes = ['my_send', 'partner_message', 'my_poke', 'partner_poke'];
    scenes.forEach(scene => {
        const preset = localStorage.getItem(`sound_preset_${scene}`) || 'default';
        const customUrl = localStorage.getItem(`sound_custom_${scene}`) || '';
        const select = document.querySelector(`.sound-preset[data-scene="${scene}"]`);
        const urlInput = document.querySelector(`.sound-url[data-scene="${scene}"]`);
        if (select) select.value = preset;
        if (urlInput) {
            urlInput.value = customUrl;
            urlInput.style.display = preset === 'custom' ? 'block' : 'none';
        }
    });
}

function bindSoundEvents() {
    // 全局音效开关
    const soundToggle = document.getElementById('sound-enabled-toggle');
    if (soundToggle) {
        soundToggle.addEventListener('change', (e) => {
            localStorage.setItem('sound_enabled', e.target.checked);
        });
    }
    // 音量滑块
    const volSlider = document.getElementById('sound-volume-slider');
    if (volSlider) {
        volSlider.addEventListener('input', (e) => {
            const val = e.target.value;
            localStorage.setItem('sound_volume', val);
            document.getElementById('sound-volume-value').innerText = val + '%';
        });
    }
    // 每个场景的预设切换和自定义URL显示
    const selects = document.querySelectorAll('.sound-preset');
    selects.forEach(select => {
        select.addEventListener('change', (e) => {
            const scene = select.dataset.scene;
            const preset = select.value;
            const urlInput = document.querySelector(`.sound-url[data-scene="${scene}"]`);
            if (urlInput) urlInput.style.display = preset === 'custom' ? 'block' : 'none';
            localStorage.setItem(`sound_preset_${scene}`, preset);
            // 注意：自定义URL的值需要独立保存，当preset为custom时，使用urlInput的值
            if (preset !== 'custom') {
                // 清除该场景的自定义URL
                localStorage.removeItem(`sound_custom_${scene}`);
            }
        });
    });
    // 自定义URL输入框
    const urlInputs = document.querySelectorAll('.sound-url');
    urlInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            const scene = input.dataset.scene;
            const url = input.value.trim();
            localStorage.setItem(`sound_custom_${scene}`, url);
        });
    });
    // 试听按钮
    const testBtns = document.querySelectorAll('.test-sound');
    testBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const scene = btn.dataset.scene;
            const soundEnabled = localStorage.getItem('sound_enabled') !== 'false';
            if (!soundEnabled) {
                alert('音效已关闭，请先开启');
                return;
            }
            playSoundForScene(scene);
        });
    });
}

// 根据场景播放音效（供外部调用）
function playSoundForScene(scene) {
    const soundEnabled = localStorage.getItem('sound_enabled') !== 'false';
    if (!soundEnabled) return;
    const preset = localStorage.getItem(`sound_preset_${scene}`) || 'default';
    let url = '';
    if (preset === 'custom') {
        url = localStorage.getItem(`sound_custom_${scene}`) || '';
    } else {
        url = SOUND_PRESETS[preset] || SOUND_PRESETS.default;
    }
    if (!url) return;
    const volume = parseInt(localStorage.getItem('sound_volume') || '70') / 100;
    const audio = new Audio(url);
    audio.volume = Math.min(1, Math.max(0, volume));
    audio.play().catch(e => console.log('音效播放失败', e));
}

// 系统通知
function bindNotificationToggle() {
    const toggle = document.getElementById('notif-enabled-toggle');
    const statusDiv = document.getElementById('notif-status');
    if (!toggle) return;
    // 检查浏览器支持
    if (!('Notification' in window)) {
        statusDiv.innerText = '您的浏览器不支持通知';
        toggle.disabled = true;
        return;
    }
    const enabled = localStorage.getItem('notif_enabled') === 'true';
    toggle.checked = enabled;
    if (Notification.permission === 'granted') {
        statusDiv.innerText = '通知已开启，将收到新消息提醒';
        toggle.checked = true;
        localStorage.setItem('notif_enabled', 'true');
    } else if (Notification.permission === 'denied') {
        statusDiv.innerText = '通知权限被拒绝，请自行在浏览器设置中开启';
        toggle.checked = false;
        localStorage.setItem('notif_enabled', 'false');
    } else {
        statusDiv.innerText = '点击开关请求通知权限';
        toggle.checked = false;
    }
    toggle.addEventListener('change', async () => {
        if (toggle.checked) {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                statusDiv.innerText = '通知已开启，将收到新消息提醒';
                localStorage.setItem('notif_enabled', 'true');
            } else {
                statusDiv.innerText = '通知权限被拒绝';
                toggle.checked = false;
                localStorage.setItem('notif_enabled', 'false');
            }
        } else {
            localStorage.setItem('notif_enabled', 'false');
            statusDiv.innerText = '通知已关闭';
        }
    });
}

// 发送通知（供chat.js调用）
function sendNotification(title, body) {
    const notifEnabled = localStorage.getItem('notif_enabled') === 'true';
    if (!notifEnabled) return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    // 只在页面隐藏时通知
    if (!document.hidden) return;
    new Notification(title || '新消息', {
        body: body || '您收到了一条新消息',
        icon: '/favicon.ico', // 可替换为应用图标
        tag: 'chat-message'
    });
}