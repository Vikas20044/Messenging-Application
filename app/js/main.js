// Main Application Initialization, Event Listeners & UI Controller

// Categorized Extensive Native Emoji Storage Array
const emojiDatabase = {
    smileys: [
        '😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👹','👺','🤡','💩','👻','💀','☠️','👽','👾','🤖','🎃','😺','😸','😹','😻','😼','😽','🙀','😿','😾'
    ],
    people: [
        '👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','🧠','🫀','🫁','🦷','🦴','👀','👁️','舌','👄','💋','🩸','👶','👧','🧒','👦','👩','🧑','👨','👩‍🦱','🧑‍🦱','👨‍🦱','👩‍🦰','🧑‍🦰','👨‍🦰','👱‍♀️','👱','👱‍♂️','👩‍🦳','🧑‍🦳','👨‍🦳','👩‍🦲','🧑‍🦲','👨‍🦲','🧔','👵','🧓','👴','👲','🧕','👮‍♀️','👮','👮‍♂️','👷‍♀️','👷','👷‍♂️','💂‍♀️','💂','💂‍♂️','🕵️‍♀️','🕵️','🕵️‍♂️','👩‍⚕️','🧑‍⚕️','👨‍⚕️'
    ],
    nature: [
        '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐻‍❄️','🐨','🐯','🦁','🐮','🐷','🐽','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🪱','🐛','🦋','🐌','🐞','🐜','🪰','🪲','🪳','🕷️','🕸️','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','鲨','🐊','🐅','🐆','🦓','🦍','🦧','🦣','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🦬','🦙','🐐','🐏','🐑','🐎','🐖','🐄','🐂','🐃',' Deer ','🐕','🐩','🦮','🐕‍🦺','🐈','🐈‍⬛','🐓','🦃','🦤','🦚','🦜',' Swan ',' Flamingo ','🕊️','🐇','🦝','🦨','🦡','🦫','🦦','🦥','🐁','🐀','🐿️','🦔','🐾','🐉','🐲','🌵','🎄','🌲','🌳','🌴','🪵','🌱','🌿','☘️','🍀','🎍','🪴','🎋','🍃','🍂','🍁','🍄','🐚','🪨','🌾','💐','🌷','🌹','🥀','🌺','🌸','🌼','🌻','🌞','🌝','🌛','🌜','🌙','🪐','💫','⭐️','🌟','✨','⚡️','💥','🔥','🌪️','🌈','☀️','🌤️','⛅️','🌥️','☁️','🌧️','⛈️','🌩️','❄️','⛄️','💨','💧','💦','🌊'
    ],
    food: [
        '🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶️','🫑','🌽','🥕','🫒','🧄','🧅','🥔','🍠','🥐','🥯','🍞','🥖','🧀','🥚','🍳','🥞','🧇','🥓','🥩','🍗','🍖','🌭','🍔','🍟','🍕','🫓','🥪','🥙','🧆','🌮','🌯','🫔','🥗','🥘','🫕','🥣','🍲','🍿','🧂','🥫','🍱','🍘','🍙','🍚','🍛','🍜','🍝','🍣','🍤','🍥','🥮','🍡','🥟','🥠','🥡','🍦','🍧','🍨','🍩','🍪','🎂','🍰','🥧','🍫','🍬','🍭','🍮','🍯','🍼','🥛','☕️','🫖','🍵','🍶','🍾','🍷','🍸','🍹','🍺','🍻','🥂','🥃','🥤','🧋','🧃','🧉','🧊'
    ],
    travel: [
        '🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🛵','🛺','🚲','🛴','🛹','🛼','🚏','🛣️','🛤️','🛢️','⛽️','🚨','🚥','🚦','🛑','🚧','⚓️','⛵️','🛥️','🚢','✈️','🛩️','🛫','🛬','🪂','💺','🚁','🚟','🚡','🚀','🛸','🛎️','🧳','⌛️','⏳','⏰','⏱️','⏲️','🕰️','🗺️','🏔️','🌋','🗻','🏕️','🏖️','🏝️','🏞️','🏟️','🏛️','🏗️','🛖','🏠','🏡','🏢','🏣','🏥','🏦','🏨','🏪','🏫','🏬','🏭','🏰','💒','🗼','🗽','⛪️','🕌','🛕','🕍','⛩️','🕋','⛲️','⛺️','🌁','🌃','🏙️','🌄','🌅','🌆','🌇','🌉','🎠','🎡','🎢'
    ],
    activities: [
        '⚽️','🏀','🏈','⚾️','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🏑','🥍','🏏','🪃','🥅','⛳️','🪁','🏹','🎣','🤿','🥊','🥋','🎽','🛹','🛼','🛷','🥌','🎿','⛷️','🏂','🏋️‍♀️','🤺','🤼‍♂️','🤸‍♀️','⛹️‍♂️','🤾‍♂️','🧗‍♀️','🧘‍♀️','🚴‍♂️','🚵‍♂️','🏆','🥇','🥈','🥉','🏅','🎖️','🎟️','🎫','🎪','🎭','🖼️','🎨','🎬','🎤','🎧','🎼','🎹','🥁','🪘','🎷','🎺','🎸','🪕','🎻','🎲','♟️','🎯','🎳','🎮','🎰','🧩'
    ],
    symbols: [
        '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉️','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈️','♉️','♊️','♋️','♌️','♍️','♎️','♏️','♐️','♑️','♒️','♓️','🆔','⚛️','☢️','☣️','🔴','🔵','⚫️','⚪️','🟤','🟣','🟢','🟡','🟠','🟥','🟦','⬛️','⬜️','🟫','🟪','🟩','🟨','🟧','🏁','🚩','🎌','🏴','🏳️','🏳️‍🌈','🏳️‍⚧️','🏴‍☠️','🇮🇳','🇺🇸','🇬🇧','🇨🇦','🇦🇺','🇫🇷','🇯🇵','🇧🇷','🇷🇺','🇨🇳','🇩🇪'
    ]
};

