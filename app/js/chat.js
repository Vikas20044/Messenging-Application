// Real-Time Chat Subsystem & Message Rendering Engine

const messageStore = new Map();

// Quoting & Reply Helpers
window.triggerReplyMessage = function(messageId) {
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

// Report Message Helpers
let activeReportMessageId = null;

window.triggerReportMessage = function(messageId) {
    const msg = messageStore.get(String(messageId));
    if (!msg) return;

    activeReportMessageId = msg._id;
    const modal = document.getElementById('report-message-modal');
    const senderPreview = document.getElementById('report-sender-preview');
    const textPreview = document.getElementById('report-text-preview');
    const reasonInput = document.getElementById('report-reason-input');

    let displaySnippet = msg.text || '';
    if (msg.message_type === 'image') displaySnippet = '📷 Image Attachment';
    else if (msg.message_type === 'audio') displaySnippet = '🎵 Audio Attachment';
    else if (msg.message_type === 'video') displaySnippet = '🎥 Video Attachment';
    else if (msg.message_type === 'pdf') displaySnippet = '📄 Document Attachment';

    if (senderPreview) senderPreview.innerText = `From: @${msg.username || 'user'}`;
    if (textPreview) textPreview.innerText = displaySnippet;
    if (reasonInput) reasonInput.value = '';
    if (modal) modal.classList.remove('hidden');

    document.querySelectorAll('.msg-dropdown').forEach(d => d.classList.add('hidden'));
};

window.closeReportModal = function() {
    activeReportMessageId = null;
    const modal = document.getElementById('report-message-modal');
    if (modal) modal.classList.add('hidden');
};

window.submitReportMessage = async function() {
    if (!activeReportMessageId) return;
    const reasonInput = document.getElementById('report-reason-input');
    const reason = reasonInput ? reasonInput.value.trim() : '';

    if (!reason) {
        showToast("Please provide a reason description for the report.", "error");
        return;
    }

    try {
        const res = await fetch('/api/messages/report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messageId: activeReportMessageId, reason })
        });
        const data = await res.json();
        if (res.ok && data.success) {
            showToast("Message reported successfully to system administrators! 🚩", "success");
            window.closeReportModal();
        } else {
            showToast(data.error || "Failed to submit report.", "error");
        }
    } catch (err) {
        console.error('Report submit error:', err);
        showToast("Server communication failure reporting message.", "error");
    }
};

