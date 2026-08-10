

async function loadJoinedRooms() {
    const communityThreadsTarget = document.getElementById('community-threads-target');
    if (!communityThreadsTarget) return;

    try {
        const res = await fetch('/api/rooms/joined');
        if (!res.ok) return;
        const rooms = await res.json();
        communityThreadsTarget.innerHTML = '';
        joinedRoomsMap.clear();
        
        const statsJoined = document.getElementById('stats-joined-rooms');
        if (statsJoined) statsJoined.innerText = rooms.length;

        if (rooms.length === 0) {
            communityThreadsTarget.innerHTML = '<p class="empty-text">No joined communities yet.</p>';
            return;
        }
        rooms.forEach(room => {
            joinedRoomsMap.set(room.id, room);
            renderRoomInSidebar(room);
        });
    } catch (err) {
        console.error('Failed to load joined rooms:', err);
    }
}

function renderRoomInSidebar(room) {
    const communityThreadsTarget = document.getElementById('community-threads-target');
    if (!communityThreadsTarget) return;

    const id = room.id;
    const name = room.room_name;
    const code = room.room_code;
    const desc = room.room_desc;
    const icon = room.room_icon || '/uploads/default-group.png';
    const unreadCount = parseInt(room.unread_count || 0, 10);

    let snippet = `Code: ${code}`;
    if (room.last_message) {
        const sender = room.last_message_sender ? `@${room.last_message_sender}: ` : '';
        if (room.last_message_type === 'image') snippet = `${sender}📷 Photo`;
        else if (room.last_message_type === 'audio') snippet = `${sender}🎵 Voice message`;
        else if (room.last_message_type === 'video') snippet = `${sender}🎥 Video`;
        else if (room.last_message_type === 'pdf') snippet = `${sender}📄 Document`;
        else snippet = `${sender}${room.last_message}`;
    }

    const timeFormatted = typeof formatThreadTime === 'function' ? formatThreadTime(room.last_activity) : '';
    const unreadPillHtml = (unreadCount > 0 && targetRoomId !== id)
        ? `<span class="unread-count-pill" id="unread-badge-room-${id}">${unreadCount}</span>`
        : '';

    const item = document.createElement('div');
    item.className = 'thread-item';
    item.id = `thread-room-${id}`;
    if (unreadCount > 0 && targetRoomId !== id) item.classList.add('has-unread');
    if (targetRoomId === id) item.classList.add('active-selected');
    
    const isSelected = window.isChatSelected && window.isChatSelected('room', id);
    if (isSelected) item.classList.add('selected-chat');
    
    item.innerHTML = `
        <div class="chat-select-checkbox" onclick="event.stopPropagation(); window.toggleSelectChat('room', ${id});"></div>
        <div class="thread-avatar-wrap">
            <img src="${icon}" onerror="this.onerror=null; this.src='/uploads/default-group.png';" class="thread-avatar-img group-icon">
        </div>
        <div class="thread-content-block">
            <div class="thread-header-row">
                <span class="thread-contact-name">${escapeHTML(name)}</span>
                <span class="thread-time-badge">${timeFormatted}</span>
            </div>
            <div class="thread-snippet-row">
                <span class="thread-last-snippet">${escapeHTML(snippet)}</span>
                ${unreadPillHtml}
            </div>
        </div>
    `;
    item.onclick = () => {
        if (window.isChatSelectionActive && window.isChatSelectionActive()) {
            window.toggleSelectChat('room', id);
            return;
        }
        selectActiveRoom(id, name, code, desc, icon);
    };
    communityThreadsTarget.appendChild(item);
}

