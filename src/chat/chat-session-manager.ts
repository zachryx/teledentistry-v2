import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS } from './socket-events';
import { handleUserConnection, handleUserDisconnection } from '../services/users.service';
import { findActiveByAppointment, updateCall } from '../services/calls.service';
import { CALL_STATUS } from '../models/call.model';

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

    // ponytail: presence tracking — only HUB can be host
    socket.on(SOCKET_EVENTS.CALL_PRESENCE_JOIN, async (data: { appointmentId: string; peerId: string; userId: string; role: string }) => {
      const session = this.sessions.get(sessionId);
      if (!session) return;

      const roomKey = `call:${data.appointmentId}`;

      try {
        await this.joinRoom(sessionId, roomKey);

        let call = await findActiveByAppointment(data.appointmentId);
        const actor = `${data.role.toLowerCase()}_peer_id`;
        const isHub = data.role.toLowerCase() === 'hub';

        if (!call) {
          call = await updateCall(
            { appointment: data.appointmentId },
            { appointment: data.appointmentId, host: data.peerId, [actor]: data.peerId, start_time: new Date(), status: CALL_STATUS.INITIATED },
            { upsert: true },
          );
        } else if (isHub && (!call.host || call.host === (call as any)[actor])) {
          call = await updateCall({ _id: call._id }, { host: data.peerId, [actor]: data.peerId });
        } else {
          call = await updateCall({ _id: call._id }, { [actor]: data.peerId });
        }

        this.io.to(sessionId).emit(SOCKET_EVENTS.NOTIFICATION, {
          type: 'call:presence_updated',
          call,
        });

        const roomMembers = this.roomMembers.get(roomKey);
        if (roomMembers) {
          for (const sid of roomMembers) {
            if (sid !== sessionId) {
              this.io.to(sid).emit(SOCKET_EVENTS.NOTIFICATION, {
                type: 'call:host_ready',
                peerId: data.peerId,
                userId: data.userId,
                role: data.role,
                appointmentId: data.appointmentId,
              });
            }
          }
        }
      } catch (err) {
        console.error('CALL_PRESENCE_JOIN error:', err);
      }
    });

    socket.on(SOCKET_EVENTS.CALL_PRESENCE_LEAVE, async (data: { appointmentId: string; userId: string; role: string }) => {
      const session = this.sessions.get(sessionId);
      if (!session) return;

      const roomKey = `call:${data.appointmentId}`;

      try {
        await this.leaveRoom(sessionId, roomKey);

        const call = await findActiveByAppointment(data.appointmentId);
        if (!call) return;

        const actor = `${data.role.toLowerCase()}_peer_id`;
        const wasHost = call.host === (call as any)[actor];

        await updateCall({ _id: call._id }, { [actor]: null });

        if (wasHost) {
          const members = this.roomMembers.get(roomKey);
          const otherMembers = members ? [...members].filter((sid) => sid !== sessionId) : [];

          if (otherMembers.length > 0) {
            // ponytail: find a HUB among remaining members to promote
            const hubSession = otherMembers
              .map((sid) => this.sessions.get(sid))
              .find((s) => s && s.userId.toLowerCase() === 'hub');
            if (hubSession) {
              const hubPeerId = (call as any).hub_peer_id;
              const updatedCall = await updateCall({ _id: call._id }, { host: hubPeerId });
              this.io.to(roomKey).emit(SOCKET_EVENTS.NOTIFICATION, {
                type: 'call:host_ready',
                peerId: hubPeerId,
                appointmentId: data.appointmentId,
              });
            } else {
              // No hub left — end call
              const updatedCall = await updateCall(
                { _id: call._id },
                { host: null, status: CALL_STATUS.ENDED, end_time: new Date() },
              );
              this.io.to(roomKey).emit(SOCKET_EVENTS.NOTIFICATION, {
                type: 'call:ended',
                call: updatedCall,
              });
            }
          } else {
            const updatedCall = await updateCall(
              { _id: call._id },
              { host: null, status: CALL_STATUS.ENDED, end_time: new Date() },
            );
            this.io.to(roomKey).emit(SOCKET_EVENTS.NOTIFICATION, {
              type: 'call:ended',
              call: updatedCall,
            });
          }
        } else {
          this.io.to(roomKey).emit(SOCKET_EVENTS.NOTIFICATION, {
            type: 'call:participant_offline',
            userId: data.userId,
          });
        }
      } catch (err) {
        console.error('CALL_PRESENCE_LEAVE error:', err);
      }
    });
  }
}

