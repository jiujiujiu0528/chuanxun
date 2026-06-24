// 应用常量
const APP_PREFIX = 'CHAT_APP_V2_';
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const DEFAULT_SETTINGS = {
    myName: '我',
    partnerName: '梦角',
    replyDelayMin: 3000,
    replyDelayMax: 7000,
    replyMaxBurst: 1,
    autoSendEnabled: false,
    autoSendInterval: 5,
    soundEnabled: true,
    isDarkMode: false,
    colorTheme: 'gold',
    readReceiptsEnabled: true,
    readReceiptStyle: 'icon',   // 'icon' or 'text'
    allowReadNoReply: false,
    readNoReplyChance: 0.2,
    autoSendEnabled: false,
    autoSendInterval: 5,   // 分钟
    typingIndicatorEnabled: true,
    emojiMixEnabled: true,
    replyEnabled: true
};

// 默认回复库数据
const DEFAULT_REPLIES = {
    cards: ['嗯嗯', '好哦', '今天也要开心呀', '想你啦', '晚安～'],
    pokes: ['拍了拍你的头', '戳了戳你的脸', '给了你一个拥抱', '牵起了你的手'],
    statuses: ['在线', '忙碌', '想你了', '在努力变好'],
    mottos: ['✨ 爱是恒久忍耐', '🌟 你是我的光', '💖 每一天都要快乐'],
    intros: ['♡ 爱 ♡|✧ 正在连接我们的思绪 ✧', '𝑳𝒐𝒗𝒆|若要由我来谈论爱的话'],
    cardGroups: []
};
