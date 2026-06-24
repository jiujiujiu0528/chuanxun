// ========== 聊天统计模块 ==========
let currentStatsTab = 'overview';

// 初始化统计模块（在需要时调用）
function initStatsModule() {
    bindStatsTabEvents();
    renderStatsOverview();
    renderStatsWords();
    renderWordCloud();
    initSearchModule();
}

// 绑定标签页切换事件
function bindStatsTabEvents() {
    const tabs = document.querySelectorAll('.stats-tab');
    tabs.forEach(tab => {
        tab.removeEventListener('click', statsTabHandler);
        tab.addEventListener('click', statsTabHandler);
    });
}

function statsTabHandler(e) {
    const tab = e.currentTarget;
    const targetTab = tab.dataset.tab;
    if (!targetTab) return;
    currentStatsTab = targetTab;
    document.querySelectorAll('.stats-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.stats-panel').forEach(panel => panel.classList.remove('active'));
    document.getElementById(`stats-${targetTab}`).classList.add('active');
    if (targetTab === 'wordcloud') {
        renderWordCloud();
    }
}

function getMessageStats() {
    // 使用 window.messages 确保访问到全局消息数组
    const msgs = window.messages;
    if (!msgs || msgs.length === 0) {
        return { total: 0, myCount: 0, partnerCount: 0, myWords: [], partnerWords: [], allWords: [] };
    }
    const myMessages = msgs.filter(m => m.sender === 'user' && m.text && m.type !== 'system');
    const partnerMessages = msgs.filter(m => m.sender !== 'user' && m.text && m.type !== 'system');
    const total = myMessages.length + partnerMessages.length;
    
    function extractWords(text) {
        const cleaned = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, ' ');
        const words = cleaned.split(/\s+/).filter(w => w.length > 1 && !stopWords.has(w));
        return words;
    }
    
    const stopWords = new Set(['的','了','是','我','你','他','她','它','们','这','那','有','在','就','也','都','和','与','或','但','不','没','很','太','更','最','已','被','让','把','对','从','到','于','以','为','之','其','而','则','所','等','啊','哦','嗯','哈','呢','吧','吗','嘛','呀','哇','哎','唉','哈哈','嘻嘻','呵呵','哦哦','啊啊','哈哈哈','一','二','三','四','五','六','七','八','九','十','个','次','条','件','种','好','行','可以','可','又','再','还','来','去','说','想','知道','觉得','感觉','什么','怎么','为什么','哪','谁','哪里','怎样','如何','这么','那么','然后','因为','所以','如果','虽然','但是','而且','不过','只是','只有','没有','不是','还是','就是','真的','对啊','好的','好吧','那个','这个','今天','昨天','明天','现在','以前','以后','时候','时间','一下','一直','一个','ok','OK','yes','no','hh','嗯','额','图片','表情','语音']);
    
    const myWordMap = new Map();
    myMessages.forEach(msg => {
        const words = extractWords(msg.text);
        words.forEach(w => myWordMap.set(w, (myWordMap.get(w) || 0) + 1));
    });
    const partnerWordMap = new Map();
    partnerMessages.forEach(msg => {
        const words = extractWords(msg.text);
        words.forEach(w => partnerWordMap.set(w, (partnerWordMap.get(w) || 0) + 1));
    });
    const allWordMap = new Map();
    [...myWordMap.entries()].forEach(([w,c]) => allWordMap.set(w, (allWordMap.get(w) || 0) + c));
    [...partnerWordMap.entries()].forEach(([w,c]) => allWordMap.set(w, (allWordMap.get(w) || 0) + c));
    
    const sortWords = (map, limit = 20) => [...map.entries()].sort((a,b) => b[1] - a[1]).slice(0, limit).map(([w,c]) => ({ word: w, count: c }));
    
    return {
        total,
        myCount: myMessages.length,
        partnerCount: partnerMessages.length,
        myWords: sortWords(myWordMap, 30),
        partnerWords: sortWords(partnerWordMap, 30),
        allWords: sortWords(allWordMap, 50)
    };
}

