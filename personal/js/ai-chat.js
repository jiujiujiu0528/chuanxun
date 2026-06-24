// ========== 场外援助对话模块 ==========
const AI_CHAT_KEY = 'ai_chat_messages';
const AI_MAX_CONTEXT = 20;
const TYPEWRITER_SPEED = 25; // ms per character

let aiMessages = [];
let isAITyping = false;

function loadAIMessages() {
    const saved = localStorage.getItem(AI_CHAT_KEY);
    aiMessages = saved ? JSON.parse(saved) : [];
}
function saveAIMessages() {
    localStorage.setItem(AI_CHAT_KEY, JSON.stringify(aiMessages));
}

// 渲染AI对话（单条增量追加模式 + 全量刷新）
function renderAIChat(fullRender = true) {
    const container = document.getElementById('ai-chat-container');
    if (!container) return;

    if (fullRender) {
        container.innerHTML = '';
        if (aiMessages.length === 0) {
            container.innerHTML = '<div class="no-data" style="padding:40px;">🤖 你好！我是你的场外援助，有什么可以帮你的？</div>';
            return;
        }
        if (aiMessages.length > AI_MAX_CONTEXT) {
            const hint = document.createElement('div');
            hint.className = 'ai-context-hint';
            hint.textContent = `--- 上下文已压缩（保留最近 ${AI_MAX_CONTEXT} 条消息）---`;
            container.appendChild(hint);
        }
        const visibleMsgs = aiMessages.slice(-AI_MAX_CONTEXT);
        visibleMsgs.forEach(msg => appendAIMessageToDOM(msg, false));
    }
    container.scrollTop = container.scrollHeight;
}

// 追加单条消息到DOM
function appendAIMessageToDOM(msg, scroll = true) {
    const container = document.getElementById('ai-chat-container');
    if (!container) return;
    const wrapper = document.createElement('div');
    wrapper.className = `ai-msg-wrapper ${msg.role}`;
    wrapper.setAttribute('data-ai-id', msg._id || '');
    wrapper.innerHTML = `
        <div>
            <div class="ai-msg-bubble">${escapeHtml(msg.content)}</div>
            <div class="ai-msg-time">${new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
    `;
    container.appendChild(wrapper);
    if (scroll) container.scrollTop = container.scrollHeight;
}

// 打字机效果：逐字显示文本
function typewriterReveal(element, text, speed = TYPEWRITER_SPEED) {
    return new Promise(resolve => {
        const container = document.getElementById('ai-chat-container');
        let i = 0;
        element.textContent = '';
        const timer = setInterval(() => {
            if (i < text.length) {
                element.textContent += text[i];
                i++;
                if (container) container.scrollTop = container.scrollHeight;
            } else {
                clearInterval(timer);
                resolve();
            }
        }, speed);
    });
}

// 发送AI消息
async function sendAIMessage() {
    if (isAITyping) return;
    const input = document.getElementById('ai-message-input');
    const text = input.value.trim();
    if (!text) return;

    const settings = getAISettings();
    if (!settings.apiKey) {
        showNotification('请先在设置中配置API Key', 'warning');
        return;
    }

    // 添加用户消息
    const userMsg = {
        _id: 'u_' + Date.now(),
        role: 'user',
        content: text,
        timestamp: new Date().toISOString()
    };
    aiMessages.push(userMsg);
    input.value = '';
    renderAIChat(true);
    saveAIMessages();

    // 显示思考指示器
    const thinking = document.getElementById('ai-typing-indicator');
    if (thinking) {
        thinking.style.display = 'flex';
        // 确保可见
        const aiContainer = document.getElementById('ai-chat-container');
        if (aiContainer) aiContainer.scrollTop = aiContainer.scrollHeight;
    }

    isAITyping = true;

    try {
        // 构建上下文
        const contextMsgs = aiMessages.slice(-AI_MAX_CONTEXT);
        const messages = [
            { role: 'system', content: settings.systemPrompt || '你是一个友好的AI助手，请用中文回复。' },
            ...contextMsgs.map(m => ({ role: m.role, content: m.content }))
        ];

        const resp = await fetch(settings.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.apiKey}`
            },
            body: JSON.stringify({
                model: settings.model || 'deepseek-chat',
                messages: messages,
                temperature: settings.temperature || 0.7,
                max_tokens: settings.maxTokens || 2000
            })
        });

        if (!resp.ok) {
            const errText = await resp.text();
            throw new Error(`API错误 (${resp.status}): ${errText}`);
        }

        const data = await resp.json();
        const reply = data.choices?.[0]?.message?.content || '（无回复）';

        // 隐藏思考指示器
        if (thinking) thinking.style.display = 'none';

        // 创建空的助手消息并添加到DOM
        const assistantMsg = {
            _id: 'a_' + Date.now(),
            role: 'assistant',
            content: reply,
            timestamp: new Date().toISOString()
        };
        aiMessages.push(assistantMsg);
        saveAIMessages();

        // 在DOM中创建占位气泡
        const container = document.getElementById('ai-chat-container');
        const wrapper = document.createElement('div');
        wrapper.className = 'ai-msg-wrapper assistant';
        wrapper.setAttribute('data-ai-id', assistantMsg._id);
        const bubble = document.createElement('div');
        bubble.className = 'ai-msg-bubble ai-typing-cursor';
        wrapper.appendChild(bubble);
        container.appendChild(wrapper);

        // 打字机逐字显示
        await typewriterReveal(bubble, reply);

        // 移除打字光标
        bubble.classList.remove('ai-typing-cursor');

        // 添加时间戳
        const timeDiv = document.createElement('div');
        timeDiv.className = 'ai-msg-time';
        timeDiv.textContent = new Date(assistantMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        wrapper.appendChild(timeDiv);

    } catch (err) {
        console.error('AI请求失败:', err);
        if (thinking) thinking.style.display = 'none';
        const errMsg = {
            _id: 'e_' + Date.now(),
            role: 'assistant',
            content: `❌ 请求失败: ${err.message}`,
            timestamp: new Date().toISOString()
        };
        aiMessages.push(errMsg);
        saveAIMessages();
        appendAIMessageToDOM(errMsg, true);
    }

    isAITyping = false;
}

// 清除上下文
function clearAIContext() {
    if (confirm('确定清除所有对话记录吗？')) {
        aiMessages = [];
        saveAIMessages();
        renderAIChat(true);
        showNotification('对话已清除', 'info');
    }
}

// 初始化
function initAIChat() {
    loadAIMessages();

    const sendBtn = document.getElementById('ai-send-btn');
    const input = document.getElementById('ai-message-input');
    const clearBtn = document.getElementById('ai-clear-context');

    if (sendBtn) sendBtn.onclick = sendAIMessage;
    if (clearBtn) clearBtn.onclick = clearAIContext;
    if (input) {
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendAIMessage();
            }
        });
    }

    renderAIChat(true);
}
