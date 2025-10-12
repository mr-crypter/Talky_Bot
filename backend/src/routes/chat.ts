import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { q } from '../config/db.js'
import { generateReply } from '../services/llm.js'
import { applyUsage, requireCredits } from '../services/credits.js'
import { validate as uuidValidate } from 'uuid'

const r = Router()
r.use(requireAuth)

r.get('/sessions', async (req, res) => {
  const uid = (req as any).user.id as string
  const sessions = (await q('select * from chat_sessions where user_id=$1 order by updated_at desc', [uid])).rows
  res.json(sessions)
})

r.post('/sessions', async (req, res) => {
  const uid = (req as any).user.id as string
  const title = (req.body?.title || 'New Chat') as string
  const s = (
    await q('insert into chat_sessions (user_id, title) values ($1,$2) returning *', [uid, title])
  ).rows[0]
  res.json(s)
})

r.get('/sessions/:id/messages', async (req, res) => {
  const uid = (req as any).user.id as string
  const { id } = req.params
  if (!uuidValidate(id)) return res.status(400).json({ error: 'invalid_session_id' })
  const ok = await q('select 1 from chat_sessions where id=$1 and user_id=$2', [id, uid])
  if (!ok.rowCount) return res.status(404).json({ error: 'not_found' })
  const msgs = (await q('select * from chat_messages where session_id=$1 order by created_at asc', [id])).rows
  res.json(msgs)
})

r.post('/sessions/:id/message', async (req, res) => {
  const uid = (req as any).user.id as string
  const { id } = req.params
  const { content } = req.body as { content: string }
  if (!uuidValidate(id)) return res.status(400).json({ error: 'invalid_session_id' })

  const ok = await q('select 1 from chat_sessions where id=$1 and user_id=$2', [id, uid])
  if (!ok.rowCount) return res.status(404).json({ error: 'not_found' })

  if (!(await requireCredits(uid, 10))) return res.status(402).json({ error: 'insufficient_credits' })

  await q('insert into chat_messages (session_id, role, content) values ($1,$2,$3)', [id, 'user', content])

  const { text, promptTokens, completionTokens } = await generateReply(content)
  await applyUsage(uid, promptTokens, completionTokens)

  await q(
    'insert into chat_messages (session_id, role, content, prompt_tokens, completion_tokens) values ($1,$2,$3,$4,$5)',
    [id, 'assistant', text, promptTokens, completionTokens],
  )
  await q(
    "update chat_sessions set updated_at=now(), title = case when title = 'New Chat' then left($1, 40) else title end where id=$2",
    [content, id],
  )

  const credits = (await q('select credits from users where id=$1', [uid])).rows[0]?.credits ?? 0
  res.json({ content: text, credits })
})

export default r


