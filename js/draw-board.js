// ========== 图画板模块 - 随机生成 + 手绘 ==========
const DRAW_COLORS = [
    '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
    '#1abc9c', '#e67e22', '#2980b9', '#c0392b', '#27ae60',
    '#8e44ad', '#d35400', '#16a085', '#f1c40f', '#34495e',
    '#e91e63', '#00bcd4', '#ff5722', '#795548', '#607d8b'
];
const DRAW_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*?!';

let drawMode = 'random'; // 'random' | 'draw'
let isDrawing = false;
let drawColor = '#c5a47e';
let brushSize = 3;
let isEraser = false;

function getRandomColor() {
    return DRAW_COLORS[Math.floor(Math.random() * DRAW_COLORS.length)];
}
function getRandomLetter() {
    return DRAW_LETTERS[Math.floor(Math.random() * DRAW_LETTERS.length)];
}

// 生成随机图像
function generateDrawing(canvas, minCount, maxCount) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    const count = minCount + Math.floor(Math.random() * (maxCount - minCount + 1));
    for (let i = 0; i < count; i++) {
        ctx.save();
        ctx.globalAlpha = 0.2 + Math.random() * 0.8;
        const x = Math.random() * w, y = Math.random() * h;
        const size = 10 + Math.random() * 60;
        const t = Math.floor(Math.random() * 7);
        switch (t) {
            case 0: ctx.fillStyle = getRandomColor(); ctx.beginPath(); ctx.arc(x, y, size/2, 0, Math.PI*2); ctx.fill(); break;
            case 1: ctx.fillStyle = getRandomColor(); ctx.fillRect(x-size/2, y-size/2, size, size*(0.5+Math.random())); break;
            case 2: ctx.fillStyle = getRandomColor(); ctx.beginPath(); ctx.moveTo(x, y-size/2); ctx.lineTo(x+size/2, y+size/2); ctx.lineTo(x-size/2, y+size/2); ctx.closePath(); ctx.fill(); break;
            case 3: ctx.fillStyle = getRandomColor(); ctx.beginPath(); ctx.ellipse(x, y, size/2, size/(2+Math.random()*2), Math.random()*Math.PI, 0, Math.PI*2); ctx.fill(); break;
            case 4: ctx.strokeStyle = getRandomColor(); ctx.lineWidth = 1+Math.random()*3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x+(Math.random()-0.5)*100, y+(Math.random()-0.5)*100); ctx.stroke(); break;
            case 5: ctx.fillStyle = getRandomColor(); ctx.font = `${12+Math.random()*36}px "Noto Serif SC", serif`; ctx.fillText(getRandomLetter(), x, y); break;
            case 6: ctx.fillStyle = getRandomColor(); ctx.translate(x, y); ctx.rotate(Math.random()*Math.PI*2); ctx.fillRect(-size/2, -size/2, size, size*0.4); break;
        }
        ctx.restore();
    }
}

function getCanvasDataUrl() {
    const canvas = document.getElementById('draw-canvas');
    return canvas ? canvas.toDataURL('image/png') : null;
}

function generateAndSendDrawingToChat() {
    const canvas = document.createElement('canvas');
    canvas.width = 300; canvas.height = 300;
    generateDrawing(canvas, 5, 15);
    const dataUrl = canvas.toDataURL('image/png');
    if (typeof addMessage === 'function') {
        addMessage({ id: Date.now(), sender: settings.partnerName, text: '', image: dataUrl, timestamp: new Date(), status: 'received', favorited: false });
    }
}

// ========== 手绘功能 ==========
function getCanvasPos(e) {
    const canvas = document.getElementById('draw-canvas');
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
}

function startDraw(e) {
    if (drawMode !== 'draw') return;
    e.preventDefault();
    isDrawing = true;
    const pos = getCanvasPos(e);
    const ctx = document.getElementById('draw-canvas').getContext('2d');
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
}

