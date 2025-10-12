import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import type { CorsOptions } from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import http from 'http'
import compression from 'compression'
import authRoutes from './routes/auth.js'
import chatRoutes from './routes/chat.js'
import notifRoutes from './routes/notifications.js'
import orgRoutes from './routes/orgs.js'
import { initSocket } from './socket/index.js'

const app = express()
app.use(helmet())

// Support comma-separated origins for local + deployed URLs
const rawOrigins = (process.env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean)
const allowedOrigins = rawOrigins.length > 0 ? rawOrigins : ['http://localhost:5173']
const corsOptions: CorsOptions = {
  credentials: true,
  origin: function (origin, callback) {
    if (!origin) return callback(null, true) // allow tools/curl
    if (allowedOrigins.includes(origin)) return callback(null, true)
    return callback(new Error('Not allowed by CORS'))
  },
}
app.use(cors(corsOptions))
app.use(compression())
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())

app.use('/api/auth', authRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/notifications', notifRoutes)

// Simple health endpoint for Render/Railway
app.get('/api/health', (_req, res) => res.json({ ok: true }))
app.use('/api/orgs', orgRoutes)

const server = http.createServer(app)
initSocket(server)

const port = Number(process.env.PORT || 3000)
server.listen(port, () => console.log(`API on http://localhost:${port}`))


