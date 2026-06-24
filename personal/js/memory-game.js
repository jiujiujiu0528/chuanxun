// ========== 翻牌记忆模块 ==========
const EMOJI_POOL = ['💕','💖','💗','💝','💌','🌹','🎀','🧸','🍀','⭐','🌈','🦋','🌸','🐱','🐰','🦊'];
const DIFFICULTY = { easy: { pairs: 6, cols: 3 }, medium: { pairs: 8, cols: 4 }, hard: { pairs: 12, cols: 6 } };

let memoryState = { cards: [], flipped: [], matched: new Set(), steps: 0, timer: 0, timerId: null, locked: false, started: false, difficulty: 'medium' };

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
}

function buildCards(diff) {
    const { pairs } = DIFFICULTY[diff];
    const emojis = shuffle(EMOJI_POOL).slice(0, pairs);
    const deck = [];
    emojis.forEach((emoji, idx) => {
        deck.push({ id: idx, emoji, flipped: false, matched: false });
        deck.push({ id: idx, emoji, flipped: false, matched: false });
    });
    return shuffle(deck);
}

function stopTimer() {
    if (memoryState.timerId) { clearInterval(memoryState.timerId); memoryState.timerId = null; }
}

function startTimer() {
    if (memoryState.timerId) return;
    memoryState.timerId = setInterval(() => {
        memoryState.timer++;
        updateTimerDisplay();
    }, 1000);
}

function updateTimerDisplay() {
    const el = document.getElementById('memory-timer');
    if (!el) return;
    const m = Math.floor(memoryState.timer / 60);
    const s = memoryState.timer % 60;
    el.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function renderMemoryGrid() {
    const grid = document.getElementById('memory-grid');
    if (!grid) return;
    const { cols } = DIFFICULTY[memoryState.difficulty];
    grid.className = 'memory-grid cols' + cols;
    grid.innerHTML = '';
    memoryState.cards.forEach((card, idx) => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'memory-card';
        if (card.flipped || card.matched) cardDiv.classList.add('flipped');
        if (card.matched) cardDiv.classList.add('matched');
        cardDiv.innerHTML = `
            <div class="memory-card-inner">
                <div class="memory-card-face memory-card-back">?</div>
                <div class="memory-card-face memory-card-front">${card.emoji}</div>
            </div>
        `;
        cardDiv.addEventListener('click', () => flipCard(idx));
        grid.appendChild(cardDiv);
    });
    document.getElementById('memory-steps').textContent = memoryState.steps;
    updateTimerDisplay();
}

function flipCard(idx) {
    if (memoryState.locked) return;
    const card = memoryState.cards[idx];
    if (card.flipped || card.matched) return;
    if (memoryState.flipped.length >= 2) return;

    if (!memoryState.started) { memoryState.started = true; startTimer(); }

    card.flipped = true;
    memoryState.flipped.push(idx);
    renderMemoryGrid();

    if (memoryState.flipped.length === 2) {
        memoryState.steps++;
        memoryState.locked = true;
        const [a, b] = memoryState.flipped;
        if (memoryState.cards[a].id === memoryState.cards[b].id) {
            // 匹配成功
            setTimeout(() => {
                memoryState.cards[a].matched = true;
                memoryState.cards[b].matched = true;
                memoryState.flipped = [];
                memoryState.locked = false;
                renderMemoryGrid();
                // 检查是否全部完成
                if (memoryState.cards.every(c => c.matched)) {
                    stopTimer();
                    setTimeout(() => showMemoryResult(), 400);
                }
            }, 300);
        } else {
            // 不匹配，翻回
            setTimeout(() => {
                memoryState.cards[a].flipped = false;
                memoryState.cards[b].flipped = false;
                memoryState.flipped = [];
                memoryState.locked = false;
                renderMemoryGrid();
            }, 700);
        }
    }
}

function showMemoryResult() {
    const m = Math.floor(memoryState.timer / 60);
    const s = memoryState.timer % 60;
    const timeStr = m > 0 ? `${m}分${s}秒` : `${s}秒`;
    showNotification(`🎉 全部配对完成！用时${timeStr}，共${memoryState.steps}步`, 'success', 5000);
}

function restartMemory() {
    stopTimer();
    const diff = document.getElementById('memory-difficulty')?.value || 'medium';
    memoryState = {
        cards: buildCards(diff),
        flipped: [], matched: new Set(), steps: 0,
        timer: 0, timerId: null, locked: false, started: false, difficulty: diff
    };
    renderMemoryGrid();
}

function initMemoryGame() {
    const diffSelect = document.getElementById('memory-difficulty');
    if (diffSelect) {
        diffSelect.value = memoryState.difficulty;
        diffSelect.onchange = () => restartMemory();
    }
    document.getElementById('memory-restart').onclick = restartMemory;
    restartMemory();
}