function selectActiveRoom(id, name, code, desc, icon) {
    targetUserId = null; 
    targetRoomId = id;
    
    // Clear unread badge immediately from UI
    const targetItem = document.getElementById(`thread-room-${id}`);
    if (targetItem) {
        targetItem.classList.remove('has-unread');
        const badge = targetItem.querySelector('.unread-count-pill');
        if (badge) badge.remove();
    }

    const checkRoomOnlineBtn = document.getElementById('check-room-online-btn');
    const chatWindowTitle = document.getElementById('chat-window-title');
    const chatWindowSubtitle = document.getElementById('chat-window-subtitle');
    const chatWindowAvatar = document.getElementById('chat-window-avatar');

    if (checkRoomOnlineBtn) checkRoomOnlineBtn.classList.remove('hidden');

    // Toggle search parameters & clear filters
    const advSenderContainer = document.getElementById('adv-search-sender-container');
    const clearBtn = document.getElementById('btn-clear-search-filters');
    if (advSenderContainer) advSenderContainer.style.display = 'flex';
    if (clearBtn) clearBtn.click();
    cancelReply();
    if (window.exitMessageSelectMode) window.exitMessageSelectMode();
    
    activeRoomName = name;
    activeRoomCode = code;
    activeRoomDesc = desc || 'No description provided for this group space.';
    activeRoomIcon = icon || '/uploads/default-group.png';
    
    if (chatWindowTitle) chatWindowTitle.innerText = `${name}`;
    if (chatWindowSubtitle) chatWindowSubtitle.innerText = `Access Pass: ${code} • ${activeRoomDesc}`;
    if (chatWindowAvatar) chatWindowAvatar.src = activeRoomIcon;
    
    const emptyNotice = document.getElementById('empty-view-notice');
    const chatSubsystem = document.getElementById('active-chat-subsystem');
    if (emptyNotice) emptyNotice.classList.add('hidden');
    if (chatSubsystem) chatSubsystem.classList.remove('hidden');
    
    document.querySelectorAll('.thread-item').forEach(el => el.classList.remove('active-selected'));
    const activeEl = document.getElementById(`thread-room-${id}`);
    if(activeEl) activeEl.classList.add('active-selected');

    closeMobileSidebar();
    const emojiPickerPanel = document.getElementById('emoji-picker-panel');
    if (emojiPickerPanel) emojiPickerPanel.classList.add('hidden');
    
    setTimeout(scrollToBottom, 50);

    socket.emit('joinGroupRoom', { roomId: id });
}

window.removeGroupMember = function(roomId, targetUserId) {
    showConfirm("Remove Member", "Are you sure you want to remove this member from the group?", async () => {
        try {
            const res = await fetch('/api/rooms/members/remove', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomId, targetUserId })
            });
            if (res.ok) {
                showToast("Member removed successfully.", "success");
                const checkRoomOnlineBtn = document.getElementById('check-room-online-btn');
                if (checkRoomOnlineBtn) checkRoomOnlineBtn.click();
            } else {
                const errData = await res.json();
                showToast(errData.error || "Failed to remove member.", "error");
            }
        } catch (err) {
            console.error(err);
        }
    });
};

window.toggleGroupAdmin = function(roomId, targetUserId, isAdmin) {
    const actionLabel = isAdmin ? "promote this member to admin" : "demote this member from admin status";
    showConfirm("Toggle Administrator", `Are you sure you want to ${actionLabel}?`, async () => {
        try {
            const res = await fetch('/api/rooms/members/toggle-admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomId, targetUserId, isAdmin })
            });
            if (res.ok) {
                showToast("Admin status updated successfully.", "success");
                const checkRoomOnlineBtn = document.getElementById('check-room-online-btn');
                if (checkRoomOnlineBtn) checkRoomOnlineBtn.click();
            } else {
                const errData = await res.json();
                showToast(errData.error || "Failed to update admin status.", "error");
            }
        } catch (err) {
            console.error(err);
        }
    });
};

window.leaveGroup = function(roomId) {
    showConfirm("Leave Group", "Are you sure you want to leave this group?", async () => {
        try {
            const res = await fetch('/api/rooms/leave', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomId })
            });
            if (res.ok) {
                showToast("You have left the group successfully.", "success");
                const groupOnlineModal = document.getElementById('group-online-modal');
                const checkRoomOnlineBtn = document.getElementById('check-room-online-btn');
                if (groupOnlineModal) groupOnlineModal.classList.add('hidden');
                targetRoomId = null;
                document.getElementById('active-chat-subsystem').classList.add('hidden');
                if (checkRoomOnlineBtn) checkRoomOnlineBtn.classList.add('hidden');
                loadJoinedRooms();
            } else {
                const errData = await res.json();
                showToast(errData.error || "Failed to leave group.", "error");
            }
        } catch (err) {
            console.error(err);
        }
    });
};
