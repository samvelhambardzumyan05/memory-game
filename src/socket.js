import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (
  import.meta.env.PROD
    ? window.location.origin
    : `http://${window.location.hostname}:3000`
);

const socket = io(SOCKET_URL, {
  reconnection: true,
  transports: ['websocket', 'polling'],
});

export default socket;
export { SOCKET_URL };
