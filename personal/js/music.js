// ========== 音乐播放器完整模块 ==========
let audioElement = null;
let currentSongIndex = 0;
let isPlaying = false;
let playMode = 'sequence'; // sequence, single, shuffle
let songList = [];
let currentCover = null;

// DOM 元素（主视图）
let playPauseBtn, nextBtn, musicTitle, musicSub, progressBar, progressArea;

// 初始化主视图播放器控件
function initMusicPlayerUI() {
    playPauseBtn = document.getElementById('home-play-pause');
    nextBtn = document.getElementById('home-next');
    musicTitle = document.getElementById('music-title');
    musicSub = document.getElementById('music-sub');
    progressBar = document.querySelector('.home-progress-bar');
    progressArea = document.querySelector('.home-player-progress');
    
    if (playPauseBtn) playPauseBtn.onclick = togglePlayPause;
    if (nextBtn) nextBtn.onclick = playNext;
    if (progressArea) progressArea.addEventListener('click', seekProgress);
}

// 加载/保存歌单
function loadSongList() {
    const saved = localStorage.getItem('songList');
    if (saved) {
        songList = JSON.parse(saved);
    } else {
        // 默认歌单（使用可播放的测试链接）
        songList = [
            { title: '小幸运', sub: '田馥甄', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
            { title: '夜曲', sub: '周杰伦', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' }
        ];
    }
    if (songList.length) loadSong(currentSongIndex);
    renderPlaylist();
}

function saveSongList() {
    localStorage.setItem('songList', JSON.stringify(songList));
}

// 加载指定歌曲
function loadSong(index) {
    if (!songList[index]) return;
    currentSongIndex = index;
    const song = songList[index];
    if (musicTitle) musicTitle.textContent = song.title;
    if (musicSub) musicSub.textContent = song.sub;
    if (audioElement) {
        audioElement.src = song.url;
        if (isPlaying) audioElement.play().catch(e => console.log('播放失败', e));
    }
    renderPlaylist();
}

// 播放/暂停
function togglePlayPause() {
    if (!songList.length) return;
    if (isPlaying) {
        audioElement.pause();
    } else {
        audioElement.play().catch(e => showNotification('无法播放，可能是链接失效', 'error'));
    }
    isPlaying = !isPlaying;
    if (playPauseBtn) playPauseBtn.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
}

// 下一曲
function playNext() {
    if (!songList.length) return;
    let nextIndex;
    if (playMode === 'shuffle') {
        nextIndex = Math.floor(Math.random() * songList.length);
    } else if (playMode === 'single') {
        nextIndex = currentSongIndex;
    } else {
        nextIndex = (currentSongIndex + 1) % songList.length;
    }
    loadSong(nextIndex);
    if (isPlaying) audioElement.play();
}

// 进度条更新
function updateProgress() {
    if (audioElement && audioElement.duration) {
        const percent = (audioElement.currentTime / audioElement.duration) * 100;
        if (progressBar) progressBar.style.width = percent + '%';
    }
}

function seekProgress(e) {
    if (!audioElement || !audioElement.duration) return;
    const rect = progressArea.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = clickX / rect.width;
    audioElement.currentTime = percent * audioElement.duration;
}

// 渲染设置视图中的歌单列表
function renderPlaylist() {
    const container = document.getElementById('music-playlist-container');
    if (!container) return;
    if (songList.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-secondary);">暂无歌曲，点击上方按钮添加</div>';
        return;
    }
    container.innerHTML = '';
    songList.forEach((song, idx) => {
        const item = document.createElement('div');
        item.className = `playlist-item ${idx === currentSongIndex ? 'playing' : ''}`;
        item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid var(--border-color); cursor: pointer;';
        item.innerHTML = `
            <div style="flex:1;">
                <div style="font-weight:600;">${escapeHtml(song.title)}</div>
                <div style="font-size:12px; color:var(--text-secondary);">${escapeHtml(song.sub)}</div>
            </div>
            <div>
                <button class="playlist-delete" data-index="${idx}" style="background:none; border:none; cursor:pointer; color:var(--text-secondary);">&times;</button>
            </div>
        `;
        item.addEventListener('click', (e) => {
            if (e.target.classList.contains('playlist-delete')) return;
            loadSong(idx);
            if (isPlaying) audioElement.play();
        });
        item.querySelector('.playlist-delete').addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(`确定删除歌曲《${song.title}》吗？`)) {
                songList.splice(idx, 1);
                if (songList.length === 0) {
                    audioElement.pause();
                    isPlaying = false;
                    if (playPauseBtn) playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
                    if (musicTitle) musicTitle.textContent = '未播放';
                    if (musicSub) musicSub.textContent = '点击播放';
                } else {
                    if (idx === currentSongIndex) {
                        loadSong(0);
                    } else if (idx < currentSongIndex) {
                        currentSongIndex--;
                    }
                }
                saveSongList();
                renderPlaylist();
            }
        });
        container.appendChild(item);
    });
}

