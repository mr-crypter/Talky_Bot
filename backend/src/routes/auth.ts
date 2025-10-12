import { Router } from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { q } from '../config/db.js'
import { requireAuth, signJwt } from '../middleware/auth.js'
import passport from '../config/passport.js'

const r = Router()

const signupSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3),
  password: z.string().min(8),
})

r.post('/signup', async (req, res) => {
  const parsed = signupSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json(parsed.error.flatten())
  const { email, username, password } = parsed.data

  const exists = await q('select 1 from users where email=$1 or username=$2', [email, username])
  if (exists.rowCount) return res.status(409).json({ error: 'email_or_username_taken' })

  const hash = await bcrypt.hash(password, 10)
  const user = (
    await q('insert into users (email, username, password_hash, onboarded, credits) values ($1,$2,$3,false,2000) returning *', [
      email,
      username,
      hash,
    ])
  ).rows[0]

  const org = (
    await q('insert into orgs (name, owner_id) values ($1,$2) returning *', [`${username} Org`, user.id])
  ).rows[0]
  await q('insert into user_org_roles (user_id, org_id, role) values ($1,$2,$3)', [user.id, org.id, 'admin'])
  await q('update users set active_org_id=$1 where id=$2', [org.id, user.id])

  const token = signJwt({ id: user.id, email: user.email })
  res.json({ token, user: { id: user.id, email: user.email, username: user.username }, credits: user.credits })
})

const loginSchema = z.object({ email: z.string().email(), password: z.string() })
r.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json(parsed.error.flatten())
  const { email, password } = parsed.data
  const u = (await q('select * from users where email=$1', [email])).rows[0]
  if (!u || !u.password_hash || !(await bcrypt.compare(password, u.password_hash)))
    return res.status(401).json({ error: 'invalid_credentials' })
  const token = signJwt({ id: u.id, email: u.email })
  res.json({ token, user: { id: u.id, email: u.email, username: u.username }, credits: u.credits })
})

r.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }))
r.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  async (req, res) => {
    const { id, email } = req.user as any
    const token = signJwt({ id, email })
    res.redirect(`${process.env.CORS_ORIGIN}/login#token=${token}`)
  },
)

export default r

// Authenticated user profile
r.get('/me', requireAuth, async (req, res) => {
  const uid = (req as any).user.id as string
  const u = (await q('select id, email, username, credits from users where id=$1', [uid])).rows[0]
  if (!u) return res.status(404).json({ error: 'not_found' })
  res.json({ user: { id: u.id, email: u.email, username: u.username }, credits: u.credits })
})