function renderEmojiCategory(categoryName) {
    const emojiGridViewport = document.getElementById('emoji-grid-viewport');
    const msgInput = document.getElementById('msg-input');
    if (!emojiGridViewport || !msgInput) return;

    emojiGridViewport.innerHTML = '';
    const emojis = emojiDatabase[categoryName] || [];
    
    emojis.forEach(emoji => {
        const item = document.createElement('span');
        item.className = 'emoji-item';
        item.innerText = emoji;
        
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const startPos = msgInput.selectionStart;
            const endPos = msgInput.selectionEnd;
            const currentText = msgInput.value;
            
            msgInput.value = currentText.substring(0, startPos) + emoji + currentText.substring(endPos);
            
            const newCursorPos = startPos + emoji.length;
            msgInput.setSelectionRange(newCursorPos, newCursorPos);
            msgInput.focus();
        });
        
        emojiGridViewport.appendChild(item);
    });
}

function openMobileSidebar() {
    const sidebarPanel = document.getElementById('sidebar-panel');
    const sidebarShadow = document.getElementById('sidebar-shadow');
    if (sidebarPanel) sidebarPanel.classList.add('open-mobile');
    if (sidebarShadow) sidebarShadow.classList.add('active');
}

function closeMobileSidebar() {
    const sidebarPanel = document.getElementById('sidebar-panel');
    const sidebarShadow = document.getElementById('sidebar-shadow');
    if (sidebarPanel) sidebarPanel.classList.remove('open-mobile');
    if (sidebarShadow) sidebarShadow.classList.remove('active');
}

function switchMainView(targetView) {
    const emptyNotice = document.getElementById('empty-view-notice');
    const chatSubsystem = document.getElementById('active-chat-subsystem');
    const navbarAboutDropdown = document.getElementById('navbar-about-dropdown');

    if (targetView === 'developer') {
        window.location.href = '/developer';
        return;
    } else if (targetView === 'faq') {
        window.location.href = '/faq';
        return;
    } else if (targetView === 'workspace') {
        if (chatSubsystem) chatSubsystem.classList.add('hidden');
        if (emptyNotice) emptyNotice.classList.remove('hidden');
    }
    
    if (navbarAboutDropdown) navbarAboutDropdown.classList.add('hidden');
    closeMobileSidebar();
}

function resetToDashboard() {
    targetUserId = null;
    targetRoomId = null;
    
    const emptyNotice = document.getElementById('empty-view-notice');
    const chatSubsystem = document.getElementById('active-chat-subsystem');
    
    if (chatSubsystem) {
        chatSubsystem.classList.add('hidden');
        chatSubsystem.classList.add('hidden-layout');
    }
    if (emptyNotice) {
        emptyNotice.classList.remove('hidden');
        emptyNotice.classList.remove('hidden-layout');
    }
    
    document.querySelectorAll('.thread-item, .community-item').forEach(item => {
        item.classList.remove('active-selected');
    });
    
    loadActiveThreads();
    loadJoinedRooms();
    const startPing = Date.now();
    socket.emit('requestUserOnlineStatus', { targetUserId: currentUserId }, () => {
        const latency = Date.now() - startPing;
        const statsLatency = document.getElementById('stats-latency');
        if (statsLatency) statsLatency.innerText = `${latency}ms`;
    });
}

async function initializeIdentity() {
    const res = await fetch('/api/session-user');
    if(!res.ok) { window.location.href = '/login'; return; }
    const data = await res.json();
    currentUserId = data.id;
    currentUsername = data.username;
    
    const userDisplayTag = document.getElementById('user-display-tag');
    if (userDisplayTag) userDisplayTag.innerText = `${currentUsername}`;
    
    const welcomeTitle = document.getElementById('dashboard-welcome-title');
    if (welcomeTitle) {
        const hours = new Date().getHours();
        let greeting = "Welcome back";
        if (hours < 12) greeting = "Good morning";
        else if (hours < 18) greeting = "Good afternoon";
        else greeting = "Good evening";
        welcomeTitle.innerText = `${greeting}, ${currentUsername}! ✨`;
    }

    socket.emit('declareIdentity', { userId: currentUserId });

    const startPing = Date.now();
    socket.emit('requestUserOnlineStatus', { targetUserId: currentUserId }, () => {
        const latency = Date.now() - startPing;
        const statsLatency = document.getElementById('stats-latency');
        if (statsLatency) statsLatency.innerText = `${latency}ms`;
    });

    loadActiveThreads();
    loadJoinedRooms();
    loadProfileHeaderMetadata();
}

