
const messageStore = new Map();

let isMessageSelectMode = false;
const selectedMessageIds = new Set();

window.isMessageSelectionActive = function() {
    return isMessageSelectMode;
};

window.enterMessageSelectMode = function(initialMessageId) {
    isMessageSelectMode = true;
    selectedMessageIds.clear();
    if (initialMessageId) {
        selectedMessageIds.add(String(initialMessageId));
    }
    const messageHistory = document.getElementById('message-history');
    if (messageHistory) messageHistory.classList.add('message-select-mode');
    
    const selectBar = document.getElementById('msg-select-action-bar');
    if (selectBar) selectBar.classList.remove('hidden');

    document.querySelectorAll('.msg-dropdown').forEach(d => d.classList.add('hidden'));

    window.syncMessageSelectionUI();
    window.updateMessageSelectBar();
};

window.exitMessageSelectMode = function() {
    isMessageSelectMode = false;
    selectedMessageIds.clear();
    const messageHistory = document.getElementById('message-history');
    if (messageHistory) messageHistory.classList.remove('message-select-mode');
    
    const selectBar = document.getElementById('msg-select-action-bar');
    if (selectBar) selectBar.classList.add('hidden');

    window.syncMessageSelectionUI();
};

window.toggleSelectMessage = function(messageId) {
    const idStr = String(messageId);
    if (!isMessageSelectMode) {
        window.enterMessageSelectMode(idStr);
        return;
    }
    if (selectedMessageIds.has(idStr)) {
        selectedMessageIds.delete(idStr);
    } else {
        selectedMessageIds.add(idStr);
    }
    window.syncMessageSelectionUI();
    window.updateMessageSelectBar();
};

window.syncMessageSelectionUI = function() {
    document.querySelectorAll('.message-row').forEach(row => {
        const id = row.id.replace('msg-card-', '');
        if (selectedMessageIds.has(id)) {
            row.classList.add('selected');
        } else {
            row.classList.remove('selected');
        }
    });
};

window.selectAllMessages = function() {
    const allRows = document.querySelectorAll('.message-row');
    if (allRows.length === 0) return;
    
    const allSelected = Array.from(allRows).every(row => {
        const id = row.id.replace('msg-card-', '');
        return selectedMessageIds.has(id);
    });

    if (allSelected) {
        selectedMessageIds.clear();
    } else {
        allRows.forEach(row => {
            const id = row.id.replace('msg-card-', '');
            selectedMessageIds.add(id);
        });
    }
    window.syncMessageSelectionUI();
    window.updateMessageSelectBar();
};

window.updateMessageSelectBar = function() {
    const count = selectedMessageIds.size;
    const countText = document.getElementById('msg-select-count-text');
    const fwdCountTag = document.getElementById('forward-count-tag');
    const delCountTag = document.getElementById('delete-count-tag');
    const fwdBtn = document.getElementById('btn-forward-selected-msgs');
    const delBtn = document.getElementById('btn-delete-selected-msgs');
    const selectAllBtn = document.getElementById('btn-select-all-msgs');

    if (countText) countText.innerText = `${count} Selected`;
    if (fwdCountTag) fwdCountTag.innerText = count;
    if (delCountTag) delCountTag.innerText = count;

    if (fwdBtn) fwdBtn.disabled = count === 0;
    if (delBtn) delBtn.disabled = count === 0;

    const allRows = document.querySelectorAll('.message-row');
    if (selectAllBtn && allRows.length > 0) {
        const isAll = count === allRows.length && count > 0;
        selectAllBtn.innerText = isAll ? 'Deselect All' : 'Select All';
    }
};

window.deleteSelectedMessages = function() {
    if (selectedMessageIds.size === 0) return;
    const msgIds = Array.from(selectedMessageIds);
    const count = msgIds.length;

    showConfirm("Delete Messages", `Are you sure you want to delete the ${count} selected message(s)? This will mark them as deleted for all participants.`, async () => {
        try {
            const res = await fetch('/api/messages/batch-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messageIds: msgIds })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                showToast(`Deleted ${data.deletedCount} message(s) successfully!`, "success");
                window.exitMessageSelectMode();
            } else {
                showToast(data.error || "Failed to delete messages.", "error");
            }
        } catch (err) {
            console.error('Batch delete error:', err);
            showToast("Server communication error deleting messages.", "error");
        }
    });
};

const selectedForwardDestinations = new Set();

window.triggerSingleMessageForward = function(messageId) {
    document.querySelectorAll('.msg-dropdown').forEach(d => d.classList.add('hidden'));
    window.enterMessageSelectMode(messageId);
    window.openForwardModal();
};

window.openForwardModal = async function() {
    if (selectedMessageIds.size === 0) {
        showToast("Please select at least one message to forward.", "info");
        return;
    }

    selectedForwardDestinations.clear();
    const modal = document.getElementById('forward-messages-modal');
    const countLabel = document.getElementById('forward-msg-count-label');
    const previewSample = document.getElementById('forward-preview-sample');
    const searchInput = document.getElementById('forward-search-input');
    const destinationsList = document.getElementById('forward-destinations-list');
    const confirmBtn = document.getElementById('btn-confirm-forward');
    const selectedTargetsCount = document.getElementById('forward-selected-targets-count');

    if (countLabel) countLabel.innerText = `${selectedMessageIds.size} message(s)`;
    if (searchInput) searchInput.value = '';
    if (confirmBtn) confirmBtn.disabled = true;
    if (selectedTargetsCount) selectedTargetsCount.innerText = '0 selected';

    if (previewSample) {
        const firstId = selectedMessageIds.values().next().value;
        const firstMsg = messageStore.get(String(firstId));
        if (firstMsg) {
            let snippet = firstMsg.text || '';
            if (firstMsg.message_type === 'image') snippet = '📷 Photo';
            else if (firstMsg.message_type === 'audio') snippet = '🎵 Voice message';
            else if (firstMsg.message_type === 'video') snippet = '🎥 Video';
            else if (firstMsg.message_type === 'pdf') snippet = '📄 Document';
            previewSample.innerText = `"${snippet}"`;
        } else {
            previewSample.innerText = '';
        }
    }

    if (destinationsList) {
        destinationsList.innerHTML = '<p class="empty-text" style="padding:1rem 0; text-align:center;">Loading contacts & communities...</p>';
    }

    if (modal) modal.classList.remove('hidden');

    try {
        const [chatsRes, roomsRes] = await Promise.all([
            fetch('/api/chats/active'),
            fetch('/api/rooms/joined')
        ]);
        const chats = chatsRes.ok ? await chatsRes.json() : [];
        const rooms = roomsRes.ok ? await roomsRes.json() : [];

        window.cachedForwardChats = chats;
        window.cachedForwardRooms = rooms;

        window.renderForwardDestinations(chats, rooms, '');
    } catch (err) {
        console.error('Error fetching forward destinations:', err);
        if (destinationsList) destinationsList.innerHTML = '<p class="empty-text" style="color:var(--danger);">Failed to load destinations.</p>';
    }
};