window.triggerEditMessage = function(messageId) {
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

// Emoji Message Reactions
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

function toggleDropdown(e, dropdownId) {
    e.stopPropagation();
    const targetMenu = document.getElementById(dropdownId);
    if (!targetMenu) return;
    const isHidden = targetMenu.classList.contains('hidden');
    
    document.querySelectorAll('.msg-dropdown').forEach(d => d.classList.add('hidden'));
    
    if (isHidden) {
        targetMenu.classList.remove('hidden');
    }
}

function triggerReceiptsAudit(msgId) {
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
}

function triggerPrivateReceiptsAudit(msgId) {
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

window.toggleStarMessage = async function(messageId) {
    try {
        const res = await fetch('/api/messages/star-toggle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messageId })
        });
        const data = await res.json();
        if (res.ok && data.success) {
            showToast(data.isStarred ? "Message starred! ⭐" : "Message unstarred.", "info");
            
            const msg = messageStore.get(String(messageId));
            if (msg) msg.isStarred = data.isStarred;

            const starBadge = document.getElementById(`star-badge-${messageId}`);
            if (starBadge) {
                starBadge.style.display = data.isStarred ? 'inline-block' : 'none';
            }
            const starOption = document.getElementById(`star-option-${messageId}`);
            if (starOption) {
                starOption.innerText = data.isStarred ? "⭐ Unstar Message" : "⭐ Star Message";
            }
        } else {
            showToast(data.error || "Failed to update star.", "error");
        }
    } catch (err) {
        console.error('Star toggle error:', err);
    }
};

function wrapMediaWithMenu(msg, mediaHtml) {
    const isOutgoing = msg.sender_id === currentUserId;
    const pickerHtml = `
        <div class="reactions-picker" style="display: flex; gap: 6px; padding: 4px; justify-content: space-around; border-bottom: 1px solid var(--bg-tertiary); margin-bottom: 4px;">
            <span onclick="triggerReaction('${msg._id}', '👍')" style="cursor: pointer; font-size: 1.1rem; transition: transform 0.1s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">👍</span>
            <span onclick="triggerReaction('${msg._id}', '❤️')" style="cursor: pointer; font-size: 1.1rem; transition: transform 0.1s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">❤️</span>
            <span onclick="triggerReaction('${msg._id}', '😂')" style="cursor: pointer; font-size: 1.1rem; transition: transform 0.1s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">😂</span>
            <span onclick="triggerReaction('${msg._id}', '😮')" style="cursor: pointer; font-size: 1.1rem; transition: transform 0.1s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">😮</span>
            <span onclick="triggerReaction('${msg._id}', '😢')" style="cursor: pointer; font-size: 1.1rem; transition: transform 0.1s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">😢</span>
            <span onclick="triggerReaction('${msg._id}', '🙏')" style="cursor: pointer; font-size: 1.1rem; transition: transform 0.1s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">🙏</span>
        </div>`;

    let deleteOptionHtml = '';
    if (isOutgoing) {
        deleteOptionHtml = `<div onclick="triggerDeleteMessage('${msg._id}')" style="cursor: pointer; padding: 4px 8px; color: var(--accent);">Delete</div>`;
    }

    const starLabel = msg.isStarred ? '⭐ Unstar Message' : '⭐ Star Message';
    const reportOptionHtml = !isOutgoing 
        ? `<div onclick="triggerReportMessage('${msg._id}')" style="cursor: pointer; padding: 4px 8px; color: #ef4444; font-weight: 600;">🚩 Report</div>` 
        : '';
    const menuHtml = `
        <div class="msg-menu-container" style="position: relative; margin-left: auto; align-self: flex-start;">
            <span class="three-dots-icon" onclick="toggleDropdown(event, 'drop-${msg._id}')">⋮</span>
            <div id="drop-${msg._id}" class="msg-dropdown hidden" style="right: 0; left: auto; top: 22px; width: 155px; z-index: 50;">
                ${pickerHtml}
                <div onclick="triggerReplyMessage('${msg._id}')" style="cursor: pointer; padding: 4px 8px;">Reply</div>
                <div id="star-option-${msg._id}" onclick="toggleStarMessage('${msg._id}')" style="cursor: pointer; padding: 4px 8px; color: #eab308; font-weight: 600;">${starLabel}</div>
                ${reportOptionHtml}
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
    if (!messageHistory) return;

    messageStore.set(String(msg._id), msg);

    const isOutgoing = msg.sender_id === currentUserId;
    const row = document.createElement('div');
    row.className = `message-row ${isOutgoing ? 'outgoing' : 'incoming'}`;
    row.id = `msg-card-${msg._id}`;
    
    const msgDate = new Date(msg.timestamp);
    const dateString = msgDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    const timeString = msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const fullDateTimeString = `${dateString}, ${timeString}`;
    const starDisplay = msg.isStarred ? 'inline-block' : 'none';

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
        const starLabel = msg.isStarred ? '⭐ Unstar Message' : '⭐ Star Message';
        const pickerHtml = `
            <div class="reactions-picker" style="display: flex; gap: 6px; padding: 4px; justify-content: space-around; border-bottom: 1px solid var(--bg-tertiary); margin-bottom: 4px;">
                <span onclick="triggerReaction('${msg._id}', '👍')" style="cursor: pointer; font-size: 1.1rem; transition: transform 0.1s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">👍</span>
                <span onclick="triggerReaction('${msg._id}', '❤️')" style="cursor: pointer; font-size: 1.1rem; transition: transform 0.1s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">❤️</span>
                <span onclick="triggerReaction('${msg._id}', '😂')" style="cursor: pointer; font-size: 1.1rem; transition: transform 0.1s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">😂</span>
                <span onclick="triggerReaction('${msg._id}', '😮')" style="cursor: pointer; font-size: 1.1rem; transition: transform 0.1s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">😮</span>
                <span onclick="triggerReaction('${msg._id}', '😢')" style="cursor: pointer; font-size: 1.1rem; transition: transform 0.1s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">😢</span>
                <span onclick="triggerReaction('${msg._id}', '🙏')" style="cursor: pointer; font-size: 1.1rem; transition: transform 0.1s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">🙏</span>
            </div>`;

        const editedHtml = msg.is_edited ? ` <span style="font-size: 0.72rem; color: var(--text-muted); margin-left: 4px; font-style: italic;">(edited)</span>` : '';
        
        let extraOptionsHtml = '';
        if (isOutgoing) {
            extraOptionsHtml = `
                <hr style="border: 0; border-top: 1px solid var(--bg-tertiary); margin: 4px 0;">
                <div onclick="triggerEditMessage('${msg._id}')" style="cursor: pointer; padding: 4px 8px; color: var(--tick-read);">Edit</div>
                <div onclick="triggerDeleteMessage('${msg._id}')" style="cursor: pointer; padding: 4px 8px; color: var(--accent);">Delete</div>
            `;
        }

        const reportOptionHtml = !isOutgoing 
            ? `<div onclick="triggerReportMessage('${msg._id}')" style="cursor: pointer; padding: 4px 8px; color: #ef4444; font-weight: 600;">🚩 Report</div>` 
            : '';

        inlineRenderBody = `
            <div class="text-content-wrapper" style="position: relative; display: flex; flex-direction: column; width: 100%;">
                <div style="display: flex; align-items: flex-start; gap: 8px; width: 100%;">
                    <span id="text-span-${msg._id}">${escapeHTML(msg.text)}${editedHtml}</span>
                    <div class="msg-menu-container" style="position: relative; margin-left: auto; align-self: flex-start;">
                        <span class="three-dots-icon" onclick="toggleDropdown(event, 'drop-${msg._id}')">⋮</span>
                        <div id="drop-${msg._id}" class="msg-dropdown hidden" style="width: 155px; z-index: 50;">
                            ${pickerHtml}
                            <div onclick="triggerReplyMessage('${msg._id}')" style="cursor: pointer; padding: 4px 8px;">Reply</div>
                            <div id="star-option-${msg._id}" onclick="toggleStarMessage('${msg._id}')" style="cursor: pointer; padding: 4px 8px; color: #eab308; font-weight: 600;">${starLabel}</div>
                            ${reportOptionHtml}
                            <div onclick="translateMessageText('${msg._id}', 'kn', 'Kannada')">Kannada</div>
                            <div onclick="translateMessageText('${msg._id}', 'ta', 'Tamil')">Tamil</div>
                            <div onclick="translateMessageText('${msg._id}', 'te', 'Telugu')">Telugu</div>
                            <div onclick="translateMessageText('${msg._id}', 'ml', 'Malayalam')">Malayalam</div>
                            <div onclick="translateMessageText('${msg._id}', 'bn', 'Bengali')">Bengali</div>
                            <hr style="border: 0; border-top: 1px solid var(--bg-tertiary); margin: 4px 0;">
                            <div onclick="translateMessageText('${msg._id}', 'en', 'English')" style="color: var(--tick-read); font-weight: bold;">Translate back</div>
                            ${extraOptionsHtml}
                        </div>
                    </div>
                </div>
                <div id="reactions-target-${msg._id}" style="width: 100%; pointer-events: auto;">${renderReactions(msg._id, msg.reactions)}</div>
            </div>`;
    }

    if (!isOutgoing) {
        row.innerHTML = `
            <img src="${msg.profile_pic_url || '/uploads/default-avatar.png'}" onerror="this.onerror=null; this.src='/uploads/default-avatar.png';" class="chat-bubble-avatar" title="Click chat header to see details">
            <div class="bubble-layout-block">
                ${targetRoomId ? `<div class="sender-title" style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 2px; font-weight: 600; text-align: left;">${escapeHTML(msg.username || '')}</div>` : ''}
                <div class="message-bubble" id="bubble-${msg._id}">${quoteHtml}${inlineRenderBody}</div>
                <div class="message-meta">
                    <span>${fullDateTimeString}</span>
                    <span id="star-badge-${msg._id}" class="star-badge-indicator" style="display: ${starDisplay};" title="Starred Message">⭐</span>
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
            
            // Background sync check
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
            <div class="bubble-layout-block">
                <div class="message-bubble" id="bubble-${msg._id}">${quoteHtml}${inlineRenderBody}</div>
                <div class="message-meta">
                    <span>${fullDateTimeString}</span>
                    <span id="star-badge-${msg._id}" class="star-badge-indicator" style="display: ${starDisplay};" title="Starred Message">⭐</span>
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

            const unreadPillHtml = (unreadCount > 0 && targetUserId !== user.id)
                ? `<span class="unread-count-pill" id="unread-badge-user-${user.id}">${unreadCount}</span>`
                : '';

            const timeFormatted = formatThreadTime(user.last_activity);
            const snippetFormatted = formatMessageSnippet(user.last_message, user.last_message_type, user.last_message_sender_id);

            item.innerHTML = `
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
            item.onclick = () => selectActiveTargetUser(user.id, user.username, user.profile_pic_url);
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

    // Clear unread badge immediately from UI
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

    if (checkRoomOnlineBtn) checkRoomOnlineBtn.classList.add('hidden');

    const advSenderContainer = document.getElementById('adv-search-sender-container');
    const clearBtn = document.getElementById('btn-clear-search-filters');
    if (advSenderContainer) advSenderContainer.style.display = 'none';
    if (clearBtn) clearBtn.click();
    cancelReply();

    if (chatWindowTitle) chatWindowTitle.innerText = `${name}`;
    if (chatWindowAvatar) chatWindowAvatar.src = picUrl || '/uploads/default-avatar.png';
    
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
    
    socket.emit('requestUserOnlineStatus', { targetUserId: id }, (reply) => {
        if (chatWindowSubtitle) chatWindowSubtitle.innerText = reply && reply.status === 'online' ? '🟢 Online Now' : '⚪ Offline';
    });

    setTimeout(scrollToBottom, 50);
    socket.emit('joinRoom', { currentUserId, targetUserId: id });
}