function renderStatsOverview() {
    const container = document.getElementById('stats-overview');
    if (!container) return;
    const stats = getMessageStats();
    const myName = settings.myName || '我';
    const partnerName = settings.partnerName || '对方';
    container.innerHTML = `
        <div class="stats-cards">
            <div class="stat-card">
                <div class="stat-value">${stats.total}</div>
                <div class="stat-label">总消息数</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.myCount}</div>
                <div class="stat-label">${myName} 发送</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.partnerCount}</div>
                <div class="stat-label">${partnerName} 发送</div>
            </div>
        </div>
        <div class="stats-chart-placeholder">
            <canvas id="message-pie-chart" width="200" height="200" style="max-width:200px; margin:0 auto;"></canvas>
        </div>
    `;
    const canvas = document.getElementById('message-pie-chart');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        const w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        const total = stats.myCount + stats.partnerCount;
        if (total === 0) return;
        const myAngle = (stats.myCount / total) * 2 * Math.PI;
        const partnerAngle = (stats.partnerCount / total) * 2 * Math.PI;
        const centerX = w/2, centerY = h/2, radius = 80;
        ctx.beginPath();
        ctx.fillStyle = 'var(--accent-color)';
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, 0, myAngle);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = 'var(--message-received-bg)';
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, myAngle, myAngle + partnerAngle);
        ctx.fill();
        ctx.fillStyle = 'var(--text-primary)';
        ctx.font = '12px sans-serif';
        ctx.fillText(`${myName}: ${stats.myCount}`, centerX - 40, centerY - 20);
        ctx.fillText(`${partnerName}: ${stats.partnerCount}`, centerX - 40, centerY + 10);
    }
}

function renderStatsWords() {
    const container = document.getElementById('stats-words');
    if (!container) return;
    const stats = getMessageStats();
    const myName = settings.myName || '我';
    const partnerName = settings.partnerName || '对方';
    container.innerHTML = `
        <div class="words-control">
            <button class="words-filter active" data-filter="all">全部</button>
            <button class="words-filter" data-filter="my">${myName}</button>
            <button class="words-filter" data-filter="partner">${partnerName}</button>
        </div>
        <div id="words-list-container" class="words-list"></div>
    `;
    const filterBtns = container.querySelectorAll('.words-filter');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter;
            let words = [];
            if (filter === 'my') words = stats.myWords;
            else if (filter === 'partner') words = stats.partnerWords;
            else words = stats.allWords;
            renderWordsList(words);
        });
    });
    renderWordsList(stats.allWords);
}

function renderWordsList(words) {
    const listContainer = document.getElementById('words-list-container');
    if (!listContainer) return;
    if (!words.length) {
        listContainer.innerHTML = '<div class="no-data">暂无数据，多聊几句吧</div>';
        return;
    }
    const maxCount = words[0].count;
    listContainer.innerHTML = words.map(w => {
        const percent = (w.count / maxCount) * 100;
        return `
            <div class="word-item">
                <span class="word-text">${escapeHtml(w.word)}</span>
                <span class="word-count">${w.count}</span>
                <div class="word-bar" style="width: ${percent}%;"></div>
            </div>
        `;
    }).join('');
}

function renderWordCloud() {
    const container = document.getElementById('stats-wordcloud');
    if (!container) return;
    const stats = getMessageStats();
    const words = stats.allWords.slice(0, 60);
    if (!words.length) {
        container.innerHTML = '<div class="no-data">暂无数据，多聊几句后词云会出现</div>';
        return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    canvas.style.borderRadius = '12px';
    container.innerHTML = '';
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'var(--primary-bg)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const maxCount = words[0].count;
    const minCount = words[words.length-1].count;
    const minFont = 12;
    const maxFont = 42;
    const colors = ['var(--accent-color)', '#7FA6CD', '#BB9EC7', '#7BC8A4', '#F4A6B3', '#FFB347'];
    
    const centerX = canvas.width/2, centerY = canvas.height/2;
    let placed = [];
    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        let fontSize = minFont + (word.count - minCount) / (maxCount - minCount || 1) * (maxFont - minFont);
        fontSize = Math.min(maxFont, Math.max(minFont, fontSize));
        ctx.font = `bold ${fontSize}px "Noto Serif SC", sans-serif`;
        const metrics = ctx.measureText(word.word);
        const width = metrics.width;
        const height = fontSize * 1.2;
        
        let placedFlag = false;
        for (let step = 0; step < 800; step++) {
            const radius = step * 1.8;
            const angle = step * 0.2;
            const x = centerX + radius * Math.cos(angle) - width/2;
            const y = centerY + radius * 0.8 * Math.sin(angle) - height/2;
            if (x > 5 && y > 5 && x + width < canvas.width - 5 && y + height < canvas.height - 5) {
                let overlap = false;
                for (let p of placed) {
                    if (!(x + width < p.x || x > p.x + p.w || y + height < p.y || y > p.y + p.h)) {
                        overlap = true;
                        break;
                    }
                }
                if (!overlap) {
                    ctx.fillStyle = colors[i % colors.length];
                    ctx.fillText(word.word, x, y + fontSize);
                    placed.push({ x, y, w: width, h: height });
                    placedFlag = true;
                    break;
                }
            }
        }
        if (!placedFlag) {
            for (let attempt = 0; attempt < 30; attempt++) {
                const x = 10 + Math.random() * (canvas.width - width - 20);
                const y = 10 + Math.random() * (canvas.height - height - 20);
                let overlap = false;
                for (let p of placed) {
                    if (!(x + width < p.x || x > p.x + p.w || y + height < p.y || y > p.y + p.h)) {
                        overlap = true;
                        break;
                    }
                }
                if (!overlap) {
                    ctx.fillStyle = colors[i % colors.length];
                    ctx.fillText(word.word, x, y + fontSize);
                    placed.push({ x, y, w: width, h: height });
                    break;
                }
            }
        }
    }
}