// Bind DOM Event Listeners after document is ready
document.addEventListener('DOMContentLoaded', () => {
    const msgInput = document.getElementById('msg-input');
    const chatForm = document.getElementById('chat-form');
    const userSearchInput = document.getElementById('user-search-input');
    const searchResultsDropdown = document.getElementById('search-results-dropdown');
    const chatAttachTrigger = document.getElementById('chat-attach-trigger');
    const attachDropdownMenu = document.getElementById('attach-dropdown-menu');
    const chatMediaInput = document.getElementById('chat-media-input');
    const chatLangTrigger = document.getElementById('chat-lang-trigger');
    const inputLangDropdown = document.getElementById('input-lang-dropdown');
    const chatEmojiTrigger = document.getElementById('chat-emoji-trigger');
    const emojiPickerPanel = document.getElementById('emoji-picker-panel');
    const emojiTabsRow = document.getElementById('emoji-tabs-row');
    const navbarAboutTrigger = document.getElementById('navbar-about-trigger');
    const navbarAboutDropdown = document.getElementById('navbar-about-dropdown');

    const sidebarPanel = document.getElementById('sidebar-panel');
    const resizeHandle = document.getElementById('resize-handle');
    const sidebarShadow = document.getElementById('sidebar-shadow');
    const closeSidebarMobile = document.getElementById('close-sidebar-mobile');
    const openMenuEmpty = document.getElementById('open-menu-empty');
    const backToSidebar = document.getElementById('back-to-sidebar');
    const chatViewport = document.getElementById('chat-viewport');

    const createGroupModal = document.getElementById('create-group-modal');
    const closeGroupModalBtn = document.getElementById('close-group-modal-btn');
    const groupCreationForm = document.getElementById('group-creation-form');
    const groupNameInput = document.getElementById('group-name-input');
    const groupDescInput = document.getElementById('group-desc-input');

    const profileModal = document.getElementById('profile-modal');
    const openProfileBtn = document.getElementById('open-profile-btn');
    const closeProfileBtn = document.getElementById('close-profile-btn');
    const avatarForm = document.getElementById('avatar-form');
    const avatarFileInput = document.getElementById('avatar-file-input');
    const modalAvatarPreview = document.getElementById('modal-avatar-preview');
    const sidebarUserAvatar = document.getElementById('sidebar-user-avatar');
    const profileInfoForm = document.getElementById('profile-info-form');
    const profileNameInput = document.getElementById('profile-name-input');
    const profileBioInput = document.getElementById('profile-bio-input');
    const profileSecurityForm = document.getElementById('profile-security-form');
    const profileUsernameInput = document.getElementById('profile-username-input');
    const profilePasswordInput = document.getElementById('profile-password-input');

    const chatHeaderUserTrigger = document.getElementById('chat-header-user-trigger');
    const publicViewModal = document.getElementById('public-view-modal');
    const closePublicModalBtn = document.getElementById('close-public-modal-btn');

    const closeGroupOnlineModal = document.getElementById('close-group-online-modal');
    const groupOnlineModal = document.getElementById('group-online-modal');

    const receiptsAuditModal = document.getElementById('receipts-audit-modal');
    const closeReceiptsModal = document.getElementById('close-receipts-modal');

    // Lightbox & Preview cancel buttons
    const closeLightboxBtn = document.getElementById('close-lightbox-btn');
    if (closeLightboxBtn) {
        closeLightboxBtn.addEventListener('click', () => {
            const lightboxModal = document.getElementById('lightbox-modal');
            const lightboxTarget = document.getElementById('lightbox-content-target');
            if (lightboxModal) lightboxModal.classList.add('hidden');
            if (lightboxTarget) lightboxTarget.innerHTML = '';
        });
    }

    const cancelReplyBtn = document.getElementById('cancel-reply-btn');
    if (cancelReplyBtn) cancelReplyBtn.addEventListener('click', cancelReply);

    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', cancelEdit);

    // Emoji tabs
    if (emojiTabsRow) {
        emojiTabsRow.querySelectorAll('.emoji-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                emojiTabsRow.querySelectorAll('.emoji-tab-btn').forEach(t => t.classList.remove('active'));
                btn.classList.add('active');
                renderEmojiCategory(btn.getAttribute('data-cat'));
            });
        });
    }

    if (chatEmojiTrigger) {
        chatEmojiTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = emojiPickerPanel.classList.contains('hidden');
            
            document.querySelectorAll('.msg-dropdown').forEach(d => d.classList.add('hidden'));
            if (attachDropdownMenu) attachDropdownMenu.classList.add('hidden');
            if (inputLangDropdown) inputLangDropdown.classList.add('hidden');
            
            if (isHidden) {
                emojiPickerPanel.classList.remove('hidden');
                const activeTab = emojiTabsRow.querySelector('.emoji-tab-btn.active');
                renderEmojiCategory(activeTab ? activeTab.getAttribute('data-cat') : 'smileys');
            } else {
                emojiPickerPanel.classList.add('hidden');
            }
        });
    }

    document.addEventListener('click', (e) => {
        document.querySelectorAll('.msg-dropdown').forEach(d => d.classList.add('hidden'));
        if (attachDropdownMenu) attachDropdownMenu.classList.add('hidden');
        if (emojiPickerPanel && !emojiPickerPanel.contains(e.target) && e.target !== chatEmojiTrigger) {
            emojiPickerPanel.classList.add('hidden');
        }
        const searchContainer = document.querySelector('.navbar-search-container');
        if (searchContainer && searchResultsDropdown && !searchContainer.contains(e.target)) {
            searchResultsDropdown.classList.add('hidden');
        }
    });

    if (navbarAboutTrigger) {
        navbarAboutTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = navbarAboutDropdown.classList.contains('hidden');
            document.querySelectorAll('.msg-dropdown').forEach(d => d.classList.add('hidden'));
            if (isHidden) {
                navbarAboutDropdown.classList.remove('hidden');
            }
        });
    }

    // Sidebar Resize Handle
    let isResizing = false;
    if (resizeHandle && sidebarPanel) {
        resizeHandle.addEventListener('mousedown', () => {
            isResizing = true;
            resizeHandle.classList.add('active');
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            let targetedWidth = e.clientX;
            
            if (targetedWidth < 75) targetedWidth = 0;
            else if (targetedWidth > 480) targetedWidth = 480;
            else if (targetedWidth < 200) targetedWidth = 200;
            
            sidebarPanel.style.width = `${targetedWidth}px`;
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                resizeHandle.classList.remove('active');
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        });
    }

    if (backToSidebar) backToSidebar.addEventListener('click', openMobileSidebar);
    if (openMenuEmpty) openMenuEmpty.addEventListener('click', openMobileSidebar);
    if (closeSidebarMobile) closeSidebarMobile.addEventListener('click', closeMobileSidebar);
    if (sidebarShadow) sidebarShadow.addEventListener('click', closeMobileSidebar);

    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', () => {
            const viewportHeight = window.visualViewport.height;
            document.body.style.height = `${viewportHeight}px`;
            if (chatViewport) chatViewport.style.height = `${viewportHeight}px`;
            scrollToBottom();
        });
    }

    if (msgInput) {
        msgInput.addEventListener('focus', () => setTimeout(scrollToBottom, 150));
    }

    // Search Users Input Listener
    if (userSearchInput && searchResultsDropdown) {
        userSearchInput.addEventListener('input', async (e) => {
            const query = e.target.value.trim();
            if(query.length < 1) { searchResultsDropdown.classList.add('hidden'); return; }

            const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
            if(!res.ok) return;
            const matches = await res.json();

            searchResultsDropdown.innerHTML = '';
            if(matches.length === 0) {
                searchResultsDropdown.innerHTML = '<div class="search-user-item" style="color: var(--text-muted); font-size: 0.85rem; justify-content: center; pointer-events: none;">No users found</div>';
            } else {
                matches.forEach(u => {
                    const block = document.createElement('div');
                    block.className = 'search-user-item';
                    const fullName = u.full_name && u.full_name.trim() !== '' ? u.full_name : u.username;
                    block.innerHTML = `
                        <div class="search-avatar-wrapper">
                            <img src="${u.profile_pic_url || '/uploads/default-avatar.png'}" onerror="this.onerror=null; this.src='/uploads/default-avatar.png';" class="search-avatar">
                        </div>
                        <div class="search-user-info">
                            <span class="search-user-fullname">${escapeHTML(fullName)}</span>
                            <span class="search-user-username">@${escapeHTML(u.username)}</span>
                        </div>
                        <div class="search-chat-badge">Chat</div>
                    `;
                    block.onclick = () => {
                        selectActiveTargetUser(u.id, u.username, u.profile_pic_url);
                        searchResultsDropdown.classList.add('hidden');
                        userSearchInput.value = '';
                    };
                    searchResultsDropdown.appendChild(block);
                });
            }
            searchResultsDropdown.classList.remove('hidden');
        });
    }

    // Attachments & Language trigger dropdowns
    if (chatAttachTrigger && attachDropdownMenu) {
        chatAttachTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            attachDropdownMenu.classList.toggle('toggle-text');
            attachDropdownMenu.classList.toggle('hidden');
        });
    }

    if (chatLangTrigger && inputLangDropdown) {
        chatLangTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = inputLangDropdown.classList.contains('hidden');
            document.querySelectorAll('.msg-dropdown').forEach(d => d.classList.add('hidden'));
            if (isHidden) inputLangDropdown.classList.remove('hidden');
        });

        inputLangDropdown.querySelectorAll('div').forEach(item => {
            item.addEventListener('click', (e) => {
                selectedOutgoingLang = e.target.getAttribute('data-lang');
                if (selectedOutgoingLang === 'auto') {
                    chatLangTrigger.innerText = '🌐';
                    if (msgInput) msgInput.placeholder = "Type a message...";
                } else {
                    chatLangTrigger.innerText = selectedOutgoingLang.toUpperCase();
                    if (msgInput) msgInput.placeholder = `Type phonetically (e.g., namaskara)...`;
                }
                inputLangDropdown.classList.add('hidden');
                if (msgInput) msgInput.focus();
            });
        });
    }

    // Transliteration on keydown (space)
    if (msgInput) {
        msgInput.addEventListener('keydown', async (e) => {
            if (selectedOutgoingLang === 'auto') return;

            if (e.key === ' ') {
                const value = msgInput.value;
                const selectionStart = msgInput.selectionStart;
                const textBeforeCursor = value.substring(0, selectionStart);

                const lastWordMatch = textBeforeCursor.match(/([a-zA-Z0-9]+)$/);
                if (!lastWordMatch) return;

                const lastWord = lastWordMatch[1];
                e.preventDefault(); 

                const itcMap = { kn: 'kn-t-i0-und', ta: 'ta-t-i0-und', te: 'te-t-i0-und', ml: 'ml-t-i0-und', bn: 'bn-t-i0-und', hi: 'hi-t-i0-und' };
                const targetItc = itcMap[selectedOutgoingLang];
                try {
                    const res = await fetch(`https://inputtools.google.com/request?text=${encodeURIComponent(lastWord)}&itc=${targetItc}&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8&app=chat-transliterate`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data[0] === 'SUCCESS' && data[1] && data[1][0] && data[1][0][1] && data[1][0][1][0]) {
                            const transliteratedWord = data[1][0][1][0];
                            const startPos = selectionStart - lastWord.length;
                            const textAfterCursor = value.substring(selectionStart);

                            msgInput.value = value.substring(0, startPos) + transliteratedWord + ' ' + textAfterCursor;
                            const newCursorPos = startPos + transliteratedWord.length + 1;
                            msgInput.setSelectionRange(newCursorPos, newCursorPos);
                            return;
                        }
                    }
                } catch (err) {
                    console.error("Transliteration engine connection timeout.", err);
                }

                const textAfterCursor = value.substring(selectionStart);
                msgInput.value = textBeforeCursor + ' ' + textAfterCursor;
                msgInput.setSelectionRange(selectionStart + 1, selectionStart + 1);
            }
        });
    }

    // Media attachment pickers
    const pickImagesBtn = document.getElementById('pick-images-btn');
    if (pickImagesBtn && chatMediaInput) {
        pickImagesBtn.addEventListener('click', () => {
            chatMediaInput.accept = "image/*";
            chosenMediaType = "images";
            chatMediaInput.click();
        });
    }

    const pickVideosBtn = document.getElementById('pick-videos-btn');
    if (pickVideosBtn && chatMediaInput) {
        pickVideosBtn.addEventListener('click', () => {
            chatMediaInput.accept = "video/*,video/mp4,video/webm";
            chosenMediaType = "videos";
            chatMediaInput.click();
        });
    }

    const pickMusicBtn = document.getElementById('pick-music-btn');
    if (pickMusicBtn && chatMediaInput) {
        pickMusicBtn.addEventListener('click', () => {
            chatMediaInput.accept = "audio/*,audio/mp3,audio/wav,audio/mpeg,audio/ogg";
            chosenMediaType = "audio";
            chatMediaInput.click();
        });
    }

    const pickDocsBtn = document.getElementById('pick-docs-btn');
    if (pickDocsBtn && chatMediaInput) {
        pickDocsBtn.addEventListener('click', () => {
            chatMediaInput.accept = "application/pdf";
            chosenMediaType = "documents";
            chatMediaInput.click();
        });
    }

    // Create Group modal triggers
    const btnCreateRoom = document.getElementById('btn-create-room');
    if (btnCreateRoom && createGroupModal) {
        btnCreateRoom.addEventListener('click', () => {
            if (groupNameInput) groupNameInput.value = '';
            if (groupDescInput) groupDescInput.value = '';
            createGroupModal.classList.remove('hidden');
        });
    }

    if (closeGroupModalBtn && createGroupModal) {
        closeGroupModalBtn.addEventListener('click', () => createGroupModal.classList.add('hidden'));
    }

    if (groupCreationForm) {
        groupCreationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = groupNameInput.value.trim();
            const desc = groupDescInput.value.trim();
            if(!name) return;

            const res = await fetch('/api/rooms/create', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ room_name: name, room_desc: desc })
            });

            if(res.ok) {
                const room = await res.json();
                createGroupModal.classList.add('hidden');
                alert(`Community generated!\nAccess Code: ${room.room_code}`);
                await loadJoinedRooms();
                selectActiveRoom(room.id, room.room_name, room.room_code, room.room_desc, room.room_icon);
            }
        });
    }

    // Join Group Room button
    const btnJoinRoom = document.getElementById('btn-join-room');
    if (btnJoinRoom) {
        btnJoinRoom.addEventListener('click', async () => {
            const code = prompt("Enter the 5-character group room access code:");
            if(!code || code.trim() === "") return;
            
            const res = await fetch(`/api/rooms/lookup/${code.trim()}`);
            if(res.ok) {
                const room = await res.json();
                await loadJoinedRooms();
                selectActiveRoom(room.id, room.room_name, room.room_code, room.room_desc, room.room_icon);
            } else {
                alert("Target configuration record verification index runtime error.");
            }
        });
    }

    if (closeGroupOnlineModal && groupOnlineModal) {
        closeGroupOnlineModal.addEventListener('click', () => groupOnlineModal.classList.add('hidden'));
    }

    // Typing indicator on message input
    let typingIndicatorTimer = null;
    let isCurrentlyTyping = false;

    function emitTypingIndicator(typingState) {
        if (isCurrentlyTyping === typingState) return;
        isCurrentlyTyping = typingState;
        socket.emit('typing', {
            sender_id: currentUserId,
            receiver_id: targetUserId,
            room_id: targetRoomId,
            isTyping: typingState
        });
    }

    if (msgInput) {
        msgInput.addEventListener('input', () => {
            if (!targetUserId && !targetRoomId) return;
            emitTypingIndicator(true);
            
            clearTimeout(typingIndicatorTimer);
            typingIndicatorTimer = setTimeout(() => {
                emitTypingIndicator(false);
            }, 1500);
        });
    }

    // Advanced search panel controls
    const toggleSearchInputBtn = document.getElementById('toggle-search-input-btn');
    const chatMessageSearchInput = document.getElementById('chat-message-search-input');
    const advancedSearchPanel = document.getElementById('advanced-search-panel');
    const closeSearchPanelX = document.getElementById('close-search-panel-x');
    const advSearchText = document.getElementById('adv-search-text');
    const advSearchSender = document.getElementById('adv-search-sender');
    const btnClearSearchFilters = document.getElementById('btn-clear-search-filters');
    const searchChips = document.querySelectorAll('#adv-search-chips .search-chip');

    if (toggleSearchInputBtn && advancedSearchPanel && chatMessageSearchInput) {
        toggleSearchInputBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = advancedSearchPanel.classList.contains('hidden');
            if (isHidden) {
                chatMessageSearchInput.style.width = '130px';
                chatMessageSearchInput.style.padding = '2px 4px';
                advancedSearchPanel.classList.remove('hidden');
                chatMessageSearchInput.focus();
            } else {
                hideAdvancedSearch();
            }
        });
    }

    if (closeSearchPanelX) {
        closeSearchPanelX.addEventListener('click', (e) => {
            e.stopPropagation();
            hideAdvancedSearch();
        });
    }

    if (chatMessageSearchInput && advSearchText) {
        chatMessageSearchInput.addEventListener('input', (e) => {
            advSearchText.value = e.target.value;
            applySearchFilters();
        });

        advSearchText.addEventListener('input', (e) => {
            chatMessageSearchInput.value = e.target.value;
            applySearchFilters();
        });
    }

    if (advSearchSender) {
        advSearchSender.addEventListener('input', () => applySearchFilters());
    }

    searchChips.forEach(chip => {
        chip.addEventListener('click', () => {
            searchChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            applySearchFilters();
        });
    });

    if (btnClearSearchFilters && chatMessageSearchInput && advSearchText && advSearchSender) {
        btnClearSearchFilters.addEventListener('click', () => {
            chatMessageSearchInput.value = '';
            advSearchText.value = '';
            advSearchSender.value = '';
            searchChips.forEach(c => c.classList.remove('active'));
            const allChip = document.querySelector('#adv-search-chips .search-chip[data-type="all"]');
            if (allChip) allChip.classList.add('active');
            applySearchFilters();
        });
    }

    // Main Chat Form Submit
    if (chatForm && msgInput) {
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (emojiPickerPanel) emojiPickerPanel.classList.add('hidden');
            let text = msgInput.value.trim();
            if(text) {
                if (selectedOutgoingLang !== 'auto' && /[a-zA-Z0-9]/.test(text)) {
                    try {
                        msgInput.disabled = true;
                        const itcMap = { kn: 'kn-t-i0-und', ta: 'ta-t-i0-und', te: 'te-t-i0-und', ml: 'ml-t-i0-und', bn: 'bn-t-i0-und', hi: 'hi-t-i0-und' };
                        const res = await fetch(`https://inputtools.google.com/request?text=${encodeURIComponent(text)}&itc=${itcMap[selectedOutgoingLang]}&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8&app=chat-transliterate`);
                        if (res.ok) {
                            const data = await res.json();
                            if (data[0] === 'SUCCESS' && data[1] && data[1][0] && data[1][0][1] && data[1][0][1][0]) {
                                text = data[1][0][1][0];
                            }
                        }
                    } catch(err) {
                        console.error(err);
                    } finally {
                        msgInput.disabled = false;
                    }
                }

                if (activeEditMessageId) {
                    const payload = { messageId: activeEditMessageId, text };
                    socket.emit('editMessage', payload);
                    cancelEdit();
                } else {
                    const payload = {
                        sender_id: currentUserId,
                        text,
                        message_type: 'text',
                        file_url: null,
                        reply_to_message_id: activeReplyMessageId
                    };
                    if(targetUserId) {
                        payload.receiver_id = targetUserId;
                        socket.emit('privateMessage', payload);
                    } else if(targetRoomId) {
                        payload.room_id = targetRoomId;
                        socket.emit('groupMessage', payload);
                    }
                    msgInput.value = '';
                    cancelReply();
                }
                msgInput.focus();
            }
        });
    }

    // Media upload handler
    if (chatMediaInput) {
        chatMediaInput.addEventListener('change', async () => {
            const files = chatMediaInput.files;
            if (files.length === 0 || (!targetUserId && !targetRoomId)) return;

            if (files.length > 10) {
                alert("Constraint Violation: You are limited to transmitting a maximum of 10 file objects per transaction batch.");
                chatMediaInput.value = '';
                return;
            }

            const formData = new FormData();
            for (let i = 0; i < files.length; i++) {
                formData.append('chatFiles', files[i]);
            }

            try {
                if (chatAttachTrigger) chatAttachTrigger.innerText = '⏳';
                const response = await fetch('/api/chat/upload', {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();
                if (chatAttachTrigger) chatAttachTrigger.innerText = '📎';

                if (response.ok && data.success) {
                    data.files.forEach(fileInfo => {
                        if (targetUserId) {
                            socket.emit('privateMessage', {
                                sender_id: currentUserId,
                                receiver_id: targetUserId,
                                text: fileInfo.filename,
                                message_type: fileInfo.file_url ? fileInfo.message_type : 'text',
                                file_url: fileInfo.file_url,
                                reply_to_message_id: activeReplyMessageId
                            });
                        } else if (targetRoomId) {
                            socket.emit('groupMessage', {
                                sender_id: currentUserId,
                                room_id: targetRoomId,
                                text: fileInfo.filename,
                                message_type: fileInfo.file_url ? fileInfo.message_type : 'text',
                                file_url: fileInfo.file_url,
                                reply_to_message_id: activeReplyMessageId
                            });
                        }
                    });
                    cancelReply();
                    chatMediaInput.value = '';
                } else {
                    alert(data.error || 'Attachment upload validation error.');
                }
            } catch(e) {
                if (chatAttachTrigger) chatAttachTrigger.innerText = '📎';
                alert('Network communication upload sequence failure.');
            }
        });
    }

    // Exit Chat button
    const exitChatBtn = document.getElementById('exit-chat-btn');
    if (exitChatBtn) {
        exitChatBtn.addEventListener('click', async () => {
            await fetch('/api/logout');
            window.location.href = '/login';
        });
    }

    // Profile Settings triggers
    if (openProfileBtn) {
        openProfileBtn.addEventListener('click', openProfileModalHandler);
    }

    if (closeProfileBtn && profileModal) {
        closeProfileBtn.addEventListener('click', () => profileModal.classList.add('hidden'));
    }

    if (avatarFileInput && modalAvatarPreview) {
        avatarFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) modalAvatarPreview.src = URL.createObjectURL(file);
        });
    }

    if (avatarForm && avatarFileInput) {
        avatarForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const file = avatarFileInput.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('avatar', file);

            try {
                const res = await fetch('/api/profile/upload-avatar', { method: 'POST', body: formData });
                const data = await res.json();
                if (res.ok && data.success) {
                    if (sidebarUserAvatar) sidebarUserAvatar.src = data.profile_pic_url;
                    alert("Profile picture changed!");
                } else {
                    alert(data.error || "Upload validation failed.");
                }
            } catch (err) {
                alert("Server interface error occurred uploading image.");
            }
        });
    }

    if (profileInfoForm && profileNameInput && profileBioInput) {
        profileInfoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                full_name: profileNameInput.value.trim(),
                bio: profileBioInput.value.trim()
            };

            try {
                const res = await fetch('/api/profile/update-info', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    alert("Profile metadata updated!");
                } else {
                    const data = await res.json();
                    alert(data.error);
                }
            } catch (err) {
                alert("Network communication error.");
            }
        });
    }

    if (profileSecurityForm && profileUsernameInput && profilePasswordInput) {
        profileSecurityForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                username: profileUsernameInput.value.trim(),
                password: profilePasswordInput.value
            };

            try {
                const res = await fetch('/api/profile/update-credentials', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (res.ok) {
                    const userDisplayTag = document.getElementById('user-display-tag');
                    if (userDisplayTag) userDisplayTag.innerText = `${payload.username}`;
                    currentUsername = payload.username;
                    alert("Account security credentials synchronized!");
                    profilePasswordInput.value = '';
                } else {
                    alert(data.error || "Could not change credentials.");
                }
            } catch (err) {
                alert("Failed to contact configuration endpoints.");
            }
        });
    }

    // Public detail card triggers
    if (chatHeaderUserTrigger && publicViewModal) {
        chatHeaderUserTrigger.addEventListener('click', async () => {
            const publicUsernameDisplay = document.getElementById('public-username-display');
            const publicFullnameDisplay = document.getElementById('public-fullname-display');
            const publicBioDisplay = document.getElementById('public-bio-display');
            const publicAvatarDisplay = document.getElementById('public-avatar-display');
            const publicDetailLabelContext = document.getElementById('public-detail-label-context');
            const publicModalHeaderTitle = document.getElementById('public-modal-header-title');

            if (targetRoomId) {
                if (publicUsernameDisplay) publicUsernameDisplay.innerText = activeRoomName;
                if (publicFullnameDisplay) publicFullnameDisplay.innerText = `Community Registry Code: ${activeRoomCode}`;
                if (publicBioDisplay) publicBioDisplay.innerText = activeRoomDesc;
                if (publicAvatarDisplay) publicAvatarDisplay.src = activeRoomIcon;
                if (publicDetailLabelContext) publicDetailLabelContext.innerText = "Group Description";
                if (publicModalHeaderTitle) publicModalHeaderTitle.innerText = `Group Workspace Details`;
                publicViewModal.classList.remove('hidden');
                return;
            }
            
            if (!targetUserId) return;
            try {
                const res = await fetch(`/api/profile/user/${targetUserId}`);
                if (!res.ok) return;
                const data = await res.json();

                if (publicUsernameDisplay) publicUsernameDisplay.innerText = `${data.username}`;
                if (publicFullnameDisplay) publicFullnameDisplay.innerText = data.full_name || 'No full name provided';
                if (publicBioDisplay) publicBioDisplay.innerText = data.bio || 'No biography written yet.';
                if (publicAvatarDisplay) publicAvatarDisplay.src = data.profile_pic_url || '/uploads/default-avatar.png';
                if (publicDetailLabelContext) publicDetailLabelContext.innerText = "Biography";
                if (publicModalHeaderTitle) publicModalHeaderTitle.innerText = `User Profile Card`;
                
                publicViewModal.classList.remove('hidden');
            } catch (err) {
                console.error("Failed parsing profile interface lookups.", err);
            }
        });
    }

    if (closePublicModalBtn && publicViewModal) {
        closePublicModalBtn.addEventListener('click', () => publicViewModal.classList.add('hidden'));
    }

    if (closeReceiptsModal && receiptsAuditModal) {
        closeReceiptsModal.addEventListener('click', () => receiptsAuditModal.classList.add('hidden'));
    }

    // Starred Messages Modal triggers
    const openStarredBtn = document.getElementById('open-starred-btn');
    const closeStarredModalBtn = document.getElementById('close-starred-modal-btn');
    const starredMessagesModal = document.getElementById('starred-messages-modal');

    if (openStarredBtn) {
        openStarredBtn.addEventListener('click', window.loadStarredMessages);
    }
    if (closeStarredModalBtn && starredMessagesModal) {
        closeStarredModalBtn.addEventListener('click', () => starredMessagesModal.classList.add('hidden'));
    }

    // Touch swipe gesture handlers
    let touchStartX = 0;
    let touchEndX = 0;

    document.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    document.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        const swipeDistance = touchEndX - touchStartX;
        if (swipeDistance > 70 && touchStartX < 50) openMobileSidebar();
        if (swipeDistance < -70 && sidebarPanel && sidebarPanel.classList.contains('open-mobile')) closeMobileSidebar();
    }, { passive: true });

    // Socket Event Subscriptions
    socket.on('chatHistory', (history) => {
        const messageHistory = document.getElementById('message-history');
        if (messageHistory) {
            messageHistory.innerHTML = '';
            history.forEach(appendMessage);
            scrollToBottom();
        }
    });

    socket.on('message', (msg) => {
        if((targetUserId && msg.sender_id && !msg.room_id) || (targetRoomId && msg.room_id == targetRoomId)) {
            appendMessage(msg);
            
            if (targetRoomId && msg.sender_id !== currentUserId) {
                socket.emit('explicitMarkGroupMessageAsRead', { messageId: msg._id, userId: currentUserId, roomId: targetRoomId });
            }
            scrollToBottom();
        }
        loadActiveThreads();
    });

    socket.on('messageReadUpdate', (messageId) => {
        const ticks = document.getElementById('ticks-' + messageId);
        if (ticks) ticks.classList.add('read');
    });

    socket.on('messageEdited', ({ messageId, newText }) => {
        const textSpan = document.getElementById(`text-span-${messageId}`);
        if (textSpan) {
            textSpan.innerHTML = `${escapeHTML(newText)} <span style="font-size: 0.72rem; color: var(--text-muted); margin-left: 4px; font-style: italic;">(edited)</span>`;
        }
        
        const dropdown = document.getElementById(`drop-${messageId}`);
        if (dropdown) {
            const safeText = newText.replace(/"/g, '&quot;').replace(/'/g, "\\'");
            const divs = dropdown.querySelectorAll('div[onclick^="translateMessageText"], div[onclick^="triggerReplyMessage"], div[onclick^="triggerEditMessage"]');
            divs.forEach(div => {
                const onclick = div.getAttribute('onclick');
                if (onclick) {
                    if (onclick.includes('translateMessageText')) {
                        const parts = onclick.split("', '");
                        if (parts.length >= 2) {
                            parts[1] = safeText;
                            div.setAttribute('onclick', parts.join("', '"));
                        }
                    } else if (onclick.includes('triggerReplyMessage')) {
                        const parts = onclick.split("', '");
                        if (parts.length >= 2) {
                            parts[2] = safeText;
                            div.setAttribute('onclick', parts.join("', '"));
                        }
                    } else if (onclick.includes('triggerEditMessage')) {
                        const parts = onclick.split("', '");
                        if (parts.length >= 2) {
                            parts[1] = safeText + "')";
                            div.setAttribute('onclick', parts.join("', '"));
                        }
                    }
                }
            });
        }
    });

    socket.on('messageDeleted', ({ messageId }) => {
        const textSpan = document.getElementById(`text-span-${messageId}`);
        if (textSpan) {
            textSpan.innerText = "This message was deleted";
            textSpan.style.fontStyle = "italic";
            textSpan.style.color = "var(--text-muted)";
            const label = textSpan.querySelector('.translated-label');
            if (label) label.remove();
        }
        const threeDots = document.querySelector(`#msg-card-${messageId} .three-dots-icon`);
        if (threeDots) threeDots.remove();
        const dropdown = document.getElementById(`drop-${messageId}`);
        if (dropdown) dropdown.remove();
        
        if (activeReplyMessageId === messageId) cancelReply();
        if (activeEditMessageId === messageId) cancelEdit();

        const bubble = document.getElementById(`bubble-${messageId}`);
        if (bubble) {
            bubble.innerHTML = `
                <div class="text-content-wrapper" style="position: relative; display: flex; align-items: flex-start; gap: 8px; width: 100%;">
                    <span id="text-span-${messageId}" style="font-style: italic; color: var(--text-muted);">This message was deleted</span>
                </div>`;
        }
    });

    socket.on('profileUpdated', (data) => {
        const targetNameEl = document.getElementById(`thread-name-${data.userId}`);
        const targetAvatarEl = document.getElementById(`thread-avatar-${data.userId}`);
        
        if (data.username && targetNameEl) targetNameEl.innerText = `${data.username}`;
        if (data.profile_pic_url && targetAvatarEl) targetAvatarEl.src = data.profile_pic_url;

        if (targetUserId === data.userId) {
            const chatWindowTitle = document.getElementById('chat-window-title');
            const chatWindowAvatar = document.getElementById('chat-window-avatar');
            if (data.username && chatWindowTitle) chatWindowTitle.innerText = `${data.username}`;
            if (data.profile_pic_url && chatWindowAvatar) chatWindowAvatar.src = data.profile_pic_url;
        }
    });

    socket.on('networkIdentityStatusChange', ({ userId, status }) => {
        const badge = document.getElementById(`status-badge-${userId}`);
        if (badge) badge.className = `global-presence-badge ${status}`;

        if (targetUserId === userId) {
            const chatWindowSubtitle = document.getElementById('chat-window-subtitle');
            if (chatWindowSubtitle) chatWindowSubtitle.innerText = status === 'online' ? '🟢 Online Now' : '⚪ Offline';
        }
    });

    socket.on('broadcastGroupReadsSynchronized', ({ roomId }) => {
        if (targetRoomId === roomId) {
            document.querySelectorAll('.group-ticks-tracker').forEach(async (el) => {
                const msgId = el.getAttribute('data-msg-id');
                socket.emit('fetchGroupMessageReadLedger', { messageId: msgId }, (ledger) => {
                    if (ledger && ledger.length > 0) {
                        el.innerText = `✓ Seen by ${ledger.length}`;
                        el.classList.add('read');
                    }
                });
            });
        }
    });

    socket.on('userKickedFromRoom', ({ roomId, userId }) => {
        if (userId === currentUserId) {
            alert("You have been removed from the group by an administrator.");
            if (groupOnlineModal) groupOnlineModal.classList.add('hidden');
            if (targetRoomId === roomId) {
                targetRoomId = null;
                document.getElementById('active-chat-subsystem').classList.add('hidden');
                const checkRoomOnlineBtn = document.getElementById('check-room-online-btn');
                if (checkRoomOnlineBtn) checkRoomOnlineBtn.classList.add('hidden');
            }
            loadJoinedRooms();
        } else {
            if (targetRoomId === roomId) {
                socket.emit('fetchGroupOnlineRoster', { roomId: targetRoomId }, () => {
                    const checkRoomOnlineBtn = document.getElementById('check-room-online-btn');
                    if (checkRoomOnlineBtn) checkRoomOnlineBtn.click();
                });
            }
        }
    });

    socket.on('userTyping', ({ userId, roomId, isTyping }) => {
        const chatWindowSubtitle = document.getElementById('chat-window-subtitle');
        if (!chatWindowSubtitle) return;

        if (roomId && targetRoomId === roomId) {
            if (isTyping) {
                socket.emit('fetchGroupOnlineRoster', { roomId: targetRoomId }, (roster) => {
                    const typist = roster.find(x => x.id === userId);
                    if (typist) {
                        chatWindowSubtitle.innerText = `✍️ ${typist.username} is typing...`;
                    }
                });
            } else {
                chatWindowSubtitle.innerText = '👥 Group Chat';
            }
        } else if (!roomId && targetUserId === userId) {
            chatWindowSubtitle.innerText = isTyping ? '✍️ typing...' : '🟢 Online Now';
        }
    });

    socket.on('reactionUpdated', ({ messageId, reactions }) => {
        const target = document.getElementById(`reactions-target-${messageId}`);
        if (target) target.innerHTML = renderReactions(messageId, reactions);
    });

    // Run identity setup
    initializeIdentity();
});

