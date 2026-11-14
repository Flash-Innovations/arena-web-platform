import { io } from 'socket.io-client';

const API_BASE = (import.meta.env.VITE_ARENA_API_URL || 'http://localhost:5050').replace(/\/+$/, '');

let socketInstance = null;

export function getSocket() {
  if (!socketInstance) {
    socketInstance = io(API_BASE, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socketInstance.on('connect', () => {
      console.log('[Arena Socket] Connected to real-time match engine:', socketInstance.id);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('[Arena Socket] Disconnected:', reason);
    });
  }

  return socketInstance;
}
