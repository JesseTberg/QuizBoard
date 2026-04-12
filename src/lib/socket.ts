import { io, Socket } from 'socket.io-client';

const socket: Socket = io(window.location.origin);

export default socket;
