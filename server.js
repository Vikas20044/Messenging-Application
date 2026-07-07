const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');

dotenv.config();

const app = require('./src/app');
const server = http.createServer(app);
const io = new Server(server);

// Bind socketio instance to express app context for controller reference
app.set('socketio', io);

// Initialize modular WebSocket chat gateway triggers
const registerChatSockets = require('./src/sockets/chatSocket');
registerChatSockets(io);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Decoupled real-time messaging application running at http://localhost:${PORT}`);
});