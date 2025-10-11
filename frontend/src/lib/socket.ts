import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3000', {
      autoConnect: false,
      transports: ['websocket'],
      withCredentials: true,
      auth: () => {
        const token = localStorage.getItem('token')
        return token ? { token } : undefined
      },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })
  }
  return socket
}


