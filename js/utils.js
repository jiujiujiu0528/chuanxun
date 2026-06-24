// 显示通知
function showNotification(message, type = 'info', duration = 3000) {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i><span>${message}</span>`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), duration);
}

// HTML 转义
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// 简单存储封装
function saveToLocalStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}
function loadFromLocalStorage(key, defaultValue) {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
    return defaultValue;
}
/**
 * 将图片裁剪为正方形（最大边长为 maxSize）
 * @param {File} file 图片文件
 * @param {number} maxSize 输出图片的最大边长（像素），默认 300
 * @returns {Promise<string>} base64 字符串
 */
function cropImageToSquare(file, maxSize = 300) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const minSide = Math.min(img.width, img.height);
                const sx = (img.width - minSide) / 2;
                const sy = (img.height - minSide) / 2;
                const canvas = document.createElement('canvas');
                canvas.width = maxSize;
                canvas.height = maxSize;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, maxSize, maxSize);
                resolve(canvas.toDataURL('image/jpeg', 0.9));
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
function showModal(modal) {
    if (!modal) return;
    modal.style.display = 'flex';
    modal.classList.add('active');
}

function hideModal(modal) {
    if (!modal) return;
    modal.style.display = 'none';
    modal.classList.remove('active');
}