/**
 * Singleton holder for the ChatSessionManager instance.
 *
 * Using a separate module avoids circular import chains between
 * server.ts (which creates the manager) and route files (which need it).
 *
 * Usage:
 *   // server.ts — after initChatSocket()
 *   setSessionManager(sessionManager);
 *
 *   // any route / service
 *   const mgr = getSessionManager();
 *   if (mgr) await mgr.emitToUser(userId, event, data);
 */

import type { ChatSessionManager } from './chat-session-manager';

let _manager: ChatSessionManager | null = null;

export function setSessionManager(manager: ChatSessionManager): void {
  _manager = manager;
}

export function getSessionManager(): ChatSessionManager | null {
  return _manager;
}
