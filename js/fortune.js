// ========== 占卜模块（雷诺曼 + 塔罗）==========
// 雷诺曼牌库（36张）
const LENORMAND_DECK = [
    { id: 1, name: '骑士', icon: '🐴', keyword: '消息、动态、快速到达、活动' },
    { id: 2, name: '幸运草', icon: '🍀', keyword: '幸运、意外之喜、小小机会' },
    { id: 3, name: '船', icon: '⛵', keyword: '旅行、远距离、出发、冒险' },
    { id: 4, name: '房子', icon: '🏠', keyword: '家庭、安定、私人空间' },
    { id: 5, name: '树', icon: '🌳', keyword: '健康、成长、根基、家族' },
    { id: 6, name: '云', icon: '☁️', keyword: '困惑、不确定、迷雾待清' },
    { id: 7, name: '蛇', icon: '🐍', keyword: '欺骗、诱惑、曲折路径' },
    { id: 8, name: '棺材', icon: '⚰️', keyword: '结束、完结、彻底转变' },
    { id: 9, name: '花束', icon: '💐', keyword: '礼物、愉悦、社交赞美' },
    { id: 10, name: '镰刀', icon: '🔪', keyword: '快速切割、果断决定、警告' },
    { id: 11, name: '鞭子', icon: '🪢', keyword: '争执、重复、纠缠' },
    { id: 12, name: '鸟', icon: '🐦', keyword: '交谈、焦虑、社交' },
    { id: 13, name: '小孩', icon: '👶', keyword: '新开始、纯真、较小' },
    { id: 14, name: '狐狸', icon: '🦊', keyword: '狡猾、机智、自我保护' },
    { id: 15, name: '熊', icon: '🐻', keyword: '力量、掌控、权威人物' },
    { id: 16, name: '星星', icon: '⭐', keyword: '希望、灵感、指引' },
    { id: 17, name: '鹳', icon: '🦩', keyword: '变化、升级、怀孕' },
    { id: 18, name: '狗', icon: '🐕', keyword: '忠诚、朋友、支持' },
    { id: 19, name: '塔', icon: '🗼', keyword: '孤立、权威、孤独' },
    { id: 20, name: '花园', icon: '🌺', keyword: '聚会、社交圈、公开场合' },
    { id: 21, name: '山', icon: '⛰️', keyword: '阻碍、挑战、延迟' },
    { id: 22, name: '路', icon: '🛤️', keyword: '选择、分岔路口、机会' },
    { id: 23, name: '老鼠', icon: '🐭', keyword: '消耗、担忧、损失' },
    { id: 24, name: '心', icon: '❤️', keyword: '爱、情感、浪漫' },
    { id: 25, name: '戒指', icon: '💍', keyword: '承诺、契约、循环' },
    { id: 26, name: '书', icon: '📖', keyword: '秘密、学习、知识' },
    { id: 27, name: '信', icon: '✉️', keyword: '消息、文书、邮件' },
    { id: 28, name: '男人', icon: '👨', keyword: '男性、阳性能量' },
    { id: 29, name: '女人', icon: '👩', keyword: '女性、阴性能量' },
    { id: 30, name: '百合', icon: '🪷', keyword: '成熟、平静、智慧' },
    { id: 31, name: '太阳', icon: '☀️', keyword: '成功、快乐、积极' },
    { id: 32, name: '月亮', icon: '🌙', keyword: '直觉、声誉、潜意识' },
    { id: 33, name: '钥匙', icon: '🔑', keyword: '解决、钥匙、关键' },
    { id: 34, name: '鱼', icon: '🐟', keyword: '财富、流通、灵活性' },
    { id: 35, name: '锚', icon: '⚓', keyword: '稳定、安全、计划' },
    { id: 36, name: '十字架', icon: '✝️', keyword: '负担、考验、宿命' }
];

