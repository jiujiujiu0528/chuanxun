// ========== 五子棋模块 ==========
const GOMOKU_KEY = 'gomoku_state';
const BOARD_SIZE = 15;
const CELL = 30;
const PAD = 30; // 边距 (480 - 14*30) / 2 = 30
const CANVAS_SIZE = PAD * 2 + CELL * (BOARD_SIZE - 1); // 480

let gomoku = { board: [], turn: 'black', history: [], steps: 0, gameOver: false, winner: null, winLine: [] };

function newBoard() {
    return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
}

function saveGomoku() {
    localStorage.setItem(GOMOKU_KEY, JSON.stringify(gomoku));
}

function loadGomoku() {
    const s = localStorage.getItem(GOMOKU_KEY);
    if (s) {
        const d = JSON.parse(s);
        gomoku = { ...gomoku, ...d, winLine: d.winLine || [] };
    } else {
        gomoku.board = newBoard();
    }
}

// 八方向扫描：[dx,dy]
const DIRS = [[1,0],[0,1],[1,1],[1,-1]];

function checkWin(x, y, color) {
    for (const [dx, dy] of DIRS) {
        let count = 1, line = [[x, y]];
        // 正向
        for (let i = 1; i < 5; i++) {
            const nx = x + dx * i, ny = y + dy * i;
            if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && gomoku.board[nx][ny] === color) {
                count++; line.push([nx, ny]);
            } else break;
        }
        // 反向
        for (let i = 1; i < 5; i++) {
            const nx = x - dx * i, ny = y - dy * i;
            if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && gomoku.board[nx][ny] === color) {
                count++; line.unshift([nx, ny]);
            } else break;
        }
        if (count >= 5) {
            gomoku.winLine = line;
            return true;
        }
    }
    return false;
}

function drawBoard(ctx) {
    const s = CANVAS_SIZE;
    // 棋盘底色
    ctx.fillStyle = '#dcb35c';
    ctx.fillRect(0, 0, s, s);
    // 网格线
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let i = 0; i < BOARD_SIZE; i++) {
        const pos = PAD + i * CELL;
        ctx.beginPath(); ctx.moveTo(PAD, pos); ctx.lineTo(s - PAD, pos); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pos, PAD); ctx.lineTo(pos, s - PAD); ctx.stroke();
    }
    // 星位
    const stars = [3, 7, 11];
    ctx.fillStyle = '#333';
    stars.forEach(r => stars.forEach(c => {
        ctx.beginPath(); ctx.arc(PAD + c * CELL, PAD + r * CELL, 3, 0, Math.PI * 2); ctx.fill();
    }));
}

function drawPieces(ctx) {
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (!gomoku.board[i][j]) continue;
            const x = PAD + i * CELL, y = PAD + j * CELL, r = CELL / 2 - 2;
            const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
            if (gomoku.board[i][j] === 'black') {
                grad.addColorStop(0, '#555'); grad.addColorStop(1, '#111');
            } else {
                grad.addColorStop(0, '#fff'); grad.addColorStop(1, '#bbb');
            }
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = gomoku.board[i][j] === 'black' ? '#000' : '#999';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }
    // 获胜线高亮
    if (gomoku.winLine.length >= 5) {
        ctx.strokeStyle = '#ff0';
        ctx.lineWidth = 3;
        ctx.beginPath();
        const first = gomoku.winLine[0], last = gomoku.winLine[gomoku.winLine.length - 1];
        ctx.moveTo(PAD + first[0] * CELL, PAD + first[1] * CELL);
        ctx.lineTo(PAD + last[0] * CELL, PAD + last[1] * CELL);
        ctx.stroke();
    }
}

function renderGomoku() {
    const canvas = document.getElementById('gomoku-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    drawBoard(ctx);
    drawPieces(ctx);
    // 更新信息
    document.getElementById('gomoku-steps').textContent = gomoku.steps;
    const turnEl = document.getElementById('gomoku-turn');
    if (gomoku.gameOver) {
        turnEl.textContent = gomoku.winner === 'black' ? '⚫ 你赢了！' : '⚪ 对方赢了！';
        turnEl.className = 'gomoku-turn ' + gomoku.winner;
    } else if (aiThinking) {
        turnEl.textContent = '⚪ 对方思考中...';
        turnEl.className = 'gomoku-turn white';
    } else {
        turnEl.textContent = gomoku.turn === 'black' ? '⚫ 轮到你' : '⚪ 对方';
        turnEl.className = 'gomoku-turn ' + gomoku.turn;
    }
}

// ========== AI 对手 ==========
let aiThinking = false;

// 评估某个位置在某个方向上的连子数
function countDir(x, y, dx, dy, color) {
    let count = 0;
    for (let i = 1; i < 5; i++) {
        const nx = x + dx * i, ny = y + dy * i;
        if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && gomoku.board[nx][ny] === color) count++;
        else break;
    }
    return count;
}

// 评分一个空位
function scorePos(x, y, color) {
    const opp = color === 'black' ? 'white' : 'black';
    let score = 0;
    for (const [dx, dy] of DIRS) {
        const my = countDir(x, y, dx, dy, color) + countDir(x, y, -dx, -dy, color);
        const enemy = countDir(x, y, dx, dy, opp) + countDir(x, y, -dx, -dy, opp);
        if (enemy >= 4) score += 10000;          // 必须堵
        if (my >= 4) score += 9000;              // 直接赢
        if (my === 3 && enemy < 4) score += 500; // 活三
        if (enemy === 3) score += 400;           // 堵对方活三
        if (my === 2) score += 50;
        if (enemy === 2) score += 30;
        score += my * my * 2;
    }
    // 靠近中心加分
    score += (7 - Math.abs(x - 7) - Math.abs(y - 7)) * 2;
    // 靠近已有棋子加分
    for (let dx = -1; dx <= 1; dx++)
        for (let dy = -1; dy <= 1; dy++) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && gomoku.board[nx][ny]) score += 3;
        }
    return score;
}

