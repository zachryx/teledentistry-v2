import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { app } from './app';
import { attachElysiaToNodeServer } from './lib/elysia-node';
import { initChatSocket } from './chat/chat-socket';
import { setSessionManager } from './chat/session-store';

const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const server = createServer();

const io = new SocketIOServer(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PATCH', 'DELETE'] },
});

const sessionManager = initChatSocket(io);
setSessionManager(sessionManager);

attachElysiaToNodeServer(server, app);

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

export { server, io };