// 添加歌曲
function addSong() {
    const title = prompt('请输入歌名：');
    if (!title) return;
    const sub = prompt('请输入艺术家/专辑（可选）：') || '未知艺术家';
    const url = prompt('请输入歌曲链接（MP3 URL）：');
    if (!url) return;
    songList.push({ title: title.trim(), sub: sub.trim(), url: url.trim() });
    saveSongList();
    if (songList.length === 1) loadSong(0);
    renderPlaylist();
    showNotification('歌曲已添加', 'success');
}

// 导入歌单（JSON文件）
function importPlaylist() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            try {
                const imported = JSON.parse(ev.target.result);
                if (Array.isArray(imported)) {
                    if (confirm(`导入将覆盖当前歌单（${songList.length}首），确定吗？`)) {
                        songList = imported;
                        saveSongList();
                        if (songList.length) loadSong(0);
                        renderPlaylist();
                        showNotification(`已导入 ${songList.length} 首歌曲`, 'success');
                    }
                } else {
                    alert('文件格式不正确（需要歌曲数组）');
                }
            } catch (err) {
                alert('解析失败，请确保是有效的 JSON 文件');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// 导出歌单
function exportPlaylist() {
    if (songList.length === 0) {
        alert('歌单为空');
        return;
    }
    const dataStr = JSON.stringify(songList, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `playlist_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('歌单已导出', 'success');
}

// 播放模式切换
function setPlayMode(mode) {
    playMode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    localStorage.setItem('playMode', mode);
}

// 音量控制
function initVolume() {
    const slider = document.getElementById('music-volume');
    const valueSpan = document.getElementById('music-volume-value');
    if (slider && audioElement) {
        const savedVol = localStorage.getItem('musicVolume');
        const vol = savedVol ? parseInt(savedVol) : 70;
        slider.value = vol;
        audioElement.volume = vol / 100;
        if (valueSpan) valueSpan.textContent = vol + '%';
        slider.oninput = () => {
            const val = slider.value;
            audioElement.volume = val / 100;
            if (valueSpan) valueSpan.textContent = val + '%';
            localStorage.setItem('musicVolume', val);
        };
    }
}

// 封面管理
function loadCover() {
    const saved = localStorage.getItem('musicCover');
    if (saved) {
        currentCover = saved;
        const img = document.getElementById('cover-preview-img');
        const icon = document.getElementById('cover-preview-icon');
        if (img && icon) {
            img.src = saved;
            img.style.display = 'block';
            icon.style.display = 'none';
        }
        // 应用到主视图迷你封面（可选）
        const vinyl = document.querySelector('.vinyl-record');
        if (vinyl) vinyl.style.backgroundImage = `url(${saved})`;
    }
}

function uploadCover() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            const data = ev.target.result;
            localStorage.setItem('musicCover', data);
            currentCover = data;
            const img = document.getElementById('cover-preview-img');
            const icon = document.getElementById('cover-preview-icon');
            if (img && icon) {
                img.src = data;
                img.style.display = 'block';
                icon.style.display = 'none';
            }
            const vinyl = document.querySelector('.vinyl-record');
            if (vinyl) vinyl.style.backgroundImage = `url(${data})`;
            showNotification('封面已更新', 'success');
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

function clearCover() {
    localStorage.removeItem('musicCover');
    currentCover = null;
    const img = document.getElementById('cover-preview-img');
    const icon = document.getElementById('cover-preview-icon');
    if (img && icon) {
        img.src = '';
        img.style.display = 'none';
        icon.style.display = 'flex';
    }
    const vinyl = document.querySelector('.vinyl-record');
    if (vinyl) vinyl.style.backgroundImage = '';
    showNotification('封面已清除', 'success');
}

// ========== 播放器背景 ==========
function loadMusicPlayerBg() {
    const saved = localStorage.getItem('music_player_bg');
    if (saved) {
        document.documentElement.style.setProperty('--music-player-bg', `url(${saved})`);
        const img = document.getElementById('player-bg-preview-img');
        const icon = document.getElementById('player-bg-preview-icon');
        if (img && icon) { img.src = saved; img.style.display = 'block'; icon.style.display = 'none'; }
    }
}

function uploadMusicPlayerBg() {
    const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
    input.onchange = e => {
        const f = e.target.files[0]; if (!f) return;
        if (f.size > 2 * 1024 * 1024) { alert('图片不超过2MB'); return; }
        const reader = new FileReader();
        reader.onload = ev => {
            const data = ev.target.result;
            localStorage.setItem('music_player_bg', data);
            document.documentElement.style.setProperty('--music-player-bg', `url(${data})`);
            const img = document.getElementById('player-bg-preview-img');
            const icon = document.getElementById('player-bg-preview-icon');
            if (img && icon) { img.src = data; img.style.display = 'block'; icon.style.display = 'none'; }
            showNotification('播放器背景已更新', 'success');
        };
        reader.readAsDataURL(f);
    };
    input.click();
}

function clearMusicPlayerBg() {
    localStorage.removeItem('music_player_bg');
    document.documentElement.style.setProperty('--music-player-bg', '');
    const img = document.getElementById('player-bg-preview-img');
    const icon = document.getElementById('player-bg-preview-icon');
    if (img && icon) { img.src = ''; img.style.display = 'none'; icon.style.display = 'flex'; }
    showNotification('播放器背景已清除', 'info');
}

// ========== 播放器外框 ==========
function loadMusicPlayerFrame() {
    const saved = localStorage.getItem('music_player_frame');
    if (saved) {
        document.documentElement.style.setProperty('--music-frame-image', `url(${saved})`);
        document.documentElement.style.setProperty('--music-frame-display', 'block');
        const img = document.getElementById('player-frame-preview-img');
        const icon = document.getElementById('player-frame-preview-icon');
        if (img && icon) { img.src = saved; img.style.display = 'block'; icon.style.display = 'none'; }
    }
}

function uploadMusicPlayerFrame() {
    const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
    input.onchange = e => {
        const f = e.target.files[0]; if (!f) return;
        if (f.size > 1 * 1024 * 1024) { alert('图片不超过1MB'); return; }
        const reader = new FileReader();
        reader.onload = ev => {
            const data = ev.target.result;
            localStorage.setItem('music_player_frame', data);
            document.documentElement.style.setProperty('--music-frame-image', `url(${data})`);
            document.documentElement.style.setProperty('--music-frame-display', 'block');
            const img = document.getElementById('player-frame-preview-img');
            const icon = document.getElementById('player-frame-preview-icon');
            if (img && icon) { img.src = data; img.style.display = 'block'; icon.style.display = 'none'; }
            showNotification('播放器外框已更新', 'success');
        };
        reader.readAsDataURL(f);
    };
    input.click();
}

function clearMusicPlayerFrame() {
    localStorage.removeItem('music_player_frame');
    document.documentElement.style.setProperty('--music-frame-image', 'none');
    document.documentElement.style.setProperty('--music-frame-display', 'none');
    const img = document.getElementById('player-frame-preview-img');
    const icon = document.getElementById('player-frame-preview-icon');
    if (img && icon) { img.src = ''; img.style.display = 'none'; icon.style.display = 'flex'; }
    showNotification('播放器外框已清除', 'info');
}

// 初始化音乐模块（主视图 + 设置视图）
function initMusicModule() {
    if (!audioElement) {
        audioElement = new Audio();
        audioElement.addEventListener('timeupdate', updateProgress);
        audioElement.addEventListener('ended', () => {
            if (playMode === 'single') {
                audioElement.currentTime = 0;
                audioElement.play();
            } else {
                playNext();
            }
        });
    }
    initMusicPlayerUI();
    loadSongList();
    const savedMode = localStorage.getItem('playMode');
    if (savedMode) setPlayMode(savedMode);
    initVolume();
    loadCover();
    
    // 绑定设置视图中的按钮事件（如果存在）
    const addBtn = document.getElementById('music-add-song');
    if (addBtn) addBtn.onclick = addSong;
    const importBtn = document.getElementById('music-import-playlist');
    if (importBtn) importBtn.onclick = importPlaylist;
    const exportBtn = document.getElementById('music-export-playlist');
    if (exportBtn) exportBtn.onclick = exportPlaylist;
    const modeSeq = document.getElementById('music-mode-sequence');
    if (modeSeq) modeSeq.onclick = () => setPlayMode('sequence');
    const modeSingle = document.getElementById('music-mode-single');
    if (modeSingle) modeSingle.onclick = () => setPlayMode('single');
    const modeShuffle = document.getElementById('music-mode-shuffle');
    if (modeShuffle) modeShuffle.onclick = () => setPlayMode('shuffle');
    const uploadCoverBtn = document.getElementById('music-upload-cover');
    if (uploadCoverBtn) uploadCoverBtn.onclick = uploadCover;
    const clearCoverBtn = document.getElementById('music-clear-cover');
    if (clearCoverBtn) clearCoverBtn.onclick = clearCover;
    // 播放器背景
    loadMusicPlayerBg();
    const uploadPlayerBgBtn = document.getElementById('music-upload-player-bg');
    if (uploadPlayerBgBtn) uploadPlayerBgBtn.onclick = uploadMusicPlayerBg;
    const clearPlayerBgBtn = document.getElementById('music-clear-player-bg');
    if (clearPlayerBgBtn) clearPlayerBgBtn.onclick = clearMusicPlayerBg;
    // 播放器外框
    loadMusicPlayerFrame();
    const uploadPlayerFrameBtn = document.getElementById('music-upload-player-frame');
    if (uploadPlayerFrameBtn) uploadPlayerFrameBtn.onclick = uploadMusicPlayerFrame;
    const clearPlayerFrameBtn = document.getElementById('music-clear-player-frame');
    if (clearPlayerFrameBtn) clearPlayerFrameBtn.onclick = clearMusicPlayerFrame;
}

// 导出主函数供 app.js 调用
window.initMusicModule = initMusicModule;