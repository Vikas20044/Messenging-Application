// Account Profile & User Settings Interface Handlers

function setAppTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
        localStorage.setItem('app_theme_preference', 'dark');
        const btnLight = document.getElementById('theme-btn-light');
        const btnDark = document.getElementById('theme-btn-dark');
        if (btnLight) btnLight.classList.remove('active');
        if (btnDark) btnDark.classList.add('active');
    } else {
        document.body.classList.remove('dark-theme');
        localStorage.setItem('app_theme_preference', 'light');
        const btnLight = document.getElementById('theme-btn-light');
        const btnDark = document.getElementById('theme-btn-dark');
        if (btnLight) btnLight.classList.add('active');
        if (btnDark) btnDark.classList.remove('active');
    }
}

function initAppTheme() {
    const savedTheme = localStorage.getItem('app_theme_preference');
    if (savedTheme === 'dark') {
        setAppTheme('dark');
    } else {
        setAppTheme('light');
    }
}

// Immediately initialize theme on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAppTheme);
} else {
    initAppTheme();
}

async function loadProfileHeaderMetadata() {
    try {
        const res = await fetch('/api/profile/me');
        if (res.ok) {
            const data = await res.json();
            const sidebarUserAvatar = document.getElementById('sidebar-user-avatar');
            if (data.profile_pic_url && sidebarUserAvatar) {
                sidebarUserAvatar.src = data.profile_pic_url;
            }
        }
    } catch(e) { 
        console.error(e); 
    }
}

function openProfileModalHandler() {
    const profileModal = document.getElementById('profile-modal');
    const profileUsernameInput = document.getElementById('profile-username-input');
    const profileNameInput = document.getElementById('profile-name-input');
    const profileBioInput = document.getElementById('profile-bio-input');
    const modalAvatarPreview = document.getElementById('modal-avatar-preview');
    const profilePasswordInput = document.getElementById('profile-password-input');

    if (!profileModal) return;

    // Synchronize current theme button state
    const currentTheme = localStorage.getItem('app_theme_preference') || 'light';
    const btnLight = document.getElementById('theme-btn-light');
    const btnDark = document.getElementById('theme-btn-dark');
    if (btnLight && btnDark) {
        if (currentTheme === 'dark') {
            btnLight.classList.remove('active');
            btnDark.classList.add('active');
        } else {
            btnLight.classList.add('active');
            btnDark.classList.remove('active');
        }
    }

    fetch('/api/profile/me')
        .then(res => {
            if (!res.ok) throw new Error();
            return res.json();
        })
        .then(profileData => {
            if (profileUsernameInput) profileUsernameInput.value = profileData.username;
            if (profileNameInput) profileNameInput.value = profileData.full_name || '';
            if (profileBioInput) profileBioInput.value = profileData.bio || '';
            if (profileData.profile_pic_url && modalAvatarPreview) {
                modalAvatarPreview.src = profileData.profile_pic_url;
            }
            if (profilePasswordInput) profilePasswordInput.value = '';
            profileModal.classList.remove('hidden');
        })
        .catch(err => {
            alert("Could not load account profiles.");
        });
}