// 塔罗大阿卡纳（22张）
const TAROT_MAJOR = [
    { id: 0, name: '愚者', meaning: '冒险、无知、新的起点，你将迎接新的旅程和机会。' },
    { id: 1, name: '魔术师', meaning: '创造力、能力、自信，你有实现目标的能力。' },
    { id: 2, name: '女祭司', meaning: '直觉、隐秘、知识、深藏，要倾听内心的声音。' },
    { id: 3, name: '女皇', meaning: '丰饶、母性、温柔，你将收获爱与滋养。' },
    { id: 4, name: '皇帝', meaning: '权力、稳定、领导力，你需要掌握自己的局面。' },
    { id: 5, name: '教皇', meaning: '传统、道德、信仰，寻找内心和谐与宽容。' },
    { id: 6, name: '恋人', meaning: '爱、选择、关系，你面临人际关系的决策。' },
    { id: 7, name: '战车', meaning: '胜利、决心、掌控，你将迎来成功和进展。' },
    { id: 8, name: '力量', meaning: '力量、勇气、耐心，需要内心平静与坚定。' },
    { id: 9, name: '隐士', meaning: '寻求内省、独处、智慧，通过独自思考来找到答案。' },
    { id: 10, name: '命运之轮', meaning: '时运、循环、转变，你将经历命运的起伏。' },
    { id: 11, name: '正义', meaning: '公正、平衡、决策，勇于面对真相并做出明智的判断。' },
    { id: 12, name: '吊人', meaning: '牺牲、放弃、观察，你需要牺牲某些东西以换取更好的结果。' },
    { id: 13, name: '死神', meaning: '结束、变革、重生，某种模式将被摒弃得以让新的开始。' },
    { id: 14, name: '节制', meaning: '平衡、和谐、调整，和解与平衡是关键。' },
    { id: 15, name: '魔鬼', meaning: '诱惑、束缚、欲望，警惕自己是否被负面情绪和欲望所控制。' },
    { id: 16, name: '塔', meaning: '崩塌、灾难、突变，某种情况正在崩溃并需要重新建立。' },
    { id: 17, name: '星星', meaning: '希望、灵感、信心，你将找到前进的方向。' },
    { id: 18, name: '月亮', meaning: '幻觉、情绪、直觉，要找到真相需要深入探索。' },
    { id: 19, name: '太阳', meaning: '快乐、成功、成长，希望与阳光即将到来。' },
    { id: 20, name: '审判', meaning: '审判、觉醒、重生，你将面对决策和审视过去。' },
    { id: 21, name: '世界', meaning: '完成、整体、境界，你将达成目标并得到满足。' }
];

// 小阿卡纳牌组
const TAROT_SUITS = [
    { name: '权杖', element: '火', meaning: '行动、创造、热情、事业' },
    { name: '圣杯', element: '水', meaning: '情感、关系、直觉、爱情' },
    { name: '宝剑', element: '风', meaning: '思想、冲突、理智、沟通' },
    { name: '星币', element: '土', meaning: '物质、财富、工作、现实' }
];

// 生成小阿卡纳
function generateMinorArcana() {
    const minorCards = [];
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const courts = ['侍从', '骑士', '王后', '国王'];
    TAROT_SUITS.forEach(suit => {
        numbers.forEach(num => {
            minorCards.push({
                id: `${suit.name}${num}`,
                name: `${suit.name} ${num}`,
                suit: suit.name,
                meaning: `${suit.name}数字${num} — ${suit.meaning}的具体展现`
            });
        });
        courts.forEach(court => {
            minorCards.push({
                id: `${suit.name}${court}`,
                name: `${suit.name} ${court}`,
                suit: suit.name,
                meaning: `${court}代表 ${suit.meaning}方面的人物或特质`
            });
        });
    });
    return minorCards;
}

const TAROT_MINOR = generateMinorArcana();
const TAROT_DECK = [...TAROT_MAJOR, ...TAROT_MINOR];

// 占卜状态
let fortuneState = {
    type: null,        // 'lenormand' 或 'tarot'
    question: '',
    cardCount: 3,      // 默认3张
    drawnCards: [],
    isDrawing: false
};

// DOM 元素变量
let lenormandOption, tarotOption, fortuneNextBtn;
let fortuneQuestionInput, fortuneCardCountSelect, fortuneQuizStartBtn, fortuneQuizCancelBtn, fortuneQuizBackBtn;
let fortuneResultContainer, fortuneAiAssistBtn, fortuneResultBackBtn, fortuneResultNewBtn;

