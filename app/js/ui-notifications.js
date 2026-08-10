
window.showToast = function(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-card ${type}`;
    toast.style.cssText = `
        pointer-events: auto;
        background: #ffffff;
        border-left: 4px solid var(--accent);
        color: var(--text-main);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        padding: 0.75rem 1.25rem;
        border-radius: 6px;
        font-weight: 600;
        font-size: 0.88rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        min-width: 250px;
        opacity: 0;
        transform: translateY(-20px);
        transition: opacity 0.3s ease, transform 0.3s ease;
    `;

    if (type === 'error') {
        toast.style.borderLeftColor = 'var(--danger)';
    } else if (type === 'success') {
        toast.style.borderLeftColor = '#10b981';
    }

    toast.innerHTML = `
        <span>${message}</span>
        <button style="background:transparent; border:none; color:var(--text-muted); font-size:1.1rem; cursor:pointer; line-height:1;" onclick="this.parentElement.remove()">&times;</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    }, 10);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3500);
};


window.alert = function(message) {
    let type = 'info';
    const lower = message.toLowerCase();
    if (lower.includes('success') || lower.includes('generated') || lower.includes('changed') || lower.includes('updated') || lower.includes('synchronized') || lower.includes('successful') || lower.includes('successfully') || lower.includes('updated!')) {
        type = 'success';
    } else if (lower.includes('error') || lower.includes('failed') || lower.includes('violation') || lower.includes('timeout') || lower.includes('denied') || lower.includes('invalid') || lower.includes('unauthorized')) {
        type = 'error';
    }
    showToast(message, type);
};

window.showConfirm = function(title, message, onConfirm) {
    const modal = document.getElementById('custom-confirm-modal');
    const titleEl = document.getElementById('custom-confirm-title');
    const msgEl = document.getElementById('custom-confirm-message');
    const okBtn = document.getElementById('custom-confirm-ok-btn');
    const cancelBtn = document.getElementById('custom-confirm-cancel-btn');

    if (!modal || !titleEl || !msgEl || !okBtn || !cancelBtn) return;

    titleEl.innerText = title;
    msgEl.innerText = message;

    const newOkBtn = okBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(newOkBtn, okBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    newCancelBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    newOkBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        if (onConfirm) onConfirm();
    });

    modal.classList.remove('hidden');
};


window.openLightbox = function(src, type) {
    const modal = document.getElementById('lightbox-modal');
    const target = document.getElementById('lightbox-content-target');
    const download = document.getElementById('lightbox-download-link');

    if (!modal || !target || !download) return;

    target.innerHTML = '';
    download.href = src;

    if (type === 'image') {
        target.innerHTML = `<img src="${src}" style="max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 6px; box-shadow: 0 10px 40px rgba(0,0,0,0.5);">`;
    } else if (type === 'video') {
        target.innerHTML = `<video src="${src}" controls autoplay style="max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 6px; box-shadow: 0 10px 40px rgba(0,0,0,0.5);"></video>`;
    }

    modal.classList.remove('hidden');
};
