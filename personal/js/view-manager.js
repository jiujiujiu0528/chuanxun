function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const target = document.getElementById(viewId);
    if (target) target.classList.add('active');
    localStorage.setItem('currentView', viewId);

    // 如果切换到聊天视图，延迟滚动到底部
    if (viewId === 'chat-view' && typeof window.scrollChatToBottom === 'function') {
        setTimeout(window.scrollChatToBottom, 100);
    }
    // 如果切换回主视图，刷新纪念日和心情数据
    if (viewId === 'home-view') {
        if (typeof renderHomeAnniversaries === 'function') renderHomeAnniversaries();
    }
    // 如果切换到心情日历，刷新
    if (viewId === 'mood-view' && typeof renderMoodCalendar === 'function') {
        renderMoodCalendar();
    }
    // 如果切换到报备视图，刷新
    if (viewId === 'checkin-view' && typeof renderCheckinView === 'function') {
        renderCheckinView();
    }
    // 如果切换到AI对话，渲染
    if (viewId === 'ai-chat-view' && typeof renderAIChat === 'function') {
        renderAIChat();
    }
}

function goBack() {
    showView('home-view');
}

// 绑定所有返回按钮
function bindBackButtons() {
    document.querySelectorAll('[data-back]').forEach(btn => {
        btn.removeEventListener('click', goBack);
        btn.addEventListener('click', goBack);
    });
}

// 初始化视图管理器
function initViewManager() {
    bindBackButtons();
    const lastView = localStorage.getItem('currentView');
    if (lastView && document.getElementById(lastView)) {
        showView(lastView);
    } else {
        showView('home-view');
    }
}