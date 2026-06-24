// ========== 抉择助手模块 ==========
let currentMode = 'coin';   // 'coin' 或 'draw'

// 预设抽签库
const PRESET_DRAWS = {
    love: [
        "❤️ 主动表达心意", "💔 暂时保持距离", "🌸 顺其自然发展",
        "💌 写封信给TA", "🌙 今晚适合谈心", "✨ 缘分正在靠近"
    ],
    work: [
        "📈 抓住机会", "📊 再观察一阵", "🤝 寻求合作", "💡 换个思路",
        "⏳ 耐心等待", "🚀 果断行动"
    ],
    luck: [
        "🍀 万事顺遂", "🌟 今日小幸运", "💎 贵人相助", "🌊 困难将过去",
        "🎉 意外惊喜", "☀️ 阳光总在风雨后"
    ]
};

function initDecisionModule() {
    bindDecisionEvents();
    loadDefaultDrawOptions();
}

function bindDecisionEvents() {
    // 选项卡切换
    const tabs = document.querySelectorAll('.decision-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const mode = tab.dataset.mode;
            if (!mode) return;
            currentMode = mode;
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById('coin-mode').style.display = mode === 'coin' ? 'block' : 'none';
            document.getElementById('draw-mode').style.display = mode === 'draw' ? 'block' : 'none';
        });
    });

    // 抛硬币按钮
    const coinBtn = document.getElementById('coin-decision-btn');
    if (coinBtn) coinBtn.addEventListener('click', tossCoin);

    // 抽签按钮
    const drawBtn = document.getElementById('draw-decision-btn');
    if (drawBtn) drawBtn.addEventListener('click', drawLot);

    // 预设按钮
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const preset = btn.dataset.preset;
            if (preset && PRESET_DRAWS[preset]) {
                const optionsText = PRESET_DRAWS[preset].join('\n');
                const textarea = document.getElementById('draw-options');
                if (textarea) textarea.value = optionsText;
                showNotification(`已加载「${btn.innerText}」预设`, 'success');
            }
        });
    });
}

function loadDefaultDrawOptions() {
    const textarea = document.getElementById('draw-options');
    if (textarea && !textarea.value.trim()) {
        // 默认一组有趣的选项
        textarea.value = "顺其自然\n主动出击\n再等等看\n询问他人\n相信自己\n换个方向";
    }
}

function tossCoin() {
    const question = document.getElementById('coin-question').value.trim();
    if (!question) {
        showNotification('请先输入你的问题', 'warning');
        return;
    }
    // 模拟抛硬币动画
    const resultDiv = document.getElementById('coin-result');
    const iconSpan = resultDiv.querySelector('.result-icon');
    const textSpan = resultDiv.querySelector('.result-text');
    iconSpan.innerHTML = '<i class="fas fa-spinner fa-pulse"></i>';
    textSpan.innerHTML = '抛掷中...';
    
    setTimeout(() => {
        const isYes = Math.random() < 0.5;
        const answer = isYes ? '是' : '否';
        const emoji = isYes ? '✅' : '❌';
        iconSpan.innerHTML = emoji;
        textSpan.innerHTML = `答案：${answer}`;
        // 可选：添加一点振动或音效
        if (typeof playSoundForScene === 'function') playSoundForScene('coin_toss');
    }, 300);
}

function drawLot() {
    const optionsText = document.getElementById('draw-options').value.trim();
    if (!optionsText) {
        showNotification('请先填写抽签选项（每行一个）', 'warning');
        return;
    }
    // 按行分割，过滤空行和只含空白的行
    let options = optionsText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (options.length === 0) {
        showNotification('至少需要一个有效选项', 'warning');
        return;
    }
    // 随机选择一个
    const randomIndex = Math.floor(Math.random() * options.length);
    const selected = options[randomIndex].trim();
    
    const resultDiv = document.getElementById('draw-result');
    const iconSpan = resultDiv.querySelector('.result-icon');
    const textSpan = resultDiv.querySelector('.result-text');
    iconSpan.innerHTML = '<i class="fas fa-dice-d6"></i>';
    textSpan.innerHTML = `抽中：${selected}`;
    // 动画效果：短暂闪烁
    resultDiv.classList.add('result-flash');
    setTimeout(() => resultDiv.classList.remove('result-flash'), 500);
}

// 导出初始化函数
window.initDecisionModule = initDecisionModule;