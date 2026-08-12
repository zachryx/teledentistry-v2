export enum SOCKET_EVENTS {
  ERROR = 'error',
  MESSAGE_SEND = 'message:send',
  MESSAGE_RECEIVED = 'message:received',
  CHAT_START = 'chat:start',
  CHAT_STARTED = 'chat:started',
  CHAT_JOIN = 'chat:join',
  CHAT_LEAVE = 'chat:leave',
  CALL_PRESENCE_JOIN = 'call:presence_join',
  CALL_PRESENCE_LEAVE = 'call:presence_leave',
  NOTIFICATION = 'notification',
  NOTIFICATIONS_UNREAD = 'notifications:unread',
  WEBRTC_SIGNAL = 'webrtc:signal',
}