function draw(e) {
    if (!isDrawing || drawMode !== 'draw') return;
    e.preventDefault();
    const pos = getCanvasPos(e);
    const ctx = document.getElementById('draw-canvas').getContext('2d');
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (isEraser) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = brushSize * 3;
    } else {
        ctx.strokeStyle = drawColor;
    }
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
}

function stopDraw() { isDrawing = false; }

function clearCanvas() {
    const canvas = document.getElementById('draw-canvas');
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// ========== 初始化 ==========
function initDrawBoard() {
    const canvas = document.getElementById('draw-canvas');
    const minSlider = document.getElementById('draw-min-count');
    const maxSlider = document.getElementById('draw-max-count');
    const minValue = document.getElementById('draw-min-value');
    const maxValue = document.getElementById('draw-max-value');
    const generateBtn = document.getElementById('draw-generate-btn');
    const sendBtn = document.getElementById('draw-send-btn');
    const randomControls = document.getElementById('draw-random-controls');
    const drawControls = document.getElementById('draw-draw-controls');

    if (!canvas) return;

    generateDrawing(canvas, 5, 20);

    // 模式切换
    document.querySelectorAll('.draw-mode-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.draw-mode-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            drawMode = tab.dataset.mode;
            if (drawMode === 'random') {
                randomControls.style.display = 'block';
                drawControls.style.display = 'none';
                canvas.style.cursor = 'default';
                generateDrawing(canvas, parseInt(minSlider.value), parseInt(maxSlider.value));
            } else {
                randomControls.style.display = 'none';
                drawControls.style.display = 'block';
                canvas.style.cursor = 'crosshair';
                clearCanvas();
            }
        });
    });

    // 滑块
    if (minSlider) minSlider.oninput = () => { minValue.textContent = minSlider.value; if (parseInt(minSlider.value) > parseInt(maxSlider.value)) { maxSlider.value = minSlider.value; maxValue.textContent = maxSlider.value; } };
    if (maxSlider) maxSlider.oninput = () => { maxValue.textContent = maxSlider.value; if (parseInt(maxSlider.value) < parseInt(minSlider.value)) { minSlider.value = maxSlider.value; minValue.textContent = minSlider.value; } };

    // 随机生成
    if (generateBtn) generateBtn.onclick = () => generateDrawing(canvas, parseInt(minSlider.value), parseInt(maxSlider.value));

    // 手绘工具
    const colorPicker = document.getElementById('draw-color');
    const brushSlider = document.getElementById('draw-brush-size');
    const brushVal = document.getElementById('draw-brush-value');
    const eraserBtn = document.getElementById('draw-eraser-btn');
    const clearBtn = document.getElementById('draw-clear-btn');

    if (colorPicker) colorPicker.oninput = () => { drawColor = colorPicker.value; isEraser = false; if (eraserBtn) eraserBtn.textContent = '🧹 橡皮'; };
    if (brushSlider) brushSlider.oninput = () => { brushSize = parseInt(brushSlider.value); if (brushVal) brushVal.textContent = brushSize + 'px'; };
    if (eraserBtn) eraserBtn.onclick = () => { isEraser = !isEraser; eraserBtn.textContent = isEraser ? '🖌️ 画笔' : '🧹 橡皮'; };
    if (clearBtn) clearBtn.onclick = () => { clearCanvas(); showNotification('画布已清除', 'info'); };

    // 触摸/鼠标绘制
    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDraw);
    canvas.addEventListener('mouseleave', stopDraw);
    canvas.addEventListener('touchstart', startDraw);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stopDraw);

    // 发送到聊天
    if (sendBtn) sendBtn.onclick = () => {
        const dataUrl = getCanvasDataUrl();
        if (dataUrl && typeof addMessage === 'function') {
            addMessage({ id: Date.now(), sender: 'user', text: '', image: dataUrl, timestamp: new Date(), status: 'sent', favorited: false });
            showNotification('图画已发送到聊天', 'success');
        }
    };
}

window.generateAndSendDrawingToChat = generateAndSendDrawingToChat;
