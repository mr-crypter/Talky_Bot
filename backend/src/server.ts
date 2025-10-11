import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import http from 'http'
import authRoutes from './routes/auth.js'
import chatRoutes from './routes/chat.js'
import notifRoutes from './routes/notifications.js'
import { initSocket } from './socket/index.js'

const app = express()
app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGIN as string, credentials: true }))
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())

app.use('/api/auth', authRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/notifications', notifRoutes)

const server = http.createServer(app)
initSocket(server)

const port = Number(process.env.PORT || 3000)
server.listen(port, () => console.log(`API on http://localhost:${port}`))


