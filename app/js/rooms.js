// Community Group Rooms Management Engine

async function loadJoinedRooms() {
    const communityThreadsTarget = document.getElementById('community-threads-target');
    if (!communityThreadsTarget) return;

    try {
        const res = await fetch('/api/rooms/joined');
        if(!res.ok) return;
        const rooms = await res.json();
        communityThreadsTarget.innerHTML = '';
        joinedRoomsMap.clear();
        
        const statsJoined = document.getElementById('stats-joined-rooms');
        if (statsJoined) statsJoined.innerText = rooms.length;

        if(rooms.length === 0) {
            communityThreadsTarget.innerHTML = '<p class="empty-text">No joined communities yet.</p>';
            return;
        }
        rooms.forEach(room => {
            joinedRoomsMap.set(room.id, room);
            renderRoomInSidebar(room.id, room.room_name, room.room_code, room.room_desc, room.room_icon);
        });
    } catch (err) {
        console.error('Failed to load joined rooms:', err);
    }
}

function renderRoomInSidebar(id, name, code, desc, icon) {
    const communityThreadsTarget = document.getElementById('community-threads-target');
    if(!communityThreadsTarget || document.getElementById(`thread-room-${id}`)) return;

    const item = document.createElement('div');
    item.className = 'thread-item';
    item.id = `thread-room-${id}`;
    if (targetRoomId === id) item.classList.add('active-selected');
    
    const groupIcon = icon || '/uploads/default-group.png';
    
    item.innerHTML = `
        <img src="${groupIcon}" onerror="this.onerror=null; this.src='/uploads/default-group.png';" style="width: 32px; height: 32px; border-radius: 8px; object-fit: cover; background: var(--bg-tertiary); flex-shrink: 0;">
        <div style="display: flex; flex-direction: column; min-width: 0; flex: 1;">
            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600;">${escapeHTML(name)}</span>
            <span style="font-size: 0.72rem; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Code: ${escapeHTML(code)}</span>
        </div>
    `;
    item.onclick = () => selectActiveRoom(id, name, code, desc, groupIcon);
    communityThreadsTarget.appendChild(item);
}

function selectActiveRoom(id, name, code, desc, icon) {
    targetUserId = null; 
    targetRoomId = id;
    
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
