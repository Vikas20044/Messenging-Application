// Socket.io initialization & Application State Management

const socket = io();

socket.on('connect', () => {
    if (currentUserId) {
        socket.emit('declareIdentity', { userId: currentUserId });
    }
});

let currentUserId = null;
let currentUsername = '';
let targetUserId = null;

let targetRoomId = null;
let joinedRoomsMap = new Map();
let chosenMediaType = null;
let activeReplyMessageId = null;
let activeEditMessageId = null;

let activeRoomName = '';
let activeRoomCode = '';
let activeRoomDesc = '';
let activeRoomIcon = '';

let selectedOutgoingLang = 'auto';

// Global Utility Helpers
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function scrollToBottom() {
    const messageHistory = document.getElementById('message-history');
    if (messageHistory) {
        messageHistory.scrollTop = messageHistory.scrollHeight;
    }
}
