import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { q } from '../config/db.js'
import { io } from '../socket/index.js'

const r = Router()
r.use(requireAuth)

r.get('/', async (req, res) => {
  const uid = (req as any).user.id as string
  const rows = (
    await q('select * from notifications where user_id is null or user_id=$1 order by created_at desc limit 100', [uid])
  ).rows
  res.json(rows)
})

r.post('/send', async (req, res) => {
  const { title, body, userId } = req.body as { title: string; body: string; userId?: string }
  const row = (
    await q('insert into notifications (user_id, title, body) values ($1,$2,$3) returning *', [userId ?? null, title, body])
  ).rows[0]
  if (userId) io.to(`user:${userId}`).emit('notification', row)
  else io.emit('notification', row)
  res.json({ ok: true })
})

export default r

// mark single notification read
r.post('/:id/read', async (req, res) => {
  const uid = (req as any).user.id as string
  const { id } = req.params as { id: string }
  await q('update notifications set seen=true where id=$1 and (user_id=$2 or user_id is null)', [id, uid])
  res.json({ ok: true })
})

// mark all read for user
r.post('/read-all', async (req, res) => {
  const uid = (req as any).user.id as string
  await q('update notifications set seen=true where user_id=$1', [uid])
  res.json({ ok: true })
})

