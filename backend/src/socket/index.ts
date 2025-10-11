import { Server } from 'socket.io'
import type { Server as HttpServer } from 'http'
import jwt from 'jsonwebtoken'

export let io: Server

export function initSocket(server: HttpServer) {
  io = new Server(server, {
    cors: { origin: process.env.CORS_ORIGIN as string, credentials: true },
  })

  io.use((socket, next) => {
    const token = (socket.handshake.auth as any)?.token as string | undefined
    if (!token) return next(new Error('unauthorized'))
    try {
      const u = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string }
      ;(socket as any).userId = u.id
      next()
    } catch (e) {
      next(new Error('unauthorized'))
    }
  })

  io.on('connection', (socket) => {
    const userId = (socket as any).userId as string
    socket.join(`user:${userId}`)
    socket.on('disconnect', () => {})
  })

  return io
}


