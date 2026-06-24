// ========== 场外援助设置模块 ==========
const AI_SETTINGS_KEY = 'ai_settings';

const DEFAULT_AI_SETTINGS = {
    apiKey: '',
    apiUrl: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat',
    systemPrompt: '你是一个温暖贴心的AI助手，请用中文回复。回答简洁友好，就像朋友之间的对话。',
    fortunePrompt: '你是一位资深的塔罗牌和雷诺曼解读师。请根据用户提供的牌面信息，进行温暖、有洞察力的解读。解读应包含：1.每张牌的核心含义 2.牌面之间的关联 3.综合解读和建议。用温柔的语气，像朋友一样给出建议。请用中文回复。',
    temperature: 0.7,
    maxTokens: 2000
};

function getAISettings() {
    const saved = localStorage.getItem(AI_SETTINGS_KEY);
    return saved ? { ...DEFAULT_AI_SETTINGS, ...JSON.parse(saved) } : { ...DEFAULT_AI_SETTINGS };
}

function saveAISettings(settings) {
    localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(settings));
}

function loadAISettingsUI() {
    const s = getAISettings();
    const apiKey = document.getElementById('ai-api-key');
    const apiUrl = document.getElementById('ai-api-url');
    const model = document.getElementById('ai-model');
    const systemPrompt = document.getElementById('ai-system-prompt');
    const temperature = document.getElementById('ai-temperature');
    const maxTokens = document.getElementById('ai-max-tokens');

    if (apiKey) apiKey.value = s.apiKey || '';
    if (apiUrl) apiUrl.value = s.apiUrl;
    if (model) model.value = s.model;
    if (systemPrompt) systemPrompt.value = s.systemPrompt || '';
    const fortunePrompt = document.getElementById('ai-fortune-prompt');
    if (fortunePrompt) fortunePrompt.value = s.fortunePrompt || DEFAULT_AI_SETTINGS.fortunePrompt;
    if (temperature) { temperature.value = s.temperature * 100; document.getElementById('ai-temp-value').textContent = s.temperature; }
    if (maxTokens) { maxTokens.value = s.maxTokens; document.getElementById('ai-tokens-value').textContent = s.maxTokens; }
}

function initAISettings() {
    loadAISettingsUI();

    // 滑块绑定
    const tempSlider = document.getElementById('ai-temperature');
    const tokensSlider = document.getElementById('ai-max-tokens');
    if (tempSlider) tempSlider.oninput = () => {
        document.getElementById('ai-temp-value').textContent = (tempSlider.value / 100).toFixed(2);
    };
    if (tokensSlider) tokensSlider.oninput = () => {
        document.getElementById('ai-tokens-value').textContent = tokensSlider.value;
    };

    // 保存按钮
    const saveBtn = document.getElementById('ai-settings-save');
    if (saveBtn) saveBtn.onclick = () => {
        const settings = {
            apiKey: document.getElementById('ai-api-key').value.trim(),
            apiUrl: document.getElementById('ai-api-url').value.trim(),
            model: document.getElementById('ai-model').value,
            systemPrompt: document.getElementById('ai-system-prompt').value.trim(),
            fortunePrompt: document.getElementById('ai-fortune-prompt').value.trim(),
            temperature: parseInt(document.getElementById('ai-temperature').value) / 100,
            maxTokens: parseInt(document.getElementById('ai-max-tokens').value)
        };
        saveAISettings(settings);
        showNotification('AI设置已保存', 'success');
    };
}
