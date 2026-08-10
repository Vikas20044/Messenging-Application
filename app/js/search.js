

function applySearchFilters() {
    const chatMessageSearchInput = document.getElementById('chat-message-search-input');
    const advSearchSender = document.getElementById('adv-search-sender');
    const messageHistory = document.getElementById('message-history');
    if (!chatMessageSearchInput || !messageHistory) return;

    const queryText = chatMessageSearchInput.value.toLowerCase().trim();
    const selectedChip = document.querySelector('#adv-search-chips .search-chip.active');
    const selectedType = selectedChip ? selectedChip.getAttribute('data-type') : 'all';
    const senderQuery = advSearchSender ? advSearchSender.value.toLowerCase().trim() : '';

    const messages = messageHistory.querySelectorAll('.message-row');

    messages.forEach(row => {
        const bubble = row.querySelector('.message-bubble');
        if (!bubble) {
            row.style.display = 'none';
            return;
        }

        // 1. Text Filter Check
        const textSpan = bubble.querySelector('[id^="text-span-"]');
        const text = textSpan ? textSpan.innerText.toLowerCase() : '';
        const fileLink = bubble.querySelector('a');
        const fileText = fileLink ? fileLink.innerText.toLowerCase() : '';
        const fullText = text + ' ' + fileText;
        const matchesText = queryText === '' || fullText.includes(queryText);

        // 2. Media Type Check
        let matchesType = false;
        if (selectedType === 'all') {
            matchesType = true;
        } else if (selectedType === 'text') {
            const hasMedia = bubble.querySelector('.chat-rendered-image, .chat-rendered-audio, .chat-rendered-video, .chat-rendered-pdf-card');
            matchesType = !hasMedia;
        } else if (selectedType === 'image') {
            matchesType = !!bubble.querySelector('.chat-rendered-image');
        } else if (selectedType === 'audio') {
            matchesType = !!bubble.querySelector('.chat-rendered-audio');
        } else if (selectedType === 'video') {
            matchesType = !!bubble.querySelector('.chat-rendered-video');
        } else if (selectedType === 'pdf') {
            matchesType = !!bubble.querySelector('.chat-rendered-pdf-card');
        }

        // 3. Sender Check
        const isOutgoing = row.classList.contains('outgoing');
        let senderName = '';
        if (targetRoomId) {
            const titleEl = row.querySelector('.sender-title');
            senderName = titleEl ? titleEl.innerText.trim().toLowerCase() : (isOutgoing ? currentUsername.toLowerCase() : '');
        } else {
            const chatWindowTitle = document.getElementById('chat-window-title');
            senderName = isOutgoing ? currentUsername.toLowerCase() : (chatWindowTitle ? chatWindowTitle.innerText.trim().toLowerCase() : '');
        }
        const matchesSender = senderQuery === '' || senderName.includes(senderQuery);

        if (matchesText && matchesType && matchesSender) {
            row.style.display = 'flex';
        } else {
            row.style.display = 'none';
        }
    });
}

function hideAdvancedSearch() {
    const advancedSearchPanel = document.getElementById('advanced-search-panel');
    const chatMessageSearchInput = document.getElementById('chat-message-search-input');
    if (advancedSearchPanel) advancedSearchPanel.classList.add('hidden');
    if (chatMessageSearchInput) {
        chatMessageSearchInput.style.width = '0';
        chatMessageSearchInput.style.padding = '0';
    }
}