// ========== 初始化入口 ==========
// AI辅助解牌（一次性，无对话记忆）
async function triggerFortuneAI() {
    if (!fortuneState.drawnCards || fortuneState.drawnCards.length === 0) {
        showNotification('请先完成占卜抽牌', 'warning');
        return;
    }
    const settings = getAISettings();
    if (!settings.apiKey) {
        showNotification('请先在设置→场外援助中配置API Key', 'warning');
        return;
    }
    // 构建牌面信息
    const typeName = fortuneState.type === 'lenormand' ? '雷诺曼 Lenormand' : '塔罗 Tarot';
    let cardsInfo = fortuneState.drawnCards.map((c, i) => {
        const orient = c.isReversed ? '（逆位）' : '（正位）';
        const info = c.keyword || c.meaning || '';
        return `第${i + 1}张：${c.name} ${orient} — ${info}`;
    }).join('\n');
    const question = fortuneState.question || '未指定问题';
    const prompt = `请解读以下${typeName}占卜结果：\n\n问题：${question}\n\n抽到的牌：\n${cardsInfo}\n\n请给出综合解读。`;

    // 显示加载状态
    const btn = document.getElementById('fortune-ai-assist');
    const origText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 解读中...';
    btn.disabled = true;

    try {
        const resp = await fetch(settings.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.apiKey}`
            },
            body: JSON.stringify({
                model: settings.model || 'deepseek-chat',
                messages: [
                    { role: 'system', content: settings.fortunePrompt || '你是一位专业的占卜解读师，请用中文回复。' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.8,
                max_tokens: settings.maxTokens || 2000
            })
        });

        if (!resp.ok) {
            const errText = await resp.text();
            throw new Error(`API错误 (${resp.status}): ${errText}`);
        }

        const data = await resp.json();
        const reply = data.choices?.[0]?.message?.content || '（无回复）';

        // 显示结果
        showFortuneAIResult(reply);
    } catch (err) {
        console.error('解牌失败:', err);
        showNotification('AI解牌失败: ' + err.message, 'error', 5000);
        btn.innerHTML = origText;
        btn.disabled = false;
    }
}

// 显示AI解牌结果
function showFortuneAIResult(text) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.style.zIndex = '30000';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:450px; max-height:80vh;">
            <div class="modal-title"><i class="fas fa-robot"></i><span>AI 辅助解牌</span></div>
            <div style="white-space:pre-wrap; line-height:1.8; font-size:14px; max-height:55vh; overflow-y:auto; padding:8px 0;">${escapeHtml(text)}</div>
            <div class="modal-buttons">
                <button class="modal-btn modal-btn-primary close-fortune-ai">关闭</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('.close-fortune-ai').onclick = () => modal.remove();
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

    // 恢复按钮
    const btn = document.getElementById('fortune-ai-assist');
    if (btn) {
        btn.innerHTML = '<i class="fas fa-robot"></i> AI 辅助解牌';
        btn.disabled = false;
    }
}

function initFortuneModule() {
    cacheElements();
    bindEvents();
    // 默认选中雷诺曼
    if (!fortuneState.type) {
        selectFortuneType('lenormand');
    } else {
        updateTypeUI();
        updateCardCountOptions();
    }
}

function cacheElements() {
    lenormandOption = document.getElementById('fortune-lenormand');
    tarotOption = document.getElementById('fortune-tarot');
    fortuneNextBtn = document.getElementById('fortune-next-btn');
    fortuneQuestionInput = document.getElementById('fortune-question');
    fortuneCardCountSelect = document.getElementById('fortune-card-count');
    if (!fortuneCardCountSelect) fortuneCardCountSelect = document.getElementById('fortune-card-count-select');
    fortuneQuizStartBtn = document.getElementById('fortune-quiz-start');
    fortuneQuizCancelBtn = document.getElementById('fortune-quiz-cancel');
    fortuneQuizBackBtn = document.getElementById('fortune-quiz-back');
    fortuneResultContainer = document.getElementById('fortune-result-cards');
    fortuneAiAssistBtn = document.getElementById('fortune-ai-assist');
    fortuneResultBackBtn = document.getElementById('fortune-result-back');
    fortuneResultNewBtn = document.getElementById('fortune-result-new');
}

function bindEvents() {
    if (lenormandOption) lenormandOption.addEventListener('click', () => selectFortuneType('lenormand'));
    if (tarotOption) tarotOption.addEventListener('click', () => selectFortuneType('tarot'));
    if (fortuneNextBtn) fortuneNextBtn.addEventListener('click', goToQuizView);
    if (fortuneQuizStartBtn) fortuneQuizStartBtn.addEventListener('click', startDivination);
    if (fortuneQuizCancelBtn) fortuneQuizCancelBtn.addEventListener('click', cancelDivination);
    if (fortuneQuizBackBtn) fortuneQuizBackBtn.addEventListener('click', backToSelection);
    if (fortuneAiAssistBtn) fortuneAiAssistBtn.addEventListener('click', () => triggerFortuneAI());
    if (fortuneResultBackBtn) fortuneResultBackBtn.addEventListener('click', backToSelection);
    if (fortuneResultNewBtn) fortuneResultNewBtn.addEventListener('click', resetToSelection);
    if (fortuneCardCountSelect) fortuneCardCountSelect.addEventListener('change', updateCardCountHint);
}

function updateTypeUI() {
    if (lenormandOption) lenormandOption.classList.toggle('selected', fortuneState.type === 'lenormand');
    if (tarotOption) tarotOption.classList.toggle('selected', fortuneState.type === 'tarot');
}

function selectFortuneType(type) {
    fortuneState.type = type;
    localStorage.setItem('fortune_last_type', type);
    updateTypeUI();
    updateCardCountOptions();
}

function updateCardCountOptions() {
    if (!fortuneCardCountSelect) return;
    const select = fortuneCardCountSelect;
    select.innerHTML = '';
    if (fortuneState.type === 'lenormand') {
        [3, 5, 7].forEach(count => {
            const opt = document.createElement('option');
            opt.value = count;
            opt.textContent = `${count} 张牌`;
            select.appendChild(opt);
        });
        select.value = fortuneState.cardCount;
    } else if (fortuneState.type === 'tarot') {
        const opts = [
            { val: 1, label: '1 张牌（快速占卜）' },
            { val: 3, label: '3 张牌（圣三角牌阵）' },
            { val: 5, label: '5 张牌（经典五牌阵）' }
        ];
        opts.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.val;
            option.textContent = opt.label;
            select.appendChild(option);
        });
        select.value = fortuneState.cardCount;
    }
    updateCardCountHint();
}

function updateCardCountHint() {
    const hintEl = document.getElementById('fortune-card-count-hint');
    if (!hintEl) return;
    const count = parseInt(fortuneCardCountSelect?.value || 3);
    fortuneState.cardCount = count;
    if (fortuneState.type === 'lenormand') {
        if (count === 3) hintEl.textContent = '💡 三张牌：快速得到问题答案';
        else if (count === 5) hintEl.textContent = '💡 五张牌：了解答案及更多细节';
        else hintEl.textContent = '💡 七张牌：更全面的信息与深层解读';
    } else if (fortuneState.type === 'tarot') {
        if (count === 1) hintEl.textContent = '💡 一张牌：快速占卜，了解核心状况';
        else if (count === 3) hintEl.textContent = '💡 三张牌：圣三角牌阵，解读过去现在未来';
        else hintEl.textContent = '💡 五张牌：经典五牌阵，全面分析问题';
    }
}

function goToQuizView() {
    if (!fortuneState.type) selectFortuneType('lenormand');
    if (fortuneCardCountSelect && fortuneCardCountSelect.options.length === 0) updateCardCountOptions();
    document.getElementById('fortune-selection-panel').style.display = 'none';
    document.getElementById('fortune-quiz-panel').style.display = 'block';
}

function backToSelection() {
    document.getElementById('fortune-selection-panel').style.display = 'block';
    document.getElementById('fortune-quiz-panel').style.display = 'none';
    document.getElementById('fortune-result-panel').style.display = 'none';
    fortuneState.drawnCards = [];
}

function cancelDivination() {
    backToSelection();
    if (fortuneQuestionInput) fortuneQuestionInput.value = '';
}

function resetToSelection() {
    backToSelection();
    if (fortuneQuestionInput) fortuneQuestionInput.value = '';
}

async function startDivination() {
    if (fortuneState.isDrawing) return;
    const question = fortuneQuestionInput?.value.trim();
    if (!question) {
        showNotification('请输入你想占卜的问题', 'warning');
        return;
    }
    fortuneState.question = question;
    const count = parseInt(fortuneCardCountSelect?.value || 3);
    fortuneState.cardCount = count;
    
    const startBtn = fortuneQuizStartBtn;
    if (startBtn) {
        startBtn.disabled = true;
        startBtn.textContent = '✨ 抽取中...';
    }
    fortuneState.isDrawing = true;
    await new Promise(r => setTimeout(r, 200));
    const drawn = drawCards(count);
    fortuneState.drawnCards = drawn;
    showResultView(drawn);
    if (startBtn) {
        startBtn.disabled = false;
        startBtn.textContent = '✨ 开始占卜';
    }
    fortuneState.isDrawing = false;
}

function drawCards(count) {
    const deck = fortuneState.type === 'lenormand' ? [...LENORMAND_DECK] : [...TAROT_DECK];
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck.slice(0, count).map((card, idx) => ({
        ...card,
        position: idx + 1,
        isReversed: fortuneState.type === 'tarot' && Math.random() < 0.3
    }));
}

function showResultView(cards) {
    document.getElementById('fortune-selection-panel').style.display = 'none';
    document.getElementById('fortune-quiz-panel').style.display = 'none';
    document.getElementById('fortune-result-panel').style.display = 'block';
    renderResultCards(cards);
}

function renderResultCards(cards) {
    if (!fortuneResultContainer) return;
    const typeName = fortuneState.type === 'lenormand' ? '雷诺曼' : '塔罗';
    const count = cards.length;
    let layoutClass = 'result-layout-multi';
    if (count === 1) layoutClass = 'result-layout-single';
    else if (count === 3) layoutClass = 'result-layout-three';
    else if (count === 5) layoutClass = 'result-layout-five';
    
    let html = `<div class="fortune-result-header">
        <div class="fortune-question-display">📿 你的问题：${escapeHtml(fortuneState.question)}</div>
        <div class="fortune-type-display">🎴 ${typeName}占卜 · ${count}张牌</div>
    </div>
    <div class="fortune-cards-container ${layoutClass}">`;
    
    cards.forEach(card => {
        const orientation = card.isReversed ? ' (逆位)' : ' (正位)';
        const meaningText = card.keyword || card.meaning || '等待解读';
        let meta = '';
        if (fortuneState.type === 'lenormand') meta = `<div class="card-number">${card.icon || ''} #${card.id}</div>`;
        else if (card.suit) meta = `<div class="card-suit">【${card.suit}】</div>`;
        
        html += `
            <div class="fortune-card ${card.isReversed ? 'reversed' : ''}">
                <div class="card-inner">
                    ${meta}
                    <div class="card-name">${escapeHtml(card.name)}${orientation}</div>
                    <div class="card-meaning">${escapeHtml(meaningText)}</div>
                </div>
            </div>
        `;
    });
    
    html += `</div><div class="fortune-reading">
        <div class="reading-title">✨ 占卜解读 ✨</div>
        <div class="reading-content">${generateReading(cards)}</div>
    </div>`;
    fortuneResultContainer.innerHTML = html;
}