window.renderForwardDestinations = function(chats, rooms, filterText) {
    const destinationsList = document.getElementById('forward-destinations-list');
    if (!destinationsList) return;
    destinationsList.innerHTML = '';

    const query = (filterText || '').toLowerCase().trim();

    const filteredChats = (chats || []).filter(c => {
        if (c.is_deleted) return false;
        if (!query) return true;
        return (c.username && c.username.toLowerCase().includes(query)) || 
               (c.full_name && c.full_name.toLowerCase().includes(query));
    });

    const filteredRooms = (rooms || []).filter(r => {
        if (!query) return true;
        return (r.room_name && r.room_name.toLowerCase().includes(query)) ||
               (r.room_code && r.room_code.toLowerCase().includes(query));
    });

    if (filteredChats.length === 0 && filteredRooms.length === 0) {
        destinationsList.innerHTML = '<p class="empty-text" style="text-align:center; padding:1.5rem 0;">No matching contacts or communities found.</p>';
        return;
    }

    if (filteredRooms.length > 0) {
        const secTitle = document.createElement('div');
        secTitle.style.cssText = 'font-size:0.7rem; font-weight:800; color:var(--accent); text-transform:uppercase; margin-top:4px; padding:0 4px;';
        secTitle.innerText = 'Communities';
        destinationsList.appendChild(secTitle);

        filteredRooms.forEach(room => {
            const destKey = `room:${room.id}`;
            const isSelected = selectedForwardDestinations.has(destKey);
            const item = document.createElement('div');
            item.className = `forward-destination-item ${isSelected ? 'selected' : ''}`;
            item.id = `dest-item-${destKey}`;
            item.innerHTML = `
                <div class="forward-destination-left">
                    <img src="${room.room_icon || '/uploads/default-group.png'}" onerror="this.onerror=null; this.src='/uploads/default-group.png';" class="forward-dest-avatar">
                    <div class="forward-dest-meta">
                        <span class="forward-dest-name">${escapeHTML(room.room_name)}</span>
                        <span class="forward-dest-sub">Pass: ${escapeHTML(room.room_code)}</span>
                    </div>
                </div>
                <div class="forward-dest-checkbox"></div>
            `;
            item.onclick = () => window.toggleForwardDestination(destKey);
            destinationsList.appendChild(item);
        });
    }

    if (filteredChats.length > 0) {
        const secTitle = document.createElement('div');
        secTitle.style.cssText = 'font-size:0.7rem; font-weight:800; color:var(--accent); text-transform:uppercase; margin-top:8px; padding:0 4px;';
        secTitle.innerText = 'Recent Contacts';
        destinationsList.appendChild(secTitle);

        filteredChats.forEach(user => {
            const destKey = `user:${user.id}`;
            const isSelected = selectedForwardDestinations.has(destKey);
            const item = document.createElement('div');
            item.className = `forward-destination-item ${isSelected ? 'selected' : ''}`;
            item.id = `dest-item-${destKey}`;
            item.innerHTML = `
                <div class="forward-destination-left">
                    <img src="${user.profile_pic_url || '/uploads/default-avatar.png'}" onerror="this.onerror=null; this.src='/uploads/default-avatar.png';" class="forward-dest-avatar">
                    <div class="forward-dest-meta">
                        <span class="forward-dest-name">${escapeHTML(user.full_name || user.username)}</span>
                        <span class="forward-dest-sub">@${escapeHTML(user.username)}</span>
                    </div>
                </div>
                <div class="forward-dest-checkbox"></div>
            `;
            item.onclick = () => window.toggleForwardDestination(destKey);
            destinationsList.appendChild(item);
        });
    }
};

window.toggleForwardDestination = function(destKey) {
    if (selectedForwardDestinations.has(destKey)) {
        selectedForwardDestinations.delete(destKey);
    } else {
        selectedForwardDestinations.add(destKey);
    }

    const item = document.getElementById(`dest-item-${destKey}`);
    if (item) {
        if (selectedForwardDestinations.has(destKey)) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    }

    const count = selectedForwardDestinations.size;
    const confirmBtn = document.getElementById('btn-confirm-forward');
    const selectedTargetsCount = document.getElementById('forward-selected-targets-count');

    if (confirmBtn) confirmBtn.disabled = count === 0;
    if (selectedTargetsCount) selectedTargetsCount.innerText = `${count} selected`;
};

window.closeForwardModal = function() {
    const modal = document.getElementById('forward-messages-modal');
    if (modal) modal.classList.add('hidden');
};

