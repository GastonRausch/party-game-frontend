import { io, Socket } from 'socket.io-client';

/**
 * Use the explicit env var when set (production / CI).
 * Otherwise derive the backend URL from the current page's hostname so any
 * device on the local network automatically reaches the right machine.
 */
const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  `${window.location.protocol}//${window.location.hostname}:3001`;

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(BACKEND_URL, {
      autoConnect: false,
      // Reconnect aggressively — phones lose the connection when backgrounded
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1_000,      // start retrying after 1 s
      reconnectionDelayMax: 5_000,   // never wait more than 5 s between attempts
      timeout: 20_000,
    });
  }
  return socket;
}

export function connectSocket(): void {
  getSocket().connect();
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