// 外部刷新函数（当消息变化时调用）
function refreshStats() {
    if (!document.getElementById('stats-view').classList.contains('active')) return;
    renderStatsOverview();
    renderStatsWords();
    renderWordCloud();
}

// 监听视图显示，自动刷新
const statsView = document.getElementById('stats-view');
if (statsView) {
    const statsObserver = new MutationObserver(() => {
        if (statsView.classList.contains('active')) {
            refreshStats();
        }
    });
    statsObserver.observe(statsView, { attributes: true, attributeFilter: ['class'] });
}
// ========== 消息搜索功能 ==========
function initSearchModule() {
    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }
    const clearDateBtn = document.getElementById('search-date-clear');
    if (clearDateBtn) {
        clearDateBtn.addEventListener('click', () => {
            document.getElementById('search-date-from').value = '';
            document.getElementById('search-date-to').value = '';
            performSearch(); // 清空后自动重新搜索
        });
    }
    // 关键词输入框支持回车搜索
    const keywordInput = document.getElementById('search-keyword');
    if (keywordInput) {
        keywordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch();
        });
    }
}

function performSearch() {
    const keyword = document.getElementById('search-keyword').value.trim().toLowerCase();
    const dateFrom = document.getElementById('search-date-from').value;
    const dateTo = document.getElementById('search-date-to').value;
    
    let filtered = messages.filter(msg => msg.type !== 'system');
    
    // 关键词过滤
    if (keyword) {
        filtered = filtered.filter(msg => msg.text && msg.text.toLowerCase().includes(keyword));
    }
    // 日期范围过滤
    if (dateFrom) {
        const from = new Date(dateFrom);
        from.setHours(0,0,0,0);
        filtered = filtered.filter(msg => new Date(msg.timestamp) >= from);
    }
    if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23,59,59,999);
        filtered = filtered.filter(msg => new Date(msg.timestamp) <= to);
    }
    
    renderSearchResults(filtered, keyword);
}

function renderSearchResults(results, keyword) {
    const container = document.getElementById('search-results');
    if (!container) return;
    
    if (results.length === 0) {
        container.innerHTML = '<div class="no-data">未找到相关消息</div>';
        return;
    }
    
    const myName = settings.myName || '我';
    const partnerName = settings.partnerName || '对方';
    
    // 高亮关键词函数
    function highlight(text, kw) {
        if (!kw) return escapeHtml(text);
        const regex = new RegExp(`(${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return escapeHtml(text).replace(regex, '<mark>$1</mark>');
    }
    
    const html = results.map(msg => {
        const isUser = msg.sender === 'user';
        const senderName = isUser ? myName : partnerName;
        const time = new Date(msg.timestamp).toLocaleString();
        const content = msg.text ? highlight(msg.text, keyword) : (msg.image ? '[图片]' : '');
        return `
            <div class="search-result-item" data-msg-id="${msg.id}">
                <div class="result-header">
                    <span class="result-sender">${escapeHtml(senderName)}</span>
                    <span class="result-time">${time}</span>
                </div>
                <div class="result-content">${content || ''}</div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
    
    // 绑定点击事件跳转消息
    document.querySelectorAll('.search-result-item').forEach(el => {
        el.addEventListener('click', () => {
            const msgId = parseInt(el.dataset.msgId);
            // 切换到聊天视图并定位消息
            if (typeof showView === 'function') {
                showView('chat-view');
                setTimeout(() => {
                    if (typeof scrollToMessage === 'function') {
                        scrollToMessage(msgId);
                    }
                }, 200);
            }
        });
    });
}
// 暴露刷新函数给其他模块调用
window.refreshStats = refreshStats;