function generateReading(cards) {
    if (!cards.length) return '请先抽取牌卡。';
    const type = fortuneState.type;
    const count = cards.length;
    if (type === 'lenormand') {
        const names = cards.map(c => c.name).join(' → ');
        const keywords = cards.map(c => c.keyword).join(' · ');
        if (count === 3) return `你抽到了三张雷诺曼牌：${names}。这三张牌呈现出清晰的线性脉络：${keywords}。整体来看，这三张牌的流向预示着一个从起始到发展的过程。`;
        if (count === 5) return `五张雷诺曼牌排列如下：${names}。五张牌提供了更丰富的信息维度：${keywords}。这组牌围绕你的问题呈现出较为完整的画面，既有核心事件也有细节补充。`;
        return `七张雷诺曼牌依次为：${names}。${keywords}。这七张牌的线性展开揭示了问题发展的深层脉络，建议结合每张牌的位置进行更精细的解读。`;
    } else {
        if (count === 1) {
            const c = cards[0];
            const ort = c.isReversed ? '（逆位）' : '（正位）';
            return `你抽到了${c.name}${ort}。${c.meaning}。这张牌是当下能量的直接反映，请静心感受它传递给你的信息。`;
        }
        if (count === 3) {
            const positions = ['过去', '现在', '未来'];
            const parts = cards.map((c, i) => {
                const ort = c.isReversed ? '（逆位）' : '（正位）';
                return `${positions[i]}：${c.name}${ort} — ${c.meaning}`;
            });
            return `圣三角牌阵揭示：${parts.join('。')}。这三张牌串联起事件的前因后果，帮助你看清能量流向。`;
        }
        const parts = cards.map((c, i) => {
            const ort = c.isReversed ? '（逆位）' : '（正位）';
            return `第${i+1}张 ${c.name}${ort}`;
        });
        return `你抽到了${parts.join('、')}。五张牌围绕你的问题展开，${cards[0].meaning} 是当前的核心状态，后续牌面提供了更深入的指引。`;
    }
}