window.loadStarredMessages = async function() {
    const target = document.getElementById('starred-messages-list-target');
    const modal = document.getElementById('starred-messages-modal');
    if (!target || !modal) return;

    target.innerHTML = '<p class="empty-text">Loading starred messages...</p>';
    modal.classList.remove('hidden');

    try {
        const res = await fetch('/api/messages/starred');
        if (!res.ok) return;
        const messages = await res.json();

        target.innerHTML = '';
        if (messages.length === 0) {
            target.innerHTML = '<p class="empty-text">No starred messages yet. Use the message menu (⋮) to star messages.</p>';
            return;
        }

        messages.forEach(msg => {
            const card = document.createElement('div');
            card.className = 'starred-msg-card';
            card.style.cursor = 'pointer';
            
            const dateObj = new Date(msg.starred_at || msg.timestamp);
            const dateStr = `${dateObj.toLocaleDateString()} at ${dateObj.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`;
            const contextText = msg.room_name ? `in Group "${escapeHTML(msg.room_name)}"` : `from @${escapeHTML(msg.sender_username)}`;

            let bodyContent = escapeHTML(msg.text);
            if (msg.message_type === 'image') bodyContent = `📷 Image Attachment`;
            else if (msg.message_type === 'audio') bodyContent = `🎵 Audio Recording`;
            else if (msg.message_type === 'video') bodyContent = `🎥 Video Clip`;
            else if (msg.message_type === 'pdf') bodyContent = `📄 PDF Document`;

            card.innerHTML = `
                <div class="starred-msg-header">
                    <div class="starred-msg-user">
                        <img src="${msg.sender_avatar}" onerror="this.onerror=null; this.src='/uploads/default-avatar.png';" class="starred-msg-avatar">
                        <span>${escapeHTML(msg.sender_username)}</span>
                        <span style="font-size:0.72rem; color:var(--text-muted); font-weight:normal;">(${contextText})</span>
                    </div>
                    <span class="starred-msg-time">${dateStr}</span>
                </div>
                <div class="starred-msg-body">${bodyContent}</div>
            `;
            card.onclick = () => {
                modal.classList.add('hidden');
                if (msg.room_id) {
                    selectActiveRoom(msg.room_id, msg.room_name || 'Group', '', '', '');
                } else if (msg.target_user_id) {
                    selectActiveTargetUser(msg.target_user_id, msg.target_username, msg.target_avatar);
                }
                setTimeout(() => scrollToMessage(msg.message_id), 300);
            };
            target.appendChild(card);
        });
    } catch (err) {
        console.error(err);
        target.innerHTML = '<p class="empty-text">Failed to load starred messages.</p>';
    }
};
