// ========== 其他设置模块 ==========
function initOtherSettings() {
    bindGalleryLink();
    bindAboutLink();
}

function bindGalleryLink() {
    const galleryItem = document.getElementById('gallery-link');
    if (galleryItem) {
        galleryItem.onclick = () => {
            window.open('https://example.com/your-gallery', '_blank');
            return false;
        };
    }
}

function bindAboutLink() {
    const aboutItem = document.getElementById('about-link');
    if (aboutItem) {
        aboutItem.onclick = () => {
            const modal = document.getElementById('about-modal');
            if (modal) {
                modal.style.display = 'flex';
            }
            return false;
        };
    }
    const closeBtn = document.getElementById('close-about-modal');
    if (closeBtn) {
        closeBtn.onclick = () => {
            const modal = document.getElementById('about-modal');
            if (modal) {
                modal.style.display = 'none';
            }
        };
    }
}