window.submitForwardMessages = async function() {
    if (selectedMessageIds.size === 0 || selectedForwardDestinations.size === 0) return;

    const targets = Array.from(selectedForwardDestinations).map(key => {
        const [type, idStr] = key.split(':');
        return { type, id: parseInt(idStr, 10) };
    });

    const messageIds = Array.from(selectedMessageIds).map(id => parseInt(id, 10));
    const confirmBtn = document.getElementById('btn-confirm-forward');
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.innerText = 'Sending...';
    }

    try {
        const res = await fetch('/api/messages/forward', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messageIds, targets })
        });
        const data = await res.json();
        if (res.ok && data.success) {
            showToast(`Forwarded ${messageIds.length} message(s) to ${targets.length} destination(s)! ↗️`, "success");
            window.closeForwardModal();
            window.exitMessageSelectMode();
        } else {
            showToast(data.error || "Failed to forward messages.", "error");
            if (confirmBtn) {
                confirmBtn.disabled = false;
                confirmBtn.innerText = 'Send ↗️';
            }
        }
    } catch (err) {
        console.error('Forward submission error:', err);
        showToast("Server error during forwarding.", "error");
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.innerText = 'Send ↗️';
        }
    }
};

window.triggerReplyMessage = function(messageId) {
    document.querySelectorAll('.msg-dropdown').forEach(d => {
        d.classList.add('hidden');
        d.classList.remove('drop-up');
    });
    document.querySelectorAll('.message-row').forEach(r => r.style.zIndex = '');

    const msg = messageStore.get(String(messageId));
    if (!msg) return;

    activeReplyMessageId = msg._id;
    cancelEdit();

    const replyPreviewBar = document.getElementById('reply-preview-bar');
    const previewUsername = document.getElementById('reply-preview-username');
    const previewText = document.getElementById('reply-preview-text');
    const msgInput = document.getElementById('msg-input');

    if (!replyPreviewBar || !previewUsername || !previewText || !msgInput) return;

    let displaySnippet = msg.text || '';
    if (msg.message_type === 'image') displaySnippet = '📷 Image';
    else if (msg.message_type === 'audio') displaySnippet = '🎵 Audio Message';
    else if (msg.message_type === 'video') displaySnippet = '🎥 Video Clip';
    else if (msg.message_type === 'pdf') displaySnippet = '📄 Document / PDF';

    previewUsername.innerText = msg.username || '';
    previewText.innerText = displaySnippet;
    replyPreviewBar.classList.remove('hidden');
    msgInput.focus();
};

window.cancelReply = function() {
    activeReplyMessageId = null;
    const replyPreviewBar = document.getElementById('reply-preview-bar');
    if (replyPreviewBar) {
        replyPreviewBar.classList.add('hidden');
    }
};



window.triggerEditMessage = function(messageId) {
    document.querySelectorAll('.msg-dropdown').forEach(d => {
        d.classList.add('hidden');
        d.classList.remove('drop-up');
    });
    document.querySelectorAll('.message-row').forEach(r => r.style.zIndex = '');

    const msg = messageStore.get(String(messageId));
    if (!msg) return;

    activeEditMessageId = msg._id;
    cancelReply();
    
    const editPreviewBar = document.getElementById('edit-preview-bar');
    const editPreviewText = document.getElementById('edit-preview-text');
    const msgInput = document.getElementById('msg-input');
    if (editPreviewBar && editPreviewText) {
        editPreviewText.innerText = msg.text || '';
        editPreviewBar.classList.remove('hidden');
    }
    if (msgInput) {
        msgInput.value = msg.text || '';
        msgInput.focus();
    }
};

window.cancelEdit = function() {
    activeEditMessageId = null;
    const editPreviewBar = document.getElementById('edit-preview-bar');
    const editPreviewText = document.getElementById('edit-preview-text');
    const msgInput = document.getElementById('msg-input');
    if (editPreviewBar) editPreviewBar.classList.add('hidden');
    if (editPreviewText) editPreviewText.innerText = '';
    if (msgInput) msgInput.value = '';
};

window.triggerDeleteMessage = function(messageId) {
    document.querySelectorAll('.msg-dropdown').forEach(d => {
        d.classList.add('hidden');
        d.classList.remove('drop-up');
    });
    document.querySelectorAll('.message-row').forEach(r => r.style.zIndex = '');

    showConfirm("Delete Message", "Are you sure you want to delete this message? This action cannot be undone.", () => {
        socket.emit('deleteMessage', { messageId });
    });
};

window.scrollToMessage = function(messageId) {
    const element = document.getElementById(`msg-card-${messageId}`);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.style.transition = 'background-color 0.5s ease';
        const originalBg = element.style.backgroundColor;
        element.style.backgroundColor = 'var(--bg-tertiary)';
        setTimeout(() => {
            element.style.backgroundColor = originalBg;
        }, 1000);
    } else {
        showToast("Parent message not loaded in current thread history.", "info");
    }
};

window.renderReactions = function(messageId, reactionsObj) {
    let html = '';
    const entries = Object.entries(reactionsObj || {});
    
    if (entries.length > 0) {
        html = `<div class="reactions-badge-row" style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; justify-content: flex-start; pointer-events: auto; width: 100%;">`;
        entries.forEach(([emoji, usersList]) => {
            if (usersList && usersList.length > 0) {
                const count = usersList.length;
                const usersTooltip = usersList.map(escapeHTML).join(', ');
                html += `
                    <div class="reaction-badge" title="Reacted: ${usersTooltip}" onclick="triggerReaction('${messageId}', '${emoji}')" style="display: flex; align-items: center; gap: 3px; background: var(--bg-secondary); border: 1px solid var(--bg-tertiary); padding: 2px 6px; border-radius: 10px; font-size: 0.72rem; cursor: pointer; font-weight: 600; color: var(--text-main); user-select: none;">
                        <span>${emoji}</span>
                        <span style="font-size: 0.65rem; color: var(--text-muted);">${count}</span>
                    </div>`;
            }
        });
        html += `</div>`;
    }
    return html;
};

window.triggerReaction = function(messageId, emoji) {
    socket.emit('messageReaction', {
        messageId,
        emoji,
        roomId: targetRoomId,
        receiverId: targetUserId
    });
    document.querySelectorAll('.msg-dropdown').forEach(d => d.classList.add('hidden'));
};

window.toggleDropdown = function(e, dropdownId) {
    if (e && e.stopPropagation) e.stopPropagation();
    const targetMenu = document.getElementById(dropdownId);
    if (!targetMenu) return;
    const isHidden = targetMenu.classList.contains('hidden');
    
    document.querySelectorAll('.msg-dropdown').forEach(d => d.classList.add('hidden'));
    
    if (isHidden) {
        targetMenu.classList.remove('hidden');
    }
};

