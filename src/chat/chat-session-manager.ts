import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS } from './socket-events';
import { handleUserConnection, handleUserDisconnection } from '../services/users.service';

export interface UserSession {
  userId: string;
  sessionId: string;
  socket: Socket;
  lastActivity: Date;
  rooms: Set<string>;
  connectionStartTime: Date;
}

export class ChatSessionManager {
  private readonly sessions: Map<string, UserSession> = new Map();
  private readonly roomMembers: Map<string, Set<string>> = new Map();
  private readonly userSessionIds: Map<string, Set<string>> = new Map();

  constructor(private readonly io: Server) {}

  async addSession(userId: string, socket: Socket): Promise<string> {
    const sessionId = socket.id;
    const userSessions = this.userSessionIds.get(userId) || new Set();

    const session: UserSession = {
      userId,
      sessionId,
      socket,
      lastActivity: new Date(),
      connectionStartTime: new Date(),
      rooms: new Set(),
    };

    this.sessions.set(sessionId, session);
    userSessions.add(sessionId);
    this.userSessionIds.set(userId, userSessions);

    await handleUserConnection(userId, sessionId);

    this.setupSocketHandlers(sessionId, socket);

    return sessionId;
  }

  async removeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    for (const room of session.rooms) {
      await this.leaveRoom(sessionId, room);
    }

    if (session.socket.connected) {
      session.socket.disconnect(true);
    }

    this.sessions.delete(sessionId);

    const userSessions = this.userSessionIds.get(session.userId);
    if (userSessions) {
      userSessions.delete(sessionId);
      if (userSessions.size === 0) {
        this.userSessionIds.delete(session.userId);
      }
    }

    await handleUserDisconnection(session.userId);
  }

  async closeAllSessions(): Promise<void> {
    const tasks = Array.from(this.sessions.keys()).map((id) => this.removeSession(id));
    await Promise.allSettled(tasks);
  }

  async joinRoom(sessionId: string, roomId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    await session.socket.join(roomId);
    session.rooms.add(roomId);

    const members = this.roomMembers.get(roomId) || new Set();
    members.add(sessionId);
    this.roomMembers.set(roomId, members);
  }

  async leaveRoom(sessionId: string, roomId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    await session.socket.leave(roomId);
    session.rooms.delete(roomId);

    const members = this.roomMembers.get(roomId);
    if (members) {
      members.delete(sessionId);
      if (members.size === 0) this.roomMembers.delete(roomId);
    }
  }

  async emitToRoom(roomId: string, event: SOCKET_EVENTS | string, data: any): Promise<void> {
    const members = this.roomMembers.get(roomId);
    if (!members) return;

    for (const sessionId of members) {
      const session = this.sessions.get(sessionId);
      if (session?.socket.connected) {
        session.socket.emit(event, data);
      }
    }
  }

  async emitToUser(userId: string, event: SOCKET_EVENTS | string, data: any): Promise<void> {
    const sessions = this.userSessionIds.get(userId);
    if (!sessions) return;

    for (const sessionId of sessions) {
      const session = this.sessions.get(sessionId);
      if (session?.socket.connected) {
        session.socket.emit(event, data);
      }
    }
  }

  private setupSocketHandlers(sessionId: string, socket: Socket): void {
    socket.onAny(() => {
      const session = this.sessions.get(sessionId);
      if (session) {
        session.lastActivity = new Date();
      }
    });

    socket.on('disconnect', async () => {
      await this.removeSession(sessionId);
    });

    socket.on(SOCKET_EVENTS.ERROR, async () => {
      await this.removeSession(sessionId);
    });
  }
}

