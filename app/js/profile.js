

async function loadProfileHeaderMetadata() {
    try {
        const res = await fetch('/api/profile/me');
        if (res.ok) {
            const data = await res.json();
            const sidebarUserAvatar = document.getElementById('sidebar-user-avatar');
            const mobileMenuAvatar = document.getElementById('mobile-menu-user-avatar');
            if (data.profile_pic_url) {
                if (sidebarUserAvatar) sidebarUserAvatar.src = data.profile_pic_url;
                if (mobileMenuAvatar) mobileMenuAvatar.src = data.profile_pic_url;
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