// AI 落子
function aiMove() {
    if (gomoku.gameOver || gomoku.turn !== 'white') { aiThinking = false; return; }

    let bestScore = -1, bestX = 7, bestY = 7;
    const candidates = [];
    // 收集候选位置（已有棋子周围2格）
    const near = new Set();
    for (let i = 0; i < BOARD_SIZE; i++)
        for (let j = 0; j < BOARD_SIZE; j++)
            if (gomoku.board[i][j])
                for (let dx = -2; dx <= 2; dx++)
                    for (let dy = -2; dy <= 2; dy++) {
                        const nx = i + dx, ny = j + dy;
                        if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && !gomoku.board[nx][ny])
                            near.add(nx * BOARD_SIZE + ny);
                    }

    if (near.size === 0) {
        bestX = 7; bestY = 7;
    } else {
        near.forEach(key => {
            const x = Math.floor(key / BOARD_SIZE), y = key % BOARD_SIZE;
            const s = scorePos(x, y, 'white');
            if (s > bestScore) { bestScore = s; bestX = x; bestY = y; }
        });
    }

    gomoku.board[bestX][bestY] = 'white';
    gomoku.history.push([bestX, bestY]);
    gomoku.steps++;
    if (checkWin(bestX, bestY, 'white')) {
        gomoku.gameOver = true;
        gomoku.winner = 'white';
    } else if (gomoku.steps >= BOARD_SIZE * BOARD_SIZE) {
        gomoku.gameOver = true;
        gomoku.winner = 'draw';
    } else {
        gomoku.turn = 'black';
    }
    aiThinking = false;
    saveGomoku();
    renderGomoku();
    if (gomoku.gameOver) {
        setTimeout(() => {
            if (gomoku.winner === 'draw') showNotification('平局！棋盘已满 🤝', 'info', 3000);
            else showNotification(`${gomoku.winner === 'white' ? '⚪ 对方' : '⚫ 你'} 获胜！`, 'success', 3000);
        }, 200);
    }
}

function placePiece(i, j) {
    if (gomoku.gameOver || gomoku.board[i][j] || aiThinking) return;
    if (gomoku.turn !== 'black') return; // 只能下黑子
    gomoku.board[i][j] = 'black';
    gomoku.history.push([i, j]);
    gomoku.steps++;
    if (checkWin(i, j, 'black')) {
        gomoku.gameOver = true;
        gomoku.winner = 'black';
    } else if (gomoku.steps >= BOARD_SIZE * BOARD_SIZE) {
        gomoku.gameOver = true;
        gomoku.winner = 'draw';
    } else {
        gomoku.turn = 'white';
    }
    saveGomoku();
    renderGomoku();
    if (gomoku.gameOver) {
        setTimeout(() => {
            if (gomoku.winner === 'draw') showNotification('平局！棋盘已满 🤝', 'info', 3000);
            else showNotification(`${gomoku.winner === 'black' ? '⚫ 你' : '⚪ 对方'} 获胜！`, 'success', 3000);
        }, 200);
    } else {
        // AI 延迟落子
        aiThinking = true;
        setTimeout(aiMove, 300 + Math.random() * 400);
    }
}

function undoMove() {
    if (gomoku.gameOver || aiThinking || gomoku.history.length < 2) return;
    // 撤回两步：AI + 自己
    gomoku.history.pop(); // AI的
    gomoku.history.pop(); // 自己的
    const [i1, j1] = gomoku.history.length > 0 ? gomoku.history[gomoku.history.length - 1] : [-1, -1];
    // 重建board
    gomoku.board = newBoard();
    gomoku.history.forEach(([x, y], idx) => {
        gomoku.board[x][y] = idx % 2 === 0 ? 'black' : 'white';
    });
    gomoku.steps = gomoku.history.length;
    gomoku.turn = 'black';
    gomoku.winLine = [];
    saveGomoku();
    renderGomoku();
}

function restartGomoku() {
    aiThinking = false;
    gomoku = { board: newBoard(), turn: 'black', history: [], steps: 0, gameOver: false, winner: null, winLine: [] };
    saveGomoku();
    renderGomoku();
}

function initGomoku() {
    loadGomoku();
    const canvas = document.getElementById('gomoku-canvas');
    renderGomoku();

    if (canvas) {
        canvas.addEventListener('click', e => {
            const rect = canvas.getBoundingClientRect();
            const scale = CANVAS_SIZE / rect.width;
            const mx = (e.clientX - rect.left) * scale;
            const my = (e.clientY - rect.top) * scale;
            const i = Math.round((mx - PAD) / CELL);
            const j = Math.round((my - PAD) / CELL);
            const distX = Math.abs(mx - (PAD + i * CELL));
            const distY = Math.abs(my - (PAD + j * CELL));
            if (i >= 0 && i < BOARD_SIZE && j >= 0 && j < BOARD_SIZE && distX < CELL * 0.45 && distY < CELL * 0.45) {
                placePiece(i, j);
            }
        });
    }
    document.getElementById('gomoku-undo').onclick = undoMove;
    document.getElementById('gomoku-restart').onclick = restartGomoku;
}