window.triggerReceiptsAudit = function(msgId) {
    const receiptsListTarget = document.getElementById('receipts-list-target');
    const receiptsAuditModal = document.getElementById('receipts-audit-modal');
    const modalHeader = receiptsAuditModal ? receiptsAuditModal.querySelector('h3') : null;

    socket.emit('fetchGroupMessageReadLedger', { messageId: msgId }, (ledger) => {
        if (!receiptsListTarget || !receiptsAuditModal) return;
        receiptsListTarget.innerHTML = '';
        
        const count = ledger ? ledger.length : 0;
        if (modalHeader) {
            modalHeader.innerText = count > 0 ? `Message Seen by (${count})` : 'Message Delivery Info';
        }

        if (!ledger || ledger.length === 0) {
            receiptsListTarget.innerHTML = '<p class="empty-text" style="text-align:center; padding:1.5rem 0; color:var(--text-muted);">No other members have opened this message yet.</p>';
        } else {
            ledger.forEach(row => {
                const dateObj = new Date(row.read_at);
                const displayTime = `${dateObj.toLocaleDateString()} at ${dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
                
                const block = document.createElement('div');
                block.style.display = 'flex';
                block.style.justifyContent = 'space-between';
                block.style.alignItems = 'center';
                block.style.borderBottom = '1px solid var(--bg-tertiary)';
                block.style.padding = '0.5rem 0';
                block.innerHTML = `
                    <span style="font-weight:600; color:var(--text-main); font-size:0.9rem;">${escapeHTML(row.username)}</span>
                    <span style="font-size:0.75rem; color:var(--accent); font-style:italic;">👁️ ${displayTime}</span>
                `;
                receiptsListTarget.appendChild(block);
            });
        }
        receiptsAuditModal.classList.remove('hidden');
    });
};

window.triggerPrivateReceiptsAudit = function(msgId) {
    const receiptsListTarget = document.getElementById('receipts-list-target');
    const receiptsAuditModal = document.getElementById('receipts-audit-modal');

    socket.emit('fetchPrivateMessageReadReceipt', { messageId: msgId }, (receipt) => {
        if (!receiptsListTarget || !receiptsAuditModal) return;
        receiptsListTarget.innerHTML = '';
        if (!receipt) {
            receiptsListTarget.innerHTML = '<p class="empty-text">No data records available yet.</p>';
        } else {
            const sentDate = new Date(receipt.sent_at);
            const sentTime = `${sentDate.toLocaleDateString()} at ${sentDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
            
            let readTimeStr = 'Unread (Pending/Offline)';
            if (receipt.isread && receipt.read_at) {
                const readDate = new Date(receipt.read_at);
                readTimeStr = `${readDate.toLocaleDateString()} at ${readDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
            }

            receiptsListTarget.innerHTML = `
                <div style="border-bottom: 1px solid var(--bg-tertiary); padding: 0.5rem 0; display: flex; justify-content: space-between;">
                    <span style="font-weight:600; color:var(--text-main); font-size:0.9rem;">Sent</span>
                    <span style="font-size:0.75rem; color:var(--text-muted); font-style:italic;">✓ ${sentTime}</span>
                </div>
                <div style="padding: 0.5rem 0; display: flex; justify-content: space-between;">
                    <span style="font-weight:600; color:var(--text-main); font-size:0.9rem;">Read</span>
                    <span style="font-size:0.75rem; color:${receipt.isread ? 'var(--tick-read)' : 'var(--text-muted)'}; font-style:italic;">${receipt.isread ? '👁️ ' + readTimeStr : '✓ Sent only'}</span>
                </div>
            `;
        }
        receiptsAuditModal.classList.remove('hidden');
    });
}

function toggleDropdown(e, dropdownId) {
    if (e) e.stopPropagation();
    const targetMenu = document.getElementById(dropdownId);
    if (!targetMenu) return;

    const isCurrentlyHidden = targetMenu.classList.contains('hidden');

    document.querySelectorAll('.msg-dropdown').forEach(d => {
        if (d !== targetMenu) {
            d.classList.add('hidden');
            d.classList.remove('drop-up');
        }
    });
    document.querySelectorAll('.message-row').forEach(r => r.style.zIndex = '');

    if (isCurrentlyHidden) {
        
        targetMenu.classList.remove('hidden');
        targetMenu.classList.remove('drop-up');
        targetMenu.style.top = '';
        targetMenu.style.bottom = '';
        targetMenu.style.left = '';
        targetMenu.style.right = '';
        targetMenu.style.maxHeight = '';
        targetMenu.style.overflowY = '';

        const parentRow = targetMenu.closest('.message-row');
        if (parentRow) parentRow.style.zIndex = '950';

        const trigger = e ? (e.currentTarget || e.target) : targetMenu.parentElement.querySelector('.three-dots-icon');
        const messagePane = document.getElementById('message-history');

        if (trigger && messagePane) {
            const triggerRect = trigger.getBoundingClientRect();
            const paneRect = messagePane.getBoundingClientRect();
            const viewportHeight = window.innerHeight;

            const menuHeight = targetMenu.offsetHeight || 200;
            const menuWidth = targetMenu.offsetWidth || 175;

            const spaceBelowInPane = paneRect.bottom - triggerRect.bottom;
            const spaceBelowInViewport = viewportHeight - triggerRect.bottom - 70; 
            const availableSpaceBelow = Math.min(spaceBelowInPane, spaceBelowInViewport);

            const spaceAboveInPane = triggerRect.top - paneRect.top;
            const spaceAboveInViewport = triggerRect.top - 70; 
            const availableSpaceAbove = Math.min(spaceAboveInPane, spaceAboveInViewport);

            if (availableSpaceBelow < menuHeight + 15 && availableSpaceAbove > availableSpaceBelow) {
                targetMenu.classList.add('drop-up');
                targetMenu.style.bottom = '100%';
                targetMenu.style.top = 'auto';
                targetMenu.style.marginBottom = '6px';
                targetMenu.style.marginTop = '0';

                if (menuHeight > availableSpaceAbove - 10) {
                    targetMenu.style.maxHeight = `${Math.max(160, availableSpaceAbove - 15)}px`;
                    targetMenu.style.overflowY = 'auto';
                }
            } else {
                targetMenu.classList.remove('drop-up');
                targetMenu.style.top = '100%';
                targetMenu.style.bottom = 'auto';
                targetMenu.style.marginTop = '6px';
                targetMenu.style.marginBottom = '0';

                if (menuHeight > availableSpaceBelow - 10) {
                    targetMenu.style.maxHeight = `${Math.max(160, availableSpaceBelow - 15)}px`;
                    targetMenu.style.overflowY = 'auto';
                }
            }

            const isOutgoing = targetMenu.closest('.outgoing') !== null;
            if (isOutgoing) {
                targetMenu.style.right = '0';
                targetMenu.style.left = 'auto';
                if (triggerRect.right - menuWidth < paneRect.left + 8) {
                    targetMenu.style.left = '0';
                    targetMenu.style.right = 'auto';
                }
            } else {
                targetMenu.style.left = '0';
                targetMenu.style.right = 'auto';
                if (triggerRect.left + menuWidth > paneRect.right - 8) {
                    targetMenu.style.right = '0';
                    targetMenu.style.left = 'auto';
                }
            }
        }
    } else {
        targetMenu.classList.add('hidden');
        targetMenu.classList.remove('drop-up');
        if (parentRow) parentRow.style.zIndex = '';
    }
}

window.toggleTranslateSubmenu = function(e, messageId) {
    if (e) e.stopPropagation();
    const submenu = document.getElementById(`translate-sub-${messageId}`);
    const arrow = document.getElementById(`trans-arrow-${messageId}`);
    if (!submenu) return;

    const isHidden = submenu.classList.contains('hidden');
    if (isHidden) {
        submenu.classList.remove('hidden');
        if (arrow) arrow.innerText = '⌄';
    } else {
        submenu.classList.add('hidden');
        if (arrow) arrow.innerText = '›';
    }

    const parentDropdown = document.getElementById(`drop-${messageId}`);
    if (parentDropdown && parentDropdown.classList.contains('drop-up')) {
        const trigger = parentDropdown.parentElement.querySelector('.three-dots-icon');
        const messagePane = document.getElementById('message-history');
        if (trigger && messagePane) {
            const triggerRect = trigger.getBoundingClientRect();
            const paneRect = messagePane.getBoundingClientRect();
            const spaceAbove = triggerRect.top - paneRect.top;
            const totalHeight = parentDropdown.offsetHeight;
            if (totalHeight > spaceAbove - 10) {
                parentDropdown.style.maxHeight = `${Math.max(160, spaceAbove - 15)}px`;
                parentDropdown.style.overflowY = 'auto';
            }
        }
    }
};

window.selectTranslateLanguage = function(e, messageId, langCode, langName) {
    if (e) e.stopPropagation();
    translateMessageText(messageId, langCode, langName);
    document.querySelectorAll('.msg-dropdown').forEach(d => {
        d.classList.add('hidden');
        d.classList.remove('drop-up');
    });
    document.querySelectorAll('.msg-translate-submenu').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.message-row').forEach(r => r.style.zIndex = '');
};

function wrapMediaWithMenu(msg, mediaHtml) {
    const isOutgoing = currentUserId && Number(msg.sender_id) === Number(currentUserId);
    const pickerHtml = `
        <div class="reactions-picker">
            <span onclick="triggerReaction('${msg._id}', '👍')" title="Thumbs Up">👍</span>
            <span onclick="triggerReaction('${msg._id}', '❤️')" title="Love">❤️</span>
            <span onclick="triggerReaction('${msg._id}', '😂')" title="Laugh">😂</span>
            <span onclick="triggerReaction('${msg._id}', '😮')" title="Surprised">😮</span>
            <span onclick="triggerReaction('${msg._id}', '😢')" title="Sad">😢</span>
            <span onclick="triggerReaction('${msg._id}', '🙏')" title="Thanks / Pray">🙏</span>
        </div>`;

    let deleteOptionHtml = '';
    if (isOutgoing) {
        deleteOptionHtml = `
            <div class="msg-menu-item delete-item" onclick="triggerDeleteMessage('${msg._id}')">
                <span class="menu-item-icon">🗑️</span>
                <span>Delete</span>
            </div>`;
    }

    const menuHtml = `
        <div class="msg-menu-container">
            <span class="three-dots-icon" onclick="toggleDropdown(event, 'drop-${msg._id}')" title="Message Options">⋮</span>
            <div id="drop-${msg._id}" class="msg-dropdown hidden">
                ${pickerHtml}
                <div class="msg-menu-item" onclick="triggerReplyMessage('${msg._id}')">
                    <span class="menu-item-icon">↩️</span>
                    <span>Reply</span>
                </div>
                <div class="msg-menu-item" onclick="window.enterMessageSelectMode('${msg._id}')">
                    <span class="menu-item-icon">☑️</span>
                    <span>Select Messages</span>
                </div>
                <div class="msg-menu-item" onclick="window.triggerSingleMessageForward('${msg._id}')">
                    <span class="menu-item-icon">↗️</span>
                    <span>Share / Forward</span>
                </div>
                ${deleteOptionHtml}
            </div>
        </div>`;

    return `
        <div class="media-content-wrapper" style="display: flex; flex-direction: column; width: 100%;">
            <div style="display: flex; align-items: flex-start; gap: 8px; position: relative; width: 100%;">
                <div style="flex: 1; min-width: 0;">${mediaHtml}</div>
                ${menuHtml}
            </div>
            <div id="reactions-target-${msg._id}" style="width: 100%; pointer-events: auto;">${renderReactions(msg._id, msg.reactions)}</div>
        </div>`;
}

function appendMessage(msg) {
    const messageHistory = document.getElementById('message-history');
    if (!messageHistory || !msg || !msg._id) return;

    if (document.getElementById(`msg-card-${msg._id}`)) {
        messageStore.set(String(msg._id), msg);
        return;
    }

    messageStore.set(String(msg._id), msg);

    const isOutgoing = currentUserId && Number(msg.sender_id) === Number(currentUserId);
    const isSelected = selectedMessageIds.has(String(msg._id));
    const row = document.createElement('div');
    row.className = `message-row ${isOutgoing ? 'outgoing' : 'incoming'} ${isSelected ? 'selected' : ''}`;
    row.id = `msg-card-${msg._id}`;

    row.addEventListener('click', (e) => {
        if (window.isMessageSelectionActive && window.isMessageSelectionActive()) {
            if (e.target.closest('.msg-menu-container') || e.target.closest('a') || e.target.closest('audio') || e.target.closest('video') || e.target.closest('.reactions-badge-row') || e.target.closest('.reactions-picker')) {
                return;
            }
            window.toggleSelectMessage(msg._id);
        }
    });

    const msgDate = new Date(msg.timestamp);
    const dateString = msgDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    const timeString = msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const fullDateTimeString = `${dateString}, ${timeString}`;

    let quoteHtml = '';
    if (msg.reply_to_message_id) {
        const quotedText = msg.reply_to_is_deleted ? 'This message was deleted' : msg.reply_to_text;
        quoteHtml = `
            <div class="quoted-message-bubble" onclick="window.scrollToMessage('${msg.reply_to_message_id}')">
                <div style="font-weight: 700; font-size: 0.7rem; margin-bottom: 2px;">${escapeHTML(msg.reply_to_username || '')}</div>
                <div class="reply-text-context" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-style: italic;">
                    ${escapeHTML(quotedText || '')}
                </div>
            </div>`;
    }

    let inlineRenderBody = '';
    
    if (msg.is_deleted) {
        inlineRenderBody = `
            <div class="text-content-wrapper" style="position: relative; display: flex; align-items: flex-start; gap: 8px; width: 100%;">
                <span id="text-span-${msg._id}" style="font-style: italic; color: var(--text-muted);">This message was deleted</span>
            </div>`;
    } else if (msg.message_type === 'image') {
        const imgHtml = `<img src="${encodeURI(msg.file_url)}" class="chat-rendered-image" onclick="window.openLightbox(this.src, 'image')" title="Zoom media preview" style="cursor: pointer;">`;
        inlineRenderBody = wrapMediaWithMenu(msg, imgHtml);
    } else if (msg.message_type === 'audio') {
        const audHtml = `
            <div style="display: flex; flex-direction: column; width: 100%;">
                <audio controls src="${encodeURI(msg.file_url)}" class="chat-rendered-audio" style="width: 100%;"></audio>
            </div>
        `;
        inlineRenderBody = wrapMediaWithMenu(msg, audHtml);
    } else if (msg.message_type === 'video') {
        const vidHtml = `<video src="${encodeURI(msg.file_url)}" class="chat-rendered-video" onclick="window.openLightbox(this.src, 'video')" title="Zoom media preview" style="cursor: pointer;"></video>`;
        inlineRenderBody = wrapMediaWithMenu(msg, vidHtml);
    } else if (msg.message_type === 'pdf') {
        const pdfHtml = `
            <div class="chat-rendered-pdf-card">
                <a href="${encodeURI(msg.file_url)}" target="_blank">📄 Open Document: ${escapeHTML(msg.text || 'File')}</a>
            </div>`;
        inlineRenderBody = wrapMediaWithMenu(msg, pdfHtml);
    } else {
        const pickerHtml = `
            <div class="reactions-picker">
                <span onclick="triggerReaction('${msg._id}', '👍')" title="Thumbs Up">👍</span>
                <span onclick="triggerReaction('${msg._id}', '❤️')" title="Love">❤️</span>
                <span onclick="triggerReaction('${msg._id}', '😂')" title="Laugh">😂</span>
                <span onclick="triggerReaction('${msg._id}', '😮')" title="Surprised">😮</span>
                <span onclick="triggerReaction('${msg._id}', '😢')" title="Sad">😢</span>
                <span onclick="triggerReaction('${msg._id}', '🙏')" title="Thanks / Pray">🙏</span>
            </div>`;

        const editedHtml = msg.is_edited ? ` <span style="font-size: 0.72rem; color: var(--text-muted); margin-left: 4px; font-style: italic;">(edited)</span>` : '';
        
        let extraOptionsHtml = '';
        if (isOutgoing) {
            extraOptionsHtml = `
                <div class="msg-menu-item edit-item" onclick="triggerEditMessage('${msg._id}')">
                    <span class="menu-item-icon">✏️</span>
                    <span>Edit</span>
                </div>
                <div class="msg-menu-item delete-item" onclick="triggerDeleteMessage('${msg._id}')">
                    <span class="menu-item-icon">🗑️</span>
                    <span>Delete</span>
                </div>
            `;
        }

        inlineRenderBody = `
            <div class="text-content-wrapper" style="position: relative; display: flex; flex-direction: column; width: 100%;">
                <div style="display: flex; align-items: flex-start; gap: 8px; width: 100%;">
                    <span id="text-span-${msg._id}">${escapeHTML(msg.text)}${editedHtml}</span>
                    <div class="msg-menu-container">
                        <span class="three-dots-icon" onclick="toggleDropdown(event, 'drop-${msg._id}')" title="Message Options">⋮</span>
                        <div id="drop-${msg._id}" class="msg-dropdown hidden">
                            ${pickerHtml}
                            <div class="msg-menu-item" onclick="triggerReplyMessage('${msg._id}')">
                                <span class="menu-item-icon">↩️</span>
                                <span>Reply</span>
                            </div>
                            <div class="msg-menu-item" onclick="window.enterMessageSelectMode('${msg._id}')">
                                <span class="menu-item-icon">☑️</span>
                                <span>Select Messages</span>
                            </div>
                            <div class="msg-menu-item" onclick="window.triggerSingleMessageForward('${msg._id}')">
                                <span class="menu-item-icon">↗️</span>
                                <span>Share / Forward</span>
                            </div>
                            <div class="msg-menu-item translate-trigger-item" onclick="toggleTranslateSubmenu(event, '${msg._id}')">
                                <span class="menu-item-icon">🌐</span>
                                <span>Translate</span>
                                <span id="trans-arrow-${msg._id}" class="submenu-arrow-indicator">›</span>
                            </div>
                            <div id="translate-sub-${msg._id}" class="msg-translate-submenu hidden">
                                <div class="translate-sub-item" onclick="selectTranslateLanguage(event, '${msg._id}', 'kn', 'Kannada')">Kannada (ಕನ್ನಡ)</div>
                                <div class="translate-sub-item" onclick="selectTranslateLanguage(event, '${msg._id}', 'ta', 'Tamil')">Tamil (தமிழ்)</div>
                                <div class="translate-sub-item" onclick="selectTranslateLanguage(event, '${msg._id}', 'te', 'Telugu')">Telugu (తెలుగు)</div>
                                <div class="translate-sub-item" onclick="selectTranslateLanguage(event, '${msg._id}', 'ml', 'Malayalam')">Malayalam (മലയാളം)</div>
                                <div class="translate-sub-item" onclick="selectTranslateLanguage(event, '${msg._id}', 'bn', 'Bengali')">Bengali (বাংলা)</div>
                                <div class="translate-sub-item" onclick="selectTranslateLanguage(event, '${msg._id}', 'hi', 'Hindi')">Hindi (हिन्दी)</div>
                                <div class="translate-sub-item restore-item" onclick="selectTranslateLanguage(event, '${msg._id}', 'en', 'English')">↩️ Original English</div>
                            </div>
                            ${extraOptionsHtml}
                        </div>
                    </div>
                </div>
                <div id="reactions-target-${msg._id}" style="width: 100%; pointer-events: auto;">${renderReactions(msg._id, msg.reactions)}</div>
            </div>`;
    }

    const selectCheckboxHtml = `<div class="msg-select-checkbox" onclick="event.stopPropagation(); window.toggleSelectMessage('${msg._id}')"></div>`;

    if (!isOutgoing) {
        row.innerHTML = `
            ${selectCheckboxHtml}
            <img src="${msg.profile_pic_url || '/uploads/default-avatar.png'}" onerror="this.onerror=null; this.src='/uploads/default-avatar.png';" class="chat-bubble-avatar" title="Click chat header to see details">
            <div class="bubble-layout-block">
                ${targetRoomId ? `<div class="sender-title" style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 2px; font-weight: 600; text-align: left;">${escapeHTML(msg.username || '')}</div>` : ''}
                <div class="message-bubble" id="bubble-${msg._id}">${quoteHtml}${inlineRenderBody}</div>
                <div class="message-meta">
                    <span>${fullDateTimeString}</span>
                </div>
            </div>
        `;
    } else {
        let contextualTicks = '';
        if (!targetRoomId) {
            contextualTicks = `<span id="ticks-${msg._id}" class="ticks ${msg.isRead ? 'read' : ''}" onclick="triggerPrivateReceiptsAudit(${msg._id})" style="cursor:pointer;" title="Click for delivery info">&check;&check;</span>`;
        } else {
            const seenCount = parseInt(msg.seen_count || 0, 10);
            if (seenCount > 0) {
                contextualTicks = `<span class="group-ticks-tracker ticks read" data-msg-id="${msg._id}" onclick="triggerReceiptsAudit(${msg._id})" style="cursor:pointer; font-size:0.75rem; font-weight:700;" title="Seen by ${seenCount} member${seenCount > 1 ? 's' : ''} (Click for list)">&check;&check; Seen by ${seenCount}</span>`;
            } else {
                contextualTicks = `<span class="group-ticks-tracker ticks" data-msg-id="${msg._id}" onclick="triggerReceiptsAudit(${msg._id})" style="cursor:pointer; font-size:0.75rem; font-weight:700;" title="Sent (Click for details)">&check; Sent</span>`;
            }

            socket.emit('fetchGroupMessageReadLedger', { messageId: msg._id }, (ledger) => {
                const trackingToken = document.querySelector(`[data-msg-id="${msg._id}"]`);
                if (trackingToken && ledger && ledger.length > 0) {
                    trackingToken.innerHTML = `&check;&check; Seen by ${ledger.length}`;
                    trackingToken.classList.add('read');
                    trackingToken.setAttribute('title', `Seen by ${ledger.length} member${ledger.length > 1 ? 's' : ''} (Click for list)`);
                }
            });
        }

        row.innerHTML = `
            ${selectCheckboxHtml}
            <div class="bubble-layout-block">
                <div class="message-bubble" id="bubble-${msg._id}">${quoteHtml}${inlineRenderBody}</div>
                <div class="message-meta">
                    <span>${fullDateTimeString}</span>
                    ${contextualTicks}
                </div>
            </div>
        `;
    }
    
    messageHistory.appendChild(row);
}

function formatThreadTime(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (isYesterday) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
}

function formatMessageSnippet(text, messageType, senderId) {
    const isOutgoing = senderId === currentUserId;
    const prefix = isOutgoing ? 'You: ' : '';
    
    if (messageType === 'image') return `${prefix}📷 Photo`;
    if (messageType === 'audio') return `${prefix}🎵 Voice message`;
    if (messageType === 'video') return `${prefix}🎥 Video`;
    if (messageType === 'pdf') return `${prefix}📄 Document`;
    
    if (!text) return 'Start a conversation...';
    return `${prefix}${text}`;
}

async function loadActiveThreads() {
    const activeThreadsTarget = document.getElementById('active-threads-target');
    if (!activeThreadsTarget) return;

    try {
        const res = await fetch('/api/chats/active');
        if (!res.ok) return;
        const threads = await res.json();
        activeThreadsTarget.innerHTML = '';
        
        const statsChats = document.getElementById('stats-recent-chats');
        if (statsChats) statsChats.innerText = threads.length;

        if (threads.length === 0) {
            activeThreadsTarget.innerHTML = '<p class="empty-text">No recent conversations yet. Search for users above to start chatting!</p>';
            return;
        }

        threads.forEach(user => {
            const item = document.createElement('div');
            item.className = 'thread-item';
            item.id = `thread-user-${user.id}`;
            
            const unreadCount = parseInt(user.unread_count || 0, 10);
            if (unreadCount > 0 && targetUserId !== user.id) {
                item.classList.add('has-unread');
            }
            if (targetUserId === user.id) {
                item.classList.add('active-selected');
            }

            const isSelected = window.isChatSelected && window.isChatSelected('user', user.id);
            if (isSelected) item.classList.add('selected-chat');

            const unreadPillHtml = (unreadCount > 0 && targetUserId !== user.id)
                ? `<span class="unread-count-pill" id="unread-badge-user-${user.id}">${unreadCount}</span>`
                : '';

            const timeFormatted = formatThreadTime(user.last_activity);
            const snippetFormatted = formatMessageSnippet(user.last_message, user.last_message_type, user.last_message_sender_id);

            item.innerHTML = `
                <div class="chat-select-checkbox" onclick="event.stopPropagation(); window.toggleSelectChat('user', ${user.id});"></div>
                <div class="thread-avatar-wrap">
                    <img id="thread-avatar-${user.id}" src="${user.profile_pic_url || '/uploads/default-avatar.png'}" onerror="this.onerror=null; this.src='/uploads/default-avatar.png';" class="thread-avatar-img">
                    <div id="status-badge-${user.id}" class="global-presence-badge offline"></div>
                </div>
                <div class="thread-content-block">
                    <div class="thread-header-row">
                        <span id="thread-name-${user.id}" class="thread-contact-name">${escapeHTML(user.username)}</span>
                        <span class="thread-time-badge" id="thread-time-${user.id}">${timeFormatted}</span>
                    </div>
                    <div class="thread-snippet-row">
                        <span class="thread-last-snippet" id="thread-snippet-${user.id}">${escapeHTML(snippetFormatted)}</span>
                        ${unreadPillHtml}
                    </div>
                </div>
            `;
            item.onclick = () => {
                if (window.isChatSelectionActive && window.isChatSelectionActive()) {
                    window.toggleSelectChat('user', user.id);
                    return;
                }
                selectActiveTargetUser(user.id, user.username, user.profile_pic_url);
            };
            activeThreadsTarget.appendChild(item);

            socket.emit('requestUserOnlineStatus', { targetUserId: user.id }, (reply) => {
                const dynamicBadge = document.getElementById(`status-badge-${user.id}`);
                if (dynamicBadge && reply) {
                    dynamicBadge.className = `global-presence-badge ${reply.status}`;
                }
            });
        });
    } catch (err) {
        console.error('Failed to load active threads:', err);
    }
}

function selectActiveTargetUser(id, name, picUrl) {
    targetRoomId = null; 
    targetUserId = id;

    const isUnavailable = name === 'Unavailable User';

    const targetItem = document.getElementById(`thread-user-${id}`);
    if (targetItem) {
        targetItem.classList.remove('has-unread');
        const badge = targetItem.querySelector('.unread-count-pill');
        if (badge) badge.remove();
    }

    const checkRoomOnlineBtn = document.getElementById('check-room-online-btn');
    const chatWindowTitle = document.getElementById('chat-window-title');
    const chatWindowSubtitle = document.getElementById('chat-window-subtitle');
    const chatWindowAvatar = document.getElementById('chat-window-avatar');
    const msgInput = document.getElementById('msg-input');
    const sendBtn = document.querySelector('#chat-form button[type="submit"]');

    if (checkRoomOnlineBtn) checkRoomOnlineBtn.classList.add('hidden');

    const advSenderContainer = document.getElementById('adv-search-sender-container');
    const clearBtn = document.getElementById('btn-clear-search-filters');
    if (advSenderContainer) advSenderContainer.style.display = 'none';
    if (clearBtn) clearBtn.click();
    cancelReply();
    if (window.exitMessageSelectMode) window.exitMessageSelectMode();

    if (isUnavailable) {
        if (chatWindowTitle) chatWindowTitle.innerText = 'Unavailable User';
        if (chatWindowSubtitle) chatWindowSubtitle.innerText = '⚪ Account unavailable or removed';
        if (chatWindowAvatar) chatWindowAvatar.src = '/uploads/default-avatar.png';
        if (msgInput) {
            msgInput.disabled = true;
            msgInput.placeholder = 'You cannot send messages to an unavailable user.';
        }
        if (sendBtn) sendBtn.disabled = true;
    } else {
        if (chatWindowTitle) chatWindowTitle.innerText = `${name}`;
        if (chatWindowAvatar) chatWindowAvatar.src = picUrl || '/uploads/default-avatar.png';
        if (msgInput) {
            msgInput.disabled = false;
            msgInput.placeholder = 'Type a message...';
        }
        if (sendBtn) sendBtn.disabled = false;

        socket.emit('requestUserOnlineStatus', { targetUserId: id }, (reply) => {
            if (chatWindowSubtitle) chatWindowSubtitle.innerText = reply && reply.status === 'online' ? '🟢 Online Now' : '⚪ Offline';
        });
    }
    
    const emptyNotice = document.getElementById('empty-view-notice');
    const chatSubsystem = document.getElementById('active-chat-subsystem');
    if (emptyNotice) emptyNotice.classList.add('hidden');
    if (chatSubsystem) chatSubsystem.classList.remove('hidden');
    
    document.querySelectorAll('.thread-item').forEach(el => el.classList.remove('active-selected'));
    const activeEl = document.getElementById(`thread-user-${id}`);
    if(activeEl) activeEl.classList.add('active-selected');

    closeMobileSidebar();
    const emojiPickerPanel = document.getElementById('emoji-picker-panel');
    if (emojiPickerPanel) emojiPickerPanel.classList.add('hidden');

    setTimeout(scrollToBottom, 50);
    socket.emit('joinRoom', { currentUserId, targetUserId: id });
}
